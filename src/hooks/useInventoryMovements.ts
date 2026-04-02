import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useInventoryMovements() {
  return useQuery({
    queryKey: ["inventory_movements"],
    queryFn: () => api.get<any[]>("/inventory/movements"),
  });
}
