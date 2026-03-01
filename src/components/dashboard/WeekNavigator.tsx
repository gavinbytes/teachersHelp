"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";

interface WeekNavigatorProps {
  weekStart: string;
  weekEnd: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onThisWeek: () => void;
  isCurrentWeek: boolean;
}

export function WeekNavigator({
  weekStart,
  weekEnd,
  onPrevWeek,
  onNextWeek,
  onThisWeek,
  isCurrentWeek,
}: WeekNavigatorProps) {
  const start = parseISO(weekStart);
  const end = parseISO(weekEnd);

  const sameMonth = start.getMonth() === end.getMonth();
  const label = sameMonth
    ? `${format(start, "MMMM d")} - ${format(end, "d, yyyy")}`
    : `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={onPrevWeek}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="text-center min-w-[220px]">
        <p className="text-sm font-semibold">Week of {label}</p>
      </div>
      <Button variant="outline" size="icon" onClick={onNextWeek}>
        <ChevronRight className="h-4 w-4" />
      </Button>
      {!isCurrentWeek && (
        <Button variant="ghost" size="sm" onClick={onThisWeek}>
          This Week
        </Button>
      )}
    </div>
  );
}
