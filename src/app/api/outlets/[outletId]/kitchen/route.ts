import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOutletAccess } from "@/lib/permissions";
import { serviceLabel } from "@/lib/service-orders";
import { checkReservationReminders } from "@/lib/service-orders";

/** Active kitchen tickets — reservations only after Guest arrived (status active). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ outletId: string }> }
) {
  const { outletId } = await params;
  const auth = await requireOutletAccess(outletId);
  if ("error" in auth) return auth.error;

  try {
    await checkReservationReminders(outletId).catch(() => undefined);

    const allocations = await prisma.tableAllocation.findMany({
      where: {
        OR: [{ outletId }, { table: { outletId } }],
        status: { in: ["active", "waiting"] },
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
        const label = serviceLabel(a.mode, a.table?.label);
        return {
          allocationId: a.id,
          orderId: a.order!.id,
          mode: a.mode,
          tableId: a.table?.id ?? null,
          tableLabel: label,
          guestName: a.guestName,
          guestCount: a.guestCount,
          startTime: a.startTime,
          reservedFor: a.reservedFor,
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
  } catch (err) {
    console.error("GET kitchen failed", err);
    return NextResponse.json({ error: "Failed to load kitchen", tickets: [] }, { status: 500 });
  }
}
