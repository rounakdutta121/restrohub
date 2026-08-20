import { prisma } from "@/lib/prisma";

export async function createOrderIncomeEntry(opts: {
  outletId: string;
  orderId: string;
  amount: number;
  paidAt: Date;
  tableLabel: string;
  guestName: string;
  paymentMethod?: string | null;
  createdById?: string | null;
}) {
  const method = opts.paymentMethod ? ` · ${opts.paymentMethod}` : "";
  const entry = await prisma.financeEntry.create({
    data: {
      outletId: opts.outletId,
      type: "income",
      amount: opts.amount,
      category: "sales",
      date: opts.paidAt,
      note: `Table ${opts.tableLabel} · ${opts.guestName}${method}`,
      sourceType: "order",
      sourceId: opts.orderId,
      createdById: opts.createdById ?? undefined,
    },
  });
  return entry;
}

/** Reverse a paid order's income with an adjustment entry (net zero). */
export async function reverseOrderIncomeEntry(opts: {
  outletId: string;
  orderId: string;
  financeEntryId: string | null | undefined;
  reason: string;
  createdById?: string | null;
}) {
  if (!opts.financeEntryId) return null;

  const original = await prisma.financeEntry.findFirst({
    where: { id: opts.financeEntryId, outletId: opts.outletId },
  });
  if (!original || original.voidedAt) return null;

  const adjustment = await prisma.financeEntry.create({
    data: {
      outletId: opts.outletId,
      type: "expense",
      amount: original.amount,
      category: "sales_void",
      date: new Date(),
      note: `Void sales · ${opts.reason}`,
      sourceType: "adjustment",
      sourceId: opts.orderId,
      createdById: opts.createdById ?? undefined,
      reversedEntryId: original.id,
    },
  });

  await prisma.financeEntry.update({
    where: { id: original.id },
    data: { voidedAt: new Date(), reversedEntryId: adjustment.id },
  });

  return adjustment;
}

/** Active P&L amounts — voided income excluded; adjustments count as expense. */
export function isActiveFinanceEntry(entry: { voidedAt?: Date | null }) {
  return !entry.voidedAt;
}
