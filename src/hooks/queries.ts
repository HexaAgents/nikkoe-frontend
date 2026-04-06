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
  ItemSaleHistory,
  ItemSupplierQuote,
  StockWithLocation,
  Category,
  Supplier,
  Location,
  Channel,
  Customer,
  Currency,
  Transfer,
  InventoryOnHand,
  UserProfile,
} from "@/types/domain.types";

export function useReceipts() {
  return useQuery({
    queryKey: ["receipts"],
    queryFn: () => api.getList<ReceiptWithRelations>("/receipts/"),
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
  const params = search ? `?search=${encodeURIComponent(search)}` : "";
  return useQuery({
    queryKey: ["sales", { search }],
    queryFn: () => api.getList<SaleWithRelations>(`/sales/${params}`),
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

export function useItems() {
  return useQuery({
    queryKey: ["items"],
    queryFn: () => api.getList<ItemWithRelations>("/items/"),
  });
}

export function useItemSearch(query: string) {
  return useQuery({
    queryKey: ["items", "search", query],
    queryFn: () =>
      api.getList<ItemWithRelations>(
        `/items/search?q=${encodeURIComponent(query)}`
      ),
    enabled: query.length > 0,
    placeholderData: keepPreviousData,
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
    queryFn: () => api.get<Record<string, unknown>[]>(`/items/${itemId}/receipts`),
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

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getList<Category>("/categories/"),
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: () => api.getList<Supplier>("/suppliers/"),
  });
}

export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: () => api.getList<Location>("/locations/"),
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
