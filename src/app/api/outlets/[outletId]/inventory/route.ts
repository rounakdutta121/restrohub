import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOutletAccess } from "@/lib/permissions";
import { checkLowStock } from "@/lib/notifications";
import { parseStockNumber, sanitizeUnitInput } from "@/lib/units";
import { writeAuditLog } from "@/lib/audit";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ outletId: string }> }
) {
  const { outletId } = await params;
  const auth = await requireOutletAccess(outletId);
  if ("error" in auth) return auth.error;

  const [ingredients, stock, menuItems, recipes] = await Promise.all([
    prisma.ingredient.findMany({
      where: { workspaceId: auth.workspace.id },
      orderBy: { name: "asc" },
    }),
    prisma.ingredientStock.findMany({
      where: { outletId },
      include: { ingredient: true },
    }),
    prisma.menuItem.findMany({
      where: { category: { outletId } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.recipeLine.findMany({
      where: { menuItem: { category: { outletId } } },
      include: {
        ingredient: { select: { id: true, name: true, unit: true } },
        menuItem: { select: { id: true, name: true } },
      },
      orderBy: { menuItemId: "asc" },
    }),
  ]);

  return NextResponse.json({ ingredients, stock, menuItems, recipes });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ outletId: string }> }
) {
  const { outletId } = await params;
  const auth = await requireOutletAccess(outletId, "manager");
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { action } = body;

  if (action === "create_ingredient") {
    const ingredient = await prisma.ingredient.create({
      data: {
        name: body.name.trim(),
        unit: sanitizeUnitInput(body.unit || "kg"),
        workspaceId: auth.workspace.id,
      },
    });
    return NextResponse.json(ingredient);
  }

  if (action === "set_stock") {
    let quantity: number;
    let reorderLevel: number;
    try {
      quantity = parseStockNumber(body.quantity);
      reorderLevel = parseStockNumber(body.reorderLevel ?? 10);
    } catch {
      return NextResponse.json({ error: "Invalid quantity or minimum value" }, { status: 400 });
    }
    const existing = await prisma.ingredientStock.findUnique({
      where: {
        outletId_ingredientId: { outletId, ingredientId: body.ingredientId },
      },
    });
    const stock = await prisma.ingredientStock.upsert({
      where: {
        outletId_ingredientId: { outletId, ingredientId: body.ingredientId },
      },
      create: {
        outletId,
        ingredientId: body.ingredientId,
        quantity,
        reorderLevel,
      },
      update: {
        quantity,
        reorderLevel,
      },
      include: { ingredient: true },
    });

    const delta = quantity - (existing?.quantity ?? 0);
    if (delta !== 0) {
      await prisma.stockMovement.create({
        data: {
          outletId,
          ingredientId: body.ingredientId,
          quantity: delta,
          type: "adjust",
          note: "Manual stock set",
          createdById: auth.user.id,
        },
      });
    }

    await writeAuditLog({
      workspaceId: auth.workspace.id,
      outletId,
      actorId: auth.user.id,
      action: "stock_set",
      entityType: "IngredientStock",
      entityId: stock.id,
      before: existing ? { quantity: existing.quantity } : undefined,
      after: { quantity },
    });

    await checkLowStock(outletId);
    return NextResponse.json(stock);
  }

  if (action === "adjust_stock") {
    const existing = await prisma.ingredientStock.findUnique({
      where: {
        outletId_ingredientId: { outletId, ingredientId: body.ingredientId },
      },
    });
    const delta = parseFloat(body.delta);
    const newQty = (existing?.quantity ?? 0) + delta;
    const stock = await prisma.ingredientStock.upsert({
      where: {
        outletId_ingredientId: { outletId, ingredientId: body.ingredientId },
      },
      create: {
        outletId,
        ingredientId: body.ingredientId,
        quantity: newQty,
        reorderLevel: 10,
      },
      update: { quantity: newQty },
      include: { ingredient: true },
    });
    await prisma.stockMovement.create({
      data: {
        outletId,
        ingredientId: body.ingredientId,
        quantity: delta,
        type: "adjust",
        note: body.note || "Manual adjust",
        createdById: auth.user.id,
      },
    });
    await checkLowStock(outletId);
    return NextResponse.json(stock);
  }

  if (action === "add_recipe_line") {
    const menuItem = await prisma.menuItem.findFirst({
      where: { id: body.menuItemId, category: { outletId } },
    });
    if (!menuItem) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }
    const ingredient = await prisma.ingredient.findFirst({
      where: { id: body.ingredientId, workspaceId: auth.workspace.id },
    });
    if (!ingredient) {
      return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
    }
    const qty = parseFloat(body.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return NextResponse.json({ error: "Quantity must be positive" }, { status: 400 });
    }

    const line = await prisma.recipeLine.create({
      data: {
        menuItemId: body.menuItemId,
        ingredientId: body.ingredientId,
        quantity: qty,
      },
      include: {
        ingredient: true,
        menuItem: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(line);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ outletId: string }> }
) {
  const { outletId } = await params;
  const auth = await requireOutletAccess(outletId, "manager");
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { action, ingredientId, recipeLineId } = body;

  if (action === "delete_ingredient") {
    const ing = await prisma.ingredient.findFirst({
      where: { id: ingredientId, workspaceId: auth.workspace.id },
    });
    if (!ing) return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
    await prisma.ingredient.delete({ where: { id: ingredientId } });
  } else if (action === "delete_stock") {
    await prisma.ingredientStock.deleteMany({
      where: { outletId, ingredientId },
    });
  } else if (action === "delete_recipe_line") {
    const line = await prisma.recipeLine.findFirst({
      where: {
        id: recipeLineId,
        menuItem: { category: { outletId } },
      },
    });
    if (!line) return NextResponse.json({ error: "Recipe line not found" }, { status: 404 });
    await prisma.recipeLine.delete({ where: { id: recipeLineId } });
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
