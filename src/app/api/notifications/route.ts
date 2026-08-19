import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export async function GET(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";

  const notifications = await prisma.notification.findMany({
    where: {
      userId: auth.user.id,
      ...(unreadOnly ? { read: false } : {}),
    },
    include: { outlet: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifications);
}

export async function PATCH(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id, markAllRead } = await req.json();

  if (markAllRead) {
    await prisma.notification.updateMany({
      where: { userId: auth.user.id, read: false },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  }

  if (id) {
    const updated = await prisma.notification.updateMany({
      where: { id, userId: auth.user.id },
      data: { read: true },
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id, clearAll } = await req.json();

  if (clearAll) {
    await prisma.notification.deleteMany({ where: { userId: auth.user.id } });
    return NextResponse.json({ success: true });
  }

  if (id) {
    const n = await prisma.notification.findFirst({
      where: { id, userId: auth.user.id },
    });
    if (!n) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.notification.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
