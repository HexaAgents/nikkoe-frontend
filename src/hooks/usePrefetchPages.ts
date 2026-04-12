import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Prefetch the next `count` pages in the background so pagination feels instant.
 * Relies on React Query's built-in deduplication — won't re-fetch pages already cached.
 * On mobile, prefetches only 1 page to save bandwidth on cellular.
 */
export function usePrefetchPages(
  queryKeyBase: unknown[],
  buildQueryFn: (page: number) => () => Promise<unknown>,
  currentPage: number,
  totalPages: number,
  count = 5,
) {
  const qc = useQueryClient();
  const isMobile = useIsMobile();
  const effectiveCount = isMobile ? 1 : count;

  useEffect(() => {
    if (totalPages <= 1) return;
    const end = Math.min(currentPage + effectiveCount, totalPages);
    for (let p = currentPage + 1; p <= end; p++) {
      qc.prefetchQuery({
        queryKey: [...queryKeyBase, { page: p }],
        queryFn: buildQueryFn(p),
        staleTime: 30_000,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, totalPages, effectiveCount]);
}
