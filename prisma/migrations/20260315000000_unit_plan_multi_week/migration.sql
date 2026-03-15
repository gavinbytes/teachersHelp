-- AlterTable: add totalWeeks to UnitPlan
ALTER TABLE "UnitPlan" ADD COLUMN "totalWeeks" INTEGER NOT NULL DEFAULT 18;

-- AlterTable: replace weekNumber with startWeek/endWeek on Unit
ALTER TABLE "Unit" ADD COLUMN "startWeek" INTEGER;
ALTER TABLE "Unit" ADD COLUMN "endWeek" INTEGER;

-- Migrate existing data: copy weekNumber to startWeek and endWeek
UPDATE "Unit" SET "startWeek" = "weekNumber", "endWeek" = "weekNumber";

-- Make columns non-nullable
ALTER TABLE "Unit" ALTER COLUMN "startWeek" SET NOT NULL;
ALTER TABLE "Unit" ALTER COLUMN "endWeek" SET NOT NULL;

-- Drop old column
ALTER TABLE "Unit" DROP COLUMN "weekNumber";
