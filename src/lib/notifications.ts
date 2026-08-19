import { prisma } from "./prisma";
import { formatQuantity } from "./units";

export async function createNotification(params: {
  userId: string;
  outletId?: string;
  type: string;
  message: string;
}) {
  return prisma.notification.create({ data: params });
}

export async function notifyOutletManagers(
  outletId: string,
  type: string,
  message: string
) {
  const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
  if (!outlet) return;

  const members = await prisma.workspaceMember.findMany({
    where: {
      workspaceId: outlet.workspaceId,
      OR: [
        { role: { in: ["owner", "admin"] } },
        { outletIds: { has: outletId } },
      ],
    },
  });

  await Promise.all(
    members.map((m) =>
      createNotification({ userId: m.userId, outletId, type, message })
    )
  );
}

export async function checkLowStock(outletId: string) {
  const stocks = await prisma.ingredientStock.findMany({
    where: { outletId },
    include: { ingredient: true },
  });

  for (const stock of stocks) {
    if (stock.quantity <= stock.reorderLevel) {
      const status = stock.quantity <= 0 ? "out of stock" : "low stock";
      await notifyOutletManagers(
        outletId,
        "low_stock",
        `${stock.ingredient.name} is ${status} at this outlet (${formatQuantity(stock.quantity, stock.ingredient.unit)} remaining)`
      );
    }
  }
}

export async function checkOverdueChecklists(workspaceId: string) {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const overdueRuns = await prisma.checklistRun.findMany({
    where: {
      status: { not: "completed" },
      dueDate: { lte: tomorrow },
      sop: { workspaceId },
    },
    include: { sop: true, assignedTo: true },
  });

  for (const run of overdueRuns) {
    if (!run.dueDate) continue;
    await createNotification({
      userId: run.assignedToId,
      outletId: run.outletId ?? undefined,
      type: run.sop.type === "maintenance" ? "maintenance_due" : "checklist_due",
      message: `Checklist "${run.sop.title}" is due ${run.dueDate < now ? "overdue" : "soon"}`,
    });
  }
}
