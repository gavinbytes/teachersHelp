"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTime, getDayName } from "@/lib/utils";
import type { ClassWithSchedule } from "@/types";
import { Users, BookOpen } from "lucide-react";

interface ClassCardProps {
  cls: ClassWithSchedule;
}

export function ClassCard({ cls }: ClassCardProps) {
  return (
    <Link href={`/classes/${cls.id}`}>
      <Card className="transition-shadow hover:shadow-md cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: cls.color }}
            />
            <CardTitle className="text-base">{cls.name}</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">{cls.subject}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {cls.room && (
            <p className="text-xs text-muted-foreground">{cls.room}</p>
          )}
          <div className="flex flex-wrap gap-1">
            {cls.schedules
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
              .map((s) => (
                <Badge key={s.id} variant="secondary" className="text-xs">
                  {getDayName(s.dayOfWeek, true)} {formatTime(s.startTime)}
                </Badge>
              ))}
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {cls._count?.students ?? 0} students
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {cls._count?.assignments ?? 0} assignments
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
