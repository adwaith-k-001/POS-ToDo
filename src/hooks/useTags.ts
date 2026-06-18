"use client";
import { useState, useEffect, useCallback } from "react";
import type { TagWithCount } from "@/types";
import type { CreateTagInput, UpdateTagInput } from "@/lib/validations";

export function useTags() {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tags");
      const json = await res.json();
      setTags(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  const createTag = async (input: CreateTagInput) => {
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    await fetchTags();
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
    await fetchTags();
    return json.data;
  };

  const deleteTag = async (id: string) => {
    await fetch(`/api/tags/${id}`, { method: "DELETE" });
    await fetchTags();
  };

  return { tags, loading, refetch: fetchTags, createTag, updateTag, deleteTag };
}
