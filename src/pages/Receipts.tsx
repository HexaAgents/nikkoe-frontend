import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable, DataTableSkeleton } from "@/components/common/DataTable";
import { useReceipts, buildReceiptsQueryFn, receiptsQueryKeyBase } from "@/hooks/queries";
import { usePrefetchPages } from "@/hooks/usePrefetchPages";
import { fetchAllPages } from "@/lib/api";
import { AddReceiptForm } from "@/components/receipts/AddReceiptForm";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ReceiptWithRelations } from "@/types/domain.types";

const PAGE_SIZE = 20;

const receiptColumns = [
  {
    key: "dateTime",
    header: "Date/Time",
    render: (receipt: ReceiptWithRelations) => receipt.dateTime ? new Date(receipt.dateTime).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "—",
  },
  {
    key: "supplier",
    header: "Supplier",
    render: (receipt: ReceiptWithRelations) => receipt.suppliers?.name || "—",
  },
  {
    key: "reference",
    header: "Reference",
    render: (receipt: ReceiptWithRelations) => receipt.reference?.trim() || "—",
  },
];

const receiptExportColumns = [
  {
    key: "dateTime",
    header: "Date/Time",
    render: (r: ReceiptWithRelations) => r.dateTime ? new Date(r.dateTime).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "",
  },
  {
    key: "supplier",
    header: "Supplier",
    render: (r: ReceiptWithRelations) => r.suppliers?.name ?? "",
  },
  {
    key: "reference",
    header: "Reference",
    render: (r: ReceiptWithRelations) => r.reference?.trim() ?? "",
  },
  {
    key: "note",
    header: "Note",
    render: (r: ReceiptWithRelations) => r.note?.trim() ?? "",
  },
];

export default function ReceiptsPage() {
  const navigate = useNavigate();
  const [showVoided, setShowVoided] = useState(false);
  const [showReceiptsHistory, setShowReceiptsHistory] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);
  const isMobile = useIsMobile();

  const status = showVoided ? undefined : "ACTIVE";
  const search = searchQuery || undefined;

  const { data: result, isLoading, isFetching } = useReceipts(
    page, PAGE_SIZE, search, status, showReceiptsHistory,
  );

  const receipts = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  usePrefetchPages(
    receiptsQueryKeyBase(PAGE_SIZE, search, status),
    (p) => buildReceiptsQueryFn(p, PAGE_SIZE, search, status),
    page,
    totalPages,
  );

  const handleExportAll = useCallback(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (status) params.status = status;
    return fetchAllPages<ReceiptWithRelations>("/receipts/", params);
  }, [search, status]);

  const handleServerSearch = useCallback((q: string) => {
    setSearchQuery(q);
    setPage(1);
  }, []);

  const handleVoidedChange = useCallback((checked: boolean) => {
    setShowVoided(checked);
    setPage(1);
  }, []);

  const handleRowClick = (receipt: ReceiptWithRelations) => {
    navigate(`/receipts/${receipt.id}`);
  };

  return (
    <MainLayout>
      <div className="space-y-6 px-1 pt-2">
        <h1 className="font-display text-[28px] font-normal text-foreground">Receipts</h1>

        {isMobile ? (
          <>
            <Button
              className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg"
              onClick={() => setMobileFormOpen(true)}
              style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            >
              <Plus className="h-6 w-6" />
              <span className="sr-only">New receipt</span>
            </Button>
            <Drawer open={mobileFormOpen} onOpenChange={setMobileFormOpen}>
              <DrawerContent className="max-h-[85dvh]">
                <DrawerHeader>
                  <DrawerTitle>Add new receipt</DrawerTitle>
                </DrawerHeader>
                <div className="overflow-y-auto px-4 pb-6">
                  <AddReceiptForm variant="inline" onSuccessfulCreate={() => setMobileFormOpen(false)} />
                </div>
              </DrawerContent>
            </Drawer>
          </>
        ) : (
          <Card>
            <CardHeader className="border-b pb-6">
              <CardTitle>Add new receipt</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <AddReceiptForm variant="inline" />
            </CardContent>
          </Card>
        )}

        <div className="pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowReceiptsHistory((prev) => !prev)}
            aria-expanded={showReceiptsHistory}
          >
            {showReceiptsHistory ? "Hide recent receipts" : "Show recent receipts"}
          </Button>
        </div>

        {showReceiptsHistory &&
          (isLoading ? (
            <DataTableSkeleton columns={3} rows={8} />
          ) : (
            <DataTable
              data={receipts}
              columns={receiptColumns}
              searchPlaceholder="Search receipts..."
              onServerSearch={handleServerSearch}
              isSearching={isFetching}
              exportFilename="receipts"
              exportColumns={receiptExportColumns}
              onRowClick={handleRowClick}
              idKey="id"
              serverPagination={{ total, page, pageSize: PAGE_SIZE, onPageChange: setPage }}
              onExportAll={handleExportAll}
              rowClassName={(receipt) => (receipt.status === "VOIDED" ? "text-destructive" : "")}
              exportOptions={{ isVoided: (receipt) => receipt.status === "VOIDED" }}
              toolbarExtra={
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="showVoidedReceipts"
                    checked={showVoided}
                    onCheckedChange={(checked) => handleVoidedChange(checked === true)}
                  />
                  <Label htmlFor="showVoidedReceipts" className="cursor-pointer text-sm text-muted-foreground">
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
