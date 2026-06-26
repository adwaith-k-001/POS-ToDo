"use client";
import { useState, useEffect, useCallback } from "react";
import type { AreaWithCount, TagWithCount } from "@/types";

export function useFormData() {
  const [areas, setAreas] = useState<AreaWithCount[]>([]);
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFormData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/context");
      const json = await res.json();
      setAreas(json.areas ?? []);
      setTags(json.tags ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFormData(); }, [fetchFormData]);

  return { areas, tags, loading };
}
