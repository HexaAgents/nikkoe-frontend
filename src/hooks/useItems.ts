import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface ItemInput {
  part_number: string;
  description?: string;
  category_id?: string;
}

export function useItems() {
  return useQuery({
    queryKey: ["items"],
    queryFn: () => api.get<any[]>("/items"),
  });
}

export function useItem(itemId: string) {
  return useQuery({
    queryKey: ["items", itemId],
    queryFn: () => api.get(`/items/${itemId}`),
    enabled: !!itemId,
  });
}

export function useItemSupplierQuotes(itemId: string) {
  return useQuery({
    queryKey: ["supplier_quotes", itemId],
    queryFn: () => api.get<any[]>(`/items/${itemId}/quotes`),
    enabled: !!itemId,
  });
}

export function useItemInventory(itemId: string) {
  return useQuery({
    queryKey: ["inventory_balances", itemId],
    queryFn: () => api.get<any[]>(`/items/${itemId}/inventory`),
    enabled: !!itemId,
  });
}

export function useItemReceipts(itemId: string) {
  return useQuery({
    queryKey: ["receipt_lines", "by_item", itemId],
    queryFn: () => api.get<any[]>(`/items/${itemId}/receipts`),
    enabled: !!itemId,
  });
}

export function useItemSales(itemId: string) {
  return useQuery({
    queryKey: ["sale_lines", "by_item", itemId],
    queryFn: () => api.get<any[]>(`/items/${itemId}/sales`),
    enabled: !!itemId,
  });
}

export function useAddItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: ItemInput) => api.post("/items", item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add item: ${error.message}`);
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, updates }: { itemId: string; updates: Partial<ItemInput> }) =>
      api.put(`/items/${itemId}`, updates),
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["items", itemId] });
      toast.success("Item updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update item: ${error.message}`);
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => api.del(`/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete item: ${error.message}`);
    },
  });
}
