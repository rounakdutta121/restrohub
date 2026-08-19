import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOutletAccess } from "@/lib/permissions";

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

function orderTotal(items: { price: number; quantity: number }[]) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
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

  const minRole = action === "create_table" || action === "delete_table" ? "manager" : undefined;
  const auth = await requireOutletAccess(outletId, minRole);
  if ("error" in auth) return auth.error;

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
    }

    return NextResponse.json({ order, total: order ? orderTotal(order.items) : 0 });
  }

  if (action === "remove_order_item") {
    const item = await prisma.tableOrderItem.findFirst({
      where: {
        id: body.itemId,
        order: { allocation: { status: "active", table: { outletId } } },
      },
    });
    if (!item) return NextResponse.json({ error: "Order item not found" }, { status: 404 });

    await prisma.tableOrderItem.delete({ where: { id: item.id } });
    return NextResponse.json({ success: true });
  }

  if (action === "free_table") {
    await prisma.tableAllocation.updateMany({
      where: { tableId: body.tableId, status: "active" },
      data: { status: "completed", endTime: new Date() },
    });
    await prisma.tableOrder.updateMany({
      where: {
        allocation: { tableId: body.tableId, status: "completed" },
        status: "open",
      },
      data: { status: "closed" },
    });
    const table = await prisma.restaurantTable.update({
      where: { id: body.tableId },
      data: { status: "available" },
    });
    return NextResponse.json(table);
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
