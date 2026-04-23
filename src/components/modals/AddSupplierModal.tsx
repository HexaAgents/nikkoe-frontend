import { useState, useEffect } from "react";
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
import { useAddSupplier } from "@/hooks/mutations";
import type { Supplier } from "@/types/domain.types";

interface AddSupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional initial field values applied when the modal opens. */
  defaults?: {
    name?: string;
  };
  /** Called with the new supplier after a successful create. */
  onCreated?: (supplier: Supplier) => void;
}

const EMPTY = { name: "", address: "", email: "", phone: "" };

export function AddSupplierModal({ open, onOpenChange, defaults, onCreated }: AddSupplierModalProps) {
  const addSupplier = useAddSupplier();
  const [formData, setFormData] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    setFormData({
      name: defaults?.name ?? "",
      address: "",
      email: "",
      phone: "",
    });
  }, [open, defaults]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = (await addSupplier.mutateAsync(formData)) as Supplier;
    setFormData(EMPTY);
    onCreated?.(created);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Supplier</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addSupplier.isPending}>
              {addSupplier.isPending ? "Adding..." : "Add Supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
