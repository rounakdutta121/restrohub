import { prisma } from "./prisma";
import { formatQuantity } from "./units";
import { can, type Capability } from "./roles";
import { bumpOutletOps } from "./outlet-live";

/** Which capability must receive each alert type (role hierarchy). */
export const NOTIFICATION_CAPABILITY: Record<string, Capability> = {
  new_order: "manageTableOrders", // staff+ on that outlet
  takeaway_order: "manageTableOrders",
  waitlist_order: "manageTableOrders",
  reservation_order: "manageTableOrders",
  reservation_reminder: "manageTableOrders",
  reservation_clear_table: "manageTableOrders",
  waitlist_seated: "manageTableOrders",
  low_stock: "manageInventory", // manager+
  order_settled: "viewFinance", // manager+
  checklist_due: "runChecklists", // staff+ (assignee still preferred)
  maintenance_due: "runChecklists",
};

export async function createNotification(params: {
  userId: string;
  outletId?: string;
  type: string;
  message: string;
}) {
  return prisma.notification.create({ data: params });
}

function memberHasOutletAccess(
  member: { role: string; outletIds: string[] },
  outletId: string
) {
  if (["owner", "admin"].includes(member.role)) return true;
  if (member.outletIds.length === 0) return true; // all outlets
  return member.outletIds.includes(outletId);
}

/**
 * Notify outlet members who (1) can access the outlet and (2) meet the
 * capability for this alert type. Also bumps opsVersion for live boards.
 */
export async function notifyOutletMembers(
  outletId: string,
  type: string,
  message: string,
  options?: { capability?: Capability; skipBump?: boolean }
) {
  const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
  if (!outlet) return;

  const capability =
    options?.capability ?? NOTIFICATION_CAPABILITY[type] ?? "manageTableOrders";

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: outlet.workspaceId },
  });

  const targets = members.filter(
    (m) => memberHasOutletAccess(m, outletId) && can(m.role, capability)
  );

  await Promise.all(
    targets.map((m) =>
      createNotification({ userId: m.userId, outletId, type, message })
    )
  );

  if (!options?.skipBump) {
    await bumpOutletOps(outletId);
  }
}

/** @deprecated Prefer notifyOutletMembers — kept for call-site compatibility */
export async function notifyOutletManagers(
  outletId: string,
  type: string,
  message: string
) {
  return notifyOutletMembers(outletId, type, message);
}

export async function checkLowStock(outletId: string) {
  const stocks = await prisma.ingredientStock.findMany({
    where: { outletId },
    include: { ingredient: true },
  });

  let notified = false;

  for (const stock of stocks) {
    if (stock.quantity > stock.reorderLevel) continue;

    const status = stock.quantity <= 0 ? "out of stock" : "low stock";
    const message = `${stock.ingredient.name} is ${status} at this outlet (${formatQuantity(stock.quantity, stock.ingredient.unit)} remaining)`;

    // Deduplicate: don't spam identical unread low-stock alerts
    const existing = await prisma.notification.findFirst({
      where: {
        outletId,
        type: "low_stock",
        message,
        read: false,
      },
      select: { id: true },
    });
    if (existing) continue;

    await notifyOutletMembers(outletId, "low_stock", message, {
      skipBump: true,
    });
    notified = true;
  }

  if (notified) await bumpOutletOps(outletId);
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

  const bumpedOutlets = new Set<string>();

  for (const run of overdueRuns) {
    if (!run.dueDate) continue;

    const type =
      run.sop.type === "maintenance" ? "maintenance_due" : "checklist_due";
    const message = `Checklist "${run.sop.title}" is due ${
      run.dueDate < now ? "overdue" : "soon"
    }`;

    const existing = await prisma.notification.findFirst({
      where: {
        userId: run.assignedToId,
        type,
        message,
        read: false,
      },
      select: { id: true },
    });
    if (existing) continue;

    await createNotification({
      userId: run.assignedToId,
      outletId: run.outletId ?? undefined,
      type,
      message,
    });

    if (run.outletId) bumpedOutlets.add(run.outletId);
  }

  await Promise.all([...bumpedOutlets].map((id) => bumpOutletOps(id)));
}
