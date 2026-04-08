import type { QueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  buildSalesQueryFn,
  salesQueryKeyBase,
  buildReceiptsQueryFn,
  receiptsQueryKeyBase,
  buildItemsQueryFn,
  itemsQueryKeyBase,
  buildCategoriesQueryFn,
  categoriesPageQueryKeyBase,
  buildLocationsQueryFn,
  locationsPageQueryKeyBase,
  buildSuppliersQueryFn,
  suppliersPageQueryKeyBase,
  buildMovementsQueryFn,
  movementsPageQueryKeyBase,
} from "@/hooks/queries";

const PAGE_SIZE = 20;

export function prefetchAppData(qc: QueryClient) {
  qc.prefetchQuery({
    queryKey: [...salesQueryKeyBase(PAGE_SIZE, undefined, "ACTIVE"), { page: 1 }],
    queryFn: buildSalesQueryFn(1, PAGE_SIZE, undefined, "ACTIVE"),
  });

  qc.prefetchQuery({
    queryKey: [...receiptsQueryKeyBase(PAGE_SIZE, undefined, "ACTIVE"), { page: 1 }],
    queryFn: buildReceiptsQueryFn(1, PAGE_SIZE, undefined, "ACTIVE"),
  });

  qc.prefetchQuery({
    queryKey: [...itemsQueryKeyBase(PAGE_SIZE), { page: 1 }],
    queryFn: buildItemsQueryFn(1, PAGE_SIZE),
  });

  qc.prefetchQuery({
    queryKey: [...categoriesPageQueryKeyBase(PAGE_SIZE), { page: 1 }],
    queryFn: buildCategoriesQueryFn(1, PAGE_SIZE),
  });

  qc.prefetchQuery({
    queryKey: [...locationsPageQueryKeyBase(PAGE_SIZE), { page: 1 }],
    queryFn: buildLocationsQueryFn(1, PAGE_SIZE),
  });

  qc.prefetchQuery({
    queryKey: [...suppliersPageQueryKeyBase(PAGE_SIZE), { page: 1 }],
    queryFn: buildSuppliersQueryFn(1, PAGE_SIZE),
  });

  qc.prefetchQuery({
    queryKey: [...movementsPageQueryKeyBase(PAGE_SIZE), { page: 1 }],
    queryFn: buildMovementsQueryFn(1, PAGE_SIZE),
  });

  qc.prefetchQuery({ queryKey: ["categories"], queryFn: () => api.getList("/categories/") });
  qc.prefetchQuery({ queryKey: ["suppliers"], queryFn: () => api.getList("/suppliers/") });
  qc.prefetchQuery({ queryKey: ["locations"], queryFn: () => api.getList("/locations/") });
  qc.prefetchQuery({ queryKey: ["channels"], queryFn: () => api.getList("/channels/") });
  qc.prefetchQuery({ queryKey: ["customers"], queryFn: () => api.getList("/customers/") });
  qc.prefetchQuery({ queryKey: ["currencies"], queryFn: () => api.getList("/currencies/") });
  qc.prefetchQuery({ queryKey: ["inventory_on_hand"], queryFn: () => api.get("/inventory/on-hand") });
}
