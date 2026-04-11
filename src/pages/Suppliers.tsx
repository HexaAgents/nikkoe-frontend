import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable, DataTableSkeleton } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useSuppliersPaginated,
  buildSuppliersQueryFn,
  suppliersPageQueryKeyBase,
} from "@/hooks/queries";
import { useDeleteSupplier } from "@/hooks/mutations";
import { usePrefetchPages } from "@/hooks/usePrefetchPages";
import { fetchAllPages } from "@/lib/api";
import { AddSupplierModal } from "@/components/modals/AddSupplierModal";
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
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const deleteSupplier = useDeleteSupplier();

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

  const handleDelete = async () => {
    if (!supplierToDelete) return;
    try {
      await deleteSupplier.mutateAsync(String(supplierToDelete.id));
    } finally {
      setSupplierToDelete(null);
    }
  };

  const columns = [
    { key: "name", header: "Name", className: "max-w-[200px] truncate" },
    { key: "address", header: "Address", className: "max-w-[250px] truncate" },
    { key: "email", header: "Email", className: "max-w-[220px] truncate" },
    { key: "phone", header: "Phone" },
    {
      key: "actions",
      header: "",
      render: (supplier: Supplier) => (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation();
            setSupplierToDelete(supplier);
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  const loadingView = (
    <div className="space-y-6">
      {!embedded && <h1 className="font-display text-[28px] font-normal text-foreground">Suppliers</h1>}
      <DataTableSkeleton columns={4} rows={8} />
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
      <AlertDialog open={!!supplierToDelete} onOpenChange={(open) => !open && setSupplierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {supplierToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this supplier and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  return embedded ? mainView : <MainLayout>{mainView}</MainLayout>;
}
