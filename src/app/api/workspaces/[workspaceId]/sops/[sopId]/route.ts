import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrgMember } from "@/lib/permissions";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; sopId: string }> }
) {
  const { workspaceId, sopId } = await params;
  const auth = await requireOrgMember(workspaceId);
  if ("error" in auth) return auth.error;

  const sop = await prisma.sOP.findUnique({
    where: { id: sopId },
    include: {
      runs: { include: { assignedTo: { select: { name: true, email: true } } } },
      outlet: { select: { name: true } },
    },
  });

  if (!sop || sop.workspaceId !== workspaceId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(sop);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; sopId: string }> }
) {
  const { workspaceId, sopId } = await params;
  const auth = await requireOrgMember(workspaceId, "manager");
  if ("error" in auth) return auth.error;

  const { title, description, steps, type, outletId } = await req.json();

  const sop = await prisma.sOP.update({
    where: { id: sopId },
    data: { title, description, steps, type, outletId },
  });

  return NextResponse.json(sop);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; sopId: string }> }
) {
  const { workspaceId, sopId } = await params;
  const auth = await requireOrgMember(workspaceId, "manager");
  if ("error" in auth) return auth.error;

  await prisma.sOP.delete({ where: { id: sopId } });
  return NextResponse.json({ success: true });
}
