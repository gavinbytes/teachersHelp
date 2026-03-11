"use client";

import { useState } from "react";
import { useCreateClass } from "@/hooks/useClasses";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDayName } from "@/lib/utils";
import { Plus, X } from "lucide-react";

const colorOptions = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
];

type SchedulePattern = {
  days: number[];
  startTime: string;
  endTime: string;
};

interface ClassFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClassForm({ open, onOpenChange }: ClassFormProps) {
  const createClass = useCreateClass();
  const [color, setColor] = useState(colorOptions[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [patterns, setPatterns] = useState<SchedulePattern[]>([]);
  const [studentCount, setStudentCount] = useState<number | "">(0);

  function addPattern() {
    setPatterns((prev) => [...prev, { days: [1], startTime: "08:00", endTime: "09:00" }]);
  }

  function removePattern(index: number) {
    setPatterns((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleDay(patternIndex: number, day: number) {
    setPatterns((prev) =>
      prev.map((p, i) => {
        if (i !== patternIndex) return p;
        const days = p.days.includes(day)
          ? p.days.filter((d) => d !== day)
          : [...p.days, day].sort();
        return { ...p, days: days.length > 0 ? days : p.days };
      })
    );
  }

  function updatePattern(index: number, field: "startTime" | "endTime", value: string) {
    setPatterns((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }

  // Expand patterns into individual schedule slots, deduplicating overlaps
  function expandPatterns(): { dayOfWeek: number; startTime: string; endTime: string }[] {
    const seen = new Set<string>();
    const slots: { dayOfWeek: number; startTime: string; endTime: string }[] = [];
    for (const pattern of patterns) {
      for (const day of pattern.days) {
        const key = `${day}-${pattern.startTime}-${pattern.endTime}`;
        if (seen.has(key)) continue;
        seen.add(key);
        slots.push({ dayOfWeek: day, startTime: pattern.startTime, endTime: pattern.endTime });
      }
    }
    return slots;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const schedules = expandPatterns();
    const newClass = await createClass.mutateAsync({
      name: formData.get("name") as string,
      subject: formData.get("subject") as string,
      room: (formData.get("room") as string) || undefined,
      color,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      schedules,
    });

    // Batch-create placeholder students if count was specified
    if (studentCount && studentCount > 0 && newClass?.id) {
      await fetch(`/api/classes/${newClass.id}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: studentCount }),
      });
    }

    setPatterns([]);
    setColor(colorOptions[0]);
    setStartDate("");
    setEndDate("");
    setStudentCount(0);
    onOpenChange(false);
  }

  function patternSummary(pattern: SchedulePattern): string {
    return pattern.days.map((d) => getDayName(d, true)).join("/");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Class Name</Label>
            <Input id="name" name="name" placeholder="Algebra I" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" name="subject" placeholder="Mathematics" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="room">Room (optional)</Label>
            <Input id="room" name="room" placeholder="Room 201" />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    color === c ? "scale-110 ring-2 ring-offset-2 ring-primary" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Semester Start (optional)</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Semester End (optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Schedule</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPattern}>
                <Plus className="mr-1 h-3 w-3" />
                Add Time Pattern
              </Button>
            </div>
            {patterns.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No schedule yet. Add a time pattern to select days and times.
              </p>
            )}
            {patterns.map((pattern, i) => (
              <div key={i} className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {patternSummary(pattern)} {pattern.startTime}–{pattern.endTime}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removePattern(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-1">
                  {WEEKDAYS.map((wd) => (
                    <button
                      key={wd.value}
                      type="button"
                      onClick={() => toggleDay(i, wd.value)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        pattern.days.includes(wd.value)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {wd.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={pattern.startTime}
                    onChange={(e) => updatePattern(i, "startTime", e.target.value)}
                    className="w-28"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input
                    type="time"
                    value={pattern.endTime}
                    onChange={(e) => updatePattern(i, "endTime", e.target.value)}
                    className="w-28"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentCount">Number of Students (optional)</Label>
            <Input
              id="studentCount"
              type="number"
              min={0}
              max={50}
              value={studentCount}
              onChange={(e) => setStudentCount(e.target.value === "" ? "" : Math.min(50, Math.max(0, Number(e.target.value))))}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Creates placeholder students you can rename later
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={createClass.isPending}>
            {createClass.isPending ? "Creating..." : "Create Class"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
