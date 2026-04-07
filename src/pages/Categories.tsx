import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/common/DataTable";
import { useCategories } from "@/hooks/queries";
import { AddCategoryModal } from "@/components/modals/AddCategoryModal";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category } from "@/types/domain.types";

interface CategoriesPageProps {
  embedded?: boolean;
}

export default function CategoriesPage({ embedded = false }: CategoriesPageProps) {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { data: categories, isLoading } = useCategories();

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
          data={categories || []}
          columns={columns}
          searchPlaceholder="Search categories..."
          onAdd={() => setIsAddModalOpen(true)}
          addButtonText="Add Category"
          searchKeys={["name"]}
          exportFilename="categories"
          idKey="id"
          onRowClick={handleRowClick}
        />
      </div>
      <AddCategoryModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
    </>
  );

  return embedded ? mainView : <MainLayout>{mainView}</MainLayout>;
}
