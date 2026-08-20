import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { workspace: { select: { id: true, name: true } } },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }
  if (invite.acceptedAt) {
    return NextResponse.json({ error: "This invite was already accepted" }, { status: 410 });
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invite has expired" }, { status: 410 });
  }

  return NextResponse.json({
    email: invite.email,
    role: invite.role,
    outletIds: invite.outletIds,
    expiresAt: invite.expiresAt,
    workspace: invite.workspace,
  });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  if (!auth.user.email) {
    return NextResponse.json({ error: "Your account has no email address" }, { status: 400 });
  }

  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }
  if (invite.acceptedAt) {
    return NextResponse.json({ error: "This invite was already accepted" }, { status: 410 });
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invite has expired" }, { status: 410 });
  }

  if (invite.email.toLowerCase() !== auth.user.email.toLowerCase()) {
    return NextResponse.json(
      {
        error: `This invite is for ${invite.email}. You’re signed in as ${auth.user.email}. Log out and use the invited email.`,
      },
      { status: 403 }
    );
  }

  const existing = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: auth.user.id, workspaceId: invite.workspaceId },
    },
  });
  if (existing) {
    await prisma.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
    return NextResponse.json({ success: true, workspaceId: invite.workspaceId, alreadyMember: true });
  }

  await prisma.$transaction([
    prisma.workspaceMember.create({
      data: {
        userId: auth.user.id,
        workspaceId: invite.workspaceId,
        role: invite.role,
        outletIds: invite.outletIds,
      },
    }),
    prisma.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ success: true, workspaceId: invite.workspaceId });
}
