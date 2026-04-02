import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface ReceiptLineInput {
  item_id: string;
  location_id: string;
  quantity: number;
  unit_cost: number;
  currency_code: string;
}

export function useReceipts() {
  return useQuery({
    queryKey: ["receipts"],
    queryFn: () => api.get<any[]>("/receipts"),
  });
}

export function useReceipt(receiptId: string) {
  return useQuery({
    queryKey: ["receipts", receiptId],
    queryFn: () => api.get(`/receipts/${receiptId}`),
    enabled: !!receiptId,
  });
}

export function useReceiptLines(receiptId: string) {
  return useQuery({
    queryKey: ["receipt_lines", receiptId],
    queryFn: () => api.get<any[]>(`/receipts/${receiptId}/lines`),
    enabled: !!receiptId,
  });
}

export function useAddReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ receipt, lines }: { receipt: Record<string, unknown>; lines: ReceiptLineInput[] }) => {
      return api.post("/receipts", { receipt, lines });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_balances"] });
      toast.success("Receipt added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add receipt: ${error.message}`);
    },
  });
}

export function useVoidReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ receiptId, reason }: { receiptId: string; voidedBy?: string; reason?: string }) => {
      return api.post(`/receipts/${receiptId}/void`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      toast.success("Receipt voided successfully");
    },
    onError: (error) => {
      toast.error(`Failed to void receipt: ${error.message}`);
    },
  });
}
