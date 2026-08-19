import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrgMember } from "@/lib/permissions";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ workspaceId: string; inviteId: string }> }
) {
  const { workspaceId, inviteId } = await params;
  const auth = await requireOrgMember(workspaceId, "admin");
  if ("error" in auth) return auth.error;

  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.workspaceId !== workspaceId) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  await prisma.invite.delete({ where: { id: inviteId } });
  return NextResponse.json({ success: true });
}
