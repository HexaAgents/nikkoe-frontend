import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Prefetch the next `count` pages in the background so pagination feels instant.
 * Relies on React Query's built-in deduplication — won't re-fetch pages already cached.
 */
export function usePrefetchPages(
  queryKeyBase: unknown[],
  buildQueryFn: (page: number) => () => Promise<unknown>,
  currentPage: number,
  totalPages: number,
  count = 5,
) {
  const qc = useQueryClient();

  useEffect(() => {
    if (totalPages <= 1) return;
    const end = Math.min(currentPage + count, totalPages);
    for (let p = currentPage + 1; p <= end; p++) {
      qc.prefetchQuery({
        queryKey: [...queryKeyBase, { page: p }],
        queryFn: buildQueryFn(p),
        staleTime: 30_000,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, totalPages]);
}
