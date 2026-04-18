import { useState, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSuppliers, useCurrencies } from "@/hooks/queries";
import { useAddSupplierQuote } from "@/hooks/mutations";
import { SearchablePartPicker } from "@/components/common/SearchablePartPicker";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface QuoteLine {
  key: number;
  item_id: string;
  cost: string;
  currency_id: string;
  note: string;
}

let lineKeyCounter = 0;
function nextKey() {
  return ++lineKeyCounter;
}

function emptyLine(): QuoteLine {
  return { key: nextKey(), item_id: "", cost: "", currency_id: "", note: "" };
}

export default function Quotes() {
  const { data: suppliers } = useSuppliers();
  const { data: currencies } = useCurrencies();
  const addQuote = useAddSupplierQuote();

  const [supplierId, setSupplierId] = useState("");
  const [dateTime, setDateTime] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [lines, setLines] = useState<QuoteLine[]>([emptyLine()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addLine = useCallback(() => {
    setLines((prev) => [...prev, emptyLine()]);
  }, []);

  const removeLine = useCallback((key: number) => {
    setLines((prev) => {
      const next = prev.filter((l) => l.key !== key);
      return next.length === 0 ? [emptyLine()] : next;
    });
  }, []);

  const updateLine = useCallback(
    (key: number, field: keyof Omit<QuoteLine, "key">, value: string) => {
      setLines((prev) =>
        prev.map((l) => (l.key === key ? { ...l, [field]: value } : l)),
      );
    },
    [],
  );

  const validLines = lines.filter((l) => l.item_id && l.cost && l.currency_id);
  const canSubmit =
    supplierId && dateTime && validLines.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    let successCount = 0;
    let failCount = 0;

    for (const line of validLines) {
      try {
        await addQuote.mutateAsync({
          item_id: parseInt(line.item_id),
          supplier_id: parseInt(supplierId),
          cost: parseFloat(line.cost),
          currency_id: parseInt(line.currency_id),
          date_time: new Date(dateTime).toISOString(),
          note: line.note || undefined,
        });
        successCount++;
      } catch {
        failCount++;
      }
    }

    setIsSubmitting(false);

    if (successCount > 0 && failCount === 0) {
      toast.success(`${successCount} quote${successCount > 1 ? "s" : ""} added successfully`);
      setLines([emptyLine()]);
    } else if (successCount > 0) {
      toast.warning(
        `${successCount} added, ${failCount} failed`,
      );
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="font-display text-[28px] font-normal text-foreground">
          Supplier Quotes
        </h1>

        <Card>
          <CardHeader className="border-b pb-6">
            <CardTitle>Quote Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Supplier</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b pb-6">
            <CardTitle>Items</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={addLine}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="hidden grid-cols-[1fr_120px_110px_1fr_40px] items-end gap-3 sm:grid">
                <Label className="text-xs text-muted-foreground">Part</Label>
                <Label className="text-xs text-muted-foreground">
                  Unit Cost
                </Label>
                <Label className="text-xs text-muted-foreground">
                  Currency
                </Label>
                <Label className="text-xs text-muted-foreground">
                  Note (optional)
                </Label>
                <div />
              </div>

              {lines.map((line) => (
                <div
                  key={line.key}
                  className="grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-[1fr_120px_110px_1fr_40px] sm:border-0 sm:p-0"
                >
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground sm:hidden">
                      Part
                    </Label>
                    <SearchablePartPicker
                      value={line.item_id}
                      onSelect={(id) => updateLine(line.key, "item_id", id)}
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground sm:hidden">
                      Unit Cost
                    </Label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="0.000"
                      value={line.cost}
                      onChange={(e) =>
                        updateLine(line.key, "cost", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground sm:hidden">
                      Currency
                    </Label>
                    <Select
                      value={line.currency_id}
                      onValueChange={(v) => updateLine(line.key, "currency_id", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies?.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground sm:hidden">
                      Note
                    </Label>
                    <Input
                      placeholder="Optional note"
                      value={line.note}
                      onChange={(e) =>
                        updateLine(line.key, "note", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-end sm:justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeLine(line.key)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between border-t pt-6">
              <p className="text-sm text-muted-foreground">
                {validLines.length} item{validLines.length !== 1 ? "s" : ""}{" "}
                ready
              </p>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting
                  ? "Submitting..."
                  : `Add ${validLines.length || ""} Quote${validLines.length !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="h-[400px] shrink-0" aria-hidden="true" />
      </div>
    </MainLayout>
  );
}
