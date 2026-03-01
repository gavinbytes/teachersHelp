-- CreateEnum
CREATE TYPE "SubUnitStatus" AS ENUM ('PLANNED', 'TAUGHT', 'SKIPPED');

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "sourceKey" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "preferences" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "UnitPlan" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "unitPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubUnit" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "status" "SubUnitStatus" NOT NULL DEFAULT 'PLANNED',

    CONSTRAINT "SubUnit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UnitPlan_classId_idx" ON "UnitPlan"("classId");

-- CreateIndex
CREATE INDEX "Unit_unitPlanId_idx" ON "Unit"("unitPlanId");

-- CreateIndex
CREATE INDEX "SubUnit_unitId_idx" ON "SubUnit"("unitId");

-- CreateIndex
CREATE INDEX "Task_sourceKey_idx" ON "Task"("sourceKey");

-- AddForeignKey
ALTER TABLE "UnitPlan" ADD CONSTRAINT "UnitPlan_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_unitPlanId_fkey" FOREIGN KEY ("unitPlanId") REFERENCES "UnitPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubUnit" ADD CONSTRAINT "SubUnit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
