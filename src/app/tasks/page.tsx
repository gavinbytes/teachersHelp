"use client";

import { useState, useMemo, useCallback } from "react";
import { format, addDays } from "date-fns";
import { useWeekSessions, useToggleSessionTask } from "@/hooks/useSessions";
import { useClasses } from "@/hooks/useClasses";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ListChecks } from "lucide-react";

function getCurrentMonday(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - day + (day === 0 ? -6 : 1));
  return format(monday, "yyyy-MM-dd");
}

export default function TasksPage() {
  const currentMonday = getCurrentMonday();
  const [weekStart, setWeekStart] = useState(currentMonday);
  const [classFilter, setClassFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "INCOMPLETE" | "COMPLETE">("ALL");

  const { data, isLoading } = useWeekSessions(weekStart);
  const { data: classes } = useClasses();
  const toggleTask = useToggleSessionTask();

  const isCurrentWeek = weekStart === currentMonday;

  const handlePrevWeek = useCallback(() => {
    const prev = addDays(new Date(weekStart + "T00:00:00"), -7);
    setWeekStart(format(prev, "yyyy-MM-dd"));
  }, [weekStart]);

  const handleNextWeek = useCallback(() => {
    const next = addDays(new Date(weekStart + "T00:00:00"), 7);
    setWeekStart(format(next, "yyyy-MM-dd"));
  }, [weekStart]);

  // Flatten all session tasks with metadata
  const flatTasks = useMemo(() => {
    if (!data?.sessions) return [];

    return data.sessions.flatMap((session) =>
      session.tasks.map((task) => ({
        ...task,
        sessionId: session.id,
        className: session.class.name,
        classColor: session.class.color,
        classId: session.class.id,
        sessionDate: session.date,
        startTime: session.schedule.startTime,
      }))
    );
  }, [data]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    let result = flatTasks;

    if (classFilter !== "ALL") {
      result = result.filter((t) => t.classId === classFilter);
    }

    if (statusFilter === "INCOMPLETE") {
      result = result.filter((t) => !t.completed);
    } else if (statusFilter === "COMPLETE") {
      result = result.filter((t) => t.completed);
    }

    return result;
  }, [flatTasks, classFilter, statusFilter]);

  const completedCount = flatTasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ListChecks className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Tasks</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[180px] text-center">
            {data
              ? `${format(new Date(data.weekStart), "MMM d")} - ${format(
                  new Date(data.weekEnd),
                  "MMM d, yyyy"
                )}`
              : "Loading..."}
          </span>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!isCurrentWeek && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeekStart(currentMonday)}
            >
              This Week
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Classes</SelectItem>
            {classes?.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as "ALL" | "INCOMPLETE" | "COMPLETE")}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="INCOMPLETE">Incomplete</SelectItem>
            <SelectItem value="COMPLETE">Complete</SelectItem>
          </SelectContent>
        </Select>

        <span className="flex items-center text-sm text-muted-foreground ml-auto">
          {completedCount}/{flatTasks.length} complete
        </span>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            {flatTasks.length === 0
              ? "No tasks for this week. Add task templates to your classes to get started."
              : "No tasks match the current filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-md border bg-card px-3 py-2"
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={(checked) =>
                  toggleTask.mutate({
                    sessionId: task.sessionId,
                    taskId: task.id,
                    completed: !!checked,
                  })
                }
              />
              <span
                className={`flex-1 text-sm ${
                  task.completed ? "text-muted-foreground line-through" : ""
                }`}
              >
                {task.title}
              </span>
              <Badge
                variant="secondary"
                className="text-xs"
                style={{
                  backgroundColor: task.classColor + "20",
                  color: task.classColor,
                  borderColor: task.classColor + "40",
                }}
              >
                {task.className}
              </Badge>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(task.sessionDate), "EEE, MMM d")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
