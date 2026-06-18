"use client";
import { useState, useEffect, useCallback } from "react";
import type { AreaWithCount } from "@/types";
import type { CreateAreaInput, UpdateAreaInput } from "@/lib/validations";

export function useAreas() {
  const [areas, setAreas] = useState<AreaWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAreas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/areas");
      const json = await res.json();
      setAreas(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAreas(); }, [fetchAreas]);

  const createArea = async (input: CreateAreaInput) => {
    const res = await fetch("/api/areas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    await fetchAreas();
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
    await fetchAreas();
    return json.data;
  };

  const deleteArea = async (id: string) => {
    await fetch(`/api/areas/${id}`, { method: "DELETE" });
    await fetchAreas();
  };

  return { areas, loading, refetch: fetchAreas, createArea, updateArea, deleteArea };
}
