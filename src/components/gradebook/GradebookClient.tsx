"use client";

import { useState } from "react";
import { useGradebook } from "@/hooks/useGradebook";
import { GradeGrid } from "./GradeGrid";
import { CategoryWeights } from "./CategoryWeights";
import { AddAssignmentDialog } from "./AddAssignmentDialog";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";

interface GradebookClientProps {
  classId: string;
}

export function GradebookClient({ classId }: GradebookClientProps) {
  const { data, isLoading } = useGradebook(classId);
  const [showWeights, setShowWeights] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-lg bg-muted" />;
  }

  if (!data) return <p>Failed to load gradebook</p>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowAddAssignment(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Assignment
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowWeights(!showWeights)}>
          <Settings className="mr-2 h-4 w-4" />
          Category Weights
        </Button>
      </div>

      {showWeights && (
        <CategoryWeights classId={classId} categories={data.categories} />
      )}

      <GradeGrid data={data} classId={classId} />

      <AddAssignmentDialog
        open={showAddAssignment}
        onOpenChange={setShowAddAssignment}
        classId={classId}
        categories={data.categories}
      />
    </div>
  );
}
