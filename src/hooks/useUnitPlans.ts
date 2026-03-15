"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { UnitPlanWithUnits } from "@/types";

export function useUnitPlans(classId: string) {
  return useQuery<UnitPlanWithUnits[]>({
    queryKey: ["unit-plans", classId],
    queryFn: async () => {
      const res = await fetch(`/api/classes/${classId}/unit-plans`);
      if (!res.ok) throw new Error("Failed to fetch unit plans");
      return res.json();
    },
    enabled: !!classId,
  });
}

export function useUnitPlan(classId: string, planId: string) {
  return useQuery<UnitPlanWithUnits>({
    queryKey: ["unit-plans", classId, planId],
    queryFn: async () => {
      const res = await fetch(`/api/classes/${classId}/unit-plans/${planId}`);
      if (!res.ok) throw new Error("Failed to fetch unit plan");
      return res.json();
    },
    enabled: !!classId && !!planId,
  });
}

export function useCreateUnitPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, name, weeks }: { classId: string; name: string; weeks?: number }) => {
      const res = await fetch(`/api/classes/${classId}/unit-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, weeks }),
      });
      if (!res.ok) throw new Error("Failed to create unit plan");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["unit-plans", variables.classId] });
      toast.success("Unit plan created");
    },
    onError: () => toast.error("Failed to create unit plan"),
  });
}

export function useDeleteUnitPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, planId }: { classId: string; planId: string }) => {
      const res = await fetch(`/api/classes/${classId}/unit-plans/${planId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete unit plan");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["unit-plans", variables.classId] });
      toast.success("Unit plan deleted");
    },
    onError: () => toast.error("Failed to delete unit plan"),
  });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      classId,
      planId,
      name,
      startWeek,
      endWeek,
      sortOrder,
    }: {
      classId: string;
      planId: string;
      name: string;
      startWeek: number;
      endWeek: number;
      sortOrder: number;
    }) => {
      const res = await fetch(`/api/classes/${classId}/unit-plans/${planId}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, startWeek, endWeek, sortOrder }),
      });
      if (!res.ok) throw new Error("Failed to create unit");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["unit-plans", variables.classId] });
      toast.success("Unit added");
    },
    onError: () => toast.error("Failed to add unit"),
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      classId,
      planId,
      unitId,
      ...data
    }: {
      classId: string;
      planId: string;
      unitId: string;
      name?: string;
      startWeek?: number;
      endWeek?: number;
      sortOrder?: number;
    }) => {
      const res = await fetch(`/api/classes/${classId}/unit-plans/${planId}/units/${unitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update unit");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["unit-plans", variables.classId] });
    },
    onError: () => toast.error("Failed to update unit"),
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      classId,
      planId,
      unitId,
    }: {
      classId: string;
      planId: string;
      unitId: string;
    }) => {
      const res = await fetch(`/api/classes/${classId}/unit-plans/${planId}/units/${unitId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete unit");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["unit-plans", variables.classId] });
      toast.success("Unit deleted");
    },
    onError: () => toast.error("Failed to delete unit"),
  });
}

export function useCreateSubUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      classId,
      planId,
      unitId,
      name,
      sortOrder,
    }: {
      classId: string;
      planId: string;
      unitId: string;
      name: string;
      sortOrder: number;
    }) => {
      const res = await fetch(
        `/api/classes/${classId}/unit-plans/${planId}/units/${unitId}/sub-units`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, sortOrder }),
        }
      );
      if (!res.ok) throw new Error("Failed to create sub-unit");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["unit-plans", variables.classId] });
      toast.success("Sub-unit added");
    },
    onError: () => toast.error("Failed to add sub-unit"),
  });
}

export function useUpdateSubUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      classId,
      planId,
      unitId,
      subUnitId,
      ...data
    }: {
      classId: string;
      planId: string;
      unitId: string;
      subUnitId: string;
      name?: string;
      sortOrder?: number;
      status?: "PLANNED" | "TAUGHT" | "SKIPPED";
    }) => {
      const res = await fetch(
        `/api/classes/${classId}/unit-plans/${planId}/units/${unitId}/sub-units/${subUnitId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error("Failed to update sub-unit");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["unit-plans", variables.classId] });
    },
    onError: () => toast.error("Failed to update sub-unit"),
  });
}

export function useDeleteSubUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      classId,
      planId,
      unitId,
      subUnitId,
    }: {
      classId: string;
      planId: string;
      unitId: string;
      subUnitId: string;
    }) => {
      const res = await fetch(
        `/api/classes/${classId}/unit-plans/${planId}/units/${unitId}/sub-units/${subUnitId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete sub-unit");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["unit-plans", variables.classId] });
      toast.success("Sub-unit deleted");
    },
    onError: () => toast.error("Failed to delete sub-unit"),
  });
}
