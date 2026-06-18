"use client";
import { useState, useEffect, useCallback } from "react";
import type { GoalWithTasks } from "@/types";

export function useGoals() {
  const [goals, setGoals] = useState<GoalWithTasks[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/goals");
      const json = await res.json();
      setGoals(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const createGoal = async (input: { title: string; description?: string; color?: string; icon?: string; targetDate?: string | null }) => {
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    await fetchGoals();
    return json.data as GoalWithTasks;
  };

  const updateGoal = async (id: string, input: Partial<{ title: string; description: string; color: string; status: string; targetDate: string | null }>) => {
    const res = await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    await fetchGoals();
    return json.data as GoalWithTasks;
  };

  const deleteGoal = async (id: string) => {
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    await fetchGoals();
  };

  return { goals, loading, refetch: fetchGoals, createGoal, updateGoal, deleteGoal };
}
