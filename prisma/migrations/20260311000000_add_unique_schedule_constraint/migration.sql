-- CreateIndex
CREATE UNIQUE INDEX "ClassSchedule_classId_dayOfWeek_startTime_endTime_key" ON "ClassSchedule"("classId", "dayOfWeek", "startTime", "endTime");
