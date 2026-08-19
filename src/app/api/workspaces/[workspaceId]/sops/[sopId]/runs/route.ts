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

  const runs = await prisma.checklistRun.findMany({
    where: { sopId },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      items: true,
      outlet: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(runs);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; sopId: string }> }
) {
  const { workspaceId, sopId } = await params;
  const auth = await requireOrgMember(workspaceId);
  if ("error" in auth) return auth.error;

  const { assignedToId, dueDate, outletId } = await req.json();

  const sop = await prisma.sOP.findUnique({ where: { id: sopId } });
  if (!sop) {
    return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
  }

  const steps = sop.steps as { title: string }[];

  const run = await prisma.checklistRun.create({
    data: {
      sopId,
      outletId: outletId || sop.outletId,
      assignedToId: assignedToId || auth.user.id,
      dueDate: dueDate ? new Date(dueDate) : null,
      items: {
        create: steps.map((_, i) => ({ stepIndex: i })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(run);
}
