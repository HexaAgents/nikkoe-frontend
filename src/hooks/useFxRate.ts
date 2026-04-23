import { useQuery } from "@tanstack/react-query";
import { fetchGbpRate, type IsoCurrency } from "@/lib/fx";

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Live FX rate converting 1 unit of `from` into GBP.
 *
 * Disabled when `from` is null or "GBP" (caller gets a static rate of 1
 * with no network activity). Rates are cached for 60 minutes — ECB only
 * publishes once per business day, so refetching more often wastes cycles.
 *
 * Failures bubble as `error`; callers should let the user edit the rate
 * manually when `error` is set.
 */
export function useFxRate(from: IsoCurrency | null) {
  const query = useQuery({
    queryKey: ["fx-rate", from],
    queryFn: () => fetchGbpRate(from as IsoCurrency),
    enabled: from !== null && from !== "GBP",
    staleTime: ONE_HOUR_MS,
    gcTime: ONE_HOUR_MS,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    rate: from === "GBP" ? 1 : query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
