import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireOrgMember } from "@/lib/permissions";
import { checkOverdueChecklists } from "@/lib/notifications";
import { can } from "@/lib/roles";

export async function GET(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  const outletId = searchParams.get("outletId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const memberAuth = await requireOrgMember(workspaceId);
  if ("error" in memberAuth) return memberAuth.error;

  await checkOverdueChecklists(workspaceId);

  const outlets = await prisma.outlet.findMany({
    where: { workspaceId },
    include: {
      _count: {
        select: {
          menuCategories: true,
          ingredientStock: true,
          tables: true,
          financeEntries: true,
        },
      },
    },
  });

  const outletFilter = outletId ? { outletId } : {};

  const [totalChecklists, totalRuns, completedRuns, overdueRuns, recentRuns, stockItems] =
    await Promise.all([
      prisma.sOP.count({ where: { workspaceId, ...outletFilter } }),
      prisma.checklistRun.count({
        where: { sop: { workspaceId }, ...outletFilter },
      }),
      prisma.checklistRun.count({
        where: { sop: { workspaceId }, status: "completed", ...outletFilter },
      }),
      prisma.checklistRun.count({
        where: {
          sop: { workspaceId },
          status: { not: "completed" },
          dueDate: { lt: new Date() },
          ...outletFilter,
        },
      }),
      prisma.checklistRun.findMany({
        where: { sop: { workspaceId }, ...outletFilter },
        include: {
          sop: { select: { title: true, type: true } },
          assignedTo: { select: { name: true, email: true } },
          outlet: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
      outletId
        ? prisma.ingredientStock.findMany({
            where: { outletId },
            include: { ingredient: true },
          })
        : Promise.resolve([]),
    ]);

  const lowStockCount = stockItems.filter((s) => s.quantity <= s.reorderLevel).length;

  const complianceRate =
    totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 100;

  const role = memberAuth.member.role;
  const includeFinance = can(role, "viewFinance");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const financeEntries = includeFinance
    ? await prisma.financeEntry.findMany({
        where: {
          outlet: { workspaceId },
          date: { gte: monthStart },
          ...(outletId ? { outletId } : {}),
        },
      })
    : [];

  const monthlyIncome = financeEntries
    .filter((e) => e.type === "income")
    .reduce((s, e) => s + e.amount, 0);
  const monthlyExpense = financeEntries
    .filter((e) => e.type === "expense")
    .reduce((s, e) => s + e.amount, 0);

  return NextResponse.json({
    outlets,
    totalChecklists,
    totalRuns,
    completedRuns,
    overdueRuns,
    complianceRate,
    recentRuns,
    lowStockCount,
    ...(includeFinance
      ? {
          monthlyIncome,
          monthlyExpense,
          monthlyProfit: monthlyIncome - monthlyExpense,
        }
      : {}),
    role,
  });
}
