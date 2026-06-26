"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { TaskWithRelations } from "@/types";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validations";

interface UseTasksOptions {
  status?: string[];
  areaId?: string;
  tagId?: string;
  goalId?: string;
  search?: string;
  inbox?: boolean;
  includeArchived?: boolean;
  dueBefore?: Date;
  dueAfter?: Date;
}

function buildTasksUrl(options: UseTasksOptions) {
  const params = new URLSearchParams();
  options.status?.forEach((s) => params.append("status", s));
  if (options.areaId) params.set("areaId", options.areaId);
  if (options.tagId) params.set("tagId", options.tagId);
  if (options.goalId) params.set("goalId", options.goalId);
  if (options.search) params.set("search", options.search);
  if (options.inbox) params.set("inbox", "true");
  if (options.includeArchived) params.set("includeArchived", "true");
  if (options.dueBefore) params.set("dueBefore", options.dueBefore.toISOString());
  if (options.dueAfter) params.set("dueAfter", options.dueAfter.toISOString());
  return `/api/tasks?${params.toString()}`;
}

export function useTasks(options: UseTasksOptions = {}) {
  const url = buildTasksUrl(options);

  const { data, error, isLoading, mutate } = useSWR<{ data: TaskWithRelations[] }>(
    url,
    fetcher,
    { keepPreviousData: true }
  );

  const tasks = data?.data ?? [];

  const createTask = async (input: CreateTaskInput) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    mutate(); // background revalidation — no loading state shown
    return json.data as TaskWithRelations;
  };

  const updateTask = async (id: string, input: UpdateTaskInput) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    mutate();
    return json.data as TaskWithRelations;
  };

  const archiveTask = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to archive task");
    mutate();
  };

  const permanentlyDeleteTask = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}?permanent=true`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete task");
    mutate();
  };

  return {
    tasks,
    loading: isLoading,
    error: error?.message ?? null,
    refetch: () => mutate(),
    createTask,
    updateTask,
    archiveTask,
    permanentlyDeleteTask,
    /** @deprecated use archiveTask */ deleteTask: archiveTask,
  };
}
