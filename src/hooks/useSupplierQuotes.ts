import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface SupplierQuoteInput {
  item_id: string;
  supplier_id: string;
  unit_cost: number;
  currency: string;
  quoted_at?: string;
  note?: string;
}

export function useAddSupplierQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quote: SupplierQuoteInput) => api.post("/supplier-quotes", quote),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["supplier_quotes", variables.item_id] });
      toast.success("Quote added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add quote: ${error.message}`);
    },
  });
}

export function useDeleteSupplierQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ quoteId }: { quoteId: string; itemId: string }) => api.del(`/supplier-quotes/${quoteId}`),
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ["supplier_quotes", itemId] });
      toast.success("Quote deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete quote: ${error.message}`);
    },
  });
}
