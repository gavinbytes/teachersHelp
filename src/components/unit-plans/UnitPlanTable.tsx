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
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnitPlanTableProps {
  classId: string;
  plan: UnitPlanWithUnits;
}

const STATUS_CYCLE = ["PLANNED", "TAUGHT", "SKIPPED"] as const;
type Status = (typeof STATUS_CYCLE)[number];

const STATUS_STYLES: Record<Status, string> = {
  PLANNED: "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
  TAUGHT:
    "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900",
  SKIPPED:
    "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-900",
};

// Each unit gets a stable accent color based on its index in the sorted unit list
const UNIT_COLORS = [
  "border-blue-400 bg-blue-50/40 dark:bg-blue-950/20",
  "border-violet-400 bg-violet-50/40 dark:bg-violet-950/20",
  "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20",
  "border-rose-400 bg-rose-50/40 dark:bg-rose-950/20",
  "border-orange-400 bg-orange-50/40 dark:bg-orange-950/20",
  "border-cyan-400 bg-cyan-50/40 dark:bg-cyan-950/20",
  "border-fuchsia-400 bg-fuchsia-50/40 dark:bg-fuchsia-950/20",
  "border-lime-400 bg-lime-50/40 dark:bg-lime-950/20",
];

const UNIT_BAR_COLORS = [
  "bg-blue-400",
  "bg-violet-400",
  "bg-emerald-400",
  "bg-rose-400",
  "bg-orange-400",
  "bg-cyan-400",
  "bg-fuchsia-400",
  "bg-lime-400",
];

function getUnitColor(index: number) {
  return UNIT_COLORS[index % UNIT_COLORS.length];
}

function getUnitBarColor(index: number) {
  return UNIT_BAR_COLORS[index % UNIT_BAR_COLORS.length];
}

// ─── Add Unit Inline Form ───────────────────────────────────────────────────

interface AddUnitFormProps {
  startWeek: number;
  totalWeeks: number;
  onConfirm: (name: string, endWeek: number) => void;
  onCancel: () => void;
  isPending: boolean;
}

function AddUnitForm({ startWeek, totalWeeks, onConfirm, onCancel, isPending }: AddUnitFormProps) {
  const [name, setName] = useState("");
  const [endWeek, setEndWeek] = useState(startWeek);

  function handleSubmit() {
    if (!name.trim()) return;
    onConfirm(name.trim(), endWeek);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 py-1">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Unit name"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") onCancel();
        }}
        autoFocus
        className="h-7 w-48 text-sm"
      />
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>Ends week</span>
        <Input
          type="number"
          value={endWeek}
          min={startWeek}
          max={totalWeeks}
          onChange={(e) => setEndWeek(Math.max(startWeek, Math.min(totalWeeks, Number(e.target.value))))}
          className="h-7 w-16 text-sm"
        />
      </div>
      <Button size="sm" className="h-7" onClick={handleSubmit} disabled={isPending || !name.trim()}>
        Add
      </Button>
      <Button size="sm" variant="ghost" className="h-7" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

// ─── Add Sub-Unit Inline Form ───────────────────────────────────────────────

interface AddSubUnitFormProps {
  onConfirm: (name: string) => void;
  onCancel: () => void;
  isPending: boolean;
}

function AddSubUnitForm({ onConfirm, onCancel, isPending }: AddSubUnitFormProps) {
  const [name, setName] = useState("");

  return (
    <div className="flex items-center gap-2 py-1">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Lesson name"
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) onConfirm(name.trim());
          if (e.key === "Escape") onCancel();
        }}
        autoFocus
        className="h-7 w-56 text-sm"
      />
      <Button
        size="sm"
        className="h-7"
        onClick={() => name.trim() && onConfirm(name.trim())}
        disabled={isPending || !name.trim()}
      >
        Add
      </Button>
      <Button size="sm" variant="ghost" className="h-7" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

// ─── Inline editable text ───────────────────────────────────────────────────

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
}

function InlineEdit({ value, onSave, className, placeholder }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    setEditing(false);
  }

  if (editing) {
    return (
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        autoFocus
        placeholder={placeholder}
        className={cn("h-7 text-sm", className)}
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          setDraft(value);
          setEditing(true);
        }
      }}
      className={cn("cursor-pointer rounded px-0.5 hover:bg-muted/60", className)}
    >
      {value}
    </span>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function UnitPlanTable({ classId, plan }: UnitPlanTableProps) {
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const deleteUnit = useDeleteUnit();
  const createSubUnit = useCreateSubUnit();
  const updateSubUnit = useUpdateSubUnit();
  const deleteSubUnit = useDeleteSubUnit();

  // Which week's "Add Unit" form is open (null = none)
  const [addingUnitWeek, setAddingUnitWeek] = useState<number | null>(null);
  // Which unit's "Add Lesson" form is open (null = none)
  const [addingSubUnitId, setAddingSubUnitId] = useState<string | null>(null);

  const totalWeeks = plan.totalWeeks ?? 18;

  // Sort units by startWeek, then sortOrder for stable coloring
  const sortedUnits = [...plan.units].sort(
    (a, b) => a.startWeek - b.startWeek || (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );

  // Build a stable color index map: unitId -> index
  const unitColorIndex = new Map<string, number>();
  sortedUnits.forEach((unit, i) => unitColorIndex.set(unit.id, i));

  // Build a map: weekNumber -> units that cover this week
  const weekUnitMap = new Map<number, (Unit & { subUnits: SubUnit[] })[]>();
  for (let w = 1; w <= totalWeeks; w++) {
    weekUnitMap.set(
      w,
      sortedUnits.filter((u) => u.startWeek <= w && u.endWeek >= w)
    );
  }

  // ── Mutation helpers ───────────────────────────────────────────────────────

  function handleAddUnit(startWeek: number, name: string, endWeek: number) {
    const unitsStartingHere = sortedUnits.filter((u) => u.startWeek === startWeek);
    createUnit.mutate(
      {
        classId,
        planId: plan.id,
        name,
        startWeek,
        endWeek,
        sortOrder: unitsStartingHere.length,
      },
      { onSuccess: () => setAddingUnitWeek(null) }
    );
  }

  function handleAddSubUnit(unitId: string, name: string) {
    const unit = plan.units.find((u) => u.id === unitId);
    createSubUnit.mutate(
      {
        classId,
        planId: plan.id,
        unitId,
        name,
        sortOrder: unit?.subUnits.length ?? 0,
      },
      { onSuccess: () => setAddingSubUnitId(null) }
    );
  }

  function cycleStatus(subUnit: SubUnit, unitId: string) {
    const idx = STATUS_CYCLE.indexOf(subUnit.status as Status);
    const nextStatus = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    updateSubUnit.mutate({ classId, planId: plan.id, unitId, subUnitId: subUnit.id, status: nextStatus });
  }

  function handleDeleteUnit(unit: Unit) {
    if (!confirm(`Delete unit "${unit.name}" and all its lessons?`)) return;
    deleteUnit.mutate({ classId, planId: plan.id, unitId: unit.id });
  }

  function handleDeleteSubUnit(unitId: string, subUnit: SubUnit) {
    deleteSubUnit.mutate({ classId, planId: plan.id, unitId, subUnitId: subUnit.id });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const allWeeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  return (
    <div className="rounded-md border overflow-hidden">
      {allWeeks.map((weekNum) => {
        const unitsThisWeek = weekUnitMap.get(weekNum) ?? [];
        const isAddingHere = addingUnitWeek === weekNum;

        return (
          <WeekRow
            key={weekNum}
            weekNum={weekNum}
            units={unitsThisWeek}
            totalWeeks={totalWeeks}
            classId={classId}
            planId={plan.id}
            unitColorIndex={unitColorIndex}
            addingUnitWeek={addingUnitWeek}
            setAddingUnitWeek={setAddingUnitWeek}
            addingSubUnitId={addingSubUnitId}
            setAddingSubUnitId={setAddingSubUnitId}
            isAddingUnit={isAddingHere}
            onAddUnit={(name, endWeek) => handleAddUnit(weekNum, name, endWeek)}
            onAddSubUnit={handleAddSubUnit}
            onCycleStatus={cycleStatus}
            onDeleteUnit={handleDeleteUnit}
            onDeleteSubUnit={handleDeleteSubUnit}
            onUpdateUnit={(unitId, name) =>
              updateUnit.mutate({ classId, planId: plan.id, unitId, name })
            }
            onUpdateSubUnit={(unitId, subUnitId, name) =>
              updateSubUnit.mutate({ classId, planId: plan.id, unitId, subUnitId, name })
            }
            createUnitPending={createUnit.isPending}
            createSubUnitPending={createSubUnit.isPending}
          />
        );
      })}
    </div>
  );
}

// ─── WeekRow ─────────────────────────────────────────────────────────────────

interface WeekRowProps {
  weekNum: number;
  units: (Unit & { subUnits: SubUnit[] })[];
  totalWeeks: number;
  classId: string;
  planId: string;
  unitColorIndex: Map<string, number>;
  addingUnitWeek: number | null;
  setAddingUnitWeek: (w: number | null) => void;
  addingSubUnitId: string | null;
  setAddingSubUnitId: (id: string | null) => void;
  isAddingUnit: boolean;
  onAddUnit: (name: string, endWeek: number) => void;
  onAddSubUnit: (unitId: string, name: string) => void;
  onCycleStatus: (subUnit: SubUnit, unitId: string) => void;
  onDeleteUnit: (unit: Unit) => void;
  onDeleteSubUnit: (unitId: string, subUnit: SubUnit) => void;
  onUpdateUnit: (unitId: string, name: string) => void;
  onUpdateSubUnit: (unitId: string, subUnitId: string, name: string) => void;
  createUnitPending: boolean;
  createSubUnitPending: boolean;
}

function WeekRow({
  weekNum,
  units,
  totalWeeks,
  unitColorIndex,
  setAddingUnitWeek,
  addingSubUnitId,
  setAddingSubUnitId,
  isAddingUnit,
  onAddUnit,
  onAddSubUnit,
  onCycleStatus,
  onDeleteUnit,
  onDeleteSubUnit,
  onUpdateUnit,
  onUpdateSubUnit,
  createUnitPending,
  createSubUnitPending,
}: WeekRowProps) {
  const isEmpty = units.length === 0;

  // Separate units that START this week from units that are continuing (started earlier)
  const startingUnits = units.filter((u) => u.startWeek === weekNum);
  const continuingUnits = units.filter((u) => u.startWeek < weekNum);

  return (
    <div
      className={cn(
        "flex border-b last:border-b-0",
        "min-h-12"
      )}
    >
      {/* Week label column */}
      <div className="flex w-20 shrink-0 items-start justify-center pt-3 text-xs font-medium text-muted-foreground border-r bg-muted/30">
        <span>Wk {weekNum}</span>
      </div>

      {/* Content column */}
      <div className="flex-1 min-w-0">
        {/* Continuing units (started in earlier weeks) — show a thin colored continuation bar */}
        {continuingUnits.map((unit) => {
          const colorIdx = unitColorIndex.get(unit.id) ?? 0;
          const isLast = weekNum === unit.endWeek;
          return (
            <div
              key={`cont-${unit.id}`}
              className={cn(
                "flex items-center gap-2 border-l-4 px-3 py-1 text-xs text-muted-foreground",
                getUnitColor(colorIdx)
              )}
              style={{ borderLeftColor: undefined }}
            >
              <div className={cn("h-3 w-0.5 rounded-full shrink-0", getUnitBarColor(colorIdx))} />
              <span className="italic truncate">{unit.name} (cont.)</span>
              {isLast && (
                <span className="ml-auto text-[10px] text-muted-foreground/60">ends</span>
              )}
            </div>
          );
        })}

        {/* Units starting this week */}
        {startingUnits.map((unit) => {
          const colorIdx = unitColorIndex.get(unit.id) ?? 0;
          const spanLabel =
            unit.endWeek > unit.startWeek ? `Wks ${unit.startWeek}–${unit.endWeek}` : null;
          const isAddingSubHere = addingSubUnitId === unit.id;

          return (
            <div
              key={unit.id}
              className={cn(
                "border-l-4 px-3 py-2",
                getUnitColor(colorIdx)
              )}
            >
              {/* Unit header */}
              <div className="flex items-center gap-2 mb-1">
                <div className={cn("h-4 w-1 rounded-full shrink-0", getUnitBarColor(colorIdx))} />

                <InlineEdit
                  value={unit.name}
                  onSave={(name) => onUpdateUnit(unit.id, name)}
                  className="font-medium text-sm"
                />

                {spanLabel && (
                  <span className="text-[10px] text-muted-foreground bg-muted/60 rounded px-1 py-0.5 ml-1 shrink-0">
                    {spanLabel}
                  </span>
                )}

                <div className="ml-auto flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => onDeleteUnit(unit)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Sub-units list */}
              {unit.subUnits.length > 0 && (
                <ul className="ml-5 space-y-1 mb-1">
                  {unit.subUnits.map((sub) => (
                    <li key={sub.id} className="flex items-center gap-2 group/sub">
                      <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />

                      <InlineEdit
                        value={sub.name}
                        onSave={(name) => onUpdateSubUnit(unit.id, sub.id, name)}
                        className="text-sm flex-1 min-w-0"
                      />

                      <button
                        onClick={() => onCycleStatus(sub, unit.id)}
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0 transition-colors",
                          STATUS_STYLES[sub.status as Status] ?? STATUS_STYLES.PLANNED
                        )}
                        title="Click to cycle status"
                      >
                        {sub.status}
                      </button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 shrink-0 opacity-0 group-hover/sub:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        onClick={() => onDeleteSubUnit(unit.id, sub)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Add lesson form or button */}
              <div className="ml-5">
                {isAddingSubHere ? (
                  <AddSubUnitForm
                    onConfirm={(name) => onAddSubUnit(unit.id, name)}
                    onCancel={() => setAddingSubUnitId(null)}
                    isPending={createSubUnitPending}
                  />
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground hover:text-foreground px-1"
                    onClick={() => setAddingSubUnitId(unit.id)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add lesson
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty week: Add Unit prompt */}
        {isEmpty && (
          <div className="px-3 py-2 flex items-center">
            {isAddingUnit ? (
              <AddUnitForm
                startWeek={weekNum}
                totalWeeks={totalWeeks}
                onConfirm={onAddUnit}
                onCancel={() => setAddingUnitWeek(null)}
                isPending={createUnitPending}
              />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground/60 hover:text-muted-foreground px-2 border border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors"
                onClick={() => setAddingUnitWeek(weekNum)}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add unit
              </Button>
            )}
          </div>
        )}

        {/* Week that has units but is not a start week for any unit — still allow adding a new unit starting here */}
        {!isEmpty && startingUnits.length === 0 && !isAddingUnit && (
          <div className="px-3 py-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground/50 hover:text-muted-foreground px-1"
              onClick={() => setAddingUnitWeek(weekNum)}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add unit starting week {weekNum}
            </Button>
          </div>
        )}

        {/* Add unit form when triggered on a non-empty week */}
        {!isEmpty && isAddingUnit && (
          <div className="px-3 py-2">
            <AddUnitForm
              startWeek={weekNum}
              totalWeeks={totalWeeks}
              onConfirm={onAddUnit}
              onCancel={() => setAddingUnitWeek(null)}
              isPending={createUnitPending}
            />
          </div>
        )}
      </div>
    </div>
  );
}
