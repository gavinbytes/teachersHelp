"use client";

import { useState } from "react";
import { useClasses } from "@/hooks/useClasses";
import { ClassCard } from "./ClassCard";
import { ClassForm } from "./ClassForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function ClassListClient() {
  const { data: classes, isLoading } = useClasses();
  const [showForm, setShowForm] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Classes</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Classes</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </div>
      {classes && classes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No classes yet. Create your first class!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes?.map((cls) => <ClassCard key={cls.id} cls={cls} />)}
        </div>
      )}
      <ClassForm open={showForm} onOpenChange={setShowForm} />
    </div>
  );
}
