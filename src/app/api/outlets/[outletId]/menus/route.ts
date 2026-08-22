import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOutletAccess } from "@/lib/permissions";
import { bumpOutletOps } from "@/lib/outlet-live";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ outletId: string }> }
) {
  const { outletId } = await params;
  const auth = await requireOutletAccess(outletId);
  if ("error" in auth) return auth.error;

  const categories = await prisma.menuCategory.findMany({
    where: { outletId },
    include: { items: { orderBy: { name: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ outletId: string }> }
) {
  const { outletId } = await params;
  const auth = await requireOutletAccess(outletId, "manager");
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { type, categoryName, categoryId, name, description, price, sortOrder } = body;

  if (type === "category") {
    const category = await prisma.menuCategory.create({
      data: { name: categoryName, sortOrder: sortOrder ?? 0, outletId },
    });
    return NextResponse.json(category);
  }

  const item = await prisma.menuItem.create({
    data: {
      name,
      description,
      price: parseFloat(price),
      categoryId,
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ outletId: string }> }
) {
  const { outletId } = await params;
  const auth = await requireOutletAccess(outletId, "manager");
  if ("error" in auth) return auth.error;

  const { type, id } = await req.json();
  if (!type || !id) {
    return NextResponse.json({ error: "type and id required" }, { status: 400 });
  }

  if (type === "category") {
    const cat = await prisma.menuCategory.findFirst({ where: { id, outletId } });
    if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    await prisma.menuCategory.delete({ where: { id } });
  } else if (type === "item") {
    const item = await prisma.menuItem.findFirst({
      where: { id, category: { outletId } },
    });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    await prisma.menuItem.delete({ where: { id } });
  } else {
    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
