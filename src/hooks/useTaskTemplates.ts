"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { SessionTaskTemplate } from "@/types";

export function useTaskTemplates(classId: string) {
  return useQuery<SessionTaskTemplate[]>({
    queryKey: ["task-templates", classId],
    queryFn: async () => {
      const res = await fetch(`/api/classes/${classId}/task-templates`);
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });
}

export function useCreateTaskTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      classId,
      title,
      isDefault,
    }: {
      classId: string;
      title: string;
      isDefault?: boolean;
    }) => {
      const res = await fetch(`/api/classes/${classId}/task-templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, isDefault }),
      });
      if (!res.ok) throw new Error("Failed to create template");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["task-templates", variables.classId],
      });
      toast.success("Template created");
    },
    onError: () => toast.error("Failed to create template"),
  });
}

export function useUpdateTaskTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      classId,
      templateId,
      ...data
    }: {
      classId: string;
      templateId: string;
      title?: string;
      isDefault?: boolean;
      sortOrder?: number;
    }) => {
      const res = await fetch(
        `/api/classes/${classId}/task-templates/${templateId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error("Failed to update template");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["task-templates", variables.classId],
      });
    },
    onError: () => toast.error("Failed to update template"),
  });
}

export function useDeleteTaskTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      classId,
      templateId,
    }: {
      classId: string;
      templateId: string;
    }) => {
      const res = await fetch(
        `/api/classes/${classId}/task-templates/${templateId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete template");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["task-templates", variables.classId],
      });
      toast.success("Template deleted");
    },
    onError: () => toast.error("Failed to delete template"),
  });
}
