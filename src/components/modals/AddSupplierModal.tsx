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
import { useAddSupplier } from "@/hooks/useSuppliers";

interface AddSupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSupplierModal({ open, onOpenChange }: AddSupplierModalProps) {
  const addSupplier = useAddSupplier();
  const [formData, setFormData] = useState({
    supplier_name: "",
    supplier_address: "",
    supplier_email: "",
    supplier_phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addSupplier.mutateAsync(formData);
    setFormData({ supplier_name: "", supplier_address: "", supplier_email: "", supplier_phone: "" });
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
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.supplier_address}
                onChange={(e) => setFormData({ ...formData, supplier_address: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.supplier_email}
                onChange={(e) => setFormData({ ...formData, supplier_email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.supplier_phone}
                onChange={(e) => setFormData({ ...formData, supplier_phone: e.target.value })}
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
