"use client";

import { useState } from "react";
import { useAddSchedule, useDeleteSchedule } from "@/hooks/useClasses";
import { formatTime, getDayName } from "@/lib/utils";
import type { ClassSchedule } from "@/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";

interface ScheduleBuilderProps {
  classId: string;
  schedules: ClassSchedule[];
}

const WEEKDAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
];

export function ScheduleBuilder({ classId, schedules }: ScheduleBuilderProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState<string>("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const addSchedule = useAddSchedule();
  const deleteSchedule = useDeleteSchedule();

  const handleAdd = async () => {
    if (!dayOfWeek || !startTime || !endTime) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await addSchedule.mutateAsync({
        classId,
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime,
      });

      // Reset form
      setDayOfWeek("");
      setStartTime("");
      setEndTime("");
      setIsAdding(false);
      toast.success("Time slot added");
    } catch (error) {
      toast.error("Failed to add time slot");
    }
  };

  const handleDelete = async (scheduleId: string) => {
    try {
      await deleteSchedule.mutateAsync({ classId, scheduleId });
      toast.success("Time slot removed");
    } catch (error) {
      toast.error("Failed to remove time slot");
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setDayOfWeek("");
    setStartTime("");
    setEndTime("");
  };

  const sortedSchedules = [...schedules].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Schedule</CardTitle>
        {!isAdding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Time Slot
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedSchedules.length === 0 && !isAdding ? (
          <p className="text-sm text-muted-foreground">No schedule set</p>
        ) : (
          <div className="space-y-2">
            {sortedSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium min-w-[80px]">
                    {getDayName(schedule.dayOfWeek, true)}
                  </span>
                  <span className="text-muted-foreground">
                    {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDelete(schedule.id)}
                  disabled={deleteSchedule.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {isAdding && (
          <div className="space-y-3 rounded-md border p-4 bg-muted/50">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Day</label>
                <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time</label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="09:00"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Time</label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="10:00"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={addSchedule.isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={addSchedule.isPending}
              >
                Add
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
