import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const workspaces = await prisma.workspace.findMany({
    where: {
      members: { some: { userId: auth.user.id } },
    },
    include: {
      _count: { select: { members: true, outlets: true, sops: true } },
      members: {
        where: { userId: auth.user.id },
        select: { role: true, outletIds: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    workspaces.map(({ members, ...ws }) => ({
      ...ws,
      role: members[0]?.role ?? "staff",
      outletIds: members[0]?.outletIds ?? [],
    }))
  );
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { name } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const workspace = await prisma.workspace.create({
    data: {
      name,
      ownerId: auth.user.id,
      members: {
        create: { userId: auth.user.id, role: "owner", outletIds: [] },
      },
    },
  });

  return NextResponse.json(workspace);
}
