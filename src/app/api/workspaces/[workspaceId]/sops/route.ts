import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrgMember } from "@/lib/permissions";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const auth = await requireOrgMember(workspaceId);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const outletId = searchParams.get("outletId");

  const sops = await prisma.sOP.findMany({
    where: {
      workspaceId,
      ...(outletId ? { outletId } : {}),
    },
    include: {
      _count: { select: { runs: true } },
      outlet: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(sops);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const auth = await requireOrgMember(workspaceId, "manager");
  if ("error" in auth) return auth.error;

  const { title, description, steps, type, outletId } = await req.json();

  const sop = await prisma.sOP.create({
    data: {
      title: title || "Untitled Checklist",
      description,
      type: type || "prep",
      steps: steps || [],
      workspaceId,
      outletId: outletId || null,
      createdById: auth.user.id,
    },
  });

  return NextResponse.json(sop);
}
