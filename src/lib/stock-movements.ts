import { prisma } from "@/lib/prisma";
import { checkLowStock } from "@/lib/notifications";

type OrderLine = {
  menuItemId: string | null;
  quantity: number;
  voided?: boolean;
};

/** Deduct recipe quantities for paid (or waste) order lines. */
export async function applyOrderStockChange(opts: {
  outletId: string;
  orderId: string;
  items: OrderLine[];
  type: "sale" | "waste" | "reverse_sale";
  createdById?: string | null;
  note?: string;
}) {
  const active = opts.items.filter((i) => i.menuItemId && !i.voided);
  const menuItemIds = [...new Set(active.map((i) => i.menuItemId!))];
  if (!menuItemIds.length) return { moved: 0 };

  const recipes = await prisma.recipeLine.findMany({
    where: { menuItemId: { in: menuItemIds } },
  });
  if (!recipes.length) return { moved: 0 };

  const qtyByMenu = new Map<string, number>();
  for (const line of active) {
    qtyByMenu.set(
      line.menuItemId!,
      (qtyByMenu.get(line.menuItemId!) ?? 0) + line.quantity
    );
  }

  const deltas = new Map<string, number>();
  for (const recipe of recipes) {
    const soldQty = qtyByMenu.get(recipe.menuItemId) ?? 0;
    if (!soldQty) continue;
    const delta =
      opts.type === "reverse_sale"
        ? recipe.quantity * soldQty
        : -(recipe.quantity * soldQty);
    deltas.set(recipe.ingredientId, (deltas.get(recipe.ingredientId) ?? 0) + delta);
  }

  let moved = 0;
  for (const [ingredientId, delta] of deltas) {
    if (delta === 0) continue;
    const existing = await prisma.ingredientStock.findUnique({
      where: {
        outletId_ingredientId: { outletId: opts.outletId, ingredientId },
      },
    });
    const newQty = (existing?.quantity ?? 0) + delta;
    await prisma.ingredientStock.upsert({
      where: {
        outletId_ingredientId: { outletId: opts.outletId, ingredientId },
      },
      create: {
        outletId: opts.outletId,
        ingredientId,
        quantity: newQty,
        reorderLevel: 10,
      },
      update: { quantity: newQty },
    });
    await prisma.stockMovement.create({
      data: {
        outletId: opts.outletId,
        ingredientId,
        quantity: delta,
        type: opts.type,
        orderId: opts.orderId,
        note: opts.note,
        createdById: opts.createdById ?? undefined,
      },
    });
    moved += 1;
  }

  if (moved) await checkLowStock(opts.outletId);
  return { moved };
}
