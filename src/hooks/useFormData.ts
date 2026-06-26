"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { AreaWithCount, TagWithCount } from "@/types";

export function useFormData() {
  const { data, isLoading } = useSWR<{ areas: AreaWithCount[]; tags: TagWithCount[] }>(
    "/api/context",
    fetcher
  );

  return {
    areas: data?.areas ?? [],
    tags: data?.tags ?? [],
    loading: isLoading,
  };
}
