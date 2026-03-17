"use client";

import { useState } from "react";
import { formatTime } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, CalendarPlus } from "lucide-react";
import type { DashboardEvent } from "@prisma/client";

interface DayEventsProps {
  events: DashboardEvent[];
  date: string;
  onAdd: (data: { title: string; date: string; time?: string | null }) => void;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

export function DayEvents({ events, date, onAdd, onToggle, onDelete }: DayEventsProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");

  function handleAdd() {
    const t = title.trim();
    if (!t) return;
    onAdd({ title: t, date, time: time || null });
    setTitle("");
    setTime("");
    setShowForm(false);
  }

  return (
    <div>
      {events.length > 0 && (
        <div className="space-y-0.5 mb-1">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-1.5 group/event rounded px-1 py-0.5 hover:bg-muted/50"
            >
              <Checkbox
                checked={event.completed}
                onCheckedChange={(checked) => onToggle(event.id, !!checked)}
                className="h-3.5 w-3.5"
              />
              <span
                className={`text-xs flex-1 min-w-0 truncate ${
                  event.completed ? "line-through text-muted-foreground" : ""
                }`}
              >
                {event.title}
              </span>
              {event.time && (
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {formatTime(event.time)}
                </span>
              )}
              <button
                onClick={() => onDelete(event.id)}
                className="opacity-0 group-hover/event:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="space-y-1 mt-1">
          <div className="flex gap-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tutoring with Mike"
              className="h-7 text-xs flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") {
                  setShowForm(false);
                  setTitle("");
                  setTime("");
                }
              }}
            />
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-7 text-xs w-24"
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleAdd}
              disabled={!title.trim()}
              className="text-xs text-primary hover:underline disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setTitle("");
                setTime("");
              }}
              className="text-xs text-muted-foreground hover:underline ml-2"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          <CalendarPlus className="h-3 w-3" />
          Add event
        </button>
      )}
    </div>
  );
}
