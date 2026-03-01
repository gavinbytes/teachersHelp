"use client";

import { useState } from "react";
import { useUpdateCategories } from "@/hooks/useGradebook";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AssignmentCategory } from "@/types";

interface CategoryWeightsProps {
  classId: string;
  categories: AssignmentCategory[];
}

export function CategoryWeights({ classId, categories }: CategoryWeightsProps) {
  const [weights, setWeights] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const cat of categories) map[cat.id] = cat.weight;
    return map;
  });
  const updateCategories = useUpdateCategories();

  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const isValid = Math.abs(total - 100) < 0.01;

  function handleSave() {
    updateCategories.mutate({
      classId,
      categories: Object.entries(weights).map(([id, weight]) => ({ id, weight })),
    });
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">No categories yet. Add an assignment with a category first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Category Weights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-3">
            <span className="w-32 text-sm">{cat.name}</span>
            <Input
              type="number"
              min={0}
              max={100}
              value={weights[cat.id] ?? 0}
              onChange={(e) =>
                setWeights((prev) => ({
                  ...prev,
                  [cat.id]: Number(e.target.value),
                }))
              }
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className={`text-sm font-medium ${isValid ? "text-green-600" : "text-red-600"}`}>
            Total: {total}%
          </span>
          <Button size="sm" onClick={handleSave} disabled={!isValid || updateCategories.isPending}>
            {updateCategories.isPending ? "Saving..." : "Save Weights"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
