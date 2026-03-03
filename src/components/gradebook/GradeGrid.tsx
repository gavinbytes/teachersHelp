"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useUpdateGrades } from "@/hooks/useGradebook";
import { useUpdateStudent } from "@/hooks/useStudents";
import { getGradeLetter, getGradeBgColor } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import type { GradebookData, GradeUpdate } from "@/types";

function InlineStudentName({
  student,
  classId,
}: {
  student: { id: string; firstName: string; lastName: string | null };
  classId: string;
}) {
  const displayName = [student.firstName, student.lastName].filter(Boolean).join(" ");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(displayName);
  const updateStudent = useUpdateStudent();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(displayName);
  }, [displayName]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function save() {
    const trimmed = name.trim();
    if (trimmed && trimmed !== displayName) {
      updateStudent.mutate({ classId, studentId: student.id, student_name: trimmed });
    } else {
      setName(displayName);
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") { setName(displayName); setEditing(false); }
        }}
        className="w-full h-7 px-1 text-sm font-medium border rounded outline-none focus:ring-2 focus:ring-primary/40"
      />
    );
  }

  return (
    <span
      className="cursor-pointer hover:underline"
      onClick={() => setEditing(true)}
      title="Click to edit name"
    >
      {displayName}
    </span>
  );
}

interface GradeGridProps {
  data: GradebookData;
  classId: string;
}

export function GradeGrid({ data, classId }: GradeGridProps) {
  const updateGrades = useUpdateGrades();

  // Build initial scores from server data: { "studentId:assignmentId": number | "" }
  const serverScores = useMemo(() => {
    const map: Record<string, number | ""> = {};
    for (const student of data.students) {
      for (const assignment of data.assignments) {
        const grade = data.grades.find(
          (g) => g.studentId === student.id && g.assignmentId === assignment.id
        );
        map[`${student.id}:${assignment.id}`] = grade?.score ?? "";
      }
    }
    return map;
  }, [data.students, data.assignments, data.grades]);

  const [scores, setScores] = useState<Record<string, number | "">>(serverScores);

  // Sync when server data changes (after save)
  useEffect(() => {
    setScores(serverScores);
  }, [serverScores]);

  // Track what's changed
  const dirtyKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const key of Object.keys(scores)) {
      if (scores[key] !== serverScores[key]) {
        keys.add(key);
      }
    }
    return keys;
  }, [scores, serverScores]);

  const isDirty = dirtyKeys.size > 0;

  const categoryWeights = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of data.categories) {
      map[cat.id] = cat.weight;
    }
    return map;
  }, [data.categories]);

  function calcWeightedAverage(studentId: string): number | null {
    const categoryScores: Record<string, { earned: number; possible: number }> = {};

    for (const assignment of data.assignments) {
      const val = scores[`${studentId}:${assignment.id}`];
      if (val === "" || val === null || val === undefined) continue;

      const catId = assignment.categoryId || "uncategorized";
      if (!categoryScores[catId]) categoryScores[catId] = { earned: 0, possible: 0 };
      categoryScores[catId].earned += Number(val);
      categoryScores[catId].possible += assignment.points;
    }

    let totalWeight = 0;
    let weightedSum = 0;
    for (const [catId, s] of Object.entries(categoryScores)) {
      if (s.possible === 0) continue;
      const weight = categoryWeights[catId] || 0;
      const pct = (s.earned / s.possible) * 100;
      weightedSum += pct * weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) return null;
    return weightedSum / totalWeight;
  }

  function handleChange(studentId: string, assignmentId: string, raw: string) {
    const key = `${studentId}:${assignmentId}`;
    if (raw === "") {
      setScores((prev) => ({ ...prev, [key]: "" }));
      return;
    }
    const num = Number(raw);
    if (!isNaN(num) && num >= 0) {
      setScores((prev) => ({ ...prev, [key]: num }));
    }
  }

  function handleSave() {
    const grades: GradeUpdate[] = [];
    for (const key of dirtyKeys) {
      const [studentId, assignmentId] = key.split(":");
      const val = scores[key];
      grades.push({
        studentId,
        assignmentId,
        score: val === "" ? null : Number(val),
      });
    }
    updateGrades.mutate({ classId, grades });
  }

  // Keyboard navigation: Enter moves down, Escape blurs
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, studentIdx: number, assignmentIdx: number) => {
      if (e.key === "Enter") {
        e.preventDefault();
        // Move down to next student, same assignment
        const nextStudent = data.students[studentIdx + 1];
        if (nextStudent) {
          const nextKey = `${nextStudent.id}:${data.assignments[assignmentIdx].id}`;
          inputRefs.current[nextKey]?.focus();
          inputRefs.current[nextKey]?.select();
        }
      } else if (e.key === "Escape") {
        (e.target as HTMLInputElement).blur();
      }
    },
    [data.students, data.assignments]
  );

  return (
    <div className="space-y-3">
      {/* Save bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {data.students.length} students &middot; {data.assignments.length} assignments
          {isDirty && (
            <span className="ml-2 text-orange-600 font-medium">
              &middot; {dirtyKeys.size} unsaved {dirtyKeys.size === 1 ? "change" : "changes"}
            </span>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!isDirty || updateGrades.isPending}
        >
          <Save className="mr-2 h-4 w-4" />
          {updateGrades.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Spreadsheet */}
      <div className="overflow-auto rounded-md border bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/60">
              <th className="sticky left-0 z-20 bg-muted/60 border-b border-r px-3 py-2 text-left font-semibold min-w-[170px]">
                Student
              </th>
              {data.assignments.map((a) => (
                <th
                  key={a.id}
                  className="border-b border-r px-2 py-2 text-center font-medium min-w-[90px] max-w-[120px]"
                  title={`${a.category?.name || "Uncategorized"} — ${a.points} pts`}
                >
                  <div className="truncate">{a.name}</div>
                  <div className="text-[10px] font-normal text-muted-foreground">
                    /{a.points}
                  </div>
                </th>
              ))}
              <th className="sticky right-[70px] z-20 bg-muted/60 border-b border-r px-2 py-2 text-center font-semibold w-[70px]">
                Avg %
              </th>
              <th className="sticky right-0 z-20 bg-muted/60 border-b px-2 py-2 text-center font-semibold w-[70px]">
                Grade
              </th>
            </tr>
          </thead>
          <tbody>
            {data.students.map((student, si) => {
              const avg = calcWeightedAverage(student.id);
              const avgRounded = avg !== null ? Math.round(avg * 10) / 10 : null;
              const letter = avg !== null ? getGradeLetter(avg) : "";

              return (
                <tr
                  key={student.id}
                  className="border-b last:border-b-0 hover:bg-muted/20"
                >
                  <td className="sticky left-0 z-10 bg-white border-r px-3 py-1 font-medium whitespace-nowrap">
                    <InlineStudentName student={student} classId={classId} />
                  </td>
                  {data.assignments.map((assignment, ai) => {
                    const key = `${student.id}:${assignment.id}`;
                    const val = scores[key];
                    const isDirtyCell = dirtyKeys.has(key);

                    return (
                      <td
                        key={assignment.id}
                        className="border-r p-0"
                      >
                        <input
                          ref={(el) => { inputRefs.current[key] = el; }}
                          type="text"
                          inputMode="decimal"
                          value={val}
                          onChange={(e) => handleChange(student.id, assignment.id, e.target.value)}
                          onFocus={(e) => e.target.select()}
                          onKeyDown={(e) => handleKeyDown(e, si, ai)}
                          className={`w-full h-8 px-2 text-center text-sm outline-none border-0 bg-transparent focus:ring-2 focus:ring-primary/40 focus:ring-inset ${
                            isDirtyCell ? "bg-blue-50" : ""
                          }`}
                        />
                      </td>
                    );
                  })}
                  <td
                    className="sticky right-[70px] z-10 border-r px-2 py-1 text-center font-bold text-sm bg-white"
                    style={avgRounded !== null ? { backgroundColor: getGradeBgColor(avgRounded) } : undefined}
                  >
                    {avgRounded ?? "—"}
                  </td>
                  <td
                    className="sticky right-0 z-10 px-2 py-1 text-center font-bold text-sm bg-white"
                    style={avgRounded !== null ? { backgroundColor: getGradeBgColor(avgRounded) } : undefined}
                  >
                    {letter || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
