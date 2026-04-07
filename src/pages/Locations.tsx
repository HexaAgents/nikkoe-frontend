import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/common/DataTable";
import {
  useLocationsPaginated,
  buildLocationsQueryFn,
  locationsPageQueryKeyBase,
} from "@/hooks/queries";
import { usePrefetchPages } from "@/hooks/usePrefetchPages";
import { fetchAllPages } from "@/lib/api";
import { AddLocationModal } from "@/components/modals/AddLocationModal";
import { Skeleton } from "@/components/ui/skeleton";
import type { Location } from "@/types/domain.types";

const PAGE_SIZE = 20;

interface LocationsPageProps {
  embedded?: boolean;
}

export default function LocationsPage({ embedded = false }: LocationsPageProps) {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const search = searchQuery || undefined;

  const { data: result, isLoading, isFetching } = useLocationsPaginated(page, PAGE_SIZE, search);

  const locations = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  usePrefetchPages(
    locationsPageQueryKeyBase(PAGE_SIZE, search),
    (p) => buildLocationsQueryFn(p, PAGE_SIZE, search),
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
    return fetchAllPages<Location>("/locations/", params);
  }, [search]);

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
          data={locations}
          columns={columns}
          searchPlaceholder="Search locations..."
          onAdd={() => setIsAddModalOpen(true)}
          addButtonText="Add Location"
          onServerSearch={handleServerSearch}
          isSearching={isFetching}
          exportFilename="locations"
          idKey="id"
          onRowClick={(location: Location) => navigate(`/locations/${location.id}`)}
          serverPagination={{ total, page, pageSize: PAGE_SIZE, onPageChange: setPage }}
          onExportAll={handleExportAll}
        />
      </div>
      <AddLocationModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
    </>
  );

  return embedded ? mainView : <MainLayout>{mainView}</MainLayout>;
}
