"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { SessionTask } from "@/types";

interface SessionTaskItemProps {
  task: SessionTask;
  sessionId: string;
  onToggle: (sessionId: string, taskId: string, completed: boolean) => void;
  onDelete: (sessionId: string, taskId: string) => void;
}

export function SessionTaskItem({
  task,
  sessionId,
  onToggle,
  onDelete,
}: SessionTaskItemProps) {
  return (
    <div className="group flex items-center gap-2 py-0.5">
      <Checkbox
        checked={task.completed}
        onCheckedChange={(checked) =>
          onToggle(sessionId, task.id, !!checked)
        }
        className="h-3.5 w-3.5"
      />
      <span
        className={`flex-1 text-xs ${
          task.completed ? "text-muted-foreground line-through" : ""
        }`}
      >
        {task.title}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onDelete(sessionId, task.id)}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
