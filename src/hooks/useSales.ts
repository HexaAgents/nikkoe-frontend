import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface SaleLineInput {
  item_id: string;
  location_id: string;
  quantity: number;
  unit_price: number;
  currency_code: string;
}

export function useSales() {
  return useQuery({
    queryKey: ["sales"],
    queryFn: () => api.get<any[]>("/sales"),
  });
}

export function useSale(saleId: string) {
  return useQuery({
    queryKey: ["sales", saleId],
    queryFn: () => api.get(`/sales/${saleId}`),
    enabled: !!saleId,
  });
}

export function useSaleLines(saleId: string) {
  return useQuery({
    queryKey: ["sale_lines", saleId],
    queryFn: () => api.get<any[]>(`/sales/${saleId}/lines`),
    enabled: !!saleId,
  });
}

export function useAddSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sale, lines }: { sale: Record<string, unknown>; lines: SaleLineInput[] }) => {
      return api.post("/sales", { sale, lines });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_balances"] });
      toast.success("Sale added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add sale: ${error.message}`);
    },
  });
}

export function useVoidSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ saleId, reason }: { saleId: string; voidedBy?: string; reason?: string }) => {
      return api.post(`/sales/${saleId}/void`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Sale voided successfully");
    },
    onError: (error) => {
      toast.error(`Failed to void sale: ${error.message}`);
    },
  });
}
