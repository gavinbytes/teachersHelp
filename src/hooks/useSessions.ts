"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { WeekSessionsData, ClassSessionWithDetails } from "@/types";

export function useWeekSessions(weekStart: string) {
  return useQuery<WeekSessionsData>({
    queryKey: ["sessions", { weekStart }],
    queryFn: async () => {
      const res = await fetch(`/api/sessions?weekStart=${weekStart}`);
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    },
  });
}

export function useToggleSessionTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      taskId,
      completed,
    }: {
      sessionId: string;
      taskId: string;
      completed: boolean;
    }) => {
      const res = await fetch(`/api/sessions/${sessionId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error("Failed to toggle task");
      return res.json();
    },
    onMutate: async ({ sessionId, taskId, completed }) => {
      await queryClient.cancelQueries({ queryKey: ["sessions"] });
      const queries = queryClient.getQueriesData<WeekSessionsData>({
        queryKey: ["sessions"],
      });
      queries.forEach(([key, data]) => {
        if (data?.sessions) {
          queryClient.setQueryData(key, {
            ...data,
            sessions: data.sessions.map((s: ClassSessionWithDetails) =>
              s.id === sessionId
                ? {
                    ...s,
                    tasks: s.tasks.map((t) =>
                      t.id === taskId ? { ...t, completed } : t
                    ),
                  }
                : s
            ),
          });
        }
      });
      return { queries };
    },
    onError: (_, __, context) => {
      context?.queries.forEach(([key, data]) => {
        if (data) queryClient.setQueryData(key, data);
      });
      toast.error("Failed to update task");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useAddSessionTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      title,
    }: {
      sessionId: string;
      title: string;
    }) => {
      const res = await fetch(`/api/sessions/${sessionId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to add task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: () => toast.error("Failed to add task"),
  });
}

export function useDeleteSessionTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      taskId,
    }: {
      sessionId: string;
      taskId: string;
    }) => {
      const res = await fetch(`/api/sessions/${sessionId}/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete task");
    },
    onMutate: async ({ sessionId, taskId }) => {
      await queryClient.cancelQueries({ queryKey: ["sessions"] });
      const queries = queryClient.getQueriesData<WeekSessionsData>({
        queryKey: ["sessions"],
      });
      queries.forEach(([key, data]) => {
        if (data?.sessions) {
          queryClient.setQueryData(key, {
            ...data,
            sessions: data.sessions.map((s: ClassSessionWithDetails) =>
              s.id === sessionId
                ? { ...s, tasks: s.tasks.filter((t) => t.id !== taskId) }
                : s
            ),
          });
        }
      });
      return { queries };
    },
    onError: (_, __, context) => {
      context?.queries.forEach(([key, data]) => {
        if (data) queryClient.setQueryData(key, data);
      });
      toast.error("Failed to delete task");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}
