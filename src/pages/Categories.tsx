import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/common/DataTable";
import { useCategories } from "@/hooks/queries";
import { AddCategoryModal } from "@/components/modals/AddCategoryModal";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoriesPageProps {
  embedded?: boolean;
}

export default function CategoriesPage({ embedded = false }: CategoriesPageProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { data: categories, isLoading } = useCategories();

  const columns = [
    { key: "name", header: "Name" },
  ];

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
          idKey="name"
        />
      </div>
      <AddCategoryModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
    </>
  );

  return embedded ? mainView : <MainLayout>{mainView}</MainLayout>;
}
