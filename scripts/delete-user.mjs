/**
 * Remove a user and related records by email.
 * Usage: node --env-file=.env scripts/delete-user.mjs damnart.wp@gmail.com
 */
import { PrismaClient } from "@prisma/client";

const email = (process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.error("Usage: node --env-file=.env scripts/delete-user.mjs <email>");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`No user found for ${email}`);
    return;
  }

  console.log(`Found user ${user.id} (${user.email})`);

  const invites = await prisma.invite.deleteMany({ where: { email } });
  console.log(`Deleted invites: ${invites.count}`);

  const memberships = await prisma.workspaceMember.deleteMany({ where: { userId: user.id } });
  console.log(`Deleted memberships: ${memberships.count}`);

  const notes = await prisma.notification.deleteMany({ where: { userId: user.id } });
  console.log(`Deleted notifications: ${notes.count}`);

  const deletedRuns = await prisma.checklistRun.deleteMany({ where: { assignedToId: user.id } });
  console.log(`Deleted checklist runs: ${deletedRuns.count}`);

  const owned = await prisma.workspace.findMany({ where: { ownerId: user.id } });
  for (const w of owned) {
    console.log(`Deleting owned workspace: ${w.name} (${w.id})`);
    await prisma.invite.deleteMany({ where: { workspaceId: w.id } });
    await prisma.workspaceMember.deleteMany({ where: { workspaceId: w.id } });
    await prisma.workspace.delete({ where: { id: w.id } });
  }

  await prisma.account.deleteMany({ where: { userId: user.id } });
  await prisma.session.deleteMany({ where: { userId: user.id } });

  await prisma.user.delete({ where: { id: user.id } });
  console.log(`Deleted user ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
