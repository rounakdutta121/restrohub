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
  const { organization, organizations, loading } = useOrganization();
  const hasOrg = !loading && organizations.length > 0 && !!organization;
  const role = (organization?.role ?? (hasOrg ? "staff" : "owner")) as Role;

  return {
    role,
    roleLabel: hasOrg ? (ROLE_LABELS[role] ?? role) : "Getting started",
    roleDescription: hasOrg ? roleDescription(role) : "Finish setup to unlock your kitchen.",
    outletIds: organization?.outletIds ?? [],
    isOrgAdmin: hasOrg ? isOrgAdmin(role) : true,
    hasMinRole: (minRole: Role) => (hasOrg ? hasMinRole(role, minRole) : true),
    can: (capability: Capability) => (hasOrg ? can(role, capability) : true),
    canAccessNav: (href: string) =>
      hasOrg
        ? canAccessNav(role, href)
        : href === "/dashboard" ||
          href === "/dashboard/setup" ||
          href === "/dashboard/docs" ||
          href === "/dashboard/settings",
    canEdit: hasOrg ? can(role, "manageMenus") : true,
    hasOrg,
  };
}
