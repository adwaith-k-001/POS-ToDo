"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { AreaWithCount } from "@/types";
import type { CreateAreaInput, UpdateAreaInput } from "@/lib/validations";

export function useAreas() {
  const { data, isLoading, mutate } = useSWR<{ data: AreaWithCount[] }>(
    "/api/areas",
    fetcher
  );

  const areas = data?.data ?? [];

  const createArea = async (input: CreateAreaInput) => {
    const res = await fetch("/api/areas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    mutate();
    return json.data;
  };

  const updateArea = async (id: string, input: UpdateAreaInput) => {
    const res = await fetch(`/api/areas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    mutate();
    return json.data;
  };

  const deleteArea = async (id: string) => {
    await fetch(`/api/areas/${id}`, { method: "DELETE" });
    mutate();
  };

  return { areas, loading: isLoading, refetch: () => mutate(), createArea, updateArea, deleteArea };
}
