import { useState, useEffect } from "react";
import { analytics } from "@/lib/analytics";
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
import { useAddItem } from "@/hooks/mutations";
import { useCategories } from "@/hooks/queries";
import type { Item } from "@/types/domain.types";

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional initial field values applied when the modal opens. */
  defaults?: {
    part_number?: string;
    description?: string;
  };
  /** Called with the new item after a successful create. */
  onCreated?: (item: Item) => void;
}

const EMPTY = { part_number: "", description: "", category_id: "" };

export function AddItemModal({ open, onOpenChange, defaults, onCreated }: AddItemModalProps) {
  const addItem = useAddItem();
  const { data: categories } = useCategories();
  const [formData, setFormData] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    setFormData({
      part_number: defaults?.part_number ?? "",
      description: defaults?.description ?? "",
      category_id: "",
    });
  }, [open, defaults]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = (await addItem.mutateAsync({
      item_id: formData.part_number,
      description: formData.description || undefined,
      category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
    })) as Item;
    analytics.track("item_created", {
      has_description: !!formData.description,
      has_category: !!formData.category_id,
      from_invoice: !!defaults?.part_number,
    });
    setFormData(EMPTY);
    onCreated?.(created);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="partNumber">Part Number</Label>
              <Input
                id="partNumber"
                value={formData.part_number}
                onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addItem.isPending}>
              {addItem.isPending ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
