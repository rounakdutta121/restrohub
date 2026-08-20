import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function writeAuditLog(input: {
  workspaceId: string;
  outletId?: string | null;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  note?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        outletId: input.outletId ?? undefined,
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        before: input.before,
        after: input.after,
        note: input.note ?? undefined,
      },
    });
  } catch (err) {
    console.error("audit log failed", err);
  }
}
