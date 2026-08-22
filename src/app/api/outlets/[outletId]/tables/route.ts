import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOutletAccess, hasMinRole } from "@/lib/permissions";
import { orderSubtotal } from "@/lib/order-math";
import { createOrderIncomeEntry, reverseOrderIncomeEntry } from "@/lib/order-finance";
import { applyOrderStockChange } from "@/lib/stock-movements";
import { writeAuditLog } from "@/lib/audit";
import { bumpOutletOps } from "@/lib/outlet-live";
import { notifyOutletManagers, notifyOutletMembers } from "@/lib/notifications";
import { checkReservationReminders, serviceLabel } from "@/lib/service-orders";
import type { Role } from "@/lib/roles";

type OrderItemInput = { menuItemId: string; quantity?: number; notes?: string };

async function resolveMenuItems(outletId: string, items: OrderItemInput[]) {
  if (!items.length) return [];

  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: items.map((i) => i.menuItemId) },
      isAvailable: true,
      category: { outletId },
    },
  });

  const byId = new Map(menuItems.map((m) => [m.id, m]));
  const resolved = [];

  for (const item of items) {
    const menuItem = byId.get(item.menuItemId);
    if (!menuItem) continue;
    const qty = Math.max(1, item.quantity ?? 1);
    resolved.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: qty,
      notes: item.notes?.trim() || null,
      kitchenStatus: "pending",
      sentToKitchenAt: new Date(),
    });
  }

  return resolved;
}

const allocationInclude = {
  where: { status: "active" as const },
  orderBy: { startTime: "desc" as const },
  take: 1,
  include: {
    order: {
      include: {
        items: { orderBy: { name: "asc" as const } },
      },
    },
  },
};

async function getActiveVisit(outletId: string, tableId: string) {
  const table = await prisma.restaurantTable.findFirst({
    where: { id: tableId, outletId },
    include: {
      allocations: {
        where: { status: "active" },
        orderBy: { startTime: "desc" },
        take: 1,
        include: {
          order: { include: { items: true } },
        },
      },
    },
  });
  if (!table) return null;
  return { table, allocation: table.allocations[0] ?? null };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ outletId: string }> }
) {
  const { outletId } = await params;
  const auth = await requireOutletAccess(outletId);
  if ("error" in auth) return auth.error;

  try {
    await checkReservationReminders(outletId).catch(() => undefined);

    const [tables, serviceOrders] = await Promise.all([
    prisma.restaurantTable.findMany({
      where: { outletId },
      include: { allocations: allocationInclude },
      orderBy: { label: "asc" },
    }),
    prisma.tableAllocation.findMany({
      where: {
        outletId,
        status: { in: ["waiting", "reserved", "active"] },
        OR: [
          { mode: { in: ["takeaway", "waitlist", "reservation"] } },
          { tableId: null },
        ],
      },
      include: {
        table: { select: { id: true, label: true, status: true } },
        order: { include: { items: { orderBy: { name: "asc" } } } },
      },
      orderBy: [{ reservedFor: "asc" }, { startTime: "asc" }],
    }),
  ]);

    return NextResponse.json({ tables, serviceOrders });
  } catch (err) {
    console.error("GET tables failed", err);
    return NextResponse.json(
      { error: "Failed to load tables", tables: [], serviceOrders: [] },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ outletId: string }> }
) {
  const { outletId } = await params;
  const body = await req.json();
  const { action } = body;

  const managerActions = new Set([
    "create_table",
    "delete_table",
    "void_order",
    "comp_close",
  ]);
  const minRole = managerActions.has(action) ? "manager" : undefined;
  const auth = await requireOutletAccess(outletId, minRole);
  if ("error" in auth) return auth.error;

  const actorId = auth.user.id;
  const workspaceId = auth.workspace.id;
  const role = auth.member.role as Role;

  if (action === "create_table") {
    const table = await prisma.restaurantTable.create({
      data: {
        label: body.label,
        capacity: body.capacity ?? 4,
        outletId,
      },
    });
    await bumpOutletOps(outletId);
    return NextResponse.json(table);
  }

  if (action === "allocate") {
    const table = await prisma.restaurantTable.findFirst({
      where: { id: body.tableId, outletId },
    });
    if (!table) return NextResponse.json({ error: "Table not found" }, { status: 404 });
    if (table.status !== "available") {
      return NextResponse.json({ error: "Table is not available" }, { status: 400 });
    }

    const orderItems = await resolveMenuItems(outletId, body.items || []);

    const allocation = await prisma.tableAllocation.create({
      data: {
        outletId,
        tableId: body.tableId,
        guestName: body.guestName,
        guestCount: body.guestCount ?? 2,
        guestPhone: body.guestPhone?.trim() || null,
        mode: "dine_in",
        status: "active",
        order: orderItems.length
          ? {
              create: {
                items: { create: orderItems },
                subtotal: orderSubtotal(orderItems),
              },
            }
          : undefined,
      },
      include: {
        order: { include: { items: true } },
      },
    });

    await prisma.restaurantTable.update({
      where: { id: body.tableId },
      data: { status: "occupied" },
    });

    await writeAuditLog({
      workspaceId,
      outletId,
      actorId,
      action: "allocate",
      entityType: "TableAllocation",
      entityId: allocation.id,
      after: { tableId: body.tableId, guestName: body.guestName },
    });

    if (orderItems.length) {
      await notifyOutletManagers(
        outletId,
        "new_order",
        `New order · Table ${table.label} · ${orderItems.length} item(s) · ${body.guestName}`
      );
    }

    await bumpOutletOps(outletId);
    return NextResponse.json({ table: { ...table, status: "occupied" }, allocation });
  }

  if (action === "add_order_items") {
    const allocation = await prisma.tableAllocation.findFirst({
      where: {
        id: body.allocationId,
        status: "active",
        table: { outletId },
      },
      include: {
        order: { include: { items: true } },
        table: true,
      },
    });

    if (!allocation) {
      return NextResponse.json({ error: "Active allocation not found" }, { status: 404 });
    }

    if (allocation.order && allocation.order.status !== "open") {
      return NextResponse.json({ error: "Order is closed" }, { status: 400 });
    }

    const newItems = await resolveMenuItems(outletId, body.items || []);
    if (!newItems.length) {
      return NextResponse.json({ error: "No valid menu items" }, { status: 400 });
    }

    let order = allocation.order;
    if (!order) {
      order = await prisma.tableOrder.create({
        data: {
          allocationId: allocation.id,
          items: { create: newItems },
          subtotal: orderSubtotal(newItems),
        },
        include: { items: true },
      });
    } else {
      await prisma.tableOrderItem.createMany({
        data: newItems.map((item) => ({ ...item, orderId: order!.id })),
      });
      order = await prisma.tableOrder.findUnique({
        where: { id: order.id },
        include: { items: true },
      });
      if (order) {
        await prisma.tableOrder.update({
          where: { id: order.id },
          data: { subtotal: orderSubtotal(order.items) },
        });
        order = await prisma.tableOrder.findUnique({
          where: { id: order.id },
          include: { items: true },
        });
      }
    }

    await notifyOutletManagers(
      outletId,
      "new_order",
      `Kitchen · Table ${allocation.table.label} · +${newItems.length} item(s)`
    );
    await bumpOutletOps(outletId);

    return NextResponse.json({
      order,
      total: order ? orderSubtotal(order.items) : 0,
    });
  }

  if (action === "remove_order_item") {
    const item = await prisma.tableOrderItem.findFirst({
      where: {
        id: body.itemId,
        order: {
          status: "open",
          allocation: { status: "active", table: { outletId } },
        },
      },
    });
    if (!item) return NextResponse.json({ error: "Order item not found" }, { status: 404 });

    await prisma.tableOrderItem.delete({ where: { id: item.id } });
    const remaining = await prisma.tableOrderItem.findMany({ where: { orderId: item.orderId } });
    await prisma.tableOrder.update({
      where: { id: item.orderId },
      data: { subtotal: orderSubtotal(remaining) },
    });
    await bumpOutletOps(outletId);
    return NextResponse.json({ success: true });
  }

  if (action === "void_order_item") {
    const item = await prisma.tableOrderItem.findFirst({
      where: {
        id: body.itemId,
        order: {
          status: "open",
          allocation: { status: "active", table: { outletId } },
        },
      },
    });
    if (!item) return NextResponse.json({ error: "Order item not found" }, { status: 404 });

    await prisma.tableOrderItem.update({
      where: { id: item.id },
      data: { voided: true, kitchenStatus: "cancelled" },
    });
    const remaining = await prisma.tableOrderItem.findMany({ where: { orderId: item.orderId } });
    await prisma.tableOrder.update({
      where: { id: item.orderId },
      data: { subtotal: orderSubtotal(remaining) },
    });
    await bumpOutletOps(outletId);
    return NextResponse.json({ success: true });
  }

  if (action === "kitchen_set_status") {
    const status = body.status as string;
    if (!["pending", "preparing", "ready", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid kitchen status" }, { status: 400 });
    }

    if (body.itemId) {
      const item = await prisma.tableOrderItem.findFirst({
        where: {
          id: body.itemId,
          voided: false,
          order: {
            status: "open",
            allocation: { status: "active", table: { outletId } },
          },
        },
      });
      if (!item) return NextResponse.json({ error: "Order item not found" }, { status: 404 });
      await prisma.tableOrderItem.update({
        where: { id: item.id },
        data: { kitchenStatus: status },
      });
    } else if (body.orderId) {
      await prisma.tableOrderItem.updateMany({
        where: {
          orderId: body.orderId,
          voided: false,
          order: {
            status: "open",
            allocation: { status: "active", table: { outletId } },
          },
        },
        data: { kitchenStatus: status },
      });
    } else {
      return NextResponse.json({ error: "itemId or orderId required" }, { status: 400 });
    }

    await bumpOutletOps(outletId);
    return NextResponse.json({ success: true, status });
  }

  /** Settle & pay — only path that creates revenue + successful turn */
  if (action === "settle_pay") {
    const visit = await getActiveVisit(outletId, body.tableId);
    if (!visit?.allocation) {
      return NextResponse.json({ error: "No active seating" }, { status: 404 });
    }
    const { table, allocation } = visit;
    let order = allocation.order;

    if (!order || order.items.filter((i) => !i.voided).length === 0) {
      return NextResponse.json(
        { error: "Add menu items before settling, or cancel the seating" },
        { status: 400 }
      );
    }
    if (order.status !== "open") {
      return NextResponse.json({ error: "Order already closed" }, { status: 400 });
    }

    const paidAt = new Date();
    const subtotal = orderSubtotal(order.items);
    const paymentMethod = body.paymentMethod || "cash";

    const finance = await createOrderIncomeEntry({
      outletId,
      orderId: order.id,
      amount: subtotal,
      paidAt,
      tableLabel: table.label,
      guestName: allocation.guestName,
      paymentMethod,
      createdById: actorId,
    });

    order = await prisma.tableOrder.update({
      where: { id: order.id },
      data: {
        status: "paid",
        subtotal,
        paidAt,
        paymentMethod,
        closedById: actorId,
        financeEntryId: finance.id,
        closeReason: null,
      },
      include: { items: true },
    });

    await prisma.tableAllocation.update({
      where: { id: allocation.id },
      data: { status: "completed", endTime: paidAt },
    });

    await prisma.restaurantTable.update({
      where: { id: table.id },
      data: { status: "available" },
    });

    await applyOrderStockChange({
      outletId,
      orderId: order.id,
      items: order.items,
      type: "sale",
      createdById: actorId,
      note: `Sale · ${table.label}`,
    });

    await prisma.tableOrderItem.updateMany({
      where: { orderId: order.id, kitchenStatus: { not: "cancelled" } },
      data: { kitchenStatus: "cancelled" },
    });

    await writeAuditLog({
      workspaceId,
      outletId,
      actorId,
      action: "settle_pay",
      entityType: "TableOrder",
      entityId: order.id,
      after: { subtotal, paymentMethod, financeEntryId: finance.id },
    });

    await notifyOutletMembers(
      outletId,
      "order_settled",
      `Paid · Table ${table.label} · ${allocation.guestName}`,
      { skipBump: true }
    );
    await bumpOutletOps(outletId);
    return NextResponse.json({
      success: true,
      order,
      finance,
      table: { ...table, status: "available" },
    });
  }

  /** Cancel seating — no revenue, no successful turn */
  if (action === "cancel_seating") {
    const visit = await getActiveVisit(outletId, body.tableId);
    if (!visit?.allocation) {
      return NextResponse.json({ error: "No active seating" }, { status: 404 });
    }
    const { table, allocation } = visit;
    const endTime = new Date();
    const reason = (body.reason as string | undefined)?.trim() || "cancelled";

    if (allocation.order && allocation.order.status === "open") {
      await prisma.tableOrder.update({
        where: { id: allocation.order.id },
        data: {
          status: "cancelled",
          voidedAt: endTime,
          closeReason: reason,
          closedById: actorId,
          subtotal: orderSubtotal(allocation.order.items),
        },
      });
      await prisma.tableOrderItem.updateMany({
        where: { orderId: allocation.order.id },
        data: { kitchenStatus: "cancelled" },
      });
    }

    await prisma.tableAllocation.update({
      where: { id: allocation.id },
      data: { status: "cancelled", endTime },
    });
    await prisma.restaurantTable.update({
      where: { id: table.id },
      data: { status: "available" },
    });

    await writeAuditLog({
      workspaceId,
      outletId,
      actorId,
      action: "cancel_seating",
      entityType: "TableAllocation",
      entityId: allocation.id,
      note: reason,
    });

    await bumpOutletOps(outletId);
    return NextResponse.json({ success: true, table: { ...table, status: "available" } });
  }

  /** Walkout / unpaid — no revenue; optional waste stock */
  if (action === "walkout_close" || action === "comp_close") {
    if (action === "comp_close" && !hasMinRole(role, "manager")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const visit = await getActiveVisit(outletId, body.tableId);
    if (!visit?.allocation) {
      return NextResponse.json({ error: "No active seating" }, { status: 404 });
    }
    const { table, allocation } = visit;
    const endTime = new Date();
    const isComp = action === "comp_close";
    const reason =
      (body.reason as string | undefined)?.trim() ||
      (isComp ? "comp" : "walkout");

    if (!reason) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 });
    }

    let order = allocation.order;
    if (order && order.status === "open") {
      order = await prisma.tableOrder.update({
        where: { id: order.id },
        data: {
          status: "voided",
          voidedAt: endTime,
          closeReason: isComp ? `comp:${reason}` : `walkout:${reason}`,
          closedById: actorId,
          subtotal: orderSubtotal(order.items),
        },
        include: { items: true },
      });

      if (body.recordWaste && order.items.length) {
        await applyOrderStockChange({
          outletId,
          orderId: order.id,
          items: order.items,
          type: "waste",
          createdById: actorId,
          note: isComp ? `Comp waste · ${table.label}` : `Walkout waste · ${table.label}`,
        });
      }

      await prisma.tableOrderItem.updateMany({
        where: { orderId: order.id },
        data: { kitchenStatus: "cancelled" },
      });
    }

    await prisma.tableAllocation.update({
      where: { id: allocation.id },
      data: {
        status: isComp ? "cancelled" : "walkout",
        endTime,
      },
    });
    await prisma.restaurantTable.update({
      where: { id: table.id },
      data: { status: "available" },
    });

    await writeAuditLog({
      workspaceId,
      outletId,
      actorId,
      action,
      entityType: "TableAllocation",
      entityId: allocation.id,
      note: reason,
      after: { recordWaste: !!body.recordWaste },
    });

    await bumpOutletOps(outletId);
    return NextResponse.json({ success: true, table: { ...table, status: "available" } });
  }

  /** Void a paid order (manager+) — reverse finance + restock */
  if (action === "void_order") {
    const order = await prisma.tableOrder.findFirst({
      where: {
        id: body.orderId,
        status: "paid",
        allocation: { table: { outletId } },
      },
      include: {
        items: true,
        allocation: { include: { table: true } },
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Paid order not found" }, { status: 404 });
    }

    const reason = (body.reason as string | undefined)?.trim();
    if (!reason) {
      return NextResponse.json({ error: "Reason is required to void" }, { status: 400 });
    }

    await reverseOrderIncomeEntry({
      outletId,
      orderId: order.id,
      financeEntryId: order.financeEntryId,
      reason,
      createdById: actorId,
    });

    await prisma.tableOrder.update({
      where: { id: order.id },
      data: {
        status: "voided",
        voidedAt: new Date(),
        closeReason: `void:${reason}`,
        closedById: actorId,
      },
    });

    // Successful turn becomes invalid for analytics (allocation stays completed but order voided)
    await applyOrderStockChange({
      outletId,
      orderId: order.id,
      items: order.items,
      type: "reverse_sale",
      createdById: actorId,
      note: `Void restock · ${order.allocation.table.label}`,
    });

    await writeAuditLog({
      workspaceId,
      outletId,
      actorId,
      action: "void_order",
      entityType: "TableOrder",
      entityId: order.id,
      note: reason,
      before: { status: "paid", financeEntryId: order.financeEntryId },
    });

    await bumpOutletOps(outletId);
    return NextResponse.json({ success: true });
  }

  /** Legacy free_table → prefer settle or cancel; keep as cancel for empty, settle blocked */
  if (action === "free_table") {
    return NextResponse.json(
      {
        error:
          "Use settle_pay, cancel_seating, or walkout_close instead of free_table",
      },
      { status: 400 }
    );
  }

  if (action === "create_takeaway") {
    const guestName = (body.guestName as string | undefined)?.trim();
    if (!guestName) {
      return NextResponse.json({ error: "Guest name required" }, { status: 400 });
    }
    const orderItems = await resolveMenuItems(outletId, body.items || []);
    if (!orderItems.length) {
      return NextResponse.json({ error: "Add at least one menu item" }, { status: 400 });
    }

    const allocation = await prisma.tableAllocation.create({
      data: {
        outletId,
        guestName,
        guestCount: body.guestCount ?? 1,
        guestPhone: body.guestPhone?.trim() || null,
        mode: "takeaway",
        status: "active",
        order: {
          create: {
            items: { create: orderItems },
            subtotal: orderSubtotal(orderItems),
          },
        },
      },
      include: { order: { include: { items: true } } },
    });

    await notifyOutletMembers(
      outletId,
      "takeaway_order",
      `Takeaway · ${guestName} · ${orderItems.length} item(s)`,
      { skipBump: true }
    );
    await bumpOutletOps(outletId);
    return NextResponse.json(allocation);
  }

  if (action === "create_waitlist") {
    const guestName = (body.guestName as string | undefined)?.trim();
    if (!guestName) {
      return NextResponse.json({ error: "Guest name required" }, { status: 400 });
    }
    const orderItems = await resolveMenuItems(outletId, body.items || []);

    const allocation = await prisma.tableAllocation.create({
      data: {
        outletId,
        guestName,
        guestCount: body.guestCount ?? 2,
        guestPhone: body.guestPhone?.trim() || null,
        mode: "waitlist",
        status: "waiting",
        order: orderItems.length
          ? {
              create: {
                items: { create: orderItems },
                subtotal: orderSubtotal(orderItems),
              },
            }
          : undefined,
      },
      include: { order: { include: { items: true } } },
    });

    await notifyOutletMembers(
      outletId,
      "waitlist_order",
      `Waitlist · ${guestName} · party ${allocation.guestCount}${
        orderItems.length ? ` · ${orderItems.length} item(s)` : ""
      }`,
      { skipBump: true }
    );
    await bumpOutletOps(outletId);
    return NextResponse.json(allocation);
  }

  if (action === "create_reservation") {
    const guestName = (body.guestName as string | undefined)?.trim();
    const tableId = body.tableId as string | undefined;
    const reservedForRaw = body.reservedFor as string | undefined;
    if (!guestName || !tableId || !reservedForRaw) {
      return NextResponse.json(
        { error: "Guest name, table, and reservation time required" },
        { status: 400 }
      );
    }
    const reservedFor = new Date(reservedForRaw);
    if (Number.isNaN(reservedFor.getTime())) {
      return NextResponse.json({ error: "Invalid reservation time" }, { status: 400 });
    }

    const table = await prisma.restaurantTable.findFirst({
      where: { id: tableId, outletId },
    });
    if (!table) return NextResponse.json({ error: "Table not found" }, { status: 404 });
    if (table.status !== "available") {
      return NextResponse.json({ error: "Table is not available" }, { status: 400 });
    }

    const orderItems = (await resolveMenuItems(outletId, body.items || [])).map(
      (item) => ({
        ...item,
        kitchenStatus: "held",
        sentToKitchenAt: null as Date | null,
      })
    );

    const allocation = await prisma.tableAllocation.create({
      data: {
        outletId,
        tableId,
        guestName,
        guestCount: body.guestCount ?? 2,
        guestPhone: body.guestPhone?.trim() || null,
        mode: "reservation",
        status: "reserved",
        reservedFor,
        order: orderItems.length
          ? {
              create: {
                items: { create: orderItems },
                subtotal: orderSubtotal(orderItems),
              },
            }
          : undefined,
      },
      include: {
        table: true,
        order: { include: { items: true } },
      },
    });

    // Table stays available until ~15 min before reservedFor
    await notifyOutletMembers(
      outletId,
      "reservation_order",
      `Reservation · Table ${table.label} · ${guestName} · ${reservedFor.toLocaleString()}${
        orderItems.length ? ` · ${orderItems.length} pre-ordered item(s)` : ""
      }`,
      { skipBump: true }
    );
    await bumpOutletOps(outletId);
    return NextResponse.json(allocation);
  }

  if (action === "seat_waitlist") {
    const allocationId = body.allocationId as string | undefined;
    const tableId = body.tableId as string | undefined;
    if (!allocationId || !tableId) {
      return NextResponse.json({ error: "Waitlist entry and table required" }, { status: 400 });
    }

    const allocation = await prisma.tableAllocation.findFirst({
      where: { id: allocationId, outletId, mode: "waitlist", status: "waiting" },
      include: { order: { include: { items: true } } },
    });
    if (!allocation) {
      return NextResponse.json({ error: "Waitlist entry not found" }, { status: 404 });
    }

    const table = await prisma.restaurantTable.findFirst({
      where: { id: tableId, outletId },
    });
    if (!table) return NextResponse.json({ error: "Table not found" }, { status: 404 });
    if (table.status !== "available") {
      return NextResponse.json({ error: "Table is not available" }, { status: 400 });
    }

    const updated = await prisma.tableAllocation.update({
      where: { id: allocation.id },
      data: {
        tableId,
        status: "active",
        mode: "dine_in",
        startTime: new Date(),
      },
      include: {
        table: true,
        order: { include: { items: true } },
      },
    });

    await prisma.restaurantTable.update({
      where: { id: tableId },
      data: { status: "occupied" },
    });

    // Ensure kitchen sees items as freshly sent
    if (updated.order?.items?.length) {
      await prisma.tableOrderItem.updateMany({
        where: {
          orderId: updated.order.id,
          voided: false,
          kitchenStatus: { not: "cancelled" },
        },
        data: { kitchenStatus: "pending", sentToKitchenAt: new Date() },
      });
    }

    const itemCount = updated.order?.items?.filter((i) => !i.voided).length ?? 0;
    await notifyOutletMembers(
      outletId,
      "waitlist_seated",
      `Waitlist seated · Table ${table.label} · ${allocation.guestName}${
        itemCount ? ` · ${itemCount} item(s) to kitchen` : ""
      }`,
      { skipBump: true }
    );
    await bumpOutletOps(outletId);
    return NextResponse.json(updated);
  }

  if (action === "arrive_reservation") {
    const allocation = await prisma.tableAllocation.findFirst({
      where: {
        id: body.allocationId,
        outletId,
        mode: "reservation",
        status: "reserved",
      },
      include: { table: true, order: { include: { items: true } } },
    });
    if (!allocation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    if (allocation.tableId) {
      const blocking = await prisma.tableAllocation.findFirst({
        where: {
          tableId: allocation.tableId,
          id: { not: allocation.id },
          status: "active",
        },
        select: { guestName: true },
      });
      if (blocking) {
        return NextResponse.json(
          {
            error: `Table still in use by ${blocking.guestName}. Clear it before seating this reservation.`,
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.tableAllocation.update({
      where: { id: allocation.id },
      data: { status: "active", mode: "dine_in", startTime: new Date() },
      include: { table: true, order: { include: { items: true } } },
    });

    if (allocation.tableId) {
      await prisma.restaurantTable.update({
        where: { id: allocation.tableId },
        data: { status: "occupied" },
      });
    }

    if (updated.order?.items?.length) {
      await prisma.tableOrderItem.updateMany({
        where: {
          orderId: updated.order.id,
          voided: false,
          kitchenStatus: { not: "cancelled" },
        },
        data: { kitchenStatus: "pending", sentToKitchenAt: new Date() },
      });
    }

    await notifyOutletMembers(
      outletId,
      "new_order",
      `Reservation arrived · Table ${allocation.table?.label ?? "?"} · ${allocation.guestName}`,
      { skipBump: true }
    );
    await bumpOutletOps(outletId);
    return NextResponse.json(updated);
  }

  if (action === "cancel_service_order") {
    const allocation = await prisma.tableAllocation.findFirst({
      where: {
        id: body.allocationId,
        outletId,
        status: { in: ["waiting", "reserved", "active"] },
      },
      include: { order: { include: { items: true } }, table: true },
    });
    if (!allocation) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const endTime = new Date();
    if (allocation.order && allocation.order.status === "open") {
      await prisma.tableOrder.update({
        where: { id: allocation.order.id },
        data: {
          status: "cancelled",
          voidedAt: endTime,
          closeReason: (body.reason as string | undefined)?.trim() || "cancelled",
          closedById: actorId,
        },
      });
      await prisma.tableOrderItem.updateMany({
        where: { orderId: allocation.order.id },
        data: { kitchenStatus: "cancelled" },
      });
    }

    await prisma.tableAllocation.update({
      where: { id: allocation.id },
      data: { status: "cancelled", endTime },
    });

    if (allocation.tableId) {
      const otherActive = await prisma.tableAllocation.findFirst({
        where: {
          tableId: allocation.tableId,
          id: { not: allocation.id },
          status: "active",
        },
        select: { id: true },
      });
      if (!otherActive) {
        await prisma.restaurantTable.update({
          where: { id: allocation.tableId },
          data: { status: "available" },
        });
      }
    }

    await bumpOutletOps(outletId);
    return NextResponse.json({ success: true });
  }

  if (action === "settle_service_order") {
    const allocation = await prisma.tableAllocation.findFirst({
      where: {
        id: body.allocationId,
        outletId,
        mode: { in: ["takeaway", "waitlist"] },
        status: { in: ["waiting", "active"] },
      },
      include: { order: { include: { items: true } } },
    });
    if (!allocation?.order || allocation.order.status !== "open") {
      return NextResponse.json({ error: "Open service order not found" }, { status: 404 });
    }
    const items = allocation.order.items.filter((i) => !i.voided);
    if (!items.length) {
      return NextResponse.json({ error: "Add menu items before settling" }, { status: 400 });
    }

    const paidAt = new Date();
    const subtotal = orderSubtotal(items);
    const paymentMethod = body.paymentMethod || "cash";
    const label = serviceLabel(allocation.mode);

    const finance = await createOrderIncomeEntry({
      outletId,
      orderId: allocation.order.id,
      amount: subtotal,
      paidAt,
      tableLabel: label,
      guestName: allocation.guestName,
      paymentMethod,
      createdById: actorId,
    });

    await prisma.tableOrder.update({
      where: { id: allocation.order.id },
      data: {
        status: "paid",
        subtotal,
        paidAt,
        paymentMethod,
        closedById: actorId,
        financeEntryId: finance.id,
      },
    });
    await prisma.tableAllocation.update({
      where: { id: allocation.id },
      data: { status: "completed", endTime: paidAt },
    });
    await applyOrderStockChange({
      outletId,
      orderId: allocation.order.id,
      items: allocation.order.items,
      type: "sale",
      createdById: actorId,
      note: `Sale · ${label}`,
    });
    await prisma.tableOrderItem.updateMany({
      where: { orderId: allocation.order.id, kitchenStatus: { not: "cancelled" } },
      data: { kitchenStatus: "cancelled" },
    });

    await notifyOutletMembers(
      outletId,
      "order_settled",
      `Paid · ${label} · ${allocation.guestName}`,
      { skipBump: true }
    );
    await bumpOutletOps(outletId);
    return NextResponse.json({ success: true, finance });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ outletId: string }> }
) {
  const { outletId } = await params;
  const auth = await requireOutletAccess(outletId, "manager");
  if ("error" in auth) return auth.error;

  const { tableId } = await req.json();
  const table = await prisma.restaurantTable.findFirst({ where: { id: tableId, outletId } });
  if (!table) return NextResponse.json({ error: "Table not found" }, { status: 404 });

  await prisma.restaurantTable.delete({ where: { id: tableId } });
  await bumpOutletOps(outletId);
  return NextResponse.json({ success: true });
}
