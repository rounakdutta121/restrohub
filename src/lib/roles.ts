export type Role = "owner" | "admin" | "manager" | "staff";

export const ROLE_HIERARCHY: Role[] = ["staff", "manager", "admin", "owner"];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
};

/** Roles that can be assigned when inviting — owner is not invitable */
export const INVITABLE_ROLES: Role[] = ["staff", "manager", "admin"];

export const ROLE_SUMMARIES: Record<Role, string> = {
  owner: "Full access. Assigned automatically to whoever creates the organization — not available via invite.",
  admin: "Manage outlets, team, and all outlet operations.",
  manager: "Edit menus, stock, finance, tables, and checklists.",
  staff: "Run checklists, seat guests, and take table orders.",
};

/** Minimum role required for each capability */
export const CAPABILITIES = {
  deleteOrg: "owner",
  manageOutlets: "admin",
  manageTeam: "admin",
  viewTeam: "admin",
  manageMenus: "manager",
  manageInventory: "manager",
  viewFinance: "manager",
  manageFinance: "manager",
  manageTableSetup: "manager",
  manageTableOrders: "staff",
  manageChecklists: "manager",
  runChecklists: "staff",
  deleteChecklistRuns: "manager",
} as const satisfies Record<string, Role>;

export type Capability = keyof typeof CAPABILITIES;

export function hasMinRole(userRole: string, minRole: Role): boolean {
  const userIdx = ROLE_HIERARCHY.indexOf(userRole as Role);
  const minIdx = ROLE_HIERARCHY.indexOf(minRole);
  if (userIdx < 0 || minIdx < 0) return false;
  return userIdx >= minIdx;
}

export function can(userRole: string, capability: Capability): boolean {
  return hasMinRole(userRole, CAPABILITIES[capability]);
}

export function isOrgAdmin(role: string): boolean {
  return hasMinRole(role, "admin");
}

export function canAccessNav(role: string, href: string): boolean {
  if (href === "/dashboard/finance") return can(role, "viewFinance");
  if (href === "/dashboard/team") return can(role, "viewTeam");
  return true;
}

export function roleDescription(role: Role): string {
  switch (role) {
    case "owner":
      return "Full access including deleting the organization.";
    case "admin":
      return "Manage outlets, team, and all outlet operations.";
    case "manager":
      return "Manage menus, stock, finance, tables, and checklists.";
    case "staff":
      return "Run checklists, seat guests, and take table orders.";
  }
}
