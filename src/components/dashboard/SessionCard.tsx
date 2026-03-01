"use client";

import { useState } from "react";
import { formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SessionTaskItem } from "./SessionTaskItem";
import { Plus } from "lucide-react";
import type { ClassSessionWithDetails } from "@/types";

interface SessionCardProps {
  session: ClassSessionWithDetails;
  onToggleTask: (sessionId: string, taskId: string, completed: boolean) => void;
  onAddTask: (sessionId: string, title: string) => void;
  onDeleteTask: (sessionId: string, taskId: string) => void;
}

export function SessionCard({
  session,
  onToggleTask,
  onAddTask,
  onDeleteTask,
}: SessionCardProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showInput, setShowInput] = useState(false);

  const completed = session.tasks.filter((t) => t.completed).length;
  const total = session.tasks.length;

  function handleAddTask() {
    const title = newTaskTitle.trim();
    if (!title) return;
    onAddTask(session.id, title);
    setNewTaskTitle("");
  }

  return (
    <div
      className="rounded-md border p-2.5"
      style={{
        borderLeftWidth: "3px",
        borderLeftColor: session.class.color,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-medium truncate">
            {session.class.name}
          </span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatTime(session.schedule.startTime)}
          </span>
        </div>
        {total > 0 && (
          <Badge
            variant={completed === total ? "default" : "secondary"}
            className="text-[10px] px-1.5 py-0 ml-1"
          >
            {completed}/{total}
          </Badge>
        )}
      </div>

      {session.lesson && (
        <p className="text-xs text-muted-foreground mb-1 truncate">
          {session.lesson.title}
        </p>
      )}

      {/* Tasks */}
      {session.tasks.length > 0 && (
        <div className="space-y-0.5 mt-1">
          {session.tasks.map((task) => (
            <SessionTaskItem
              key={task.id}
              task={task}
              sessionId={session.id}
              onToggle={onToggleTask}
              onDelete={onDeleteTask}
            />
          ))}
        </div>
      )}

      {/* Add Task */}
      {showInput ? (
        <div className="mt-1.5">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Task title..."
            className="h-7 text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddTask();
              if (e.key === "Escape") {
                setShowInput(false);
                setNewTaskTitle("");
              }
            }}
            onBlur={() => {
              if (!newTaskTitle.trim()) {
                setShowInput(false);
              }
            }}
          />
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add task
        </button>
      )}
    </div>
  );
}
