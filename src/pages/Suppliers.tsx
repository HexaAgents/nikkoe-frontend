import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/common/DataTable";
import { useSuppliers } from "@/hooks/queries";
import { AddSupplierModal } from "@/components/modals/AddSupplierModal";
import { Skeleton } from "@/components/ui/skeleton";
import type { Supplier } from "@/types/domain.types";

interface SuppliersPageProps {
  embedded?: boolean;
}

export default function SuppliersPage({ embedded = false }: SuppliersPageProps) {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { data: suppliers, isLoading } = useSuppliers();

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
          data={suppliers || []}
          columns={columns}
          searchPlaceholder="Search suppliers..."
          onAdd={() => setIsAddModalOpen(true)}
          addButtonText="Add Supplier"
          searchKeys={["name", "email", "address"]}
          exportFilename="suppliers"
          idKey="id"
          onRowClick={(supplier: Supplier) => navigate(`/suppliers/${supplier.id}`)}
        />
      </div>
      <AddSupplierModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
    </>
  );

  return embedded ? mainView : <MainLayout>{mainView}</MainLayout>;
}
