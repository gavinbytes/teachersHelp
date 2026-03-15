"use client";

import { useState } from "react";
import { useCreateUnitPlan } from "@/hooks/useUnitPlans";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateUnitPlanDialogProps {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUnitPlanDialog({
  classId,
  open,
  onOpenChange,
}: CreateUnitPlanDialogProps) {
  const createPlan = useCreateUnitPlan();
  const [name, setName] = useState("");
  const [weeks, setWeeks] = useState(18);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    await createPlan.mutateAsync({ classId, name: name.trim(), weeks });
    setName("");
    setWeeks(18);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Unit Plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="planName">Plan Name</Label>
            <Input
              id="planName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fall 2026 Curriculum"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="planWeeks">Weeks in Term</Label>
            <Input
              id="planWeeks"
              type="number"
              value={weeks}
              min={1}
              max={52}
              onChange={(e) => setWeeks(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              How many weeks is this term/semester? You can adjust later.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={createPlan.isPending}>
            {createPlan.isPending ? "Creating..." : "Create Plan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
