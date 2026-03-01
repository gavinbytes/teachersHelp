"use client";

import { use } from "react";
import { UnitPlanClient } from "@/components/unit-plans/UnitPlanClient";

export default function UnitPlansPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <UnitPlanClient classId={id} />;
}
