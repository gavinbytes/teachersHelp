"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { GradebookData, GradeUpdate } from "@/types";

export function useGradebook(classId: string) {
  return useQuery<GradebookData>({
    queryKey: ["gradebook", classId],
    queryFn: async () => {
      const res = await fetch(`/api/classes/${classId}/grades`);
      if (!res.ok) throw new Error("Failed to fetch gradebook");
      return res.json();
    },
    enabled: !!classId,
  });
}

export function useUpdateGrades() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, grades }: { classId: string; grades: GradeUpdate[] }) => {
      const res = await fetch(`/api/classes/${classId}/grades`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grades }),
      });
      if (!res.ok) throw new Error("Failed to update grades");
      return res.json();
    },
    onMutate: async ({ classId, grades: updates }) => {
      await queryClient.cancelQueries({ queryKey: ["gradebook", classId] });
      const previous = queryClient.getQueryData<GradebookData>(["gradebook", classId]);
      if (previous) {
        const newGrades = [...previous.grades];
        for (const update of updates) {
          const idx = newGrades.findIndex(
            (g) => g.studentId === update.studentId && g.assignmentId === update.assignmentId
          );
          if (idx >= 0) {
            newGrades[idx] = { ...newGrades[idx], score: update.score };
          } else {
            newGrades.push({
              id: `temp-${Date.now()}-${Math.random()}`,
              score: update.score,
              status: (update.status as "GRADED") || "GRADED",
              studentId: update.studentId,
              assignmentId: update.assignmentId,
              createdAt: new Date() as unknown as Date,
              updatedAt: new Date() as unknown as Date,
            });
          }
        }
        queryClient.setQueryData(["gradebook", classId], { ...previous, grades: newGrades });
      }
      return { previous };
    },
    onError: (_, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["gradebook", variables.classId], context.previous);
      }
      toast.error("Failed to save grades");
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ["gradebook", variables.classId] });
    },
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, ...data }: { classId: string; name: string; type: string; points: number; dueDate?: string; categoryId?: string }) => {
      const res = await fetch(`/api/classes/${classId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create assignment");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["gradebook", variables.classId] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Assignment added");
    },
    onError: () => toast.error("Failed to create assignment"),
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, assignmentId }: { classId: string; assignmentId: string }) => {
      const res = await fetch(`/api/classes/${classId}/assignments/${assignmentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete assignment");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["gradebook", variables.classId] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Assignment deleted");
    },
    onError: () => toast.error("Failed to delete assignment"),
  });
}

export function useUpdateCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, categories }: { classId: string; categories: { id: string; weight: number }[] }) => {
      const res = await fetch(`/api/classes/${classId}/categories`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to update weights");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["gradebook", variables.classId] });
      toast.success("Category weights updated");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update weights"),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, ...data }: { classId: string; name: string; weight: number }) => {
      const res = await fetch(`/api/classes/${classId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create category");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["gradebook", variables.classId] });
      toast.success("Category created");
    },
    onError: () => toast.error("Failed to create category"),
  });
}
