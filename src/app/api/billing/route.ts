import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrgMember } from "@/lib/permissions";
import { PLANS, PlanKey } from "@/lib/billing";

export async function POST(req: Request) {
  const { workspaceId, plan } = await req.json();

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const auth = await requireOrgMember(workspaceId, "admin");
  if ("error" in auth) return auth.error;

  if (!PLANS[plan as PlanKey]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const updated = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { plan },
  });

  return NextResponse.json({ success: true, workspace: updated });
}
