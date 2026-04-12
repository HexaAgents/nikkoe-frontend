import { useState, useMemo, useRef, useEffect } from "react";

import { Trash2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const isMobile = useIsMobile();
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
    <Card className={`border-primary/20 ${showErrors && errors.length > 0 ? "border-destructive" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-foreground">Part {index + 1}</CardTitle>
          {canRemove && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
        {showErrors && errors.length > 0 && (
          <p className="mt-1 text-xs text-destructive">Missing: {errors.join(", ")}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-1.5 md:flex-row md:flex-wrap md:items-center md:gap-4">
          <Label
            className={`md:w-32 md:shrink-0 ${showErrors && errors.includes("Part Number") ? "text-destructive" : "text-muted-foreground"}`}
          >
            Part Number:
          </Label>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <SearchablePartPicker
              value={part.item_id}
              onSelect={(id) => onPartSelect(index, id)}
              hasError={showErrors && errors.includes("Part Number")}
              inStockOnly={inStockOnly}
              initialLabel={partLabel}
            />
            {parsedPartNumber && !part.item_id && (
              <span className="shrink-0 text-xs text-amber-600">
                Invoice: {parsedPartNumber}
              </span>
            )}
            {extraPartActions}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 md:flex-row md:flex-wrap md:items-center md:gap-4">
          <Label
            className={`md:w-32 md:shrink-0 ${showErrors && errors.includes("Location") ? "text-destructive" : "text-muted-foreground"}`}
          >
            Location:
          </Label>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <SearchableLocationPicker
              locations={derivedLocations}
              value={part.location_id}
              onSelect={(id) => onFieldChange(index, "location_id", id)}
              hasError={showErrors && errors.includes("Location")}
            />
            {extraLocationActions}
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-start md:gap-x-6 md:gap-y-4">
          <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:gap-4">
            <Label
              className={`md:w-32 md:shrink-0 ${showErrors && errors.includes("Quantity") ? "text-destructive" : "text-muted-foreground"}`}
            >
              Quantity:
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                value={part.quantity}
                onChange={(e) => onFieldChange(index, "quantity", e.target.value)}
                className={cn(
                  "w-24",
                  showErrors && errors.includes("Quantity") && "border-destructive",
                  exceedsStock && "border-amber-500",
                )}
              />
              {availableQuantity != null && (
                <span
                  className={cn(
                    "shrink-0 text-sm",
                    exceedsStock ? "font-medium text-amber-600" : "text-muted-foreground",
                  )}
                >
                  out of {availableQuantity}
                </span>
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1.5 md:flex-row md:items-center md:gap-4">
            <Label
              className={`md:shrink-0 ${showErrors && errors.includes(priceLabel) ? "text-destructive" : "text-muted-foreground"}`}
            >
              {priceLabel}:
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={part.price}
              onChange={(e) => onFieldChange(index, "price", e.target.value)}
              className={cn(
                "min-w-0 flex-1",
                showErrors && errors.includes(priceLabel) && "border-destructive",
              )}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:gap-4">
          <Label className={`md:w-32 md:shrink-0 ${showErrors && errors.includes("Currency") ? "text-destructive" : "text-muted-foreground"}`}>Currency:</Label>
          {isMobile ? (
            <>
              <div className="relative min-w-0 flex-1" onClick={() => setCurrencyOpen(true)}>
                <Input placeholder="Select currency..." value={selectedCurrency?.name ?? ""} readOnly className={cn("cursor-pointer", showErrors && errors.includes("Currency") && "border-destructive")} />
                <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
              </div>
              <Drawer open={currencyOpen} onOpenChange={setCurrencyOpen}>
                <DrawerContent>
                  <DrawerHeader><DrawerTitle>Select currency</DrawerTitle></DrawerHeader>
                  <div className="max-h-[60dvh] overflow-y-auto px-3 pb-4">
                    {filteredCurrencies.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">No currencies found.</div>
                    ) : filteredCurrencies.map((c) => (
                      <button key={c.id} type="button" className={cn("relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground", part.currency_id === c.id.toString() && "bg-accent text-accent-foreground")} onClick={() => { onFieldChange(index, "currency_id", c.id.toString()); setCurrencySearch(""); setCurrencyOpen(false); }}>
                        <Check className={cn("mr-2 h-4 w-4", part.currency_id === c.id.toString() ? "opacity-100" : "opacity-0")} />
                        {c.name}
                      </button>
                    ))}
                  </div>
                </DrawerContent>
              </Drawer>
            </>
          ) : (
          <Popover open={currencyOpen} onOpenChange={(newOpen) => {
            if (!newOpen && skipCurrencyClose.current) { skipCurrencyClose.current = false; return; }
            setCurrencyOpen(newOpen);
            if (newOpen) { setCurrencySearch(""); skipCurrencyClose.current = false; }
          }}>
            <PopoverTrigger asChild>
              <div
                className="relative min-w-0 flex-1"
                onPointerDown={() => { skipCurrencyClose.current = true; }}
              >
                <Input
                  placeholder="Select currency..."
                  value={currencyOpen ? currencySearch : (selectedCurrency?.name ?? "")}
                  onChange={(e) => {
                    setCurrencySearch(e.target.value);
                    if (!currencyOpen) setCurrencyOpen(true);
                  }}
                  onFocus={() => setCurrencyOpen(true)}
                  className={cn(showErrors && errors.includes("Currency") && "border-destructive")}
                />
                <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
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
                        "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground md:py-1.5",
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}
