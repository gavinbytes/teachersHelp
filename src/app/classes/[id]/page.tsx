"use client";

import { use } from "react";
import Link from "next/link";
import { useClass, useDeleteClass } from "@/hooks/useClasses";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScheduleBuilder } from "@/components/classes/ScheduleBuilder";
import { TaskTemplateEditor } from "@/components/classes/TaskTemplateEditor";
import { Users, BookOpen, Trash2, ArrowLeft, ClipboardList } from "lucide-react";

export default function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: cls, isLoading } = useClass(id);
  const deleteClass = useDeleteClass();
  const router = useRouter();

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-lg bg-muted" />;
  }

  if (!cls) {
    return <p>Class not found</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/classes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: cls.color }} />
          <h1 className="text-2xl font-bold">{cls.name}</h1>
        </div>
        <Badge variant="secondary">{cls.subject}</Badge>
        {cls.room && <span className="text-sm text-muted-foreground">{cls.room}</span>}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Link href={`/classes/${id}/students`}>
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{cls.students.length}</p>
                <p className="text-sm text-muted-foreground">Students</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/classes/${id}/gradebook`}>
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <BookOpen className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{cls.assignments.length}</p>
                <p className="text-sm text-muted-foreground">Assignments</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/classes/${id}/unit-plans`}>
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <ClipboardList className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-lg font-bold">Unit Plans</p>
                <p className="text-sm text-muted-foreground">Curriculum</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div>
              <p className="text-2xl font-bold">{cls.categories.length}</p>
              <p className="text-sm text-muted-foreground">Grade Categories</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ScheduleBuilder classId={id} schedules={cls.schedules} />

      <TaskTemplateEditor classId={id} />

      <Separator />

      <Button
        variant="destructive"
        size="sm"
        onClick={async () => {
          if (confirm("Delete this class? This cannot be undone.")) {
            await deleteClass.mutateAsync(id);
            router.push("/classes");
          }
        }}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Class
      </Button>
    </div>
  );
}
