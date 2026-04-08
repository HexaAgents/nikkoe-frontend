import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { exportToExcel } from "@/lib/exportToExcel";

interface StockValuationRow {
  item_id: string;
  description: string | null;
  total_quantity: number;
  unit_price: number | null;
  stock_valuation: number | null;
}

export function StockValuationExport() {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<StockValuationRow[]>("/inventory/stock-valuation");

      if (!data.length) {
        toast.info("No inventory data to export");
        return;
      }

      await exportToExcel(
        data as unknown as Record<string, unknown>[],
        [
          { key: "item_id", header: "Part Number" },
          { key: "description", header: "Description" },
          { key: "total_quantity", header: "Total Stock" },
          { key: "unit_price", header: "Unit Price" },
          { key: "stock_valuation", header: "Stock Valuation" },
        ],
        "stock_valuation",
      );

      toast.success("Stock valuation report downloaded");
    } catch {
      toast.error("Failed to download stock valuation report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="border-b pb-6">
        <CardTitle>Stock Valuation Report</CardTitle>
        <CardDescription>
          Download an Excel spreadsheet with each item's part number, total stock,
          unit price (from last receipt), and stock valuation.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Button onClick={handleDownload} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Download Report
        </Button>
      </CardContent>
    </Card>
  );
}
