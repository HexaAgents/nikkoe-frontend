import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/common/DataTable";
import { useInventoryMovements } from "@/hooks/queries";
import { Skeleton } from "@/components/ui/skeleton";
import type { InventoryMovementWithRelations } from "@/types/domain.types";

interface LogPageProps {
  embedded?: boolean;
}

export default function LogPage({ embedded = false }: LogPageProps) {
  const { data: movements, isLoading } = useInventoryMovements();

  const columns = [
    { key: "movement_id", header: "ID" },
    {
      key: "moved_at",
      header: "Date/Time",
      render: (m: InventoryMovementWithRelations) => new Date(m.moved_at).toLocaleString(),
    },
    { key: "movement_type", header: "Type" },
    {
      key: "item",
      header: "Item",
      render: (m: InventoryMovementWithRelations) => m.items?.part_number || "-",
    },
    { key: "quantity", header: "Qty" },
    {
      key: "from",
      header: "From",
      render: (m: InventoryMovementWithRelations) => m.from_location?.location_code || "-",
    },
    {
      key: "to",
      header: "To",
      render: (m: InventoryMovementWithRelations) => m.to_location?.location_code || "-",
    },
    {
      key: "user",
      header: "User",
      render: (m: InventoryMovementWithRelations) => m.users?.name || "-",
    },
    {
      key: "reference",
      header: "Reference",
      render: (m: InventoryMovementWithRelations) => {
        if (m.receipt_id) return `Receipt #${m.receipt_id}`;
        if (m.sale_id) return `Sale #${m.sale_id}`;
        return "-";
      },
    },
    { key: "note", header: "Note", render: (m: InventoryMovementWithRelations) => m.note || "-" },
  ];

  const exportColumns = [
    { key: "movement_id", header: "ID" },
    {
      key: "moved_at",
      header: "Date/Time",
      render: (m: InventoryMovementWithRelations) => new Date(m.moved_at).toLocaleString(),
    },
    { key: "movement_type", header: "Type" },
    {
      key: "item",
      header: "Item",
      render: (m: InventoryMovementWithRelations) => m.items?.part_number || "",
    },
    { key: "quantity", header: "Qty" },
    {
      key: "from",
      header: "From",
      render: (m: InventoryMovementWithRelations) => m.from_location?.location_code || "",
    },
    {
      key: "to",
      header: "To",
      render: (m: InventoryMovementWithRelations) => m.to_location?.location_code || "",
    },
    {
      key: "user",
      header: "User",
      render: (m: InventoryMovementWithRelations) => m.users?.name || "",
    },
    {
      key: "reference",
      header: "Reference",
      render: (m: InventoryMovementWithRelations) => {
        if (m.receipt_id) return `Receipt #${m.receipt_id}`;
        if (m.sale_id) return `Sale #${m.sale_id}`;
        return "";
      },
    },
    { key: "note", header: "Note", render: (m: InventoryMovementWithRelations) => m.note || "" },
  ];

  const loadingView = (
    <div className="space-y-6">
      {!embedded && <h1 className="font-display text-[28px] font-normal text-foreground">Log</h1>}
      <Skeleton className="h-[400px] w-full" />
    </div>
  );

  if (isLoading) {
    return embedded ? loadingView : <MainLayout>{loadingView}</MainLayout>;
  }

  const mainView = (
    <div className="space-y-6">
      {!embedded && <h1 className="font-display text-[28px] font-normal text-foreground">Log</h1>}
      <DataTable
        data={movements || []}
        columns={columns}
        searchPlaceholder="Search movements..."
        searchKeys={["movement_type", "note"]}
        exportFilename="inventory_movements"
        idKey="movement_id"
        exportColumns={exportColumns}
      />
    </div>
  );

  return embedded ? mainView : <MainLayout>{mainView}</MainLayout>;
}
