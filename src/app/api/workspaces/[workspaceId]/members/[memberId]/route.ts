import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrgMember } from "@/lib/permissions";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  const { workspaceId, memberId } = await params;
  const auth = await requireOrgMember(workspaceId, "admin");
  if ("error" in auth) return auth.error;

  const target = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  });

  if (!target || target.workspaceId !== workspaceId) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (target.role === "owner") {
    return NextResponse.json({ error: "Cannot remove the organization owner" }, { status: 403 });
  }

  if (target.userId === auth.user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 403 });
  }

  await prisma.workspaceMember.delete({ where: { id: memberId } });
  return NextResponse.json({ success: true });
}
