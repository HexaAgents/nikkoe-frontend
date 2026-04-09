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

function receiptsUrl(page: number, pageSize: number, search?: string, status?: string) {
  const qs = new URLSearchParams({
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
  });
  if (search) qs.set("search", search);
  if (status) qs.set("status", status);
  return `/receipts/?${qs}`;
}

export function useReceipts(
  page = 1, pageSize = 20,
  search?: string, status?: string, enabled = true,
) {
  return useQuery({
    queryKey: ["receipts", { pageSize, search, status }, { page }],
    queryFn: () => api.getListPaginated<ReceiptWithRelations>(receiptsUrl(page, pageSize, search, status)),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function buildReceiptsQueryFn(page: number, pageSize: number, search?: string, status?: string) {
  return () => api.getListPaginated<ReceiptWithRelations>(receiptsUrl(page, pageSize, search, status));
}

export function receiptsQueryKeyBase(pageSize: number, search?: string, status?: string) {
  return ["receipts", { pageSize, search, status }];
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

function salesUrl(page: number, pageSize: number, search?: string, status?: string) {
  const qs = new URLSearchParams({
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
  });
  if (search) qs.set("search", search);
  if (status) qs.set("status", status);
  return `/sales/?${qs}`;
}

export function useSales(
  page = 1, pageSize = 20,
  search?: string, status?: string, enabled = true,
) {
  return useQuery({
    queryKey: ["sales", { pageSize, search, status }, { page }],
    queryFn: () => api.getListPaginated<SaleWithRelations>(salesUrl(page, pageSize, search, status)),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function buildSalesQueryFn(page: number, pageSize: number, search?: string, status?: string) {
  return () => api.getListPaginated<SaleWithRelations>(salesUrl(page, pageSize, search, status));
}

export function salesQueryKeyBase(pageSize: number, search?: string, status?: string) {
  return ["sales", { pageSize, search, status }];
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

export function useItems({ page = 1, pageSize = 20, sortBy = "item_id" } = {}) {
  const offset = (page - 1) * pageSize;
  const params = new URLSearchParams({
    limit: String(pageSize),
    offset: String(offset),
  });
  if (sortBy !== "item_id") params.set("sort_by", sortBy);
  return useQuery({
    queryKey: ["items", { pageSize, sortBy }, { page }],
    queryFn: () =>
      api.getListPaginated<ItemWithRelations>(`/items/?${params}`),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function buildItemsQueryFn(page: number, pageSize: number, sortBy = "item_id") {
  return () => {
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String((page - 1) * pageSize),
    });
    if (sortBy !== "item_id") params.set("sort_by", sortBy);
    return api.getListPaginated<ItemWithRelations>(`/items/?${params}`);
  };
}

export function itemsQueryKeyBase(pageSize: number, sortBy = "item_id") {
  return ["items", { pageSize, sortBy }];
}

export function useItemSearch(
  query: string,
  { page = 1, pageSize = 20, inStockOnly = false, sortBy = "item_id" } = {},
) {
  const offset = (page - 1) * pageSize;
  return useQuery({
    queryKey: ["items", "search", query, { page, pageSize, inStockOnly, sortBy }],
    queryFn: () => {
      const params = new URLSearchParams({
        q: query,
        limit: String(pageSize),
        offset: String(offset),
      });
      if (inStockOnly) params.set("in_stock", "true");
      if (sortBy !== "item_id") params.set("sort_by", sortBy);
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

function categoriesPageUrl(page: number, pageSize: number, search?: string) {
  const qs = new URLSearchParams({
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
  });
  if (search) qs.set("search", search);
  return `/categories/?${qs}`;
}

export function useCategoriesPaginated(page = 1, pageSize = 20, search?: string) {
  return useQuery({
    queryKey: ["categories_page", { pageSize, search }, { page }],
    queryFn: () => api.getListPaginated<Category>(categoriesPageUrl(page, pageSize, search)),
    placeholderData: keepPreviousData,
  });
}

export function buildCategoriesQueryFn(page: number, pageSize: number, search?: string) {
  return () => api.getListPaginated<Category>(categoriesPageUrl(page, pageSize, search));
}

export function categoriesPageQueryKeyBase(pageSize: number, search?: string) {
  return ["categories_page", { pageSize, search }];
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

function suppliersPageUrl(page: number, pageSize: number, search?: string) {
  const qs = new URLSearchParams({
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
  });
  if (search) qs.set("search", search);
  return `/suppliers/?${qs}`;
}

export function useSuppliersPaginated(page = 1, pageSize = 20, search?: string) {
  return useQuery({
    queryKey: ["suppliers_page", { pageSize, search }, { page }],
    queryFn: () => api.getListPaginated<Supplier>(suppliersPageUrl(page, pageSize, search)),
    placeholderData: keepPreviousData,
  });
}

export function buildSuppliersQueryFn(page: number, pageSize: number, search?: string) {
  return () => api.getListPaginated<Supplier>(suppliersPageUrl(page, pageSize, search));
}

export function suppliersPageQueryKeyBase(pageSize: number, search?: string) {
  return ["suppliers_page", { pageSize, search }];
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

function locationsPageUrl(page: number, pageSize: number, search?: string) {
  const qs = new URLSearchParams({
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
  });
  if (search) qs.set("search", search);
  return `/locations/?${qs}`;
}

export function useLocationsPaginated(page = 1, pageSize = 20, search?: string) {
  return useQuery({
    queryKey: ["locations_page", { pageSize, search }, { page }],
    queryFn: () => api.getListPaginated<Location>(locationsPageUrl(page, pageSize, search)),
    placeholderData: keepPreviousData,
  });
}

export function buildLocationsQueryFn(page: number, pageSize: number, search?: string) {
  return () => api.getListPaginated<Location>(locationsPageUrl(page, pageSize, search));
}

export function locationsPageQueryKeyBase(pageSize: number, search?: string) {
  return ["locations_page", { pageSize, search }];
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

function movementsPageUrl(page: number, pageSize: number, search?: string) {
  const qs = new URLSearchParams({
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
  });
  if (search) qs.set("search", search);
  return `/inventory/movements?${qs}`;
}

export function useMovementsPaginated(page = 1, pageSize = 20, search?: string) {
  return useQuery({
    queryKey: ["movements_page", { pageSize, search }, { page }],
    queryFn: () => api.getListPaginated<Transfer>(movementsPageUrl(page, pageSize, search)),
    placeholderData: keepPreviousData,
  });
}

export function buildMovementsQueryFn(page: number, pageSize: number, search?: string) {
  return () => api.getListPaginated<Transfer>(movementsPageUrl(page, pageSize, search));
}

export function movementsPageQueryKeyBase(pageSize: number, search?: string) {
  return ["movements_page", { pageSize, search }];
}

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
