import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable, DataTableSkeleton } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategory, useCategoryItems } from "@/hooks/queries";
import type { ItemWithRelations } from "@/types/domain.types";

export default function CategoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const categoryId = id || "";

  const { data: category, isLoading: isCategoryLoading } = useCategory(categoryId);
  const { data: itemsResult, isLoading: isItemsLoading } = useCategoryItems(categoryId);

  const items = itemsResult?.data ?? [];
  const totalItems = itemsResult?.total ?? 0;

  const columns = [
    { key: "item_id", header: "Part Number" },
    {
      key: "description",
      header: "Description",
      render: (item: ItemWithRelations) => (
        <span className="block max-w-[400px] truncate" title={item.description || ""}>
          {item.description || "-"}
        </span>
      ),
    },
    {
      key: "locations",
      header: "Locations",
      render: (item: ItemWithRelations) => {
        const locs = item.locations ?? [];
        if (locs.length === 0) return <span className="text-muted-foreground">-</span>;
        return locs.join(", ");
      },
    },
    {
      key: "total_quantity",
      header: "Qty in Stock",
      render: (item: ItemWithRelations) => {
        const qty = (item as Record<string, unknown>).total_quantity as number;
        if (!qty) return <span className="text-muted-foreground italic">Not in stock</span>;
        return <span className="tabular-nums">{qty}</span>;
      },
    },
  ];

  const handleRowClick = (item: ItemWithRelations) => {
    navigate(`/items/${item.id}`);
  };

  if (isCategoryLoading) {
    return (
      <MainLayout>
        <div className="space-y-6 px-1 pt-2">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-8 w-48" />
          </div>
          <DataTableSkeleton columns={4} rows={8} />
        </div>
      </MainLayout>
    );
  }

  if (!category) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <p className="text-muted-foreground">Category not found</p>
          <Button onClick={() => navigate("/settings")}>Back to Settings</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 px-1 pt-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[28px] font-normal text-foreground">
              {category.name}
            </h1>
            <div className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm tabular-nums text-muted-foreground">
                {totalItems} item{totalItems !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {isItemsLoading ? (
          <DataTableSkeleton columns={4} rows={8} />
        ) : (
          <DataTable
            data={items}
            columns={columns}
            searchPlaceholder="Search items in this category..."
            searchKeys={["item_id", "description"]}
            onRowClick={handleRowClick}
            idKey="id"
            exportFilename={`category-${category.name}-items`}
            exportColumns={[
              { key: "item_id", header: "Part Number" },
              { key: "description", header: "Description" },
              {
                key: "locations",
                header: "Locations",
                render: (item: ItemWithRelations) => (item.locations ?? []).join(", "),
              },
              {
                key: "total_quantity",
                header: "Qty in Stock",
                render: (item: ItemWithRelations) =>
                  String((item as Record<string, unknown>).total_quantity || 0),
              },
            ]}
          />
        )}
      </div>
    </MainLayout>
  );
}
