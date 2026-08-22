import { prisma } from "@/lib/prisma";
import { notifyOutletMembers } from "@/lib/notifications";
import { bumpOutletOps } from "@/lib/outlet-live";

/** Table is held starting this long before reservedFor */
export const RESERVATION_HOLD_MS = 15 * 60 * 1000;
/** Re-alert to clear a busy table at most this often */
const CLEAR_ALERT_COOLDOWN_MS = 5 * 60 * 1000;

/**
 * Reservation hold window:
 * - Far-future bookings do not occupy the table.
 * - From 15 min before reservedFor: occupy if free; if busy, alert staff to clear.
 * Also releases tables that were incorrectly held early.
 */
export async function checkReservationReminders(outletId: string) {
  const now = new Date();
  const holdHorizon = new Date(now.getTime() + RESERVATION_HOLD_MS);

  let bumped = false;

  // Free tables held by reservations that are still outside the 15‑min window
  const premature = await prisma.tableAllocation.findMany({
    where: {
      OR: [{ outletId }, { table: { outletId } }],
      mode: "reservation",
      status: "reserved",
      reservedFor: { gt: holdHorizon },
      tableId: { not: null },
    },
    include: { table: { select: { id: true, status: true, label: true } } },
  });

  for (const a of premature) {
    if (!a.tableId || !a.table || a.table.status !== "occupied") continue;
    const otherActive = await prisma.tableAllocation.findFirst({
      where: {
        tableId: a.tableId,
        id: { not: a.id },
        status: "active",
      },
      select: { id: true },
    });
    if (otherActive) continue;
    await prisma.restaurantTable.update({
      where: { id: a.tableId },
      data: { status: "available" },
    });
    bumped = true;
  }

  // Reservations entering (or past) the hold window
  const due = await prisma.tableAllocation.findMany({
    where: {
      OR: [{ outletId }, { table: { outletId } }],
      mode: "reservation",
      status: "reserved",
      reservedFor: { lte: holdHorizon },
      tableId: { not: null },
    },
    include: {
      table: { select: { id: true, label: true, status: true } },
      order: {
        include: {
          items: { where: { voided: false }, select: { name: true, quantity: true } },
        },
      },
    },
  });

  for (const a of due) {
    if (!a.tableId || !a.table) continue;

    const when = a.reservedFor
      ? a.reservedFor.toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "soon";
    const tableLabel = a.table.label;
    const items = a.order?.items ?? [];
    const menu =
      items.length === 0
        ? "no items yet"
        : items.map((i) => `${i.quantity}× ${i.name}`).join(", ");

    const blocking = await prisma.tableAllocation.findFirst({
      where: {
        tableId: a.tableId,
        id: { not: a.id },
        status: "active",
      },
      select: { id: true, guestName: true },
    });

    if (blocking || a.table.status === "occupied") {
      // Occupied by someone else (or leftover occupied without this hold)
      if (blocking) {
        const lastAlert = a.reminderSentAt?.getTime() ?? 0;
        if (now.getTime() - lastAlert >= CLEAR_ALERT_COOLDOWN_MS) {
          await notifyOutletMembers(
            outletId,
            "reservation_clear_table",
            `Clear table ${tableLabel} · reservation for ${a.guestName} at ${when} (currently: ${blocking.guestName})`,
            { skipBump: true }
          );
          await prisma.tableAllocation.update({
            where: { id: a.id },
            data: { reminderSentAt: now },
          });
          bumped = true;
        }
        continue;
      }

      // Table marked occupied but no other active visit — claim for this reservation
      if (!a.reminderSentAt) {
        await notifyOutletMembers(
          outletId,
          "reservation_reminder",
          `Table ${tableLabel} held · ${a.guestName} at ${when} · ${menu}`,
          { skipBump: true }
        );
        await prisma.tableAllocation.update({
          where: { id: a.id },
          data: { reminderSentAt: now },
        });
        bumped = true;
      }
      continue;
    }

    // Table is free — occupy for the reservation
    await prisma.restaurantTable.update({
      where: { id: a.tableId },
      data: { status: "occupied" },
    });

    if (!a.reminderSentAt) {
      await notifyOutletMembers(
        outletId,
        "reservation_reminder",
        `Table ${tableLabel} held for reservation · ${a.guestName} at ${when} · ${menu}`,
        { skipBump: true }
      );
      await prisma.tableAllocation.update({
        where: { id: a.id },
        data: { reminderSentAt: now },
      });
    }
    bumped = true;
  }

  if (bumped) await bumpOutletOps(outletId);
  return due.length;
}

export function serviceLabel(mode: string, tableLabel?: string | null) {
  if (mode === "takeaway") return "Takeaway";
  if (mode === "waitlist") return "Waitlist";
  if (mode === "reservation") return tableLabel ? `Res · ${tableLabel}` : "Reservation";
  return tableLabel || "Table";
}
