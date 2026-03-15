"use client";

import { useState, useCallback } from "react";
import { format, addDays } from "date-fns";
import { useWeekSessions, useToggleSessionTask, useAddSessionTask, useDeleteSessionTask, useUpdateSessionNotes } from "@/hooks/useSessions";
import { useClasses } from "@/hooks/useClasses";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WeekNavigator } from "./WeekNavigator";
import { WeekProgressBar } from "./WeekProgressBar";
import { SessionWeekView } from "./SessionWeekView";
import { UpcomingDeadlines } from "./UpcomingDeadlines";

function getCurrentSunday(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  return format(sunday, "yyyy-MM-dd");
}

export function DashboardClient() {
  const currentSunday = getCurrentSunday();
  const [weekStart, setWeekStart] = useState(currentSunday);

  const [selectedClassId, setSelectedClassId] = useState<string>("all");

  const { data, isLoading } = useWeekSessions(weekStart);
  const { data: classes } = useClasses();
  const toggleTask = useToggleSessionTask();
  const addTask = useAddSessionTask();
  const deleteTask = useDeleteSessionTask();
  const updateNotes = useUpdateSessionNotes();

  const isCurrentWeek = weekStart === currentSunday;

  const filteredSessions = data
    ? selectedClassId === "all"
      ? data.sessions
      : data.sessions.filter((s) => s.class.id === selectedClassId)
    : [];

  const handlePrevWeek = useCallback(() => {
    const prev = addDays(new Date(weekStart + "T00:00:00"), -7);
    setWeekStart(format(prev, "yyyy-MM-dd"));
  }, [weekStart]);

  const handleNextWeek = useCallback(() => {
    const next = addDays(new Date(weekStart + "T00:00:00"), 7);
    setWeekStart(format(next, "yyyy-MM-dd"));
  }, [weekStart]);

  const handleThisWeek = useCallback(() => {
    setWeekStart(currentSunday);
  }, [currentSunday]);

  const handleToggleTask = useCallback(
    (sessionId: string, taskId: string, completed: boolean) => {
      toggleTask.mutate({ sessionId, taskId, completed });
    },
    [toggleTask]
  );

  const handleAddTask = useCallback(
    (sessionId: string, title: string) => {
      addTask.mutate({ sessionId, title });
    },
    [addTask]
  );

  const handleDeleteTask = useCallback(
    (sessionId: string, taskId: string) => {
      deleteTask.mutate({ sessionId, taskId });
    },
    [deleteTask]
  );

  const handleUpdateNotes = useCallback(
    (sessionId: string, notes: string) => {
      updateNotes.mutate({ sessionId, notes });
    },
    [updateNotes]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="h-8 animate-pulse rounded bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-3 md:grid-cols-7">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-3 flex-wrap">
          {classes && classes.length > 0 && (
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cls.color ?? "#6b7280" }}
                      />
                      {cls.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {data && (
            <WeekNavigator
              weekStart={data.weekStart}
              weekEnd={data.weekEnd}
              onPrevWeek={handlePrevWeek}
              onNextWeek={handleNextWeek}
              onThisWeek={handleThisWeek}
              isCurrentWeek={isCurrentWeek}
            />
          )}
        </div>
      </div>

      <UpcomingDeadlines />

      {data && (
        <>
          <WeekProgressBar sessions={filteredSessions} />
          <SessionWeekView
            sessions={filteredSessions}
            weekStart={data.weekStart}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onUpdateNotes={handleUpdateNotes}
          />
        </>
      )}
    </div>
  );
}
