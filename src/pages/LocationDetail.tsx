import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable, DataTableSkeleton } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { useLocations, useLocationItems } from "@/hooks/queries";
import type { LocationItem } from "@/types/domain.types";

export default function LocationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const locationId = parseInt(id || "0");

  const { data: locations } = useLocations();
  const { data: items, isLoading } = useLocationItems(locationId);

  const location = locations?.find((l) => l.id === locationId);

  const columns = [
    { key: "item_id", header: "Part Number" },
    { key: "description", header: "Description", className: "max-w-[300px] truncate", render: (item: LocationItem) => item.description || "-" },
    { key: "category", header: "Category", render: (item: LocationItem) => item.category || "-" },
    {
      key: "quantity",
      header: "Quantity",
      render: (item: LocationItem) => (
        <span className="tabular-nums">{item.quantity}</span>
      ),
    },
    {
      key: "last_unit_price",
      header: "Last Unit Price",
      render: (item: LocationItem) => (
        <span className="tabular-nums">
          {item.last_unit_price != null ? item.last_unit_price.toFixed(2) : "-"}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6 px-1 pt-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon-sm" onClick={() => navigate("/settings?section=locations")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-display text-[28px] font-normal text-foreground">
              {location?.code ?? "Location"}
            </h1>
          </div>
          <DataTableSkeleton columns={5} />
        </div>
      </MainLayout>
    );
  }

  if (!items) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <p className="text-muted-foreground">Location not found</p>
          <Button onClick={() => navigate("/settings?section=locations")}>Back to Locations</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 px-1 pt-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate("/settings?section=locations")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-[28px] font-normal text-foreground">
              {location?.code ?? "Location"}
            </h1>
            <p className="text-[13px] text-muted-foreground">
              {items.length} item{items.length !== 1 ? "s" : ""} in stock
            </p>
          </div>
        </div>

        <DataTable
          data={items}
          columns={columns}
          searchPlaceholder="Search items..."
          searchKeys={["item_id", "description", "category"]}
          onRowClick={(item: LocationItem) => navigate(`/items/${item.id}`)}
          exportFilename={`location-${location?.code ?? id}-items`}
          idKey="id"
        />
      </div>
    </MainLayout>
  );
}
