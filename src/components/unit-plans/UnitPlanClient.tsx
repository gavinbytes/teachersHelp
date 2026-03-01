"use client";

import { useState } from "react";
import { useUnitPlans, useDeleteUnitPlan } from "@/hooks/useUnitPlans";
import { useClass } from "@/hooks/useClasses";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateUnitPlanDialog } from "./CreateUnitPlanDialog";
import { UnitPlanTable } from "./UnitPlanTable";
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";

interface UnitPlanClientProps {
  classId: string;
}

export function UnitPlanClient({ classId }: UnitPlanClientProps) {
  const { data: cls } = useClass(classId);
  const { data: plans, isLoading } = useUnitPlans(classId);
  const deletePlan = useDeleteUnitPlan();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  // Auto-expand first plan
  if (plans?.length && expandedPlan === null) {
    setExpandedPlan(plans[0].id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/classes/${classId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Unit Plans</h1>
          {cls && <p className="text-sm text-muted-foreground">{cls.name}</p>}
        </div>
        <div className="ml-auto">
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Plan
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : plans?.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No unit plans yet. Create one to start organizing your curriculum.
            </p>
          </CardContent>
        </Card>
      ) : (
        plans?.map((plan) => (
          <Card key={plan.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <button
                  className="flex items-center gap-2"
                  onClick={() =>
                    setExpandedPlan(expandedPlan === plan.id ? null : plan.id)
                  }
                >
                  {expandedPlan === plan.id ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <span className="text-sm text-muted-foreground">
                    ({plan.units.length} unit{plan.units.length !== 1 ? "s" : ""})
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Delete "${plan.name}"? This cannot be undone.`)) {
                      deletePlan.mutate({ classId, planId: plan.id });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            {expandedPlan === plan.id && (
              <CardContent>
                <UnitPlanTable classId={classId} plan={plan} />
              </CardContent>
            )}
          </Card>
        ))
      )}

      <CreateUnitPlanDialog
        classId={classId}
        open={showCreate}
        onOpenChange={setShowCreate}
      />
    </div>
  );
}
