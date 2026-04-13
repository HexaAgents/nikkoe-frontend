import { useState, useMemo, useRef, useEffect } from "react";

import { Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SearchablePartPicker } from "@/components/common/SearchablePartPicker";
import { SearchableLocationPicker } from "@/components/common/SearchableLocationPicker";
import { useItemInventory } from "@/hooks/queries";

export interface PartLine {
  item_id: string;
  location_id: string;
  quantity: string;
  price: string;
  currency_id: string;
}

interface PartLineCardProps {
  index: number;
  part: PartLine;
  locations: { location_id: string | number; location_code: string }[] | undefined;
  currencies?: { id: number; name: string }[] | undefined;
  priceLabel: string;
  showErrors: boolean;
  errors: string[];
  canRemove: boolean;
  onPartSelect: (index: number, itemId: string) => void;
  onFieldChange: (index: number, field: keyof PartLine, value: string) => void;
  onRemove: (index: number) => void;
  extraPartActions?: React.ReactNode;
  extraLocationActions?: React.ReactNode;
  inStockOnly?: boolean;
  availableQuantity?: number | null;
  partLabel?: string;
  parsedPartNumber?: string;
}

const fallbackCurrencies = [
  { id: 1, name: "£" },
  { id: 2, name: "$" },
  { id: 3, name: "€" },
];

export function PartLineCard({
  index,
  part,
  locations,
  currencies,
  priceLabel,
  showErrors,
  errors,
  canRemove,
  onPartSelect,
  onFieldChange,
  onRemove,
  extraPartActions,
  extraLocationActions,
  inStockOnly,
  availableQuantity: availableQuantityProp,
  partLabel,
  parsedPartNumber,
}: PartLineCardProps) {
  const { data: itemInventory } = useItemInventory(part.item_id);

  const derivedLocations = useMemo(() => {
    if (!part.item_id || !itemInventory || itemInventory.length === 0) {
      return locations;
    }
    return itemInventory.map((row) => ({
      location_id: String(row.location_id),
      location_code: `${row.location?.code ?? `Location ${row.location_id}`} (${row.quantity ?? 0})`,
    }));
  }, [part.item_id, itemInventory, locations]);

  const computedAvailableQty = useMemo(() => {
    if (!part.item_id || !itemInventory) return null;
    if (itemInventory.length === 0) return 0;
    return itemInventory.reduce((sum, r) => sum + (r.quantity ?? 0), 0);
  }, [itemInventory, part.item_id]);

  const availableQuantity = availableQuantityProp ?? computedAvailableQty;

  const onFieldChangeRef = useRef(onFieldChange);
  onFieldChangeRef.current = onFieldChange;

  useEffect(() => {
    if (!part.item_id || !itemInventory || itemInventory.length === 0) return;

    const validIds = new Set(itemInventory.map((r) => String(r.location_id)));
    if (part.location_id && validIds.has(part.location_id)) return;

    const withStock = [...itemInventory]
      .filter((r) => (r.quantity ?? 0) > 0)
      .sort((a, b) => (b.quantity ?? 0) - (a.quantity ?? 0));
    const best = withStock[0] ?? itemInventory[0];
    if (best) {
      onFieldChangeRef.current(index, "location_id", String(best.location_id));
    }
  }, [itemInventory, part.item_id, part.location_id, index]);

  const qty = Number(part.quantity);
  const exceedsStock =
    availableQuantity != null && Number.isFinite(qty) && qty > availableQuantity;

  const currencyList = currencies && currencies.length > 0 ? currencies : fallbackCurrencies;

  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");
  const skipCurrencyClose = useRef(false);
  const currencyBlurTimeout = useRef<ReturnType<typeof setTimeout>>();

  const handleCurrencyBlur = () => {
    currencyBlurTimeout.current = setTimeout(() => setCurrencyOpen(false), 150);
  };
  const handleCurrencyFocus = () => {
    clearTimeout(currencyBlurTimeout.current);
    setCurrencyOpen(true);
  };

  const selectedCurrency = useMemo(
    () => currencyList.find((c) => String(c.id) === part.currency_id),
    [currencyList, part.currency_id]
  );

  const filteredCurrencies = useMemo(() => {
    if (!currencySearch.trim()) return currencyList;
    const q = currencySearch.trim().toLowerCase();
    return currencyList.filter((c) => c.name.toLowerCase().includes(q));
  }, [currencyList, currencySearch]);

  return (
    <div
      className={cn(
        "space-y-3 md:rounded-lg md:border md:bg-card md:p-4",
        showErrors && errors.length > 0 ? "md:border-destructive" : "md:border-border/60",
        index > 0 && "border-t border-border/40 pt-4 md:border-t-0 md:pt-0",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Part {index + 1}
        </span>
        {canRemove && (
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(index)}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        )}
      </div>

      {showErrors && errors.length > 0 && (
        <p className="text-xs text-destructive">Missing: {errors.join(", ")}</p>
      )}

      <div className="space-y-1.5">
        <Label className={cn("text-xs", showErrors && errors.includes("Part Number") ? "text-destructive" : "text-muted-foreground")}>
          Part Number
        </Label>
        <SearchablePartPicker
          value={part.item_id}
          onSelect={(id) => onPartSelect(index, id)}
          hasError={showErrors && errors.includes("Part Number")}
          inStockOnly={inStockOnly}
          initialLabel={partLabel}
        />
        {parsedPartNumber && !part.item_id && (
          <span className="text-xs text-amber-600">
            Invoice: {parsedPartNumber}
          </span>
        )}
        {extraPartActions && <div className="[&>*]:w-full">{extraPartActions}</div>}
      </div>

      <div className="space-y-1.5">
        <Label className={cn("text-xs", showErrors && errors.includes("Location") ? "text-destructive" : "text-muted-foreground")}>
          Location
        </Label>
        <SearchableLocationPicker
          locations={derivedLocations}
          value={part.location_id}
          onSelect={(id) => onFieldChange(index, "location_id", id)}
          hasError={showErrors && errors.includes("Location")}
        />
        {extraLocationActions && <div className="[&>*]:w-full">{extraLocationActions}</div>}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label className={cn("text-xs", showErrors && errors.includes("Quantity") ? "text-destructive" : "text-muted-foreground")}>
            Qty
          </Label>
          <Input
            type="number"
            min="1"
            placeholder="0"
            value={part.quantity}
            onChange={(e) => onFieldChange(index, "quantity", e.target.value)}
            className={cn(
              showErrors && errors.includes("Quantity") && "border-destructive",
              exceedsStock && "border-amber-500",
            )}
          />
          {availableQuantity != null && (
            <span
              className={cn(
                "block text-[10px] leading-tight",
                exceedsStock ? "font-medium text-amber-600" : "text-muted-foreground",
              )}
            >
              {availableQuantity} available
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className={cn("text-xs", showErrors && errors.includes(priceLabel) ? "text-destructive" : "text-muted-foreground")}>
            {priceLabel}
          </Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={part.price}
            onChange={(e) => onFieldChange(index, "price", e.target.value)}
            className={cn(
              showErrors && errors.includes(priceLabel) && "border-destructive",
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label className={cn("text-xs", showErrors && errors.includes("Currency") ? "text-destructive" : "text-muted-foreground")}>
            Currency
          </Label>
          <Popover open={currencyOpen} onOpenChange={(newOpen) => {
            if (!newOpen && skipCurrencyClose.current) { skipCurrencyClose.current = false; return; }
            setCurrencyOpen(newOpen);
            if (newOpen) { setCurrencySearch(""); skipCurrencyClose.current = false; }
          }}>
            <PopoverTrigger asChild>
              <div
                className="relative"
                onPointerDown={() => { skipCurrencyClose.current = true; }}
              >
                <Input
                  placeholder="—"
                  value={currencyOpen ? currencySearch : (selectedCurrency?.name ?? "")}
                  onChange={(e) => {
                    setCurrencySearch(e.target.value);
                    if (!currencyOpen) setCurrencyOpen(true);
                  }}
                  onFocus={handleCurrencyFocus}
                  onBlur={handleCurrencyBlur}
                  className={cn(showErrors && errors.includes("Currency") && "border-destructive")}
                />
              </div>
            </PopoverTrigger>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0"
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
                {filteredCurrencies.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">No currencies found.</div>
                ) : (
                  filteredCurrencies.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={cn(
                        "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                        part.currency_id === c.id.toString() && "bg-accent text-accent-foreground"
                      )}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onFieldChange(index, "currency_id", c.id.toString());
                        setCurrencySearch("");
                        setCurrencyOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          part.currency_id === c.id.toString() ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {c.name}
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
