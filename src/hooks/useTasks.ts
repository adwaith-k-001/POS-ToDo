"use client";
import { useState, useEffect, useCallback } from "react";
import type { TaskWithRelations } from "@/types";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validations";

interface UseTasksOptions {
  status?: string[];
  areaId?: string;
  tagId?: string;
  search?: string;
  inbox?: boolean;
  includeArchived?: boolean;
}

export function useTasks(options: UseTasksOptions = {}) {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    options.status?.forEach((s) => params.append("status", s));
    if (options.areaId) params.set("areaId", options.areaId);
    if (options.tagId) params.set("tagId", options.tagId);
    if (options.search) params.set("search", options.search);
    if (options.inbox) params.set("inbox", "true");
    if (options.includeArchived) params.set("includeArchived", "true");
    return `/api/tasks?${params.toString()}`;
  }, [options.status?.join(), options.areaId, options.tagId, options.search, options.inbox, options.includeArchived]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildUrl());
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setTasks(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const createTask = async (input: CreateTaskInput) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    await fetchTasks();
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
    await fetchTasks();
    return json.data as TaskWithRelations;
  };

  const archiveTask = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to archive task");
    await fetchTasks();
  };

  const permanentlyDeleteTask = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}?permanent=true`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete task");
    await fetchTasks();
  };

  return { tasks, loading, error, refetch: fetchTasks, createTask, updateTask, archiveTask, permanentlyDeleteTask,
    /** @deprecated use archiveTask */ deleteTask: archiveTask };
}
