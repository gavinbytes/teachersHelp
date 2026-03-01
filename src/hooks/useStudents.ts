"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Student } from "@/types";

export function useStudents(classId: string) {
  return useQuery<Student[]>({
    queryKey: ["students", classId],
    queryFn: async () => {
      const res = await fetch(`/api/classes/${classId}/students`);
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
    enabled: !!classId,
  });
}

export function useAddStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, ...data }: { classId: string; student_name: string; email?: string }) => {
      const res = await fetch(`/api/classes/${classId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add student");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["students", variables.classId] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Student added");
    },
    onError: () => toast.error("Failed to add student"),
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, studentId, ...data }: { classId: string; studentId: string; student_name?: string; email?: string }) => {
      const res = await fetch(`/api/classes/${classId}/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update student");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["students", variables.classId] });
      toast.success("Student updated");
    },
    onError: () => toast.error("Failed to update student"),
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, studentId }: { classId: string; studentId: string }) => {
      const res = await fetch(`/api/classes/${classId}/students/${studentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete student");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["students", variables.classId] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Student removed");
    },
    onError: () => toast.error("Failed to delete student"),
  });
}
