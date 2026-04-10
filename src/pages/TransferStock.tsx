import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, ChevronDown } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchablePartPicker } from "@/components/common/SearchablePartPicker";
import { SearchableLocationPicker } from "@/components/common/SearchableLocationPicker";
import { useItemInventory, useItem, useLocations, useMovementsPaginated } from "@/hooks/queries";
import { useItemsBySearchId } from "@/hooks/queries";
import { useCrossTransferStock } from "@/hooks/mutations";
import type { Transfer } from "@/types/domain.types";

export default function TransferStockPage() {
  const navigate = useNavigate();
  const crossTransfer = useCrossTransferStock();
  const { data: allLocations } = useLocations();

  const [fromItemId, setFromItemId] = useState("");
  const [fromLocationId, setFromLocationId] = useState("");
  const [toItemId, setToItemId] = useState("");
  const [toLocationId, setToLocationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const { data: fromItem } = useItem(fromItemId);
  const { data: fromInventory } = useItemInventory(fromItemId);
  const { data: toItem } = useItem(toItemId);
  const { data: toInventory } = useItemInventory(toItemId);

  const searchId = fromItem?.search_id ?? "";
  const { data: matchingItems } = useItemsBySearchId(searchId);

  const autoMatchedForItem = useRef("");
  useEffect(() => {
    if (!fromItemId || !matchingItems || matchingItems.length === 0) return;
    if (autoMatchedForItem.current === fromItemId) return;
    const other = matchingItems.find((m) => String(m.id) !== fromItemId);
    if (other) {
      setToItemId(String(other.id));
      setToLocationId("");
      toAutoSelected.current = false;
      autoMatchedForItem.current = fromItemId;
    }
  }, [fromItemId, matchingItems]);

  const fromLocations = useMemo(() => {
    if (!fromItemId || !fromInventory || fromInventory.length === 0) return allLocations?.map((l) => ({ location_id: String(l.id), location_code: l.code }));
    return fromInventory.map((row) => ({
      location_id: String(row.location_id),
      location_code: `${row.location?.code ?? `Location ${row.location_id}`} (${row.quantity ?? 0})`,
    }));
  }, [fromItemId, fromInventory, allLocations]);

  const toLocations = useMemo(() => {
    if (!toItemId || !toInventory || toInventory.length === 0) return allLocations?.map((l) => ({ location_id: String(l.id), location_code: l.code }));
    return toInventory.map((row) => ({
      location_id: String(row.location_id),
      location_code: `${row.location?.code ?? `Location ${row.location_id}`} (${row.quantity ?? 0})`,
    }));
  }, [toItemId, toInventory, allLocations]);

  const fromAutoSelected = useRef(false);
  useEffect(() => {
    if (!fromItemId || !fromInventory || fromInventory.length === 0) {
      fromAutoSelected.current = false;
      return;
    }
    if (fromAutoSelected.current) return;
    const withStock = [...fromInventory].filter((r) => (r.quantity ?? 0) > 0).sort((a, b) => (b.quantity ?? 0) - (a.quantity ?? 0));
    const best = withStock[0] ?? fromInventory[0];
    if (best) {
      setFromLocationId(String(best.location_id));
      fromAutoSelected.current = true;
    }
  }, [fromItemId, fromInventory]);

  const toAutoSelected = useRef(false);
  useEffect(() => {
    if (!toItemId || !toInventory || toInventory.length === 0) {
      toAutoSelected.current = false;
      return;
    }
    if (toAutoSelected.current) return;
    const withStock = [...toInventory].filter((r) => (r.quantity ?? 0) > 0).sort((a, b) => (b.quantity ?? 0) - (a.quantity ?? 0));
    const best = withStock[0] ?? toInventory[0];
    if (best) {
      setToLocationId(String(best.location_id));
      toAutoSelected.current = true;
    }
  }, [toItemId, toInventory]);

  const availableQty = useMemo(() => {
    if (!fromLocationId || !fromInventory) return null;
    const row = fromInventory.find((r) => String(r.location_id) === fromLocationId);
    return row?.quantity ?? 0;
  }, [fromInventory, fromLocationId]);

  const parsedQty = Number(quantity);
  const exceedsStock = availableQty != null && Number.isFinite(parsedQty) && parsedQty > availableQty;

  const errors = useMemo(() => {
    const e: string[] = [];
    if (!fromItemId) e.push("From Part Number");
    if (!fromLocationId) e.push("From Location");
    if (!toItemId) e.push("To Part Number");
    if (!toLocationId) e.push("To Location");
    if (!quantity || parsedQty <= 0) e.push("Quantity");
    if (exceedsStock) e.push("Exceeds stock");
    return e;
  }, [fromItemId, fromLocationId, toItemId, toLocationId, quantity, parsedQty, exceedsStock]);

  const handleFromPartSelect = useCallback((id: string) => {
    setFromItemId(id);
    setFromLocationId("");
    fromAutoSelected.current = false;
    autoMatchedForItem.current = "";
  }, []);

  const handleToPartSelect = useCallback((id: string) => {
    setToItemId(id);
    setToLocationId("");
    toAutoSelected.current = false;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (errors.length > 0) {
      setShowErrors(true);
      return;
    }
    await crossTransfer.mutateAsync({
      from_item_id: Number(fromItemId),
      from_location_id: Number(fromLocationId),
      to_item_id: Number(toItemId),
      to_location_id: Number(toLocationId),
      quantity: parsedQty,
      notes: notes || undefined,
    });
    navigate("/items");
  };

  const handleClear = () => {
    setFromItemId("");
    setFromLocationId("");
    setToItemId("");
    setToLocationId("");
    setQuantity("");
    setNotes("");
    setShowErrors(false);
    fromAutoSelected.current = false;
    toAutoSelected.current = false;
    autoMatchedForItem.current = "";
  };

  const PREVIEW_ROWS = 5;
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);

  const { data: historyResult } = useMovementsPaginated(1, showAllHistory ? 50 : PREVIEW_ROWS);
  const historyRows = historyResult?.data ?? [];
  const historyTotal = historyResult?.total ?? 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/items")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Items
          </Button>
          <h1 className="font-display text-[28px] font-normal text-foreground">Transfer Stock</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-base">From</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className={showErrors && !fromItemId ? "text-destructive" : ""}>Part Number</Label>
                  <SearchablePartPicker
                    value={fromItemId}
                    onSelect={handleFromPartSelect}
                    hasError={showErrors && !fromItemId}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={showErrors && !fromLocationId ? "text-destructive" : ""}>Location</Label>
                  <SearchableLocationPicker
                    locations={fromLocations}
                    value={fromLocationId}
                    onSelect={(id) => setFromLocationId(id)}
                    hasError={showErrors && !fromLocationId}
                  />
                </div>
                {availableQty != null && (
                  <div className="rounded-md border bg-muted/30 px-3 py-2">
                    <span className="text-sm text-muted-foreground">Available: </span>
                    <span className="text-sm font-medium tabular-nums">{availableQty}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b pb-4">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">To</CardTitle>
                  {matchingItems && matchingItems.length > 1 && (
                    <span className="text-xs text-muted-foreground">
                      ({matchingItems.length} items share this search ID)
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className={showErrors && !toItemId ? "text-destructive" : ""}>Part Number</Label>
                  <SearchablePartPicker
                    value={toItemId}
                    onSelect={handleToPartSelect}
                    hasError={showErrors && !toItemId}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={showErrors && !toLocationId ? "text-destructive" : ""}>Location</Label>
                  <SearchableLocationPicker
                    locations={toLocations}
                    value={toLocationId}
                    onSelect={(id) => setToLocationId(id)}
                    hasError={showErrors && !toLocationId}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardContent className="flex flex-wrap items-end gap-6 pt-6">
              <div className="w-32 space-y-2">
                <Label className={showErrors && (!quantity || parsedQty <= 0 || exceedsStock) ? "text-destructive" : ""}>
                  Quantity
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={availableQty ?? undefined}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={exceedsStock ? "border-destructive" : ""}
                />
                {exceedsStock && (
                  <p className="text-xs text-destructive">Exceeds available ({availableQty})</p>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Reason for transfer..."
                  rows={1}
                  className="min-h-[36px] resize-none"
                />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={handleClear}>Clear</Button>
                <Button type="submit" disabled={crossTransfer.isPending}>
                  {crossTransfer.isPending ? "Transferring..." : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Transfer Stock
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {showErrors && errors.length > 0 && (
            <p className="mt-3 text-sm text-destructive">Missing: {errors.join(", ")}</p>
          )}
        </form>

        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base">Transfer History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quantity</TableHead>
                  <TableHead>From Item</TableHead>
                  <TableHead>To Item</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No transfers yet
                    </TableCell>
                  </TableRow>
                ) : (
                  historyRows.map((t) => (
                    <TableRow
                      key={t.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedTransfer(t)}
                    >
                      <TableCell className="tabular-nums">{t.quantity}</TableCell>
                      <TableCell className="font-medium">{t.from_item?.item_id ?? "-"}</TableCell>
                      <TableCell className="font-medium">{t.to_item?.item_id ?? "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {t.date ? new Date(t.date).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {!showAllHistory && historyTotal > PREVIEW_ROWS && (
              <div className="border-t px-4 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => setShowAllHistory(true)}
                >
                  <ChevronDown className="mr-2 h-4 w-4" />
                  See all {historyTotal} transfers
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedTransfer} onOpenChange={(open) => { if (!open) setSelectedTransfer(null); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Transfer Details</DialogTitle>
          </DialogHeader>
          {selectedTransfer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">From</h4>
                  <div>
                    <p className="text-xs text-muted-foreground">Item</p>
                    <p className="text-sm font-medium">{selectedTransfer.from_item?.item_id ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-medium">{selectedTransfer.from_location?.code ?? "-"}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">To</h4>
                  <div>
                    <p className="text-xs text-muted-foreground">Item</p>
                    <p className="text-sm font-medium">{selectedTransfer.to_item?.item_id ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-medium">{selectedTransfer.to_location?.code ?? "-"}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p className="text-sm font-medium tabular-nums">{selectedTransfer.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium">
                    {selectedTransfer.date
                      ? new Date(selectedTransfer.date).toLocaleString("en-GB", { timeZone: "Europe/London" })
                      : "-"}
                  </p>
                </div>
              </div>
              {selectedTransfer.users && (
                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground">Transferred by</p>
                  <p className="text-sm font-medium">
                    {selectedTransfer.users.first_name} {selectedTransfer.users.last_name}
                  </p>
                </div>
              )}
              {selectedTransfer.notes && (
                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedTransfer.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
