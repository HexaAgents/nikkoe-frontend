import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type {
  ReceiptLineInput,
  SaleLineInput,
  ItemInput,
  SupplierInput,
  SupplierQuoteInput,
} from "@/types/domain.types";

export type { ReceiptLineInput, SaleLineInput, ItemInput, SupplierInput, SupplierQuoteInput } from "@/types/domain.types";

export {
  saleInputSchema,
  saleLineInputSchema,
  receiptInputSchema,
  receiptLineInputSchema,
  itemInputSchema,
  categoryNameSchema,
  locationInputSchema,
  supplierInputSchema,
  supplierQuoteInputSchema,
} from "@/lib/schemas";

export function useAddReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ receipt, lines }: { receipt: Record<string, unknown>; lines: ReceiptLineInput[] }) => {
      return api.post("/receipts/", { receipt, lines });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_balances"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_on_hand"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
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
      queryClient.invalidateQueries({ queryKey: ["inventory_balances"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_on_hand"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Receipt voided successfully");
    },
    onError: (error) => {
      toast.error(`Failed to void receipt: ${error.message}`);
    },
  });
}

export function useAddSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sale, lines }: { sale: Record<string, unknown>; lines: SaleLineInput[] }) => {
      return api.post("/sales/", { sale, lines });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_balances"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_on_hand"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
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
      queryClient.invalidateQueries({ queryKey: ["inventory_balances"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_on_hand"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Sale voided successfully");
    },
    onError: (error) => {
      toast.error(`Failed to void sale: ${error.message}`);
    },
  });
}

export function useAddItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: ItemInput) => api.post("/items/", item),
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
    mutationFn: ({ itemId, updates }: { itemId: string | number; updates: Partial<ItemInput> }) =>
      api.put(`/items/${itemId}`, updates),
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["items", String(itemId)] });
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
    mutationFn: (itemId: string | number) => api.del(`/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete item: ${error.message}`);
    },
  });
}

export function useAddCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => api.post("/categories/", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add category: ${error.message}`);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => api.del(`/categories/${categoryId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete category: ${error.message}`);
    },
  });
}

export function useAddSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (supplier: SupplierInput) => api.post("/suppliers/", supplier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add supplier: ${error.message}`);
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (supplierId: string) => api.del(`/suppliers/${supplierId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete supplier: ${error.message}`);
    },
  });
}

export function useAddLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (location: { code: string }) => api.post("/locations/", location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add location: ${error.message}`);
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locationId: string) => api.del(`/locations/${locationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete location: ${error.message}`);
    },
  });
}

export function useAddCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => api.post("/customers/", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error) => {
      toast.error(`Failed to add customer: ${error.message}`);
    },
  });
}

export function useAddSupplierQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quote: SupplierQuoteInput) => api.post("/supplier-quotes/", quote),
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
