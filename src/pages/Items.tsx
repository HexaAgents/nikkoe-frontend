import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/common/DataTable";
import { useItems } from "@/hooks/queries";
import { AddItemModal } from "@/components/modals/AddItemModal";
import { Skeleton } from "@/components/ui/skeleton";
import type { ItemWithRelations } from "@/types/domain.types";

interface ItemsPageProps {
  /** When true, render without outer shell (e.g. embedded in Settings). */
  embedded?: boolean;
}

export default function ItemsPage({ embedded = false }: ItemsPageProps) {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { data: items, isLoading } = useItems();

  const columns = [
    { key: "item_id", header: "Part Number" },
    { key: "description", header: "Description" },
    {
      key: "category",
      header: "Category",
      render: (item: ItemWithRelations) => item.categories?.name || "-",
    },
    {
      key: "total_quantity",
      header: "Quantity",
      render: (item: ItemWithRelations) => {
        const qty = (item as Record<string, unknown>).total_quantity as number;
        return qty > 0 ? qty : "-";
      },
    },
  ];

  const handleRowClick = (item: ItemWithRelations) => {
    navigate(`/items/${item.id}`);
  };

  const loadingView = (
    <div className="space-y-6">
      {!embedded && <h1 className="font-display text-[28px] font-normal text-foreground">Items</h1>}
      <Skeleton className="h-[400px] w-full" />
    </div>
  );

  if (isLoading) {
    return embedded ? loadingView : <MainLayout>{loadingView}</MainLayout>;
  }

  const mainView = (
    <>
      <div className="space-y-6">
        {!embedded && <h1 className="font-display text-[28px] font-normal text-foreground">Items</h1>}
        <DataTable
          data={items || []}
          columns={columns}
          searchPlaceholder="Search items..."
          onAdd={() => setIsAddModalOpen(true)}
          addButtonText="Add Item"
          searchKeys={["item_id", "description"]}
          exportFilename="items"
          onRowClick={handleRowClick}
          idKey="id"
          exportColumns={[
            { key: "item_id", header: "Part Number" },
            { key: "description", header: "Description" },
            { key: "category", header: "Category", render: (item: ItemWithRelations) => item.categories?.name || "" },
            { key: "total_quantity", header: "Quantity", render: (item: ItemWithRelations) => String((item as Record<string, unknown>).total_quantity || 0) },
          ]}
        />
      </div>
      <AddItemModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
    </>
  );

  return embedded ? mainView : <MainLayout>{mainView}</MainLayout>;
}
