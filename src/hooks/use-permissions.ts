"use client";

import { useOrganization } from "./use-organization";
import {
  type Role,
  type Capability,
  ROLE_LABELS,
  can,
  canAccessNav,
  hasMinRole,
  isOrgAdmin,
  roleDescription,
} from "@/lib/roles";

export function usePermissions() {
  const { organization } = useOrganization();
  const role = (organization?.role ?? "staff") as Role;

  return {
    role,
    roleLabel: ROLE_LABELS[role] ?? role,
    roleDescription: roleDescription(role),
    outletIds: organization?.outletIds ?? [],
    isOrgAdmin: isOrgAdmin(role),
    hasMinRole: (minRole: Role) => hasMinRole(role, minRole),
    can: (capability: Capability) => can(role, capability),
    canAccessNav: (href: string) => canAccessNav(role, href),
    canEdit: can(role, "manageMenus"), // shorthand for any manager+ outlet edit
  };
}
