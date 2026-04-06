import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableLocationPicker } from "@/components/common/SearchableLocationPicker";
import { useLocations } from "@/hooks/queries";
import { useTransferStock } from "@/hooks/mutations";
import type { StockWithLocation } from "@/types/domain.types";

interface TransferStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemPartNumber: string;
  fromStock: StockWithLocation;
}

export function TransferStockModal({
  open,
  onOpenChange,
  itemPartNumber,
  fromStock,
}: TransferStockModalProps) {
  const { data: locations } = useLocations();
  const transferStock = useTransferStock();
  const [toLocationId, setToLocationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const availableLocations = locations
    ?.filter((loc) => loc.id !== fromStock.location_id)
    .map((loc) => ({ location_id: loc.id, location_code: loc.code }));

  const parsedQty = parseInt(quantity);
  const isValid =
    toLocationId !== "" &&
    !isNaN(parsedQty) &&
    parsedQty > 0 &&
    parsedQty <= fromStock.quantity;

  const resetForm = () => {
    setToLocationId("");
    setQuantity("");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    await transferStock.mutateAsync({
      from_stock_id: fromStock.id,
      to_location_id: parseInt(toLocationId),
      quantity: parsedQty,
      notes: notes || undefined,
    });
    resetForm();
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transfer Stock</DialogTitle>
          <DialogDescription>{itemPartNumber}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-sm font-medium">From</Label>
                <p className="text-sm text-foreground rounded-md border px-3 py-2 bg-muted">
                  {fromStock.location?.code ?? "-"}
                </p>
              </div>
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Available</Label>
                <p className="text-sm text-foreground rounded-md border px-3 py-2 bg-muted tabular-nums">
                  {fromStock.quantity}
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Destination</Label>
              <SearchableLocationPicker
                locations={availableLocations}
                value={toLocationId}
                onSelect={setToLocationId}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="transfer-qty">Quantity</Label>
              <Input
                id="transfer-qty"
                type="number"
                min={1}
                max={fromStock.quantity}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={`Max ${fromStock.quantity}`}
                required
              />
              {quantity && parsedQty > fromStock.quantity && (
                <p className="text-xs text-destructive">
                  Cannot exceed available quantity ({fromStock.quantity})
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="transfer-notes">Notes (optional)</Label>
              <Textarea
                id="transfer-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for transfer..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || transferStock.isPending}
            >
              {transferStock.isPending ? "Transferring..." : "Transfer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
