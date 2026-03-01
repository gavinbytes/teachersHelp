"use client";

import { useCreateAssignment } from "@/hooks/useGradebook";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AssignmentCategory } from "@/types";

interface AddAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  categories: AssignmentCategory[];
}

export function AddAssignmentDialog({
  open,
  onOpenChange,
  classId,
  categories,
}: AddAssignmentDialogProps) {
  const createAssignment = useCreateAssignment();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createAssignment.mutateAsync({
      classId,
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      points: Number(formData.get("points")),
      dueDate: (formData.get("dueDate") as string) || undefined,
      categoryId: (formData.get("categoryId") as string) || undefined,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Assignment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Homework 3" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue="HOMEWORK">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOMEWORK">Homework</SelectItem>
                  <SelectItem value="QUIZ">Quiz</SelectItem>
                  <SelectItem value="TEST">Test</SelectItem>
                  <SelectItem value="PROJECT">Project</SelectItem>
                  <SelectItem value="PARTICIPATION">Participation</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="points">Points</Label>
              <Input id="points" name="points" type="number" defaultValue={100} min={1} required />
            </div>
          </div>
          {categories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select name="categoryId">
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} ({cat.weight}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (optional)</Label>
            <Input id="dueDate" name="dueDate" type="date" />
          </div>
          <Button type="submit" className="w-full" disabled={createAssignment.isPending}>
            {createAssignment.isPending ? "Adding..." : "Add Assignment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
