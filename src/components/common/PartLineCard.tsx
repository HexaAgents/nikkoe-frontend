import { useState, useMemo, useRef } from "react";

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
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchablePartPicker } from "@/components/common/SearchablePartPicker";
import { SearchableLocationPicker } from "@/components/common/SearchableLocationPicker";

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
  availableQuantity,
}: PartLineCardProps) {
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
        <div className="flex flex-wrap items-center gap-4">
          <Label
            className={`w-32 shrink-0 ${showErrors && errors.includes("Part Number") ? "text-destructive" : "text-muted-foreground"}`}
          >
            Part Number:
          </Label>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <SearchablePartPicker
              value={part.item_id}
              onSelect={(id) => onPartSelect(index, id)}
              hasError={showErrors && errors.includes("Part Number")}
              inStockOnly={inStockOnly}
            />
            {extraPartActions}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Label
            className={`w-32 shrink-0 ${showErrors && errors.includes("Location") ? "text-destructive" : "text-muted-foreground"}`}
          >
            Location:
          </Label>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <SearchableLocationPicker
              locations={locations}
              value={part.location_id}
              onSelect={(id) => onFieldChange(index, "location_id", id)}
              hasError={showErrors && errors.includes("Location")}
            />
            {extraLocationActions}
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
          <div className="flex items-center gap-4">
            <Label
              className={`w-32 shrink-0 ${showErrors && errors.includes("Quantity") ? "text-destructive" : "text-muted-foreground"}`}
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

          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Label
              className={`shrink-0 ${showErrors && errors.includes(priceLabel) ? "text-destructive" : "text-muted-foreground"}`}
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

        <div className="flex items-center gap-4">
          <Label className={`w-32 shrink-0 ${showErrors && errors.includes("Currency") ? "text-destructive" : "text-muted-foreground"}`}>Currency:</Label>
          <Popover open={currencyOpen} onOpenChange={(newOpen) => {
            if (!newOpen && skipCurrencyClose.current) { skipCurrencyClose.current = false; return; }
            setCurrencyOpen(newOpen);
            if (newOpen) setCurrencySearch("");
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
              <Command shouldFilter={false}>
                <CommandList>
                  {filteredCurrencies.length === 0 && (
                    <div className="py-6 text-center text-sm text-muted-foreground">No currencies found.</div>
                  )}
                  <CommandGroup>
                    {filteredCurrencies.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={c.name}
                        onSelect={() => {
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
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
}
