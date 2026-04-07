import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type {
  ReceiptWithRelations,
  ReceiptLine,
  SaleWithRelations,
  SaleLine,
  Item,
  ItemWithRelations,
  ItemReceiptHistory,
  ItemSaleHistory,
  ItemSupplierQuote,
  ItemTransferHistory,
  StockWithLocation,
  Category,
  Supplier,
  SupplierReceiptHistory,
  Location,
  LocationItem,
  Channel,
  Customer,
  Currency,
  Transfer,
  InventoryOnHand,
  UserProfile,
} from "@/types/domain.types";

export function useReceipts(search?: string) {
  const qs = new URLSearchParams({ limit: "5000" });
  if (search) qs.set("search", search);
  return useQuery({
    queryKey: ["receipts", { search }],
    queryFn: () => api.getList<ReceiptWithRelations>(`/receipts/?${qs}`),
    placeholderData: keepPreviousData,
  });
}

export function useReceipt(receiptId: string | number) {
  return useQuery({
    queryKey: ["receipts", String(receiptId)],
    queryFn: () => api.get<ReceiptWithRelations>(`/receipts/${receiptId}`),
    enabled: !!receiptId,
  });
}

export function useReceiptLines(receiptId: string | number) {
  return useQuery({
    queryKey: ["receipt_lines", String(receiptId)],
    queryFn: () => api.get<ReceiptLine[]>(`/receipts/${receiptId}/lines`),
    enabled: !!receiptId,
  });
}

export function useSales(search?: string) {
  const qs = new URLSearchParams({ limit: "5000" });
  if (search) qs.set("search", search);
  return useQuery({
    queryKey: ["sales", { search }],
    queryFn: () => api.getList<SaleWithRelations>(`/sales/?${qs}`),
    placeholderData: keepPreviousData,
  });
}

export function useSale(saleId: string | number) {
  return useQuery({
    queryKey: ["sales", String(saleId)],
    queryFn: () => api.get<SaleWithRelations>(`/sales/${saleId}`),
    enabled: !!saleId,
  });
}

export function useSaleLines(saleId: string | number) {
  return useQuery({
    queryKey: ["sale_lines", String(saleId)],
    queryFn: () => api.get<SaleLine[]>(`/sales/${saleId}/lines`),
    enabled: !!saleId,
  });
}

export function useItems({ page = 1, pageSize = 20 } = {}) {
  const offset = (page - 1) * pageSize;
  return useQuery({
    queryKey: ["items", { page, pageSize }],
    queryFn: () =>
      api.getListPaginated<ItemWithRelations>(
        `/items/?limit=${pageSize}&offset=${offset}`,
      ),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useAllItems(enabled: boolean) {
  return useQuery({
    queryKey: ["items", "all"],
    queryFn: () =>
      api.getListPaginated<ItemWithRelations>("/items/?limit=5000&offset=0"),
    enabled,
    staleTime: 60_000,
  });
}

export function useItemSearch(
  query: string,
  { page = 1, pageSize = 20, inStockOnly = false } = {},
) {
  const offset = (page - 1) * pageSize;
  return useQuery({
    queryKey: ["items", "search", query, { page, pageSize, inStockOnly }],
    queryFn: () => {
      const params = new URLSearchParams({
        q: query,
        limit: String(pageSize),
        offset: String(offset),
      });
      if (inStockOnly) params.set("in_stock", "true");
      return api.getListPaginated<ItemWithRelations>(`/items/search?${params}`);
    },
    enabled: query.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useItem(itemId: string | number) {
  return useQuery({
    queryKey: ["items", String(itemId)],
    queryFn: () => api.get<Item>(`/items/${itemId}`),
    enabled: !!itemId,
  });
}

export function useItemSupplierQuotes(itemId: string | number) {
  return useQuery({
    queryKey: ["supplier_quotes", String(itemId)],
    queryFn: () => api.get<ItemSupplierQuote[]>(`/items/${itemId}/quotes`),
    enabled: !!itemId,
  });
}

export function useItemInventory(itemId: string | number) {
  return useQuery({
    queryKey: ["inventory_balances", String(itemId)],
    queryFn: () => api.get<StockWithLocation[]>(`/items/${itemId}/inventory`),
    enabled: !!itemId,
  });
}

export function useItemReceipts(itemId: string | number) {
  return useQuery({
    queryKey: ["receipt_lines", "by_item", String(itemId)],
    queryFn: () => api.get<ItemReceiptHistory[]>(`/items/${itemId}/receipts`),
    enabled: !!itemId,
  });
}

export function useItemSales(itemId: string | number) {
  return useQuery({
    queryKey: ["sale_lines", "by_item", String(itemId)],
    queryFn: () => api.get<ItemSaleHistory[]>(`/items/${itemId}/sales`),
    enabled: !!itemId,
  });
}

export function useItemTransfers(itemId: string | number) {
  return useQuery({
    queryKey: ["transfers", "by_item", String(itemId)],
    queryFn: () => api.get<ItemTransferHistory[]>(`/items/${itemId}/transfers`),
    enabled: !!itemId,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getList<Category>("/categories/"),
  });
}

export function useCategory(categoryId: string | number) {
  return useQuery({
    queryKey: ["categories", String(categoryId)],
    queryFn: () => api.get<Category>(`/categories/${categoryId}`),
    enabled: !!categoryId,
  });
}

export function useCategoryItems(categoryId: string | number) {
  return useQuery({
    queryKey: ["categories", String(categoryId), "items"],
    queryFn: () =>
      api.getListPaginated<ItemWithRelations>(
        `/categories/${categoryId}/items?limit=5000&offset=0`,
      ),
    enabled: !!categoryId,
    staleTime: 60_000,
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: () => api.getList<Supplier>("/suppliers/"),
  });
}

export function useSupplier(supplierId: string | number) {
  return useQuery({
    queryKey: ["suppliers", String(supplierId)],
    queryFn: () => api.get<Supplier>(`/suppliers/${supplierId}`),
    enabled: !!supplierId,
  });
}

export function useSupplierReceipts(supplierId: string | number) {
  return useQuery({
    queryKey: ["supplier_receipts", String(supplierId)],
    queryFn: () => api.get<SupplierReceiptHistory[]>(`/suppliers/${supplierId}/receipts`),
    enabled: !!supplierId,
  });
}

export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: () => api.getList<Location>("/locations/"),
  });
}

export function useLocationItems(locationId: string | number) {
  return useQuery({
    queryKey: ["locations", String(locationId), "items"],
    queryFn: () => api.get<LocationItem[]>(`/locations/${locationId}/items`),
    enabled: !!locationId,
  });
}

export function useChannels() {
  return useQuery({
    queryKey: ["channels"],
    queryFn: () => api.getList<Channel>("/channels/"),
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: () => api.getList<Customer>("/customers/"),
  });
}

export function useCurrencies() {
  return useQuery({
    queryKey: ["currencies"],
    queryFn: () => api.getList<Currency>("/currencies/"),
  });
}

export function useTransfers() {
  return useQuery({
    queryKey: ["transfers"],
    queryFn: () => api.getList<Transfer>("/inventory/movements/"),
  });
}

export const useInventoryMovements = useTransfers;

export function useInventoryOnHand() {
  return useQuery({
    queryKey: ["inventory_on_hand"],
    queryFn: () => api.get<InventoryOnHand[]>("/inventory/on-hand"),
    staleTime: 0,
  });
}

export function useCurrentUser() {
  const { user: authUser } = useAuth();

  return useQuery({
    queryKey: ["current_user", authUser?.id],
    queryFn: () => api.get<UserProfile>("/users/me"),
    enabled: !!authUser?.id,
  });
}
