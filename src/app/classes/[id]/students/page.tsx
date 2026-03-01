"use client";

import { use, useState } from "react";
import { useClass } from "@/hooks/useClasses";
import { useStudents, useDeleteStudent, useUpdateStudent } from "@/hooks/useStudents";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickStudentEntry } from "@/components/students/QuickStudentEntry";
import { ArrowLeft, Trash2 } from "lucide-react";

function InlineStudentName({
  student,
  classId,
}: {
  student: { id: string; firstName: string; lastName: string };
  classId: string;
}) {
  const fullName = [student.firstName, student.lastName].filter(Boolean).join(" ");
  const [editing, setEditing] = useState(false);
  const [studentName, setStudentName] = useState(fullName);
  const updateStudent = useUpdateStudent();

  function startEdit() {
    setStudentName(fullName);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setStudentName(fullName);
  }

  async function save() {
    const trimmed = studentName.trim();
    if (!trimmed) {
      cancel();
      return;
    }
    if (trimmed === fullName) {
      setEditing(false);
      return;
    }
    await updateStudent.mutateAsync({
      classId,
      studentId: student.id,
      student_name: trimmed,
    });
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      cancel();
    }
  }

  if (editing) {
    return (
      <Input
        value={studentName}
        onChange={(e) => setStudentName(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        className="h-7 w-48 text-sm"
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={startEdit}
      className="cursor-pointer font-medium hover:underline text-left"
    >
      {fullName}
    </button>
  );
}

export default function StudentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: cls } = useClass(id);
  const { data: students, isLoading } = useStudents(id);
  const deleteStudent = useDeleteStudent();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/classes/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          {cls && <p className="text-sm text-muted-foreground">{cls.name}</p>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Roster ({students?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : students?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students yet. Add your first student below.</p>
          ) : (
            <div className="space-y-1">
              {students?.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <InlineStudentName student={student} classId={id} />
                    {student.email && (
                      <span className="ml-3 text-sm text-muted-foreground">
                        {student.email}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Remove ${[student.firstName, student.lastName].filter(Boolean).join(" ")}?`)) {
                        deleteStudent.mutate({ classId: id, studentId: student.id });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <QuickStudentEntry classId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
