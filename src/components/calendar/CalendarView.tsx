"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useClasses } from "@/hooks/useClasses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatTime } from "@/lib/utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  getDay,
} from "date-fns";
import type { Assignment, AssignmentCategory } from "@/types";

type ViewMode = "monthly" | "weekly" | "daily";

type AssignmentWithClass = Assignment & {
  category: AssignmentCategory | null;
  class: {
    id: string;
    name: string;
    color: string;
    subject: string;
  };
};

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>("monthly");
  const { data: classes } = useClasses();

  // Fetch assignments with due dates
  const { data: assignments } = useQuery<AssignmentWithClass[]>({
    queryKey: ["calendar-assignments"],
    queryFn: async () => {
      const res = await fetch("/api/calendar");
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return res.json();
    },
  });

  // Calculate calendar days for monthly view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Calculate week days for weekly view
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Mon
    return eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 4) }); // Mon-Fri
  }, [currentDate]);

  // Map assignments to dates
  const assignmentsByDate = useMemo(() => {
    if (!assignments) return new Map<string, AssignmentWithClass[]>();

    const map = new Map<string, AssignmentWithClass[]>();
    assignments.forEach((assignment) => {
      if (assignment.dueDate) {
        const dateKey = format(new Date(assignment.dueDate), "yyyy-MM-dd");
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, assignment]);
      }
    });
    return map;
  }, [assignments]);

  // Map class schedules to days of week
  const schedulesByDayOfWeek = useMemo(() => {
    if (!classes) return new Map<number, typeof classes>();

    const map = new Map<number, typeof classes>();
    classes.forEach((cls) => {
      cls.schedules.forEach((schedule) => {
        const existing = map.get(schedule.dayOfWeek) || [];
        map.set(schedule.dayOfWeek, [...existing, cls]);
      });
    });
    return map;
  }, [classes]);

  // Get schedule entries with times for a given day of week
  const getScheduleEntriesForDay = (dayOfWeek: number) => {
    if (!classes) return [];
    const entries: { cls: (typeof classes)[0]; startTime: string; endTime: string }[] = [];
    classes.forEach((cls) => {
      cls.schedules.forEach((schedule) => {
        if (schedule.dayOfWeek === dayOfWeek) {
          entries.push({ cls, startTime: schedule.startTime, endTime: schedule.endTime });
        }
      });
    });
    return entries.sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // Navigation handlers
  const handlePrev = () => {
    if (view === "monthly") setCurrentDate(subMonths(currentDate, 1));
    else if (view === "weekly") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (view === "monthly") setCurrentDate(addMonths(currentDate, 1));
    else if (view === "weekly") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const today = new Date();

  // Header title based on view
  const headerTitle = useMemo(() => {
    if (view === "monthly") return format(currentDate, "MMMM yyyy");
    if (view === "weekly") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 4);
      return `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;
    }
    return format(currentDate, "EEEE, MMMM d, yyyy");
  }, [currentDate, view]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{headerTitle}</CardTitle>
            <div className="flex items-center gap-2">
              {/* View toggle buttons */}
              <div className="flex rounded-md border">
                {(["monthly", "weekly", "daily"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors first:rounded-l-md last:rounded-r-md ${
                      view === v
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Monthly View */}
          {view === "monthly" && (
            <>
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
                {/* Weekday Headers */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="bg-muted px-2 py-2 text-center text-sm font-medium"
                  >
                    {day}
                  </div>
                ))}

                {/* Calendar Days */}
                {calendarDays.map((day, idx) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const dayAssignments = assignmentsByDate.get(dateKey) || [];
                  const dayOfWeek = getDay(day);
                  const classesOnDay = schedulesByDayOfWeek.get(dayOfWeek) || [];
                  const isToday = isSameDay(day, today);
                  const isCurrentMonth = isSameMonth(day, currentDate);

                  return (
                    <div
                      key={idx}
                      className={`bg-card min-h-[120px] p-2 ${
                        !isCurrentMonth ? "opacity-40" : ""
                      } ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-sm font-medium ${
                            isToday
                              ? "bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center"
                              : ""
                          }`}
                        >
                          {format(day, "d")}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {/* Class Schedules */}
                        {isCurrentMonth &&
                          classesOnDay.map((cls) => (
                            <div
                              key={cls.id}
                              className="flex items-center gap-1 text-xs"
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: cls.color }}
                              />
                              <span className="truncate text-muted-foreground">
                                {cls.name}
                              </span>
                            </div>
                          ))}

                        {/* Assignments Due */}
                        {dayAssignments.map((assignment) => (
                          <Badge
                            key={assignment.id}
                            variant="outline"
                            className="w-full justify-start text-xs py-0 px-1.5 border-l-2 rounded-none rounded-r"
                            style={{
                              borderLeftColor: assignment.class.color,
                            }}
                          >
                            <span className="truncate">{assignment.name}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Weekly View */}
          {view === "weekly" && (
            <div className="grid grid-cols-5 gap-2">
              {weekDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayAssignments = assignmentsByDate.get(dateKey) || [];
                const dayOfWeek = getDay(day);
                const isToday = isSameDay(day, today);
                const entries = getScheduleEntriesForDay(dayOfWeek);

                return (
                  <div
                    key={dateKey}
                    className={`rounded-lg border p-3 min-h-[300px] ${
                      isToday ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div className="mb-3 text-center">
                      <p className={`text-xs font-semibold ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                        {format(day, "EEE")}
                      </p>
                      <p className={`text-lg font-bold ${
                        isToday ? "bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center mx-auto" : ""
                      }`}>
                        {format(day, "d")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {/* Class sessions with times */}
                      {entries.map((entry, i) => (
                        <div
                          key={`${entry.cls.id}-${i}`}
                          className="rounded-md p-2 text-xs"
                          style={{
                            backgroundColor: entry.cls.color + "20",
                            borderLeft: `3px solid ${entry.cls.color}`,
                          }}
                        >
                          <p className="font-medium truncate">{entry.cls.name}</p>
                          <p className="text-muted-foreground">
                            {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
                          </p>
                        </div>
                      ))}

                      {/* Assignments due */}
                      {dayAssignments.length > 0 && (
                        <div className="border-t pt-2 mt-2">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Due</p>
                          {dayAssignments.map((assignment) => (
                            <Badge
                              key={assignment.id}
                              variant="outline"
                              className="w-full justify-start text-xs py-0.5 px-1.5 border-l-2 rounded-none rounded-r mb-1"
                              style={{
                                borderLeftColor: assignment.class.color,
                              }}
                            >
                              <span className="truncate">{assignment.name}</span>
                            </Badge>
                          ))}
                        </div>
                      )}

                      {entries.length === 0 && dayAssignments.length === 0 && (
                        <p className="text-center text-xs text-muted-foreground pt-4">
                          No classes
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Daily View */}
          {view === "daily" && (() => {
            const dateKey = format(currentDate, "yyyy-MM-dd");
            const dayAssignments = assignmentsByDate.get(dateKey) || [];
            const dayOfWeek = getDay(currentDate);
            const isToday = isSameDay(currentDate, today);
            const entries = getScheduleEntriesForDay(dayOfWeek);

            return (
              <div className="max-w-2xl mx-auto">
                {isToday && (
                  <Badge variant="secondary" className="mb-4">Today</Badge>
                )}

                {/* Class Sessions */}
                <div className="space-y-3">
                  {entries.length > 0 ? (
                    entries.map((entry, i) => (
                      <div
                        key={`${entry.cls.id}-${i}`}
                        className="flex items-center gap-4 rounded-lg border p-4"
                        style={{
                          borderLeft: `4px solid ${entry.cls.color}`,
                        }}
                      >
                        <div className="text-sm font-medium text-muted-foreground w-32">
                          {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
                        </div>
                        <div>
                          <p className="font-semibold">{entry.cls.name}</p>
                          <p className="text-sm text-muted-foreground">{entry.cls.subject}</p>
                          {entry.cls.room && (
                            <p className="text-xs text-muted-foreground">Room {entry.cls.room}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No classes scheduled for this day
                    </p>
                  )}
                </div>

                {/* Assignments Due */}
                {dayAssignments.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                      Assignments Due
                    </h3>
                    <div className="space-y-2">
                      {dayAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-center gap-3 rounded-md border p-3"
                          style={{ borderLeft: `4px solid ${assignment.class.color}` }}
                        >
                          <div>
                            <p className="font-medium text-sm">{assignment.name}</p>
                            <p className="text-xs text-muted-foreground">{assignment.class.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Legend */}
          <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Class Schedule</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-5 px-1.5">
                Assignment
              </Badge>
              <span>Due Date</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
