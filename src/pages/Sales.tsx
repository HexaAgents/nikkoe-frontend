import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/common/DataTable";
import { useSales, buildSalesQueryFn, salesQueryKeyBase } from "@/hooks/queries";
import { usePrefetchPages } from "@/hooks/usePrefetchPages";
import { AddSaleForm } from "@/components/sales/AddSaleForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SaleWithRelations } from "@/types/domain.types";

const PAGE_SIZE = 20;

export default function SalesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);

  const searchQuery = searchParams.get("search") ?? "";
  const showVoided = searchParams.get("voided") === "1";
  const showSalesHistory = searchParams.get("history") === "1" || searchQuery !== "";

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
        if (show) next.set("history", "1");
        else {
          next.delete("history");
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
      render: (sale: SaleWithRelations) => sale.date ? new Date(sale.date).toLocaleString() : "—",
    },
  ];

  const handleRowClick = (sale: SaleWithRelations) => {
    navigate(`/sales/${sale.id}`);
  };

  return (
    <MainLayout>
      <div className="space-y-6 px-1 pt-2">
        <h1 className="font-display text-[28px] font-normal text-foreground">Sales</h1>

        <Card>
          <CardHeader className="border-b pb-6">
            <CardTitle className="text-lg font-bold">Add new sale</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <AddSaleForm variant="inline" />
          </CardContent>
        </Card>

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
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <DataTable
              data={sales}
              columns={columns}
              searchPlaceholder="Search by part number..."
              onServerSearch={setSearchQuery}
              defaultSearchValue={searchQuery}
              isSearching={isFetching}
              exportFilename="sales"
              onRowClick={handleRowClick}
              idKey="id"
              serverPagination={{ total, page, pageSize: PAGE_SIZE, onPageChange: setPage }}
              rowClassName={(sale) => (sale.status === "VOIDED" ? "text-destructive" : "")}
              exportOptions={{ isVoided: (sale) => sale.status === "VOIDED" }}
              exportColumns={[
                { key: "customer", header: "Customer", render: (sale: SaleWithRelations) => sale.customers?.name || "" },
                { key: "channel", header: "Channel", render: (sale: SaleWithRelations) => sale.channels?.name || "" },
                { key: "date", header: "Date/Time", render: (sale: SaleWithRelations) => sale.date ? new Date(sale.date).toLocaleString() : "" },
                { key: "status", header: "Status" },
                { key: "note", header: "Note" },
                { key: "void_reason", header: "Void Reason" },
                { key: "voided_at", header: "Voided At", render: (sale: SaleWithRelations) => (sale.voided_at ? new Date(sale.voided_at).toLocaleString() : "") },
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
