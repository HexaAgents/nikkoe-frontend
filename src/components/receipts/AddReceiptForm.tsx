import { useState, useMemo } from "react";
import posthog from "posthog-js";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddReceipt, ReceiptLineInput } from "@/hooks/useReceipts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useItems } from "@/hooks/useItems";
import { useLocations } from "@/hooks/useLocations";
import { AddItemModal } from "@/components/modals/AddItemModal";
import { AddLocationModal } from "@/components/modals/AddLocationModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { SearchablePartPicker } from "@/components/common/SearchablePartPicker";
import { SearchableLocationPicker } from "@/components/common/SearchableLocationPicker";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PartLine {
  item_id: string;
  location_id: string;
  quantity: string;
  unit_cost: string;
  currency_code: string;
}

function getPartLineFieldErrors(part: PartLine): string[] {
  const bad: string[] = [];

  if (!part.item_id?.trim()) bad.push("Part Number");

  if (!part.location_id?.trim()) bad.push("Location");

  if (!part.quantity?.trim()) bad.push("Quantity");
  else {
    const n = Number.parseInt(part.quantity, 10);
    if (!Number.isFinite(n) || n < 1) bad.push("Quantity");
  }

  if (!part.unit_cost?.trim()) bad.push("Unit Cost");
  else {
    const raw = part.unit_cost.replace(",", ".").trim();
    const n = Number.parseFloat(raw);
    if (!Number.isFinite(n) || n < 0) bad.push("Unit Cost");
  }

  return bad;
}

function partLineToInput(p: PartLine): ReceiptLineInput {
  return {
    item_id: p.item_id,
    location_id: p.location_id,
    quantity: Number.parseInt(p.quantity, 10),
    unit_cost: Number.parseFloat(p.unit_cost.replace(",", ".").trim()),
    currency_code: p.currency_code,
  };
}

const emptyPart: PartLine = {
  item_id: "",
  location_id: "",
  quantity: "",
  unit_cost: "",
  currency_code: "£",
};

export type AddReceiptFormVariant = "inline" | "dialog";

export interface AddReceiptFormProps {
  variant?: AddReceiptFormVariant;
  onSuccessfulCreate?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function AddReceiptForm({
  variant = "inline",
  onSuccessfulCreate,
  onCancel,
  className,
}: AddReceiptFormProps) {
  const addReceipt = useAddReceipt();
  const { data: currentUser } = useCurrentUser();
  const { data: suppliers } = useSuppliers();
  const { data: items } = useItems();
  const { data: locations } = useLocations();

  const [supplierId, setSupplierId] = useState<string>("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [parts, setParts] = useState<PartLine[]>([{ ...emptyPart }]);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const validation = useMemo(() => {
    const errors: { partIndex: number; fields: string[] }[] = [];

    parts.forEach((part, index) => {
      const fields = getPartLineFieldErrors(part);
      if (fields.length > 0) {
        errors.push({ partIndex: index, fields });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [parts]);

  const resetForm = () => {
    setSupplierId("");
    setReference("");
    setNote("");
    setParts([{ ...emptyPart }]);
    setShowErrors(false);
  };

  const handleAddPart = () => {
    setParts([...parts, { ...emptyPart }]);
  };

  const handleRemovePart = (index: number) => {
    if (parts.length > 1) {
      setParts(parts.filter((_, i) => i !== index));
    }
  };

  const handlePartChange = (index: number, field: keyof PartLine, value: string) => {
    const updated = [...parts];
    updated[index] = { ...updated[index], [field]: value };
    setParts(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);

    if (!validation.isValid) {
      return;
    }

    const lines: ReceiptLineInput[] = parts.map((p) => partLineToInput(p));

    await addReceipt.mutateAsync({
      receipt: {
        supplier_id: supplierId || undefined,
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
      },
      lines,
    });

    posthog.capture("receipt_created", {
      line_count: lines.length,
      has_supplier: !!supplierId,
      has_reference: !!reference.trim(),
    });

    resetForm();
    onSuccessfulCreate?.();
  };

  const handleCancelOrClear = () => {
    resetForm();
    if (variant === "dialog") {
      onCancel?.();
    }
  };

  const getPartErrors = (index: number) => {
    return validation.errors.find((e) => e.partIndex === index)?.fields || [];
  };

  return (
    <>
      <form onSubmit={handleSubmit} className={cn(className)}>
        <div className={cn("space-y-6", variant === "inline" ? "py-0" : "py-4")}>
          <div className="flex flex-wrap items-center gap-4">
            <Label className="w-24 shrink-0 text-muted-foreground">Supplier:</Label>
            <Select
              value={supplierId || undefined}
              onValueChange={setSupplierId}
            >
              <SelectTrigger className="min-w-0 flex-1">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers?.map((supplier) => (
                  <SelectItem key={supplier.supplier_id} value={supplier.supplier_id.toString()}>
                    {supplier.supplier_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <Label className="w-24 shrink-0 text-muted-foreground">Reference:</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="min-w-0 flex-1"
              placeholder="PO, ASN, or other reference"
            />
          </div>

          <div className="flex flex-wrap items-start gap-4">
            <Label className="w-24 shrink-0 pt-2 text-muted-foreground">Note:</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[80px] min-w-0 flex-1"
            />
          </div>

          {parts.map((part, index) => {
            const partErrors = getPartErrors(index);
            return (
              <Card
                key={index}
                className={`border-primary/20 ${showErrors && partErrors.length > 0 ? "border-destructive" : ""}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-foreground">Part {index + 1}</CardTitle>
                    {parts.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleRemovePart(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  {showErrors && partErrors.length > 0 && (
                    <p className="mt-1 text-xs text-destructive">Missing: {partErrors.join(", ")}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <Label
                      className={`w-32 shrink-0 ${showErrors && partErrors.includes("Part Number") ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      Part Number:
                    </Label>
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <SearchablePartPicker
                        items={items}
                        value={part.item_id}
                        onSelect={(id) => handlePartChange(index, "item_id", id)}
                        hasError={showErrors && partErrors.includes("Part Number")}
                      />
                      <Button type="button" variant="secondary" onClick={() => setIsAddItemModalOpen(true)}>
                        New Part
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <Label
                      className={`w-32 shrink-0 ${showErrors && partErrors.includes("Location") ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      Location:
                    </Label>
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <SearchableLocationPicker
                        locations={locations}
                        value={part.location_id}
                        onSelect={(id) => handlePartChange(index, "location_id", id)}
                        hasError={showErrors && partErrors.includes("Location")}
                      />
                      <Button type="button" variant="secondary" onClick={() => setIsAddLocationModalOpen(true)}>
                        New Location
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Label
                      className={`w-32 shrink-0 ${showErrors && partErrors.includes("Quantity") ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      Quantity:
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={part.quantity}
                      onChange={(e) => handlePartChange(index, "quantity", e.target.value)}
                      className={`min-w-0 flex-1 ${showErrors && partErrors.includes("Quantity") ? "border-destructive" : ""}`}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <Label
                      className={`w-32 shrink-0 ${showErrors && partErrors.includes("Unit Cost") ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      Unit Cost:
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={part.unit_cost}
                      onChange={(e) => handlePartChange(index, "unit_cost", e.target.value)}
                      className={`min-w-0 flex-1 ${showErrors && partErrors.includes("Unit Cost") ? "border-destructive" : ""}`}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <Label className="w-32 shrink-0 text-muted-foreground">Currency:</Label>
                    <Select value={part.currency_code} onValueChange={(v) => handlePartChange(index, "currency_code", v)}>
                      <SelectTrigger className="min-w-0 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="£">£</SelectItem>
                        <SelectItem value="$">$</SelectItem>
                        <SelectItem value="€">€</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-wrap justify-center gap-2 pt-6">
          <Button type="submit" disabled={addReceipt.isPending}>
            {addReceipt.isPending ? "Creating..." : variant === "inline" ? "Create receipt" : "Create"}
          </Button>
          <Button type="button" variant="outline" onClick={handleAddPart}>
            Add Part
          </Button>
          {variant === "inline" ? (
            <Button type="button" variant="outline" onClick={handleCancelOrClear}>
              Clear form
            </Button>
          ) : (
            <Button type="button" variant="destructive" onClick={handleCancelOrClear}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <AddItemModal open={isAddItemModalOpen} onOpenChange={setIsAddItemModalOpen} />
      <AddLocationModal open={isAddLocationModalOpen} onOpenChange={setIsAddLocationModalOpen} />
    </>
  );
}
