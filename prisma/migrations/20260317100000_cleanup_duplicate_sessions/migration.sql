-- Step 1: Delete duplicate ClassSession records.
-- When multiple sessions exist for the same class + date (from duplicate schedules),
-- keep the one with the most tasks (or the oldest if tied).
DELETE FROM "ClassSession"
WHERE "id" IN (
  SELECT cs."id"
  FROM "ClassSession" cs
  INNER JOIN (
    -- Find (classId, date) combos that have more than one session
    SELECT "classId", "date"
    FROM "ClassSession"
    GROUP BY "classId", "date"
    HAVING COUNT(*) > 1
  ) dups ON cs."classId" = dups."classId" AND cs."date" = dups."date"
  WHERE cs."id" NOT IN (
    -- For each duplicate group, keep the session with the most tasks (break ties by oldest id)
    SELECT DISTINCT ON (cs2."classId", cs2."date") cs2."id"
    FROM "ClassSession" cs2
    LEFT JOIN (
      SELECT "classSessionId", COUNT(*) as task_count
      FROM "SessionTask"
      GROUP BY "classSessionId"
    ) tc ON tc."classSessionId" = cs2."id"
    INNER JOIN (
      SELECT "classId", "date"
      FROM "ClassSession"
      GROUP BY "classId", "date"
      HAVING COUNT(*) > 1
    ) dups2 ON cs2."classId" = dups2."classId" AND cs2."date" = dups2."date"
    ORDER BY cs2."classId", cs2."date", COALESCE(tc.task_count, 0) DESC, cs2."id" ASC
  )
);

-- Step 2: Delete duplicate ClassSchedule records.
-- Keep the oldest schedule for each (classId, dayOfWeek, startTime, endTime).
DELETE FROM "ClassSchedule"
WHERE "id" NOT IN (
  SELECT DISTINCT ON ("classId", "dayOfWeek", "startTime", "endTime") "id"
  FROM "ClassSchedule"
  ORDER BY "classId", "dayOfWeek", "startTime", "endTime", "id" ASC
);
