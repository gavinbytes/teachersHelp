/**
 * One-time migration script: remove duplicate ClassSchedule records
 * and their orphaned ClassSession records.
 *
 * A "duplicate" is defined as two or more ClassSchedule rows that share
 * the same (classId, dayOfWeek, startTime, endTime). We keep the oldest
 * record (smallest createdAt / first inserted id) and delete the rest.
 *
 * Run with:  npx tsx prisma/dedup-schedules.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Find all duplicate groups
  const groups = await prisma.$queryRaw<
    { classId: string; dayOfWeek: number; startTime: string; endTime: string; cnt: bigint }[]
  >`
    SELECT "classId", "dayOfWeek", "startTime", "endTime", COUNT(*) as cnt
    FROM "ClassSchedule"
    GROUP BY "classId", "dayOfWeek", "startTime", "endTime"
    HAVING COUNT(*) > 1
  `;

  if (groups.length === 0) {
    console.log("No duplicate schedules found. Database is clean.");
    return;
  }

  console.log(`Found ${groups.length} duplicate group(s):\n`);

  let totalDeleted = 0;

  for (const group of groups) {
    const { classId, dayOfWeek, startTime, endTime, cnt } = group;

    // Get all schedule IDs in this group, ordered by id (keep the first)
    const schedules = await prisma.classSchedule.findMany({
      where: { classId, dayOfWeek, startTime, endTime },
      orderBy: { id: "asc" },
      select: { id: true },
    });

    const keepId = schedules[0].id;
    const deleteIds = schedules.slice(1).map((s) => s.id);

    console.log(
      `  classId=${classId} day=${dayOfWeek} ${startTime}-${endTime}: ` +
        `${Number(cnt)} records → keeping ${keepId}, deleting ${deleteIds.length} duplicate(s)`
    );

    // Deleting the ClassSchedule will cascade-delete its ClassSession records
    await prisma.classSchedule.deleteMany({
      where: { id: { in: deleteIds } },
    });

    totalDeleted += deleteIds.length;
  }

  console.log(`\nDone. Deleted ${totalDeleted} duplicate schedule(s) and their cascaded sessions.`);
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
