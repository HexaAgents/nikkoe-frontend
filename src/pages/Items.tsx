import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/common/DataTable";
import { useItems, useItemSearch } from "@/hooks/queries";
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
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allItems, isLoading } = useItems();
  const { data: searchResults, isFetching: isSearching } = useItemSearch(searchQuery);

  const isActiveSearch = searchQuery.length > 0;
  const items = isActiveSearch ? searchResults : allItems;

  const handleServerSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const columns = [
    { key: "item_id", header: "Part Number" },
    { key: "description", header: "Description" },
    {
      key: "category",
      header: "Category",
      render: (item: ItemWithRelations) => item.categories?.name || "-",
    },
    {
      key: "locations",
      header: "Locations",
      render: (item: ItemWithRelations) => {
        const locs = item.locations ?? [];
        if (locs.length === 0) return "-";
        return locs.join(", ");
      },
    },
    {
      key: "total_quantity",
      header: "Quantity",
      render: (item: ItemWithRelations) => {
        const qty = (item as Record<string, unknown>).total_quantity as number;
        if (!qty) return <span className="text-muted-foreground italic">Not in stock</span>;
        return qty;
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
          searchPlaceholder="Search part numbers..."
          onAdd={() => setIsAddModalOpen(true)}
          addButtonText="Add Item"
          onServerSearch={handleServerSearch}
          isSearching={isSearching}
          exportFilename="items"
          onRowClick={handleRowClick}
          idKey="id"
          exportColumns={[
            { key: "item_id", header: "Part Number" },
            { key: "description", header: "Description" },
            { key: "category", header: "Category", render: (item: ItemWithRelations) => item.categories?.name || "" },
            { key: "locations", header: "Locations", render: (item: ItemWithRelations) => (item.locations ?? []).join(", ") },
            { key: "total_quantity", header: "Quantity", render: (item: ItemWithRelations) => String((item as Record<string, unknown>).total_quantity || 0) },
          ]}
        />
      </div>
      <AddItemModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
    </>
  );

  return embedded ? mainView : <MainLayout>{mainView}</MainLayout>;
}
