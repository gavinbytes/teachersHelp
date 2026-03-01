"use client";

import { useState, useCallback } from "react";
import { format, addDays } from "date-fns";
import { useWeekSessions, useToggleSessionTask, useAddSessionTask, useDeleteSessionTask } from "@/hooks/useSessions";
import { WeekNavigator } from "./WeekNavigator";
import { WeekProgressBar } from "./WeekProgressBar";
import { SessionWeekView } from "./SessionWeekView";

function getCurrentMonday(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - day + (day === 0 ? -6 : 1));
  return format(monday, "yyyy-MM-dd");
}

export function DashboardClient() {
  const currentMonday = getCurrentMonday();
  const [weekStart, setWeekStart] = useState(currentMonday);

  const { data, isLoading } = useWeekSessions(weekStart);
  const toggleTask = useToggleSessionTask();
  const addTask = useAddSessionTask();
  const deleteTask = useDeleteSessionTask();

  const isCurrentWeek = weekStart === currentMonday;

  const handlePrevWeek = useCallback(() => {
    const prev = addDays(new Date(weekStart + "T00:00:00"), -7);
    setWeekStart(format(prev, "yyyy-MM-dd"));
  }, [weekStart]);

  const handleNextWeek = useCallback(() => {
    const next = addDays(new Date(weekStart + "T00:00:00"), 7);
    setWeekStart(format(next, "yyyy-MM-dd"));
  }, [weekStart]);

  const handleThisWeek = useCallback(() => {
    setWeekStart(currentMonday);
  }, [currentMonday]);

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="h-8 animate-pulse rounded bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-3 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
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

      {data && (
        <>
          <WeekProgressBar sessions={data.sessions} />
          <SessionWeekView
            sessions={data.sessions}
            weekStart={data.weekStart}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
          />
        </>
      )}
    </div>
  );
}
