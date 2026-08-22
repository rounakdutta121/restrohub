import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOutletAccess } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";
import { bumpOutletOps } from "@/lib/outlet-live";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ outletId: string }> }
) {
  const { outletId } = await params;
  const auth = await requireOutletAccess(outletId, "manager");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const now = new Date();
  const m = month ? parseInt(month) : now.getMonth() + 1;
  const y = year ? parseInt(year) : now.getFullYear();
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59);

  const entries = await prisma.financeEntry.findMany({
    where: { outletId, date: { gte: start, lte: end } },
    orderBy: { date: "desc" },
  });

  const active = entries.filter((e) => !e.voidedAt);
  const income = active
    .filter((e) => e.type === "income")
    .reduce((s, e) => s + e.amount, 0);
  const expense = active
    .filter((e) => e.type === "expense")
    .reduce((s, e) => s + e.amount, 0);

  return NextResponse.json({
    entries,
    summary: { income, expense, profit: income - expense, month: m, year: y },
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ outletId: string }> }
) {
  const { outletId } = await params;
  const auth = await requireOutletAccess(outletId, "manager");
  if ("error" in auth) return auth.error;

  const { type, amount, category, date, note } = await req.json();

  const entry = await prisma.financeEntry.create({
    data: {
      outletId,
      type,
      amount: parseFloat(amount),
      category,
      date: new Date(date),
      note,
      sourceType: "manual",
      createdById: auth.user.id,
    },
  });

  await writeAuditLog({
    workspaceId: auth.workspace.id,
    outletId,
    actorId: auth.user.id,
    action: "finance_create",
    entityType: "FinanceEntry",
    entityId: entry.id,
    after: { type, amount: entry.amount, category },
  });

  await bumpOutletOps(outletId);
  return NextResponse.json(entry);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ outletId: string }> }
) {
  const { outletId } = await params;
  const auth = await requireOutletAccess(outletId, "manager");
  if ("error" in auth) return auth.error;

  const { id } = await req.json();
  const entry = await prisma.financeEntry.findFirst({ where: { id, outletId } });
  if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

  if (entry.sourceType === "order" || entry.sourceType === "adjustment") {
    return NextResponse.json(
      {
        error:
          "Table sales cannot be deleted here. Void the paid order from Tables (manager) to reverse income.",
      },
      { status: 400 }
    );
  }

  await prisma.financeEntry.delete({ where: { id } });

  await writeAuditLog({
    workspaceId: auth.workspace.id,
    outletId,
    actorId: auth.user.id,
    action: "finance_delete",
    entityType: "FinanceEntry",
    entityId: id,
    before: { type: entry.type, amount: entry.amount, category: entry.category },
  });

  await bumpOutletOps(outletId);
  return NextResponse.json({ success: true });
}
