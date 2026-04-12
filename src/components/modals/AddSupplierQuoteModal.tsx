import { useState, useEffect } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
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
import type { ItemSupplierQuote } from "@/types/domain.types";

interface AddSupplierQuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: number;
  latestQuote?: ItemSupplierQuote;
}

export function AddSupplierQuoteModal({ open, onOpenChange, itemId, latestQuote }: AddSupplierQuoteModalProps) {
  const { data: suppliers } = useSuppliers();
  const { data: currencies } = useCurrencies();
  const addQuote = useAddSupplierQuote();
  const [formData, setFormData] = useState({
    supplier_id: "",
    cost: "",
    currency_id: "",
    date_time: new Date().toISOString().split("T")[0],
    note: "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        supplier_id: latestQuote ? String(latestQuote.supplier_id) : "",
        cost: latestQuote ? String(latestQuote.cost) : "",
        currency_id: latestQuote ? String(latestQuote.currency_id) : "",
        date_time: new Date().toISOString().split("T")[0],
        note: "",
      });
    }
  }, [open, latestQuote]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addQuote.mutateAsync({
      item_id: itemId,
      supplier_id: parseInt(formData.supplier_id),
      cost: parseFloat(formData.cost),
      currency_id: parseInt(formData.currency_id),
      date_time: formData.date_time ? new Date(formData.date_time).toISOString() : undefined,
      note: formData.note || undefined,
    });
    setFormData({
      supplier_id: "",
      cost: "",
      currency_id: "",
      date_time: new Date().toISOString().split("T")[0],
      note: "",
    });
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[425px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Add Supplier Quote</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
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
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date_time">Date</Label>
              <Input
                id="date_time"
                type="date"
                value={formData.date_time}
                onChange={(e) => setFormData({ ...formData, date_time: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cost">Unit Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency_id">Currency</Label>
                <Select value={formData.currency_id} onValueChange={(value) => setFormData({ ...formData, currency_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
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
          <ResponsiveDialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addQuote.isPending}>
              {addQuote.isPending ? "Adding..." : "Add Quote"}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
