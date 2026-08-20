import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import type { Workspace, WorkspaceMember } from "@prisma/client";
import { hasMinRole, isOrgAdmin, type Role } from "./roles";

export type { Role } from "./roles";
export { hasMinRole, can, CAPABILITIES, ROLE_LABELS, isOrgAdmin } from "./roles";

const ADMIN_ROLES: Role[] = ["owner", "admin"];

type AuthUser = { id: string; name?: string | null; email?: string | null; image?: string | null };

type AuthError = { error: NextResponse };
type OrgAuth = { user: AuthUser; member: WorkspaceMember; workspace: Workspace };
type OutletAuth = OrgAuth & { outlet: { id: string; workspaceId: string; name: string; slug: string } };

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireAuth(): Promise<AuthError | { user: AuthUser }> {
  const user = await getSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user };
}

export async function requireOrgMember(
  workspaceId: string,
  minRole?: Role
): Promise<AuthError | OrgAuth> {
  const auth = await requireAuth();
  if ("error" in auth) return auth;

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: auth.user.id, workspaceId },
    },
    include: { workspace: true },
  });

  if (!member) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const role = member.role as Role;
  if (minRole && !hasMinRole(role, minRole)) {
    return { error: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }) };
  }

  return { user: auth.user, member, workspace: member.workspace };
}

export async function requireOutletAccess(
  outletId: string,
  minRole?: Role
): Promise<AuthError | OutletAuth> {
  const outlet = await prisma.outlet.findUnique({
    where: { id: outletId },
  });

  if (!outlet) {
    return { error: NextResponse.json({ error: "Outlet not found" }, { status: 404 }) };
  }

  const auth = await requireOrgMember(outlet.workspaceId, minRole);
  if ("error" in auth) return auth;

  const role = auth.member.role as Role;
  // Empty outletIds = access to every outlet in the org (default for invites)
  if (!ADMIN_ROLES.includes(role) && auth.member.outletIds.length > 0) {
    const assigned = auth.member.outletIds.includes(outletId);
    if (!assigned) {
      return { error: NextResponse.json({ error: "No access to this outlet" }, { status: 403 }) };
    }
  }

  return { ...auth, outlet };
}

export function canManageOrg(role: string) {
  return isOrgAdmin(role);
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
