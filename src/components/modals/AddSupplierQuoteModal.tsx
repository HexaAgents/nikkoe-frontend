import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useSuppliers } from "@/hooks/queries";
import { useAddSupplierQuote } from "@/hooks/mutations";

interface AddSupplierQuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: number;
}

export function AddSupplierQuoteModal({ open, onOpenChange, itemId }: AddSupplierQuoteModalProps) {
  const { data: suppliers } = useSuppliers();
  const addQuote = useAddSupplierQuote();
  const [formData, setFormData] = useState({
    supplier_id: "",
    unit_cost: "",
    currency: "GBP",
    quoted_at: new Date().toISOString().split("T")[0],
    note: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addQuote.mutateAsync({
      item_id: itemId,
      supplier_id: parseInt(formData.supplier_id),
      unit_cost: parseFloat(formData.unit_cost),
      currency: formData.currency,
      quoted_at: formData.quoted_at ? new Date(formData.quoted_at).toISOString() : undefined,
      note: formData.note || undefined,
    });
    setFormData({
      supplier_id: "",
      unit_cost: "",
      currency: "GBP",
      quoted_at: new Date().toISOString().split("T")[0],
      note: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Supplier Quote</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((s) => (
                    <SelectItem key={s.supplier_id} value={String(s.supplier_id)}>
                      {s.supplier_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quoted_at">Date</Label>
              <Input
                id="quoted_at"
                type="date"
                value={formData.quoted_at}
                onChange={(e) => setFormData({ ...formData, quoted_at: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unitCost">Unit Cost</Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Input
                id="note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addQuote.isPending}>
              {addQuote.isPending ? "Adding..." : "Add Quote"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
