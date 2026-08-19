import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOutletAccess } from "@/lib/permissions";
import { checkLowStock } from "@/lib/notifications";
import { parseStockNumber, sanitizeUnitInput } from "@/lib/units";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ outletId: string }> }
) {
  const { outletId } = await params;
  const auth = await requireOutletAccess(outletId);
  if ("error" in auth) return auth.error;

  const [ingredients, stock] = await Promise.all([
    prisma.ingredient.findMany({
      where: { workspaceId: auth.workspace.id },
      orderBy: { name: "asc" },
    }),
    prisma.ingredientStock.findMany({
      where: { outletId },
      include: { ingredient: true },
    }),
  ]);

  return NextResponse.json({ ingredients, stock });
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
    await checkLowStock(outletId);
    return NextResponse.json(stock);
  }

  if (action === "adjust_stock") {
    const existing = await prisma.ingredientStock.findUnique({
      where: {
        outletId_ingredientId: { outletId, ingredientId: body.ingredientId },
      },
    });
    const newQty = (existing?.quantity ?? 0) + parseFloat(body.delta);
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
    await checkLowStock(outletId);
    return NextResponse.json(stock);
  }

  if (action === "add_recipe_line") {
    const line = await prisma.recipeLine.create({
      data: {
        menuItemId: body.menuItemId,
        ingredientId: body.ingredientId,
        quantity: parseFloat(body.quantity),
      },
      include: { ingredient: true },
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
  const { action, ingredientId } = body;

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
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
