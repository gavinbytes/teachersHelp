"use client";

import { useState, useCallback } from "react";
import { format, addDays, parseISO } from "date-fns";
import { useWeekSessions, useToggleSessionTask, useAddSessionTask, useDeleteSessionTask, useUpdateSessionNotes } from "@/hooks/useSessions";
import { useClasses } from "@/hooks/useClasses";
import { useWeekEvents, useCreateEvent, useToggleEvent, useDeleteEvent } from "@/hooks/useEvents";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { WeekNavigator } from "./WeekNavigator";
import { WeekProgressBar } from "./WeekProgressBar";
import { SessionWeekView } from "./SessionWeekView";
import { UpcomingDeadlines } from "./UpcomingDeadlines";

type ViewMode = "week" | "school" | "3day" | "day";

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "school", label: "5 Day" },
  { value: "3day", label: "3 Day" },
  { value: "day", label: "Day" },
];

function getCurrentSunday(): string {
  const now = new Date();
  const day = now.getDay();
  const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  return format(sunday, "yyyy-MM-dd");
}

function getTodayDayIndex(): number {
  return new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
}

function getViewSlice(viewMode: ViewMode, dayOffset: number): { startIndex: number; dayCount: number } {
  switch (viewMode) {
    case "week":
      return { startIndex: 0, dayCount: 7 };
    case "school":
      return { startIndex: 1, dayCount: 5 };
    case "3day":
      return { startIndex: Math.min(dayOffset, 4), dayCount: 3 };
    case "day":
      return { startIndex: dayOffset, dayCount: 1 };
  }
}

export function DashboardClient() {
  const currentSunday = getCurrentSunday();
  const [weekStart, setWeekStart] = useState(currentSunday);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [dayOffset, setDayOffset] = useState(getTodayDayIndex);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");

  const { data, isLoading } = useWeekSessions(weekStart);
  const { data: classes } = useClasses();
  const { data: events } = useWeekEvents(weekStart);
  const toggleTask = useToggleSessionTask();
  const addTask = useAddSessionTask();
  const deleteTask = useDeleteSessionTask();
  const updateNotes = useUpdateSessionNotes();
  const createEvent = useCreateEvent();
  const toggleEvent = useToggleEvent();
  const deleteEvent = useDeleteEvent();

  const isCurrentWeek = weekStart === currentSunday;
  const { startIndex, dayCount } = getViewSlice(viewMode, dayOffset);

  const filteredSessions = data
    ? selectedClassId === "all"
      ? data.sessions
      : data.sessions.filter((s) => s.class.id === selectedClassId)
    : [];

  // Navigation: week/school step by 7 days, 3day/day step within the week then wrap
  const handlePrev = useCallback(() => {
    if (viewMode === "week" || viewMode === "school") {
      setWeekStart((ws) => format(addDays(parseISO(ws), -7), "yyyy-MM-dd"));
    } else if (viewMode === "3day") {
      setDayOffset((prev) => {
        const next = prev - 3;
        if (next < 0) {
          setWeekStart((ws) => format(addDays(parseISO(ws), -7), "yyyy-MM-dd"));
          return Math.max(0, 7 + next);
        }
        return next;
      });
    } else {
      setDayOffset((prev) => {
        if (prev <= 0) {
          setWeekStart((ws) => format(addDays(parseISO(ws), -7), "yyyy-MM-dd"));
          return 6;
        }
        return prev - 1;
      });
    }
  }, [viewMode]);

  const handleNext = useCallback(() => {
    if (viewMode === "week" || viewMode === "school") {
      setWeekStart((ws) => format(addDays(parseISO(ws), 7), "yyyy-MM-dd"));
    } else if (viewMode === "3day") {
      setDayOffset((prev) => {
        const next = prev + 3;
        if (next > 4) {
          setWeekStart((ws) => format(addDays(parseISO(ws), 7), "yyyy-MM-dd"));
          return 0;
        }
        return next;
      });
    } else {
      setDayOffset((prev) => {
        if (prev >= 6) {
          setWeekStart((ws) => format(addDays(parseISO(ws), 7), "yyyy-MM-dd"));
          return 0;
        }
        return prev + 1;
      });
    }
  }, [viewMode]);

  const handleToday = useCallback(() => {
    setWeekStart(getCurrentSunday());
    setDayOffset(getTodayDayIndex());
  }, []);

  const handleViewChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    // Reset dayOffset to today when switching to 3day/day modes
    if (mode === "3day" || mode === "day") {
      if (weekStart === getCurrentSunday()) {
        setDayOffset(getTodayDayIndex());
      } else {
        setDayOffset(0);
      }
    }
  }, [weekStart]);

  // Compute the date range label for the current view
  const viewLabel = (() => {
    if (!data) return "";
    const ws = parseISO(data.weekStart);
    const firstDay = addDays(ws, startIndex);
    const lastDay = addDays(ws, startIndex + dayCount - 1);
    if (dayCount === 1) return format(firstDay, "EEEE, MMMM d, yyyy");
    const sameMonth = firstDay.getMonth() === lastDay.getMonth();
    return sameMonth
      ? `${format(firstDay, "MMMM d")} - ${format(lastDay, "d, yyyy")}`
      : `${format(firstDay, "MMM d")} - ${format(lastDay, "MMM d, yyyy")}`;
  })();

  const isToday = isCurrentWeek && dayOffset === getTodayDayIndex();

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

  const handleAddEvent = useCallback(
    (data: { title: string; date: string; time?: string | null }) => {
      createEvent.mutate(data);
    },
    [createEvent]
  );

  const handleToggleEvent = useCallback(
    (id: string, completed: boolean) => {
      toggleEvent.mutate({ id, completed });
    },
    [toggleEvent]
  );

  const handleDeleteEvent = useCallback(
    (id: string) => {
      deleteEvent.mutate(id);
    },
    [deleteEvent]
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

          {/* View mode toggle */}
          <div className="flex rounded-md border overflow-hidden">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleViewChange(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                } ${opt.value !== "week" ? "border-l" : ""}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation row */}
      {data && (
        <WeekNavigator
          weekStart={data.weekStart}
          weekEnd={data.weekEnd}
          onPrevWeek={handlePrev}
          onNextWeek={handleNext}
          onThisWeek={handleToday}
          isCurrentWeek={viewMode === "week" || viewMode === "school" ? isCurrentWeek : isToday}
          label={viewLabel}
        />
      )}

      <UpcomingDeadlines />

      {data && (
        <>
          <WeekProgressBar sessions={filteredSessions} />
          <SessionWeekView
            sessions={filteredSessions}
            weekStart={data.weekStart}
            startIndex={startIndex}
            dayCount={dayCount}
            events={events ?? []}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onUpdateNotes={handleUpdateNotes}
            onAddEvent={handleAddEvent}
            onToggleEvent={handleToggleEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        </>
      )}
    </div>
  );
}
