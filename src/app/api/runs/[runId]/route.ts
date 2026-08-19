import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOrgMember, isOrgAdmin } from "@/lib/permissions";

async function authorizeRunAccess(runId: string) {
  const run = await prisma.checklistRun.findUnique({
    where: { id: runId },
    include: {
      sop: { select: { workspaceId: true, outletId: true } },
    },
  });

  if (!run) {
    return { error: NextResponse.json({ error: "Run not found" }, { status: 404 }) };
  }

  const auth = await requireOrgMember(run.sop.workspaceId);
  if ("error" in auth) return { error: auth.error };

  if (!isOrgAdmin(auth.member.role)) {
    const outletId = run.outletId || run.sop.outletId;
    if (outletId && !auth.member.outletIds.includes(outletId)) {
      return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
  }

  return { run, auth };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await authorizeRunAccess(runId);
  if ("error" in access) return access.error;

  const run = await prisma.checklistRun.findUnique({
    where: { id: runId },
    include: {
      sop: true,
      items: { orderBy: { stepIndex: "asc" } },
      assignedTo: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(run);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await authorizeRunAccess(runId);
  if ("error" in access) return access.error;

  const { itemId, checked } = await req.json();

  const item = await prisma.checklistItem.findFirst({
    where: { id: itemId, runId },
  });
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  await prisma.checklistItem.update({
    where: { id: itemId },
    data: {
      checked,
      completedAt: checked ? new Date() : null,
    },
  });

  const run = await prisma.checklistRun.findUnique({
    where: { id: runId },
    include: { items: true },
  });

  if (run) {
    const isChecked = (item: { id: string; checked: boolean }) =>
      item.id === itemId ? checked : item.checked;

    const allChecked = run.items.length > 0 && run.items.every((item) => isChecked(item));
    const anyChecked = run.items.some((item) => isChecked(item));

    let status = "pending";
    if (allChecked && run.items.length > 0) {
      status = "completed";
    } else if (anyChecked) {
      status = "in_progress";
    }

    await prisma.checklistRun.update({
      where: { id: runId },
      data: {
        status,
        completedAt: status === "completed" ? new Date() : null,
      },
    });
  }

  const updated = await prisma.checklistRun.findUnique({
    where: { id: runId },
    include: {
      sop: true,
      items: { orderBy: { stepIndex: "asc" } },
      assignedTo: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await authorizeRunAccess(runId);
  if ("error" in access) return access.error;

  if (!["owner", "admin", "manager"].includes(access.auth!.member.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  await prisma.checklistRun.delete({ where: { id: runId } });
  return NextResponse.json({ success: true });
}
