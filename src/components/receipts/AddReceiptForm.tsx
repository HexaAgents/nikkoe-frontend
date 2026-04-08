import { useState, useMemo, useEffect } from "react";
import { analytics } from "@/lib/analytics";
import { useCurrentUser, useCurrencies, useSuppliers, useLocations } from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAddReceipt } from "@/hooks/mutations";
import type { ReceiptLineInput } from "@/types/domain.types";
import { AddItemModal } from "@/components/modals/AddItemModal";
import { AddLocationModal } from "@/components/modals/AddLocationModal";
import { SearchableSupplierPicker } from "@/components/common/SearchableSupplierPicker";
import { PartLineCard } from "@/components/common/PartLineCard";
import type { PartLine } from "@/components/common/PartLineCard";
import { cn } from "@/lib/utils";

function getPartLineFieldErrors(part: PartLine): string[] {
  const bad: string[] = [];

  if (!part.item_id?.trim()) bad.push("Part Number");
  if (!part.location_id?.trim()) bad.push("Location");

  if (!part.quantity?.trim()) bad.push("Quantity");
  else {
    const n = Number.parseInt(part.quantity, 10);
    if (!Number.isFinite(n) || n < 1) bad.push("Quantity");
  }

  if (!part.price?.trim()) bad.push("Unit Cost");
  else {
    const raw = part.price.replace(",", ".").trim();
    const n = Number.parseFloat(raw);
    if (!Number.isFinite(n) || n < 0) bad.push("Unit Cost");
  }

  if (!part.currency_id?.trim()) bad.push("Currency");

  return bad;
}

function partLineToInput(p: PartLine): ReceiptLineInput {
  return {
    item_id: Number(p.item_id) || undefined,
    location_id: Number(p.location_id) || undefined,
    quantity: Number.parseInt(p.quantity, 10),
    unit_price: Number.parseFloat(p.price.replace(",", ".").trim()),
    currency_id: Number(p.currency_id),
  };
}

const emptyPart: PartLine = {
  item_id: "",
  location_id: "",
  quantity: "",
  price: "",
  currency_id: "",
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
  const { data: locations } = useLocations();
  const { data: currencies } = useCurrencies();

  const [supplierId, setSupplierId] = useState<string>("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [parts, setParts] = useState<PartLine[]>([{ ...emptyPart }]);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const validation = useMemo(() => {
    const headerErrors: string[] = [];
    if (!supplierId) headerErrors.push("Supplier");
    const errors: { partIndex: number; fields: string[] }[] = [];
    parts.forEach((part, index) => {
      const fields = getPartLineFieldErrors(part);
      if (fields.length > 0) errors.push({ partIndex: index, fields });
    });
    return { isValid: headerErrors.length === 0 && errors.length === 0, headerErrors, errors };
  }, [parts, supplierId]);

  const defaultCurrencyId = currencies?.find((c) => c.name === "£")?.id?.toString() ?? "";

  const allLocations = useMemo(
    () => locations?.map((l) => ({ location_id: String(l.id), location_code: l.code })),
    [locations],
  );

  useEffect(() => {
    if (!defaultCurrencyId) return;
    setParts((prev) =>
      prev.map((p) => ({
        ...p,
        currency_id: p.currency_id || defaultCurrencyId,
      }))
    );
  }, [defaultCurrencyId]);

  const resetForm = () => {
    setSupplierId("");
    setReference("");
    setNote("");
    setFormKey((k) => k + 1);
    setParts([{ ...emptyPart, currency_id: defaultCurrencyId }]);
    setShowErrors(false);
  };

  const handlePartSelect = (index: number, itemId: string) => {
    setParts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], item_id: itemId, location_id: "" };
      return updated;
    });
  };

  const handlePartChange = (index: number, field: keyof PartLine, value: string) => {
    const updated = [...parts];
    updated[index] = { ...updated[index], [field]: value };
    setParts(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);
    if (!validation.isValid) return;

    const lines: ReceiptLineInput[] = parts.map((p) => partLineToInput(p));

    await addReceipt.mutateAsync({
      receipt: {
        supplier_id: Number(supplierId) || undefined,
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
      },
      lines,
    });

    analytics.track("receipt_created", {
      line_count: lines.length,
      has_supplier: !!supplierId,
      has_reference: !!reference.trim(),
    });

    resetForm();
    onSuccessfulCreate?.();
  };

  const handleCancelOrClear = () => {
    resetForm();
    if (variant === "dialog") onCancel?.();
  };

  const getPartErrors = (index: number) =>
    validation.errors.find((e) => e.partIndex === index)?.fields || [];

  return (
    <>
      <form onSubmit={handleSubmit} className={cn(className)}>
        <div className={cn("space-y-6", variant === "inline" ? "py-0" : "py-4")}>
          {showErrors && validation.headerErrors.length > 0 && (
            <p className="text-sm text-destructive">Missing: {validation.headerErrors.join(", ")}</p>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <Label className={`w-24 shrink-0 ${showErrors && !supplierId ? "text-destructive" : "text-muted-foreground"}`}>Supplier:</Label>
            <SearchableSupplierPicker
              key={`supplier-${formKey}`}
              suppliers={suppliers}
              value={supplierId}
              onSelect={setSupplierId}
              hasError={showErrors && !supplierId}
            />
          </div>

          <div className="flex items-center gap-4">
            <Label className="w-24 shrink-0 text-muted-foreground">Reference:</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="min-w-0 flex-1"
              placeholder="PO, ASN, or other reference (optional)"
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

          {parts.map((part, index) => (
            <PartLineCard
              key={index}
              index={index}
              part={part}
              locations={allLocations}
              currencies={currencies}
              priceLabel="Unit Cost"
              showErrors={showErrors}
              errors={getPartErrors(index)}
              canRemove={parts.length > 1}
              onPartSelect={handlePartSelect}
              onFieldChange={handlePartChange}
              onRemove={(i) => setParts(parts.filter((_, j) => j !== i))}
              extraPartActions={
                <Button type="button" variant="secondary" onClick={() => setIsAddItemModalOpen(true)}>
                  New Part
                </Button>
              }
              extraLocationActions={
                <Button type="button" variant="secondary" onClick={() => setIsAddLocationModalOpen(true)}>
                  New Location
                </Button>
              }
            />
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2 pt-6">
          <Button type="submit" disabled={addReceipt.isPending}>
            {addReceipt.isPending ? "Creating..." : variant === "inline" ? "Create receipt" : "Create"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setParts([...parts, { ...emptyPart, currency_id: defaultCurrencyId }])}>
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
