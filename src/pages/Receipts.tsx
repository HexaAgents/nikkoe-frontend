import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/common/DataTable";
import { useReceipts } from "@/hooks/queries";
import { AddReceiptForm } from "@/components/receipts/AddReceiptForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReceiptWithRelations } from "@/types/domain.types";

const receiptColumns = [
  {
    key: "dateTime",
    header: "Date/Time",
    render: (receipt: ReceiptWithRelations) => receipt.dateTime ? new Date(receipt.dateTime).toLocaleString() : "—",
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
    render: (r: ReceiptWithRelations) => r.dateTime ? new Date(r.dateTime).toLocaleString() : "",
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
  const [showReceiptsHistory, setShowReceiptsHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: receipts, isLoading, isFetching } = useReceipts(searchQuery || undefined, showReceiptsHistory);

  const filteredReceipts = useMemo(() => {
    if (!receipts) return [];
    return showVoided ? receipts : receipts.filter((r) => r.status !== "VOIDED");
  }, [receipts, showVoided]);

  const handleRowClick = (receipt: ReceiptWithRelations) => {
    navigate(`/receipts/${receipt.id}`);
  };

  return (
    <MainLayout>
      <div className="space-y-6 px-1 pt-2">
        <h1 className="font-display text-[28px] font-normal text-foreground">Receipts</h1>

        <Card>
          <CardHeader className="border-b pb-6">
            <CardTitle>Add new receipt</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <AddReceiptForm variant="inline" />
          </CardContent>
        </Card>

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
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <DataTable
              data={filteredReceipts}
              columns={receiptColumns}
              searchPlaceholder="Search by part number..."
              onServerSearch={setSearchQuery}
              isSearching={isFetching}
              exportFilename="receipts"
              exportColumns={receiptExportColumns}
              onRowClick={handleRowClick}
              idKey="id"
              rowClassName={(receipt) => (receipt.status === "VOIDED" ? "text-destructive" : "")}
              exportOptions={{ isVoided: (receipt) => receipt.status === "VOIDED" }}
              toolbarExtra={
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="showVoidedReceipts"
                    checked={showVoided}
                    onCheckedChange={(checked) => setShowVoided(checked === true)}
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
