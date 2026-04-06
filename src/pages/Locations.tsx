import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/common/DataTable";
import { useLocations } from "@/hooks/queries";
import { AddLocationModal } from "@/components/modals/AddLocationModal";
import { Skeleton } from "@/components/ui/skeleton";

interface LocationsPageProps {
  embedded?: boolean;
}

export default function LocationsPage({ embedded = false }: LocationsPageProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { data: locations, isLoading } = useLocations();

  const columns = [
    { key: "code", header: "Location" },
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
        />
      </div>
      <AddLocationModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
    </>
  );

  return embedded ? mainView : <MainLayout>{mainView}</MainLayout>;
}
