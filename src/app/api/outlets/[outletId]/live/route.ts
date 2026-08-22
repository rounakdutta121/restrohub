import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOutletAccess } from "@/lib/permissions";

/** Cheap live pulse — clients poll every ~3s while tab is visible. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ outletId: string }> }
) {
  const { outletId } = await params;
  const auth = await requireOutletAccess(outletId);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const clientV = parseInt(searchParams.get("v") || "0", 10) || 0;

  const outlet = await prisma.outlet.findUnique({
    where: { id: outletId },
    select: { opsVersion: true },
  });
  if (!outlet) {
    return NextResponse.json({ error: "Outlet not found" }, { status: 404 });
  }

  const opsVersion = outlet.opsVersion ?? 0;
  const unread = await prisma.notification.count({
    where: {
      userId: auth.user.id,
      read: false,
      OR: [{ outletId }, { outletId: null }],
    },
  });

  if (clientV === opsVersion) {
    return NextResponse.json(
      { opsVersion, changed: false, unread },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { opsVersion, changed: true, unread },
    { headers: { "Cache-Control": "no-store" } }
  );
}
