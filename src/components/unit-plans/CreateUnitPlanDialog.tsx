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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    await createPlan.mutateAsync({ classId, name: name.trim() });
    setName("");
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
          <Button type="submit" className="w-full" disabled={createPlan.isPending}>
            {createPlan.isPending ? "Creating..." : "Create Plan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
