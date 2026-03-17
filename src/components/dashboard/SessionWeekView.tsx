"use client";

import { addDays, parseISO, format } from "date-fns";
import { DayGroup } from "./DayGroup";
import type { ClassSessionWithDetails } from "@/types";
import type { DashboardEvent } from "@prisma/client";

const GRID_COLS: Record<number, string> = {
  1: "grid-cols-1",
  3: "grid-cols-1 md:grid-cols-3",
  5: "grid-cols-1 md:grid-cols-5",
  7: "grid-cols-1 md:grid-cols-7",
};

interface SessionWeekViewProps {
  sessions: ClassSessionWithDetails[];
  weekStart: string;
  startIndex: number;
  dayCount: number;
  events: DashboardEvent[];
  onToggleTask: (sessionId: string, taskId: string, completed: boolean) => void;
  onAddTask: (sessionId: string, title: string) => void;
  onDeleteTask: (sessionId: string, taskId: string) => void;
  onUpdateNotes?: (sessionId: string, notes: string) => void;
  onAddEvent: (data: { title: string; date: string; time?: string | null }) => void;
  onToggleEvent: (id: string, completed: boolean) => void;
  onDeleteEvent: (id: string) => void;
}

export function SessionWeekView({
  sessions,
  weekStart,
  startIndex,
  dayCount,
  events,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onUpdateNotes,
  onAddEvent,
  onToggleEvent,
  onDeleteEvent,
}: SessionWeekViewProps) {
  const sunday = parseISO(weekStart);

  const days = Array.from({ length: dayCount }, (_, i) => {
    const date = addDays(sunday, startIndex + i);
    const dateStr = format(date, "yyyy-MM-dd");
    const daySessions = sessions.filter((s) => {
      const sessionDateStr = new Date(s.date).toISOString().slice(0, 10);
      return sessionDateStr === dateStr;
    });
    const dayEvents = events.filter((e) => {
      const eventDateStr = new Date(e.date).toISOString().slice(0, 10);
      return eventDateStr === dateStr;
    });
    return { date: dateStr, sessions: daySessions, events: dayEvents };
  });

  return (
    <div className={`grid gap-3 ${GRID_COLS[dayCount] ?? "grid-cols-1 md:grid-cols-7"}`}>
      {days.map(({ date, sessions: daySessions, events: dayEvents }) => (
        <DayGroup
          key={date}
          date={date}
          sessions={daySessions}
          events={dayEvents}
          onToggleTask={onToggleTask}
          onAddTask={onAddTask}
          onDeleteTask={onDeleteTask}
          onUpdateNotes={onUpdateNotes}
          onAddEvent={onAddEvent}
          onToggleEvent={onToggleEvent}
          onDeleteEvent={onDeleteEvent}
        />
      ))}
    </div>
  );
}
