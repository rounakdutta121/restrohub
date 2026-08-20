import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireOrgMember } from "@/lib/permissions";
import { getAppUrl } from "@/lib/env";
import { INVITABLE_ROLES, type Role } from "@/lib/roles";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const auth = await requireOrgMember(workspaceId, "admin");
  if ("error" in auth) return auth.error;

  const invites = await prisma.invite.findMany({
    where: { workspaceId, acceptedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invites);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const auth = await requireOrgMember(workspaceId, "admin");
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const outletIds: string[] = Array.isArray(body.outletIds)
    ? body.outletIds.filter((id: unknown) => typeof id === "string")
    : [];

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const inviteRole = (body.role || "staff") as Role;
  if (!INVITABLE_ROLES.includes(inviteRole)) {
    return NextResponse.json(
      { error: "Owner cannot be assigned via invite. Choose staff, manager, or admin." },
      { status: 400 }
    );
  }

  const existing = await prisma.workspaceMember.findFirst({
    where: { workspaceId, user: { email } },
  });
  if (existing) {
    return NextResponse.json({ error: "User is already a member" }, { status: 409 });
  }

  await prisma.invite.deleteMany({
    where: {
      workspaceId,
      email,
      acceptedAt: null,
    },
  });

  const token = randomBytes(32).toString("hex");
  const invite = await prisma.invite.create({
    data: {
      email,
      token,
      role: inviteRole,
      outletIds,
      workspaceId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const baseUrl = getAppUrl();
  return NextResponse.json({
    invite,
    inviteUrl: `${baseUrl}/invite/${token}`,
    token,
  });
}
