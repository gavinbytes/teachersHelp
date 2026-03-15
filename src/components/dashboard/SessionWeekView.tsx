"use client";

import { addDays, parseISO, format } from "date-fns";
import { DayGroup } from "./DayGroup";
import type { ClassSessionWithDetails } from "@/types";

interface SessionWeekViewProps {
  sessions: ClassSessionWithDetails[];
  weekStart: string;
  onToggleTask: (sessionId: string, taskId: string, completed: boolean) => void;
  onAddTask: (sessionId: string, title: string) => void;
  onDeleteTask: (sessionId: string, taskId: string) => void;
  onUpdateNotes?: (sessionId: string, notes: string) => void;
}

export function SessionWeekView({
  sessions,
  weekStart,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onUpdateNotes,
}: SessionWeekViewProps) {
  const sunday = parseISO(weekStart);

  // Build 7 day slots (Sun-Sat)
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(sunday, i);
    const dateStr = format(date, "yyyy-MM-dd");
    const daySessions = sessions.filter((s) => {
      // Extract UTC date portion directly to avoid local timezone shifts
      const sessionDateStr = new Date(s.date).toISOString().slice(0, 10);
      return sessionDateStr === dateStr;
    });
    return { date: dateStr, sessions: daySessions };
  });

  return (
    <div className="grid gap-3 md:grid-cols-7">
      {days.map(({ date, sessions: daySessions }) => (
        <DayGroup
          key={date}
          date={date}
          sessions={daySessions}
          onToggleTask={onToggleTask}
          onAddTask={onAddTask}
          onDeleteTask={onDeleteTask}
          onUpdateNotes={onUpdateNotes}
        />
      ))}
    </div>
  );
}
