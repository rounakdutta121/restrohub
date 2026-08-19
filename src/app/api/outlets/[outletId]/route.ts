import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOutletAccess, slugify } from "@/lib/permissions";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ outletId: string }> }
) {
  const { outletId } = await params;
  const auth = await requireOutletAccess(outletId);
  if ("error" in auth) return auth.error;

  const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
  return NextResponse.json(outlet);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ outletId: string }> }
) {
  const { outletId } = await params;
  const auth = await requireOutletAccess(outletId, "admin");
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { name, address, city, country, timezone, currency, isActive } = body;

  const data: Record<string, unknown> = {
    address,
    city,
    country,
    timezone,
    currency,
    isActive,
  };
  if (name) {
    data.name = name;
    data.slug = slugify(name) + "-" + outletId.slice(-4);
  }

  const outlet = await prisma.outlet.update({
    where: { id: outletId },
    data,
  });

  return NextResponse.json(outlet);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ outletId: string }> }
) {
  const { outletId } = await params;
  const auth = await requireOutletAccess(outletId, "admin");
  if ("error" in auth) return auth.error;

  await prisma.outlet.delete({ where: { id: outletId } });
  return NextResponse.json({ success: true });
}
