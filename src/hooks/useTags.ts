"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { TagWithCount } from "@/types";
import type { CreateTagInput, UpdateTagInput } from "@/lib/validations";

export function useTags() {
  const { data, isLoading, mutate } = useSWR<{ data: TagWithCount[] }>(
    "/api/tags",
    fetcher
  );

  const tags = data?.data ?? [];

  const createTag = async (input: CreateTagInput) => {
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    mutate();
    return json.data;
  };

  const updateTag = async (id: string, input: UpdateTagInput) => {
    const res = await fetch(`/api/tags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    mutate();
    return json.data;
  };

  const deleteTag = async (id: string) => {
    await fetch(`/api/tags/${id}`, { method: "DELETE" });
    mutate();
  };

  return { tags, loading: isLoading, refetch: () => mutate(), createTag, updateTag, deleteTag };
}
