import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOutletAccess, hasMinRole } from "@/lib/permissions";
import { orderSubtotal } from "@/lib/order-math";
import { createOrderIncomeEntry, reverseOrderIncomeEntry } from "@/lib/order-finance";
import { applyOrderStockChange } from "@/lib/stock-movements";
import { writeAuditLog } from "@/lib/audit";
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

  const tables = await prisma.restaurantTable.findMany({
    where: { outletId },
    include: { allocations: allocationInclude },
    orderBy: { label: "asc" },
  });

  return NextResponse.json(tables);
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
        tableId: body.tableId,
        guestName: body.guestName,
        guestCount: body.guestCount ?? 2,
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

    return NextResponse.json({ table: { ...table, status: "occupied" }, allocation });
  }

  if (action === "add_order_items") {
    const allocation = await prisma.tableAllocation.findFirst({
      where: {
        id: body.allocationId,
        status: "active",
        table: { outletId },
      },
      include: { order: { include: { items: true } } },
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
      data: { voided: true },
    });
    const remaining = await prisma.tableOrderItem.findMany({ where: { orderId: item.orderId } });
    await prisma.tableOrder.update({
      where: { id: item.orderId },
      data: { subtotal: orderSubtotal(remaining) },
    });
    return NextResponse.json({ success: true });
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

    await writeAuditLog({
      workspaceId,
      outletId,
      actorId,
      action: "settle_pay",
      entityType: "TableOrder",
      entityId: order.id,
      after: { subtotal, paymentMethod, financeEntryId: finance.id },
    });

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

  if (action === "reserve") {
    const table = await prisma.restaurantTable.update({
      where: { id: body.tableId },
      data: { status: "reserved" },
    });
    return NextResponse.json(table);
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
  return NextResponse.json({ success: true });
}
