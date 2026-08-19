import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrgMember, slugify, isOrgAdmin } from "@/lib/permissions";
import { getPlanLimits } from "@/lib/billing";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const auth = await requireOrgMember(workspaceId);
  if ("error" in auth) return auth.error;

  const role = auth.member.role;
  const outlets = await prisma.outlet.findMany({
    where: {
      workspaceId,
      ...(isOrgAdmin(role) ? {} : { id: { in: auth.member.outletIds } }),
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(outlets);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const auth = await requireOrgMember(workspaceId, "admin");
  if ("error" in auth) return auth.error;

  const limits = getPlanLimits(auth.workspace.plan);
  const count = await prisma.outlet.count({ where: { workspaceId } });
  if (count >= limits.maxOutlets) {
    return NextResponse.json(
      { error: `Upgrade to add more than ${limits.maxOutlets} outlets` },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { name, address, city, country, timezone, currency } = body;
  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  let slug = slugify(name);
  const existing = await prisma.outlet.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  const outlet = await prisma.outlet.create({
    data: {
      name,
      slug,
      address,
      city,
      country,
      timezone: timezone || "UTC",
      currency: currency || "USD",
      workspaceId,
    },
  });

  return NextResponse.json(outlet);
}
