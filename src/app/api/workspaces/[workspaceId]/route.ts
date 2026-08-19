import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrgMember } from "@/lib/permissions";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const auth = await requireOrgMember(workspaceId, "owner");
  if ("error" in auth) return auth.error;

  await prisma.workspace.delete({ where: { id: workspaceId } });
  return NextResponse.json({ success: true });
}
