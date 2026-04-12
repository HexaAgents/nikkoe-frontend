import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable, DataTableSkeleton } from "@/components/common/DataTable";
import { useSales, buildSalesQueryFn, salesQueryKeyBase } from "@/hooks/queries";
import { usePrefetchPages } from "@/hooks/usePrefetchPages";
import { fetchAllPages } from "@/lib/api";
import { AddSaleForm } from "@/components/sales/AddSaleForm";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SaleWithRelations } from "@/types/domain.types";

const PAGE_SIZE = 20;

export default function SalesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);
  const isMobile = useIsMobile();

  const searchQuery = searchParams.get("search") ?? "";
  const showVoided = searchParams.get("voided") === "1";
  const showSalesHistory = searchParams.get("history") !== "0" || searchQuery !== "";

  const status = showVoided ? undefined : "ACTIVE";
  const search = searchQuery || undefined;

  const setSearchQuery = useCallback(
    (q: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (q) {
          next.set("search", q);
          next.set("history", "1");
        } else {
          next.delete("search");
        }
        return next;
      }, { replace: true });
      setPage(1);
    },
    [setSearchParams],
  );

  const setShowVoided = useCallback(
    (v: boolean) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (v) next.set("voided", "1");
        else next.delete("voided");
        return next;
      }, { replace: true });
      setPage(1);
    },
    [setSearchParams],
  );

  const setShowSalesHistory = useCallback(
    (show: boolean) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (show) {
          next.delete("history");
        } else {
          next.set("history", "0");
          next.delete("search");
          next.delete("voided");
        }
        return next;
      }, { replace: true });
      setPage(1);
    },
    [setSearchParams],
  );

  const { data: result, isLoading, isFetching } = useSales(
    page, PAGE_SIZE, search, status, showSalesHistory,
  );

  const sales = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  usePrefetchPages(
    salesQueryKeyBase(PAGE_SIZE, search, status),
    (p) => buildSalesQueryFn(p, PAGE_SIZE, search, status),
    page,
    totalPages,
  );

  const handleExportAll = useCallback(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (status) params.status = status;
    return fetchAllPages<SaleWithRelations>("/sales/", params);
  }, [search, status]);

  const columns = [
    {
      key: "customer",
      header: "Customer",
      render: (sale: SaleWithRelations) => sale.customers?.name || "—",
    },
    {
      key: "channel",
      header: "Channel",
      render: (sale: SaleWithRelations) => sale.channels?.name || "—",
    },
    {
      key: "date",
      header: "Date/Time",
      render: (sale: SaleWithRelations) => sale.date ? new Date(sale.date).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "—",
    },
  ];

  const handleRowClick = (sale: SaleWithRelations) => {
    navigate(`/sales/${sale.id}`);
  };

  return (
    <MainLayout>
      <div className="space-y-6 px-1 pt-2">
        <h1 className="font-display text-[28px] font-normal text-foreground">Sales</h1>

        {isMobile ? (
          <>
            <Button
              className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg"
              onClick={() => setMobileFormOpen(true)}
              style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            >
              <Plus className="h-6 w-6" />
              <span className="sr-only">New sale</span>
            </Button>
            <Drawer open={mobileFormOpen} onOpenChange={setMobileFormOpen}>
              <DrawerContent className="max-h-[85dvh]">
                <DrawerHeader>
                  <DrawerTitle>Add new sale</DrawerTitle>
                </DrawerHeader>
                <div className="overflow-y-auto px-4 pb-6">
                  <AddSaleForm variant="inline" onSuccessfulCreate={() => setMobileFormOpen(false)} />
                </div>
              </DrawerContent>
            </Drawer>
          </>
        ) : (
          <Card>
            <CardHeader className="border-b pb-6">
              <CardTitle className="text-lg font-bold">Add new sale</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <AddSaleForm variant="inline" />
            </CardContent>
          </Card>
        )}

        <div className="pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowSalesHistory(!showSalesHistory)}
            aria-expanded={showSalesHistory}
          >
            {showSalesHistory ? "Hide recent sales" : "Show recent sales"}
          </Button>
        </div>

        {showSalesHistory &&
          (isLoading ? (
            <DataTableSkeleton columns={3} rows={8} />
          ) : (
            <DataTable
              data={sales}
              columns={columns}
              searchPlaceholder="Search sales..."
              onServerSearch={setSearchQuery}
              defaultSearchValue={searchQuery}
              isSearching={isFetching}
              exportFilename="sales"
              onRowClick={handleRowClick}
              idKey="id"
              serverPagination={{ total, page, pageSize: PAGE_SIZE, onPageChange: setPage }}
              onExportAll={handleExportAll}
              rowClassName={(sale) => (sale.status === "VOIDED" ? "text-destructive" : "")}
              exportOptions={{ isVoided: (sale) => sale.status === "VOIDED" }}
              exportColumns={[
                { key: "customer", header: "Customer", render: (sale: SaleWithRelations) => sale.customers?.name || "" },
                { key: "channel", header: "Channel", render: (sale: SaleWithRelations) => sale.channels?.name || "" },
                { key: "date", header: "Date/Time", render: (sale: SaleWithRelations) => sale.date ? new Date(sale.date).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "" },
                { key: "status", header: "Status" },
                { key: "note", header: "Note" },
                { key: "void_reason", header: "Void Reason" },
                { key: "voided_at", header: "Voided At", render: (sale: SaleWithRelations) => (sale.voided_at ? new Date(sale.voided_at).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "") },
              ]}
              toolbarExtra={
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="showVoided"
                    checked={showVoided}
                    onCheckedChange={(checked) => setShowVoided(checked === true)}
                  />
                  <Label htmlFor="showVoided" className="cursor-pointer text-sm text-muted-foreground">
                    Show Voided
                  </Label>
                </div>
              }
            />
          ))}
      </div>
    </MainLayout>
  );
}
