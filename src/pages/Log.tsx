import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/common/DataTable";
import { useInventoryMovements } from "@/hooks/useInventoryMovements";
import { Skeleton } from "@/components/ui/skeleton";

interface MovementWithRelations {
  movement_id: number;
  item_id: number;
  moved_at: string;
  movement_type: string;
  quantity: number;
  from_location_id: number | null;
  to_location_id: number | null;
  user_id: string | null;
  receipt_id: number | null;
  sale_id: number | null;
  note: string | null;
  receipt_line_id: number | null;
  reversed_by_movement_id: number | null;
  sale_line_id: number | null;
  items: { item_id: number; part_number: string } | null;
  from_location: { location_id: number; location_code: string } | null;
  to_location: { location_id: number; location_code: string } | null;
  users: { user_id: string; name: string } | null;
}

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
      render: (m: MovementWithRelations) => new Date(m.moved_at).toLocaleString(),
    },
    { key: "movement_type", header: "Type" },
    {
      key: "item",
      header: "Item",
      render: (m: MovementWithRelations) => m.items?.part_number || "-",
    },
    { key: "quantity", header: "Qty" },
    {
      key: "from",
      header: "From",
      render: (m: MovementWithRelations) => m.from_location?.location_code || "-",
    },
    {
      key: "to",
      header: "To",
      render: (m: MovementWithRelations) => m.to_location?.location_code || "-",
    },
    {
      key: "user",
      header: "User",
      render: (m: MovementWithRelations) => m.users?.name || "-",
    },
    {
      key: "reference",
      header: "Reference",
      render: (m: MovementWithRelations) => {
        if (m.receipt_id) return `Receipt #${m.receipt_id}`;
        if (m.sale_id) return `Sale #${m.sale_id}`;
        return "-";
      },
    },
    { key: "note", header: "Note", render: (m: MovementWithRelations) => m.note || "-" },
  ];

  const exportColumns = [
    { key: "movement_id", header: "ID" },
    {
      key: "moved_at",
      header: "Date/Time",
      render: (m: MovementWithRelations) => new Date(m.moved_at).toLocaleString(),
    },
    { key: "movement_type", header: "Type" },
    {
      key: "item",
      header: "Item",
      render: (m: MovementWithRelations) => m.items?.part_number || "",
    },
    { key: "quantity", header: "Qty" },
    {
      key: "from",
      header: "From",
      render: (m: MovementWithRelations) => m.from_location?.location_code || "",
    },
    {
      key: "to",
      header: "To",
      render: (m: MovementWithRelations) => m.to_location?.location_code || "",
    },
    {
      key: "user",
      header: "User",
      render: (m: MovementWithRelations) => m.users?.name || "",
    },
    {
      key: "reference",
      header: "Reference",
      render: (m: MovementWithRelations) => {
        if (m.receipt_id) return `Receipt #${m.receipt_id}`;
        if (m.sale_id) return `Sale #${m.sale_id}`;
        return "";
      },
    },
    { key: "note", header: "Note", render: (m: MovementWithRelations) => m.note || "" },
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
