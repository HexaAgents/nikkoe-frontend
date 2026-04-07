import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable, DataTableSkeleton } from "@/components/common/DataTable";
import { useItems, useItemSearch } from "@/hooks/queries";
import { AddItemModal } from "@/components/modals/AddItemModal";
import type { ItemWithRelations } from "@/types/domain.types";

const PAGE_SIZE = 20;

interface ItemsPageProps {
  embedded?: boolean;
}

export default function ItemsPage({ embedded = false }: ItemsPageProps) {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [searchPage, setSearchPage] = useState(1);

  const { data: browseResult, isLoading } = useItems({ page, pageSize: PAGE_SIZE });
  const { data: searchResult, isFetching: isSearching } = useItemSearch(searchQuery, {
    page: searchPage,
    pageSize: PAGE_SIZE,
  });

  const isActiveSearch = searchQuery.length > 0;
  const activeResult = isActiveSearch ? searchResult : browseResult;
  const items = activeResult?.data ?? [];
  const total = activeResult?.total ?? 0;
  const activePage = isActiveSearch ? searchPage : page;

  const handleServerSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setSearchPage(1);
  }, []);

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (isActiveSearch) {
        setSearchPage(newPage);
      } else {
        setPage(newPage);
      }
    },
    [isActiveSearch],
  );

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
      <DataTableSkeleton columns={5} rows={8} />
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
          data={items}
          columns={columns}
          searchPlaceholder="Search part numbers..."
          onAdd={() => setIsAddModalOpen(true)}
          addButtonText="Add Item"
          onServerSearch={handleServerSearch}
          isSearching={isSearching}
          exportFilename="items"
          onRowClick={handleRowClick}
          idKey="id"
          serverPagination={{
            total,
            page: activePage,
            pageSize: PAGE_SIZE,
            onPageChange: handlePageChange,
          }}
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
