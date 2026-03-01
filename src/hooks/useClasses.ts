"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ClassWithSchedule, ClassWithDetails } from "@/types";

export function useClasses() {
  return useQuery<ClassWithSchedule[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const res = await fetch("/api/classes");
      if (!res.ok) throw new Error("Failed to fetch classes");
      return res.json();
    },
  });
}

export function useClass(id: string) {
  return useQuery<ClassWithDetails>({
    queryKey: ["classes", id],
    queryFn: async () => {
      const res = await fetch(`/api/classes/${id}`);
      if (!res.ok) throw new Error("Failed to fetch class");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; subject: string; color?: string; room?: string; startDate?: string; endDate?: string; schedules?: { dayOfWeek: number; startTime: string; endTime: string }[] }) => {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Create class error:", errorText);
        throw new Error(errorText || "Failed to create class");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class created");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to create class"),
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; subject?: string; color?: string; room?: string; startDate?: string; endDate?: string }) => {
      const res = await fetch(`/api/classes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update class");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["classes", variables.id] });
      toast.success("Class updated");
    },
    onError: () => toast.error("Failed to update class"),
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/classes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete class");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class deleted");
    },
    onError: () => toast.error("Failed to delete class"),
  });
}

export function useAddSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, ...data }: { classId: string; dayOfWeek: number; startTime: string; endTime: string }) => {
      const res = await fetch(`/api/classes/${classId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add schedule");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["classes", variables.classId] });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, scheduleId }: { classId: string; scheduleId: string }) => {
      const res = await fetch(`/api/classes/${classId}/schedule`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: scheduleId }),
      });
      if (!res.ok) throw new Error("Failed to delete schedule");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["classes", variables.classId] });
    },
  });
}
