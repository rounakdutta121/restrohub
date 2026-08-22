import { prisma } from "@/lib/prisma";

/** Bump outlet ops version so live clients refetch without full page reload. */
export async function bumpOutletOps(outletId: string) {
  try {
    const outlet = await prisma.outlet.findUnique({
      where: { id: outletId },
      select: { opsVersion: true },
    });
    if (!outlet) return;
    await prisma.outlet.update({
      where: { id: outletId },
      data: { opsVersion: (outlet.opsVersion ?? 0) + 1 },
    });
  } catch (err) {
    console.error("bumpOutletOps failed", err);
  }
}
