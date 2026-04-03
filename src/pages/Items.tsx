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
    { key: "part_number", header: "Part Number" },
    { key: "description", header: "Description" },
    { 
      key: "category", 
      header: "Category",
      render: (item: ItemWithRelations) => item.categories?.name || "-"
    },
    {
      key: "locations",
      header: "Locations",
      render: (item: ItemWithRelations) => {
        const locs = (item.inventory_balances || [])
          .filter((b) => b.quantity_on_hand > 0)
          .map((b) => b.locations?.location_code)
          .filter(Boolean);
        return locs.length > 0 ? locs.join(", ") : "-";
      }
    },
    {
      key: "total_qty",
      header: "Total Qty",
      render: (item: ItemWithRelations) => {
        const total = (item.inventory_balances || [])
          .reduce((sum: number, b) => sum + (b.quantity_on_hand || 0), 0);
        return total > 0 ? total : "-";
      }
    },
    {
      key: "avg_unit_cost",
      header: "Avg Unit Cost",
      render: (item: ItemWithRelations) => {
        const postedLines = (item.receipt_lines || [])
          .filter((rl) => rl.receipts?.status === "POSTED");
        if (postedLines.length === 0) return "-";
        const avg = postedLines.reduce((sum: number, rl) => sum + Number(rl.unit_cost), 0) / postedLines.length;
        return avg.toFixed(2);
      }
    },
  ];

  const handleRowClick = (item: ItemWithRelations) => {
    navigate(`/items/${item.item_id}`);
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
          searchKeys={["part_number", "description"]}
          exportFilename="items"
          onRowClick={handleRowClick}
          idKey="item_id"
          exportColumns={[
            { key: "item_id", header: "Item ID" },
            { key: "part_number", header: "Part Number" },
            { key: "description", header: "Description" },
            { key: "category", header: "Category", render: (item: ItemWithRelations) => item.categories?.name || "" },
            { key: "locations", header: "Locations", render: (item: ItemWithRelations) => (item.inventory_balances || []).filter((b) => b.quantity_on_hand > 0).map((b) => b.locations?.location_code).filter(Boolean).join(", ") },
            { key: "total_qty", header: "Total Qty", render: (item: ItemWithRelations) => String((item.inventory_balances || []).reduce((sum: number, b) => sum + (b.quantity_on_hand || 0), 0)) },
            { key: "avg_unit_cost", header: "Avg Unit Cost", render: (item: ItemWithRelations) => { const lines = (item.receipt_lines || []).filter((rl) => rl.receipts?.status === "POSTED"); return lines.length ? (lines.reduce((s: number, rl) => s + Number(rl.unit_cost), 0) / lines.length).toFixed(2) : ""; } },
          ]}
        />
      </div>
      <AddItemModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
    </>
  );

  return embedded ? mainView : <MainLayout>{mainView}</MainLayout>;
}
