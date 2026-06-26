"use client";
import { SWRConfig } from "swr";

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        // Don't refetch when the user switches browser tabs — they're the only user.
        revalidateOnFocus: false,
        // Retry failed requests once before giving up.
        errorRetryCount: 1,
      }}
    >
      {children}
    </SWRConfig>
  );
}
