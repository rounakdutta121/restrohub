export const PLANS = {
  free: {
    name: "Free",
    maxOutlets: 1,
    maxMembers: 3,
    maxMenuItems: 20,
    maxChecklists: 5,
    price: 0,
    features: ["1 outlet", "3 staff", "20 menu items", "5 checklists"],
  },
  pro: {
    name: "Pro",
    maxOutlets: 5,
    maxMembers: 25,
    maxMenuItems: 999999,
    maxChecklists: 999999,
    price: 9,
    features: [
      "5 outlets",
      "25 staff",
      "Unlimited menu items",
      "Unlimited checklists",
      "QR menus",
    ],
  },
  business: {
    name: "Business",
    maxOutlets: 999999,
    maxMembers: 999999,
    maxMenuItems: 999999,
    maxChecklists: 999999,
    price: 29,
    features: [
      "Unlimited outlets",
      "Unlimited staff",
      "Full inventory & finance",
      "Audit logs",
      "Priority support",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanLimits(plan: string) {
  return PLANS[(plan as PlanKey) || "free"] ?? PLANS.free;
}
