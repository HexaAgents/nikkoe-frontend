import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useInventoryOnHand() {
  return useQuery({
    queryKey: ["inventory_on_hand"],
    queryFn: () => api.get<any[]>("/inventory/on-hand"),
  });
}
