import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const outlet = await prisma.outlet.findUnique({
    where: { slug, isActive: true },
    include: {
      menuCategories: {
        include: { items: { where: { isAvailable: true }, orderBy: { name: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!outlet) {
    return NextResponse.json({ error: "Menu not found" }, { status: 404 });
  }

  return NextResponse.json({
    outlet: {
      name: outlet.name,
      city: outlet.city,
      currency: outlet.currency,
    },
    categories: outlet.menuCategories,
  });
}
