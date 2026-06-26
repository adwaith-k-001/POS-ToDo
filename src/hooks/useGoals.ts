"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { GoalWithTasks } from "@/types";

export function useGoals() {
  const { data, isLoading, mutate } = useSWR<{ data: GoalWithTasks[] }>(
    "/api/goals",
    fetcher
  );

  const goals = data?.data ?? [];

  const createGoal = async (input: {
    title: string;
    description?: string;
    color?: string;
    icon?: string;
    targetDate?: string | null;
  }) => {
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    mutate();
    return json.data as GoalWithTasks;
  };

  const updateGoal = async (
    id: string,
    input: Partial<{ title: string; description: string; color: string; status: string; targetDate: string | null }>
  ) => {
    const res = await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    mutate();
    return json.data as GoalWithTasks;
  };

  const deleteGoal = async (id: string) => {
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    mutate();
  };

  return { goals, loading: isLoading, refetch: () => mutate(), createGoal, updateGoal, deleteGoal };
}
