import { prisma } from "@/lib/prisma";
import type { ClassSessionWithDetails } from "@/types";

/**
 * Ensure ClassSession records exist for every (schedule, date) pair
 * in the given Mon–Fri week, then return all sessions for the week
 * with tasks, class, schedule, and lesson included.
 */
export async function ensureSessionsForWeek(
  userId: string,
  weekStart: Date
): Promise<ClassSessionWithDetails[]> {
  // Normalise weekStart to Monday 00:00:00 UTC
  const monday = new Date(weekStart);
  monday.setUTCHours(0, 0, 0, 0);

  const friday = new Date(monday);
  friday.setUTCDate(monday.getUTCDate() + 4);
  friday.setUTCHours(23, 59, 59, 999);

  // 1. Load all user classes with schedules + default templates
  const classes = await prisma.class.findMany({
    where: { userId },
    include: {
      schedules: true,
      taskTemplates: {
        where: { isDefault: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  // 2. Compute which (scheduleId, date) pairs should exist this week
  const sessionsToCreate: { scheduleId: string; classId: string; date: Date }[] = [];

  for (const cls of classes) {
    for (const schedule of cls.schedules) {
      // dayOfWeek: 0=Sun, 1=Mon, ..., 6=Sat
      if (schedule.dayOfWeek < 1 || schedule.dayOfWeek > 5) continue; // skip weekends

      const sessionDate = new Date(monday);
      sessionDate.setUTCDate(monday.getUTCDate() + (schedule.dayOfWeek - 1)); // Mon=0 offset
      sessionDate.setUTCHours(0, 0, 0, 0);

      // Respect class startDate/endDate bounds
      if (cls.startDate && sessionDate < new Date(cls.startDate)) continue;
      if (cls.endDate && sessionDate > new Date(cls.endDate)) continue;

      sessionsToCreate.push({
        scheduleId: schedule.id,
        classId: cls.id,
        date: sessionDate,
      });
    }
  }

  // 3. Bulk-create sessions, skipping duplicates (@@unique constraint)
  if (sessionsToCreate.length > 0) {
    await prisma.classSession.createMany({
      data: sessionsToCreate,
      skipDuplicates: true,
    });
  }

  // 4. Find sessions that were just created (have no tasks yet) and
  //    copy default templates into SessionTask records for them
  const allSessions = await prisma.classSession.findMany({
    where: {
      class: { userId },
      date: { gte: monday, lte: friday },
    },
    include: { tasks: true },
  });

  // Build a map of classId -> default templates
  const templatesByClass = new Map<string, { id: string; title: string; sortOrder: number }[]>();
  for (const cls of classes) {
    if (cls.taskTemplates.length > 0) {
      templatesByClass.set(cls.id, cls.taskTemplates);
    }
  }

  const tasksToCreate: {
    title: string;
    sortOrder: number;
    classSessionId: string;
    templateId: string;
  }[] = [];

  for (const session of allSessions) {
    // Only populate sessions that have zero tasks (i.e. newly created)
    if (session.tasks.length > 0) continue;

    const templates = templatesByClass.get(session.classId);
    if (!templates) continue;

    for (const tpl of templates) {
      tasksToCreate.push({
        title: tpl.title,
        sortOrder: tpl.sortOrder,
        classSessionId: session.id,
        templateId: tpl.id,
      });
    }
  }

  if (tasksToCreate.length > 0) {
    await prisma.sessionTask.createMany({ data: tasksToCreate });
  }

  // 5. Return all sessions for the week with full details
  const sessions = await prisma.classSession.findMany({
    where: {
      class: { userId },
      date: { gte: monday, lte: friday },
    },
    include: {
      class: true,
      schedule: true,
      lesson: true,
      tasks: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: [{ date: "asc" }, { schedule: { startTime: "asc" } }],
  });

  return sessions as ClassSessionWithDetails[];
}
