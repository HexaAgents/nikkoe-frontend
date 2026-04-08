import { useState, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable, DataTableSkeleton } from "@/components/common/DataTable";
import {
  useMovementsPaginated,
  buildMovementsQueryFn,
  movementsPageQueryKeyBase,
} from "@/hooks/queries";
import { usePrefetchPages } from "@/hooks/usePrefetchPages";
import { fetchAllPages } from "@/lib/api";
import type { Transfer } from "@/types/domain.types";

const PAGE_SIZE = 20;

interface LogPageProps {
  embedded?: boolean;
}

export default function LogPage({ embedded = false }: LogPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const search = searchQuery || undefined;

  const { data: result, isLoading, isFetching } = useMovementsPaginated(page, PAGE_SIZE, search);

  const movements = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  usePrefetchPages(
    movementsPageQueryKeyBase(PAGE_SIZE, search),
    (p) => buildMovementsQueryFn(p, PAGE_SIZE, search),
    page,
    totalPages,
  );

  const handleServerSearch = useCallback((q: string) => {
    setSearchQuery(q);
    setPage(1);
  }, []);

  const handleExportAll = useCallback(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    return fetchAllPages<Transfer>("/inventory/movements", params);
  }, [search]);

  const columns = [
    { key: "id", header: "ID" },
    {
      key: "date",
      header: "Date/Time",
      render: (m: Transfer) => m.date ? new Date(m.date).toLocaleString() : "-",
    },
    {
      key: "item",
      header: "Item",
      render: (m: Transfer) => m.items?.item_id || "-",
    },
    {
      key: "quantity",
      header: "Qty",
      render: (m: Transfer) => m.quantity,
    },
    {
      key: "user",
      header: "User",
      render: (m: Transfer) => {
        if (!m.users) return "-";
        return [m.users.first_name, m.users.last_name].filter(Boolean).join(" ") || "-";
      },
    },
    {
      key: "notes",
      header: "Notes",
      render: (m: Transfer) => m.notes || "-",
    },
  ];

  const exportColumns = [
    { key: "id", header: "ID" },
    {
      key: "date",
      header: "Date/Time",
      render: (m: Transfer) => m.date ? new Date(m.date).toLocaleString() : "",
    },
    {
      key: "item",
      header: "Item",
      render: (m: Transfer) => m.items?.item_id || "",
    },
    { key: "quantity", header: "Qty" },
    {
      key: "user",
      header: "User",
      render: (m: Transfer) => {
        if (!m.users) return "";
        return [m.users.first_name, m.users.last_name].filter(Boolean).join(" ");
      },
    },
    {
      key: "notes",
      header: "Notes",
      render: (m: Transfer) => m.notes || "",
    },
  ];

  const loadingView = (
    <div className="space-y-6">
      {!embedded && <h1 className="font-display text-[28px] font-normal text-foreground">Log</h1>}
      <DataTableSkeleton columns={6} rows={8} />
    </div>
  );

  if (isLoading) {
    return embedded ? loadingView : <MainLayout>{loadingView}</MainLayout>;
  }

  const mainView = (
    <div className="space-y-6">
      {!embedded && <h1 className="font-display text-[28px] font-normal text-foreground">Log</h1>}
      <DataTable
        data={movements}
        columns={columns}
        searchPlaceholder="Search by part number or notes..."
        onServerSearch={handleServerSearch}
        isSearching={isFetching}
        exportFilename="inventory_movements"
        idKey="id"
        exportColumns={exportColumns}
        serverPagination={{ total, page, pageSize: PAGE_SIZE, onPageChange: setPage }}
        onExportAll={handleExportAll}
      />
    </div>
  );

  return embedded ? mainView : <MainLayout>{mainView}</MainLayout>;
}
