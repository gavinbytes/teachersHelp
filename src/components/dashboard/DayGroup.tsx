"use client";

import { format, parseISO, isToday } from "date-fns";
import { SessionCard } from "./SessionCard";
import { DayEvents } from "./DayEvents";
import type { ClassSessionWithDetails } from "@/types";
import type { DashboardEvent } from "@prisma/client";

interface DayGroupProps {
  date: string;
  sessions: ClassSessionWithDetails[];
  events: DashboardEvent[];
  onToggleTask: (sessionId: string, taskId: string, completed: boolean) => void;
  onAddTask: (sessionId: string, title: string) => void;
  onDeleteTask: (sessionId: string, taskId: string) => void;
  onUpdateNotes?: (sessionId: string, notes: string) => void;
  onAddEvent: (data: { title: string; date: string; time?: string | null }) => void;
  onToggleEvent: (id: string, completed: boolean) => void;
  onDeleteEvent: (id: string) => void;
}

export function DayGroup({
  date,
  sessions,
  events,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onUpdateNotes,
  onAddEvent,
  onToggleEvent,
  onDeleteEvent,
}: DayGroupProps) {
  const dateObj = parseISO(date);
  const today = isToday(dateObj);
  const completed = sessions.flatMap((s) => s.tasks).filter((t) => t.completed).length;
  const total = sessions.flatMap((s) => s.tasks).length;

  return (
    <div
      className={`rounded-lg border p-3 ${
        today ? "border-primary border-2" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <p
            className={`text-sm font-semibold ${
              today ? "text-primary" : ""
            }`}
          >
            {format(dateObj, "EEEE, MMM d")}
          </p>
          {today && (
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </div>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">
            {completed}/{total}
          </span>
        )}
      </div>

      {sessions.length === 0 ? (
        <p className="text-xs text-muted-foreground">No classes</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onToggleTask={onToggleTask}
              onAddTask={onAddTask}
              onDeleteTask={onDeleteTask}
              onUpdateNotes={onUpdateNotes}
            />
          ))}
        </div>
      )}

      <div className="mt-2 pt-2 border-t border-dashed">
        <DayEvents
          events={events}
          date={date}
          onAdd={onAddEvent}
          onToggle={onToggleEvent}
          onDelete={onDeleteEvent}
        />
      </div>
    </div>
  );
}
