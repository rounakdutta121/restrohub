import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrgMember } from "@/lib/permissions";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(from: Date, to: Date) {
  return Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const auth = await requireOrgMember(workspaceId, "manager");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const outletId = searchParams.get("outletId") || undefined;
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
  const from = searchParams.get("from")
    ? startOfDay(new Date(searchParams.get("from")!))
    : startOfDay(defaultFrom);
  const toParam = searchParams.get("to") ? new Date(searchParams.get("to")!) : now;
  const to = new Date(toParam.getFullYear(), toParam.getMonth(), toParam.getDate(), 23, 59, 59);

  const periodDays = daysBetween(from, to);
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - (periodDays - 1));
  prevFrom.setHours(0, 0, 0, 0);

  const outlets = await prisma.outlet.findMany({
    where: { workspaceId, ...(outletId ? { id: outletId } : {}) },
    select: { id: true, name: true, currency: true },
  });
  const outletIds = outlets.map((o) => o.id);
  if (!outletIds.length) {
    return NextResponse.json({
      range: { from, to },
      kpis: emptyKpis(),
      growth: { revenuePct: null, turnsPct: null },
      byOutlet: [],
      revenueByDay: [],
      incomeVsExpense: [],
      topItems: [],
      byHour: Array.from({ length: 24 }, (_, h) => ({ hour: h, revenue: 0, orders: 0 })),
      byTable: [],
      integrity: { walkouts: 0, voids: 0, cancels: 0, comps: 0 },
      visits: [],
      lowStock: [],
      cogsComplete: false,
    });
  }

  const tableFilter = { outletId: { in: outletIds } };

  const [paidOrders, prevPaidOrders, allocations, financeEntries, prevFinance, tables, stock] =
    await Promise.all([
      prisma.tableOrder.findMany({
        where: {
          status: "paid",
          paidAt: { gte: from, lte: to },
          allocation: { table: tableFilter },
        },
        include: {
          items: true,
          allocation: {
            include: {
              table: { select: { id: true, label: true, outletId: true } },
            },
          },
        },
      }),
      prisma.tableOrder.findMany({
        where: {
          status: "paid",
          paidAt: { gte: prevFrom, lte: prevTo },
          allocation: { table: tableFilter },
        },
        select: { subtotal: true },
      }),
      prisma.tableAllocation.findMany({
        where: {
          endTime: { gte: from, lte: to },
          table: tableFilter,
          status: { in: ["completed", "cancelled", "walkout"] },
        },
        include: {
          order: { select: { status: true, closeReason: true, subtotal: true } },
          table: { select: { id: true, label: true, outletId: true } },
        },
      }),
      prisma.financeEntry.findMany({
        where: {
          outletId: { in: outletIds },
          date: { gte: from, lte: to },
        },
      }),
      prisma.financeEntry.findMany({
        where: {
          outletId: { in: outletIds },
          date: { gte: prevFrom, lte: prevTo },
        },
      }),
      prisma.restaurantTable.findMany({
        where: tableFilter,
        select: { id: true, label: true, outletId: true },
      }),
      prisma.ingredientStock.findMany({
        where: { outletId: { in: outletIds } },
        include: { ingredient: { select: { name: true, unit: true } } },
      }),
    ]);

  const successfulTurns = allocations.filter(
    (a) => a.status === "completed" && a.order?.status === "paid"
  );
  const walkouts = allocations.filter((a) => a.status === "walkout").length;
  const cancels = allocations.filter((a) => a.status === "cancelled").length;
  const voids = await prisma.tableOrder.count({
    where: {
      status: "voided",
      voidedAt: { gte: from, lte: to },
      closeReason: { startsWith: "void:" },
      allocation: { table: tableFilter },
    },
  });
  const comps = await prisma.tableOrder.count({
    where: {
      status: "voided",
      voidedAt: { gte: from, lte: to },
      closeReason: { startsWith: "comp:" },
      allocation: { table: tableFilter },
    },
  });

  const opsRevenue = paidOrders.reduce((s, o) => s + (o.subtotal || 0), 0);
  const prevOpsRevenue = prevPaidOrders.reduce((s, o) => s + (o.subtotal || 0), 0);
  const activeFinance = financeEntries.filter((e) => !e.voidedAt);
  const activePrevFinance = prevFinance.filter((e) => !e.voidedAt);
  const income = activeFinance
    .filter((e) => e.type === "income")
    .reduce((s, e) => s + e.amount, 0);
  const expense = activeFinance
    .filter((e) => e.type === "expense")
    .reduce((s, e) => s + e.amount, 0);
  const prevIncome = activePrevFinance
    .filter((e) => e.type === "income")
    .reduce((s, e) => s + e.amount, 0);

  const covers = successfulTurns.reduce((s, a) => s + a.guestCount, 0);
  const turns = successfulTurns.length;
  const avgCheck = turns > 0 ? opsRevenue / turns : 0;

  const todayStart = startOfDay(now);
  const dailyRevenue = paidOrders
    .filter((o) => o.paidAt && o.paidAt >= todayStart)
    .reduce((s, o) => s + (o.subtotal || 0), 0);

  const revenuePct =
    prevIncome > 0 ? Math.round(((income - prevIncome) / prevIncome) * 1000) / 10 : null;
  const prevTurns = await prisma.tableAllocation.count({
    where: {
      endTime: { gte: prevFrom, lte: prevTo },
      status: "completed",
      table: tableFilter,
      order: { status: "paid" },
    },
  });
  const turnsPct =
    prevTurns > 0 ? Math.round(((turns - prevTurns) / prevTurns) * 1000) / 10 : null;

  // By outlet
  const byOutlet = outlets.map((o) => {
    const oOrders = paidOrders.filter((ord) => ord.allocation.table.outletId === o.id);
    const oFin = activeFinance.filter((e) => e.outletId === o.id);
    const oIncome = oFin.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
    const oExpense = oFin.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
    const oTurns = successfulTurns.filter((a) => a.table.outletId === o.id).length;
    return {
      outletId: o.id,
      name: o.name,
      currency: o.currency,
      opsRevenue: oOrders.reduce((s, ord) => s + (ord.subtotal || 0), 0),
      income: oIncome,
      expense: oExpense,
      profit: oIncome - oExpense,
      turns: oTurns,
    };
  });

  // Revenue by day
  const dayMap = new Map<string, number>();
  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    dayMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const o of paidOrders) {
    if (!o.paidAt) continue;
    const key = o.paidAt.toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) ?? 0) + (o.subtotal || 0));
  }
  const revenueByDay = [...dayMap.entries()].map(([date, revenue]) => ({ date, revenue }));

  // Income vs expense by day from finance
  const ieMap = new Map<string, { income: number; expense: number }>();
  for (const e of activeFinance) {
    const key = e.date.toISOString().slice(0, 10);
    const cur = ieMap.get(key) ?? { income: 0, expense: 0 };
    if (e.type === "income") cur.income += e.amount;
    else cur.expense += e.amount;
    ieMap.set(key, cur);
  }
  const incomeVsExpense = [...ieMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  // Top items
  const itemMap = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of paidOrders) {
    for (const item of o.items) {
      if (item.voided) continue;
      const cur = itemMap.get(item.name) ?? { name: item.name, qty: 0, revenue: 0 };
      cur.qty += item.quantity;
      cur.revenue += item.price * item.quantity;
      itemMap.set(item.name, cur);
    }
  }
  const topItems = [...itemMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // Peak hours
  const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, revenue: 0, orders: 0 }));
  for (const o of paidOrders) {
    if (!o.paidAt) continue;
    const h = o.paidAt.getHours();
    byHour[h].revenue += o.subtotal || 0;
    byHour[h].orders += 1;
  }

  // Table performance
  const tableMap = new Map<
    string,
    { tableId: string; label: string; outletId: string; turns: number; revenue: number }
  >();
  for (const t of tables) {
    tableMap.set(t.id, {
      tableId: t.id,
      label: t.label,
      outletId: t.outletId,
      turns: 0,
      revenue: 0,
    });
  }
  for (const a of successfulTurns) {
    const row = tableMap.get(a.table.id);
    if (!row) continue;
    row.turns += 1;
    row.revenue += a.order?.subtotal || 0;
  }
  const byTable = [...tableMap.values()]
    .filter((t) => t.turns > 0 || t.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const visits = paidOrders
    .slice()
    .sort((a, b) => (b.paidAt?.getTime() ?? 0) - (a.paidAt?.getTime() ?? 0))
    .slice(0, 40)
    .map((o) => ({
      orderId: o.id,
      paidAt: o.paidAt,
      subtotal: o.subtotal,
      paymentMethod: o.paymentMethod,
      guestName: o.allocation.guestName,
      guestCount: o.allocation.guestCount,
      tableLabel: o.allocation.table.label,
      outletId: o.allocation.table.outletId,
      items: o.items
        .filter((i) => !i.voided)
        .map((i) => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
    }));

  const lowStock = stock
    .filter((s) => s.quantity <= s.reorderLevel)
    .map((s) => ({
      outletId: s.outletId,
      name: s.ingredient.name,
      quantity: s.quantity,
      reorderLevel: s.reorderLevel,
      unit: s.ingredient.unit,
    }));

  const recipeCount = await prisma.recipeLine.count({
    where: { menuItem: { category: { outletId: { in: outletIds } } } },
  });

  return NextResponse.json({
    range: { from, to, prevFrom, prevTo },
    outlets: await prisma.outlet.findMany({
      where: { workspaceId },
      select: { id: true, name: true, currency: true },
    }),
    kpis: {
      dailyRevenue,
      periodRevenue: opsRevenue,
      income,
      expense,
      profit: income - expense,
      covers,
      turns,
      avgCheck,
      walkouts,
      voids,
      cancels,
      comps,
    },
    growth: { revenuePct, turnsPct },
    byOutlet,
    revenueByDay,
    incomeVsExpense,
    topItems,
    byHour,
    byTable,
    integrity: { walkouts, voids, cancels, comps },
    visits,
    lowStock,
    cogsComplete: recipeCount > 0,
  });
}

function emptyKpis() {
  return {
    dailyRevenue: 0,
    periodRevenue: 0,
    income: 0,
    expense: 0,
    profit: 0,
    covers: 0,
    turns: 0,
    avgCheck: 0,
    walkouts: 0,
    voids: 0,
    cancels: 0,
    comps: 0,
  };
}
