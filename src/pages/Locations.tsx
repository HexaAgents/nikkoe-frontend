import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/common/DataTable";
import { useLocations } from "@/hooks/queries";
import { AddLocationModal } from "@/components/modals/AddLocationModal";
import { Skeleton } from "@/components/ui/skeleton";
import type { Location } from "@/types/domain.types";

interface LocationsPageProps {
  embedded?: boolean;
}

export default function LocationsPage({ embedded = false }: LocationsPageProps) {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { data: locations, isLoading } = useLocations();

  const columns = [
    { key: "code", header: "Location" },
    { key: "total_quantity", header: "Total Qty", render: (loc: Location) => (loc.total_quantity ?? 0).toLocaleString() },
  ];

  const loadingView = (
    <div className="space-y-6">
      {!embedded && <h1 className="font-display text-[28px] font-normal text-foreground">Locations</h1>}
      <Skeleton className="h-[400px] w-full" />
    </div>
  );

  if (isLoading) {
    return embedded ? loadingView : <MainLayout>{loadingView}</MainLayout>;
  }

  const mainView = (
    <>
      <div className="space-y-6">
        {!embedded && <h1 className="font-display text-[28px] font-normal text-foreground">Locations</h1>}
        <DataTable
          data={locations || []}
          columns={columns}
          searchPlaceholder="Search locations..."
          onAdd={() => setIsAddModalOpen(true)}
          addButtonText="Add Location"
          searchKeys={["code"]}
          exportFilename="locations"
          idKey="id"
          onRowClick={(location: Location) => navigate(`/locations/${location.id}`)}
        />
      </div>
      <AddLocationModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
    </>
  );

  return embedded ? mainView : <MainLayout>{mainView}</MainLayout>;
}
