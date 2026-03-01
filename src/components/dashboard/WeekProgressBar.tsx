"use client";

import { Progress } from "@/components/ui/progress";
import type { ClassSessionWithDetails } from "@/types";

interface WeekProgressBarProps {
  sessions: ClassSessionWithDetails[];
}

export function WeekProgressBar({ sessions }: WeekProgressBarProps) {
  const allTasks = sessions.flatMap((s) => s.tasks);
  const total = allTasks.length;
  const completed = allTasks.filter((t) => t.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {completed}/{total} tasks complete
        </span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
