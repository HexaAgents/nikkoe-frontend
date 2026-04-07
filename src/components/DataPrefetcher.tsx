import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { prefetchAppData } from "@/lib/prefetch";

export function DataPrefetcher() {
  const { session } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (session) {
      prefetchAppData(qc);
    }
  }, [session, qc]);

  return null;
}
