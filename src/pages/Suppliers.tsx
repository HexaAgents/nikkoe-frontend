import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/common/DataTable";
import {
  useSuppliersPaginated,
  buildSuppliersQueryFn,
  suppliersPageQueryKeyBase,
} from "@/hooks/queries";
import { usePrefetchPages } from "@/hooks/usePrefetchPages";
import { fetchAllPages } from "@/lib/api";
import { AddSupplierModal } from "@/components/modals/AddSupplierModal";
import { Skeleton } from "@/components/ui/skeleton";
import type { Supplier } from "@/types/domain.types";

const PAGE_SIZE = 20;

interface SuppliersPageProps {
  embedded?: boolean;
}

export default function SuppliersPage({ embedded = false }: SuppliersPageProps) {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const search = searchQuery || undefined;

  const { data: result, isLoading, isFetching } = useSuppliersPaginated(page, PAGE_SIZE, search);

  const suppliers = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  usePrefetchPages(
    suppliersPageQueryKeyBase(PAGE_SIZE, search),
    (p) => buildSuppliersQueryFn(p, PAGE_SIZE, search),
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
    return fetchAllPages<Supplier>("/suppliers/", params);
  }, [search]);

  const columns = [
    { key: "name", header: "Name" },
    { key: "address", header: "Address", className: "max-w-[300px] truncate" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
  ];

  const loadingView = (
    <div className="space-y-6">
      {!embedded && <h1 className="font-display text-[28px] font-normal text-foreground">Suppliers</h1>}
      <Skeleton className="h-[400px] w-full" />
    </div>
  );

  if (isLoading) {
    return embedded ? loadingView : <MainLayout>{loadingView}</MainLayout>;
  }

  const mainView = (
    <>
      <div className="space-y-6">
        {!embedded && <h1 className="font-display text-[28px] font-normal text-foreground">Suppliers</h1>}
        <DataTable
          data={suppliers}
          columns={columns}
          searchPlaceholder="Search suppliers..."
          onAdd={() => setIsAddModalOpen(true)}
          addButtonText="Add Supplier"
          onServerSearch={handleServerSearch}
          isSearching={isFetching}
          exportFilename="suppliers"
          idKey="id"
          onRowClick={(supplier: Supplier) => navigate(`/suppliers/${supplier.id}`)}
          serverPagination={{ total, page, pageSize: PAGE_SIZE, onPageChange: setPage }}
          onExportAll={handleExportAll}
        />
      </div>
      <AddSupplierModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
    </>
  );

  return embedded ? mainView : <MainLayout>{mainView}</MainLayout>;
}
