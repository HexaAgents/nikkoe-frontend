import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/common/DataTable";
import {
  useCategoriesPaginated,
  buildCategoriesQueryFn,
  categoriesPageQueryKeyBase,
} from "@/hooks/queries";
import { usePrefetchPages } from "@/hooks/usePrefetchPages";
import { fetchAllPages } from "@/lib/api";
import { AddCategoryModal } from "@/components/modals/AddCategoryModal";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category } from "@/types/domain.types";

const PAGE_SIZE = 20;

interface CategoriesPageProps {
  embedded?: boolean;
}

export default function CategoriesPage({ embedded = false }: CategoriesPageProps) {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const search = searchQuery || undefined;

  const { data: result, isLoading, isFetching } = useCategoriesPaginated(page, PAGE_SIZE, search);

  const categories = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  usePrefetchPages(
    categoriesPageQueryKeyBase(PAGE_SIZE, search),
    (p) => buildCategoriesQueryFn(p, PAGE_SIZE, search),
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
    return fetchAllPages<Category>("/categories/", params);
  }, [search]);

  const columns = [
    { key: "name", header: "Name" },
    {
      key: "item_count",
      header: "Items",
      render: (cat: Category) => (
        <span className="tabular-nums">{cat.item_count ?? 0}</span>
      ),
    },
    {
      key: "total_quantity",
      header: "Total Qty",
      render: (cat: Category) => (
        <span className="tabular-nums">{cat.total_quantity ?? 0}</span>
      ),
    },
  ];

  const handleRowClick = (category: Category) => {
    navigate(`/categories/${category.id}`);
  };

  const loadingView = (
    <div className="space-y-6">
      {!embedded && <h1 className="font-display text-[28px] font-normal text-foreground">Categories</h1>}
      <Skeleton className="h-[400px] w-full" />
    </div>
  );

  if (isLoading) {
    return embedded ? loadingView : <MainLayout>{loadingView}</MainLayout>;
  }

  const mainView = (
    <>
      <div className="space-y-6">
        {!embedded && <h1 className="font-display text-[28px] font-normal text-foreground">Categories</h1>}
        <DataTable
          data={categories}
          columns={columns}
          searchPlaceholder="Search categories..."
          onAdd={() => setIsAddModalOpen(true)}
          addButtonText="Add Category"
          onServerSearch={handleServerSearch}
          isSearching={isFetching}
          exportFilename="categories"
          idKey="id"
          onRowClick={handleRowClick}
          serverPagination={{ total, page, pageSize: PAGE_SIZE, onPageChange: setPage }}
          onExportAll={handleExportAll}
        />
      </div>
      <AddCategoryModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
    </>
  );

  return embedded ? mainView : <MainLayout>{mainView}</MainLayout>;
}
