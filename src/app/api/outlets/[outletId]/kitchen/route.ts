import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOutletAccess } from "@/lib/permissions";

/** Active kitchen tickets for open table orders at this outlet. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ outletId: string }> }
) {
  const { outletId } = await params;
  const auth = await requireOutletAccess(outletId);
  if ("error" in auth) return auth.error;

  const allocations = await prisma.tableAllocation.findMany({
    where: {
      status: "active",
      table: { outletId },
      order: {
        status: "open",
        items: {
          some: {
            voided: false,
            kitchenStatus: { in: ["pending", "preparing", "ready"] },
          },
        },
      },
    },
    include: {
      table: { select: { id: true, label: true } },
      order: {
        include: {
          items: {
            where: {
              voided: false,
              kitchenStatus: { in: ["pending", "preparing", "ready"] },
            },
            orderBy: { sentToKitchenAt: "asc" },
          },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  const tickets = allocations
    .filter((a) => a.order && a.order.items.length > 0)
    .map((a) => {
      const items = a.order!.items;
      const oldest = items.reduce((min, i) => {
        const t = i.sentToKitchenAt?.getTime() ?? a.startTime.getTime();
        return t < min ? t : min;
      }, Date.now());
      return {
        allocationId: a.id,
        orderId: a.order!.id,
        tableId: a.table.id,
        tableLabel: a.table.label,
        guestName: a.guestName,
        guestCount: a.guestCount,
        startTime: a.startTime,
        oldestSentAt: new Date(oldest).toISOString(),
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          notes: i.notes,
          kitchenStatus: i.kitchenStatus,
          sentToKitchenAt: i.sentToKitchenAt,
        })),
      };
    })
    .sort(
      (a, b) =>
        new Date(a.oldestSentAt).getTime() - new Date(b.oldestSentAt).getTime()
    );

  return NextResponse.json({ tickets });
}
