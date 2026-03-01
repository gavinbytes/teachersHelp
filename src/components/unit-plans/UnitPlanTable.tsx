"use client";

import { useState } from "react";
import type { UnitPlanWithUnits, Unit, SubUnit } from "@/types";
import {
  useCreateUnit,
  useUpdateUnit,
  useDeleteUnit,
  useCreateSubUnit,
  useUpdateSubUnit,
  useDeleteSubUnit,
} from "@/hooks/useUnitPlans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnitPlanTableProps {
  classId: string;
  plan: UnitPlanWithUnits;
}

const STATUS_CYCLE = ["PLANNED", "TAUGHT", "SKIPPED"] as const;
const STATUS_STYLES = {
  PLANNED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  TAUGHT: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  SKIPPED: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
};

function getCurrentWeek(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const diffMs = now.getTime() - startOfYear.getTime();
  return Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000));
}

export function UnitPlanTable({ classId, plan }: UnitPlanTableProps) {
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const deleteUnit = useDeleteUnit();
  const createSubUnit = useCreateSubUnit();
  const updateSubUnit = useUpdateSubUnit();
  const deleteSubUnit = useDeleteSubUnit();

  const [addingUnitWeek, setAddingUnitWeek] = useState<number | null>(null);
  const [newUnitName, setNewUnitName] = useState("");
  const [addingSubUnitId, setAddingSubUnitId] = useState<string | null>(null);
  const [newSubUnitName, setNewSubUnitName] = useState("");
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editingSubUnitId, setEditingSubUnitId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Group units by week number
  const weekGroups = new Map<number, (Unit & { subUnits: SubUnit[] })[]>();
  for (const unit of plan.units) {
    const existing = weekGroups.get(unit.weekNumber) ?? [];
    existing.push(unit);
    weekGroups.set(unit.weekNumber, existing);
  }

  const weeks = [...weekGroups.keys()].sort((a, b) => a - b);
  const maxWeek = weeks.length > 0 ? Math.max(...weeks) : 0;

  // Determine "current" week relative to plan (week 1 = first week in the plan)
  const currentCalendarWeek = getCurrentWeek();

  async function handleAddUnit(weekNumber: number) {
    if (!newUnitName.trim()) return;
    const unitsInWeek = weekGroups.get(weekNumber) ?? [];
    await createUnit.mutateAsync({
      classId,
      planId: plan.id,
      name: newUnitName.trim(),
      weekNumber,
      sortOrder: unitsInWeek.length,
    });
    setNewUnitName("");
    setAddingUnitWeek(null);
  }

  async function handleAddSubUnit(unitId: string) {
    if (!newSubUnitName.trim()) return;
    const unit = plan.units.find((u) => u.id === unitId);
    await createSubUnit.mutateAsync({
      classId,
      planId: plan.id,
      unitId,
      name: newSubUnitName.trim(),
      sortOrder: unit?.subUnits.length ?? 0,
    });
    setNewSubUnitName("");
    setAddingSubUnitId(null);
  }

  function cycleStatus(subUnit: SubUnit, unit: Unit) {
    const currentIndex = STATUS_CYCLE.indexOf(subUnit.status as (typeof STATUS_CYCLE)[number]);
    const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];
    updateSubUnit.mutate({
      classId,
      planId: plan.id,
      unitId: unit.id,
      subUnitId: subUnit.id,
      status: nextStatus,
    });
  }

  function startEditUnit(unit: Unit) {
    setEditingUnitId(unit.id);
    setEditName(unit.name);
  }

  function saveEditUnit(unit: Unit) {
    if (editName.trim() && editName.trim() !== unit.name) {
      updateUnit.mutate({
        classId,
        planId: plan.id,
        unitId: unit.id,
        name: editName.trim(),
      });
    }
    setEditingUnitId(null);
  }

  function startEditSubUnit(subUnit: SubUnit) {
    setEditingSubUnitId(subUnit.id);
    setEditName(subUnit.name);
  }

  function saveEditSubUnit(subUnit: SubUnit, unitId: string) {
    if (editName.trim() && editName.trim() !== subUnit.name) {
      updateSubUnit.mutate({
        classId,
        planId: plan.id,
        unitId,
        subUnitId: subUnit.id,
        name: editName.trim(),
      });
    }
    setEditingSubUnitId(null);
  }

  if (plan.units.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          No units yet. Add your first unit to get started.
        </p>
        {addingUnitWeek === 1 ? (
          <div className="flex items-center gap-2">
            <Input
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
              placeholder="Unit name"
              onKeyDown={(e) => e.key === "Enter" && handleAddUnit(1)}
              autoFocus
              className="max-w-xs"
            />
            <Button size="sm" onClick={() => handleAddUnit(1)} disabled={createUnit.isPending}>
              Add
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAddingUnitWeek(null)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setAddingUnitWeek(1)}>
            <Plus className="mr-1 h-3 w-3" />
            Add Unit to Week 1
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium w-20">Week</th>
              <th className="px-3 py-2 text-left font-medium">Unit</th>
              <th className="px-3 py-2 text-left font-medium">Lesson / Sub-Unit</th>
              <th className="px-3 py-2 text-left font-medium w-24">Status</th>
              <th className="px-3 py-2 w-16" />
            </tr>
          </thead>
          <tbody>
            {weeks.map((weekNum) => {
              const units = weekGroups.get(weekNum) ?? [];
              const isCurrentWeek = weekNum === currentCalendarWeek;
              let firstRowInWeek = true;

              return units.map((unit) => {
                const rows: React.ReactNode[] = [];
                const showWeek = firstRowInWeek;
                firstRowInWeek = false;

                // Unit row (if no sub-units, show unit as a single row)
                if (unit.subUnits.length === 0) {
                  rows.push(
                    <tr
                      key={unit.id}
                      className={cn(
                        "border-b",
                        isCurrentWeek && "bg-primary/5"
                      )}
                    >
                      <td className="px-3 py-2 text-muted-foreground">
                        {showWeek ? `Week ${weekNum}` : ""}
                      </td>
                      <td className="px-3 py-2">
                        {editingUnitId === unit.id ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={() => saveEditUnit(unit)}
                            onKeyDown={(e) => e.key === "Enter" && saveEditUnit(unit)}
                            className="h-7 text-sm"
                            autoFocus
                          />
                        ) : (
                          <span
                            className="cursor-pointer hover:underline font-medium"
                            onClick={() => startEditUnit(unit)}
                          >
                            {unit.name}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground italic">
                        No lessons yet
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-6 text-xs"
                          onClick={() => setAddingSubUnitId(unit.id)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Add
                        </Button>
                      </td>
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Delete unit "${unit.name}"?`)) {
                              deleteUnit.mutate({ classId, planId: plan.id, unitId: unit.id });
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                } else {
                  // Sub-unit rows
                  unit.subUnits.forEach((sub, subIdx) => {
                    rows.push(
                      <tr
                        key={sub.id}
                        className={cn(
                          "border-b",
                          isCurrentWeek && "bg-primary/5"
                        )}
                      >
                        <td className="px-3 py-2 text-muted-foreground">
                          {showWeek && subIdx === 0 ? `Week ${weekNum}` : ""}
                        </td>
                        <td className="px-3 py-2">
                          {subIdx === 0 ? (
                            editingUnitId === unit.id ? (
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={() => saveEditUnit(unit)}
                                onKeyDown={(e) => e.key === "Enter" && saveEditUnit(unit)}
                                className="h-7 text-sm"
                                autoFocus
                              />
                            ) : (
                              <span
                                className="cursor-pointer hover:underline font-medium"
                                onClick={() => startEditUnit(unit)}
                              >
                                {unit.name}
                              </span>
                            )
                          ) : (
                            ""
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {editingSubUnitId === sub.id ? (
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onBlur={() => saveEditSubUnit(sub, unit.id)}
                              onKeyDown={(e) =>
                                e.key === "Enter" && saveEditSubUnit(sub, unit.id)
                              }
                              className="h-7 text-sm"
                              autoFocus
                            />
                          ) : (
                            <span
                              className="cursor-pointer hover:underline"
                              onClick={() => startEditSubUnit(sub)}
                            >
                              {sub.name}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => cycleStatus(sub, unit)}
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                              STATUS_STYLES[sub.status as keyof typeof STATUS_STYLES]
                            )}
                          >
                            {sub.status}
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              deleteSubUnit.mutate({
                                classId,
                                planId: plan.id,
                                unitId: unit.id,
                                subUnitId: sub.id,
                              })
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  });
                }

                // Add sub-unit inline form
                if (addingSubUnitId === unit.id) {
                  rows.push(
                    <tr key={`add-sub-${unit.id}`} className="border-b">
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2" colSpan={2}>
                        <div className="flex items-center gap-2">
                          <Input
                            value={newSubUnitName}
                            onChange={(e) => setNewSubUnitName(e.target.value)}
                            placeholder="Lesson / sub-unit name"
                            onKeyDown={(e) => e.key === "Enter" && handleAddSubUnit(unit.id)}
                            autoFocus
                            className="h-7 text-sm"
                          />
                          <Button
                            size="sm"
                            className="h-7"
                            onClick={() => handleAddSubUnit(unit.id)}
                            disabled={createSubUnit.isPending}
                          >
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7"
                            onClick={() => setAddingSubUnitId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </td>
                      <td />
                    </tr>
                  );
                } else {
                  rows.push(
                    <tr key={`add-sub-btn-${unit.id}`} className="border-b">
                      <td className="px-3 py-1" />
                      <td className="px-3 py-1" />
                      <td className="px-3 py-1" colSpan={3}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-muted-foreground"
                          onClick={() => setAddingSubUnitId(unit.id)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Add lesson
                        </Button>
                      </td>
                    </tr>
                  );
                }

                return rows;
              });
            })}
          </tbody>
        </table>
      </div>

      {/* Add unit to existing or new week */}
      {addingUnitWeek !== null ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Week {addingUnitWeek}:</span>
          <Input
            value={newUnitName}
            onChange={(e) => setNewUnitName(e.target.value)}
            placeholder="Unit name"
            onKeyDown={(e) => e.key === "Enter" && handleAddUnit(addingUnitWeek!)}
            autoFocus
            className="max-w-xs"
          />
          <Button size="sm" onClick={() => handleAddUnit(addingUnitWeek!)} disabled={createUnit.isPending}>
            Add
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAddingUnitWeek(null)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAddingUnitWeek(maxWeek + 1)}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Unit (Week {maxWeek + 1})
        </Button>
      )}
    </div>
  );
}
