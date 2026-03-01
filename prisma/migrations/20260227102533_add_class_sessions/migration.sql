-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "classSessionId" TEXT;

-- CreateTable
CREATE TABLE "ClassSession" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "classId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ClassSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "classSessionId" TEXT NOT NULL,
    "templateId" TEXT,

    CONSTRAINT "SessionTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionTaskTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "classId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SessionTaskTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassSession_classId_idx" ON "ClassSession"("classId");

-- CreateIndex
CREATE INDEX "ClassSession_date_idx" ON "ClassSession"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSession_scheduleId_date_key" ON "ClassSession"("scheduleId", "date");

-- CreateIndex
CREATE INDEX "SessionTask_classSessionId_idx" ON "SessionTask"("classSessionId");

-- CreateIndex
CREATE INDEX "SessionTaskTemplate_classId_idx" ON "SessionTaskTemplate"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_classSessionId_key" ON "Lesson"("classSessionId");

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_classSessionId_fkey" FOREIGN KEY ("classSessionId") REFERENCES "ClassSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ClassSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionTask" ADD CONSTRAINT "SessionTask_classSessionId_fkey" FOREIGN KEY ("classSessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionTask" ADD CONSTRAINT "SessionTask_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SessionTaskTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionTaskTemplate" ADD CONSTRAINT "SessionTaskTemplate_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
