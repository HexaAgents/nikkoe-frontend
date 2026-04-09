import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable, DataTableSkeleton } from "@/components/common/DataTable";
import { useItems, useItemSearch, buildItemsQueryFn, itemsQueryKeyBase } from "@/hooks/queries";
import { usePrefetchPages } from "@/hooks/usePrefetchPages";
import { fetchAllPages } from "@/lib/api";
import { AddItemModal } from "@/components/modals/AddItemModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ItemWithRelations } from "@/types/domain.types";

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: "item_id", label: "Part Number (A\u2013Z)" },
  { value: "latest_receipt", label: "Most Recent Receipt" },
  { value: "latest_sale", label: "Most Recent Sale" },
  { value: "total_quantity", label: "Highest Quantity" },
] as const;

interface ItemsPageProps {
  embedded?: boolean;
}

export default function ItemsPage({ embedded = false }: ItemsPageProps) {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [searchPage, setSearchPage] = useState(1);
  const [sortBy, setSortBy] = useState("item_id");

  const { data: browseResult, isLoading } = useItems({ page, pageSize: PAGE_SIZE, sortBy });
  const { data: searchResult, isFetching: isSearching } = useItemSearch(searchQuery, {
    page: searchPage,
    pageSize: PAGE_SIZE,
    sortBy,
  });

  const isActiveSearch = searchQuery.length > 0;

  const items = useMemo(() => {
    if (isActiveSearch) return searchResult?.data ?? [];
    return browseResult?.data ?? [];
  }, [isActiveSearch, searchResult, browseResult]);

  const total = isActiveSearch
    ? searchResult?.total ?? 0
    : browseResult?.total ?? 0;

  const activePage = isActiveSearch ? searchPage : page;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  usePrefetchPages(
    itemsQueryKeyBase(PAGE_SIZE, sortBy),
    (p) => buildItemsQueryFn(p, PAGE_SIZE, sortBy),
    page,
    totalPages,
  );

  const serverPagination = useMemo(() => ({
    total,
    page: activePage,
    pageSize: PAGE_SIZE,
    onPageChange: (newPage: number) => {
      if (isActiveSearch) setSearchPage(newPage);
      else setPage(newPage);
    },
  }), [total, activePage, isActiveSearch]);

  const handleExportAll = useCallback(() => {
    if (isActiveSearch) {
      return fetchAllPages<ItemWithRelations>("/items/search", { q: searchQuery });
    }
    return fetchAllPages<ItemWithRelations>("/items/");
  }, [searchQuery, isActiveSearch]);

  const handleServerSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setSearchPage(1);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value);
    setPage(1);
    setSearchPage(1);
  }, []);

  const columns = [
    { key: "item_id", header: "Part Number", className: "max-w-[180px] truncate" },
    { key: "description", header: "Description", className: "max-w-[280px] truncate" },
    {
      key: "category",
      header: "Category",
      className: "max-w-[150px] truncate",
      render: (item: ItemWithRelations) => item.categories?.name || "-",
    },
    {
      key: "locations",
      header: "Locations",
      className: "max-w-[180px] truncate",
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
        const qty = (item as Record<string, unknown>).total_quantity as number ?? 0;
        if (qty < 0) return <span className="font-medium text-destructive">{qty}</span>;
        if (qty === 0) return <span className="text-muted-foreground italic">Not in stock</span>;
        return qty;
      },
    },
  ];

  const handleRowClick = (item: ItemWithRelations) => {
    navigate(`/items/${item.id}`);
  };

  const sortDropdown = (
    <Select value={sortBy} onValueChange={handleSortChange}>
      <SelectTrigger className="h-9 w-[200px] text-xs">
        <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

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
          serverPagination={serverPagination}
          onExportAll={handleExportAll}
          toolbarExtra={sortDropdown}
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
