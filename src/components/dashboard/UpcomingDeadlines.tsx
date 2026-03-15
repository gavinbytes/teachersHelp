"use client";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { CalendarClock } from "lucide-react";
import type { Assignment, Class } from "@/types";

type DeadlineAssignment = Assignment & {
  class: Pick<Class, "id" | "name" | "color">;
};

function formatDueLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEE, MMM d");
}

export function UpcomingDeadlines() {
  const { data: deadlines, isLoading } = useQuery<DeadlineAssignment[]>({
    queryKey: ["deadlines"],
    queryFn: async () => {
      const res = await fetch("/api/deadlines");
      if (!res.ok) throw new Error("Failed to fetch deadlines");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border p-3">
        <div className="h-4 w-40 animate-pulse rounded bg-muted mb-2" />
        <div className="space-y-2">
          <div className="h-8 animate-pulse rounded bg-muted" />
          <div className="h-8 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!deadlines || deadlines.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <CalendarClock className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Upcoming Deadlines</h3>
      </div>
      <div className="space-y-1.5">
        {deadlines.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
          >
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: a.class.color }}
            />
            <span className="truncate flex-1 min-w-0">{a.name}</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {a.class.name}
            </span>
            <span className="text-xs font-medium whitespace-nowrap ml-1">
              {a.dueDate ? formatDueLabel(typeof a.dueDate === "string" ? a.dueDate : new Date(a.dueDate).toISOString()) : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
