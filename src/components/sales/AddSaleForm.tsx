import { useState, useMemo } from "react";
import posthog from "posthog-js";
import { Check, ChevronsUpDown } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAddSale, SaleLineInput } from "@/hooks/useSales";
import { useChannels } from "@/hooks/useChannels";
import { useCustomers, useAddCustomer } from "@/hooks/useCustomers";
import { useItems } from "@/hooks/useItems";
import { useLocations } from "@/hooks/useLocations";
import { useInventoryOnHand } from "@/hooks/useInventoryOnHand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { SearchablePartPicker } from "@/components/common/SearchablePartPicker";
import { SearchableLocationPicker } from "@/components/common/SearchableLocationPicker";
import { cn } from "@/lib/utils";

interface PartLine {
  item_id: string;
  location_id: string;
  quantity: string;
  unit_price: string;
  currency_code: string;
}

const emptyPart: PartLine = {
  item_id: "",
  location_id: "",
  quantity: "",
  unit_price: "",
  currency_code: "£",
};

export type AddSaleFormVariant = "inline" | "dialog";

export interface AddSaleFormProps {
  variant?: AddSaleFormVariant;
  /** After a successful create (e.g. close dialog) */
  onSuccessfulCreate?: () => void;
  /** When user cancels (dialog only) — reset + callback */
  onCancel?: () => void;
  className?: string;
}

export function AddSaleForm({
  variant = "inline",
  onSuccessfulCreate,
  onCancel,
  className,
}: AddSaleFormProps) {
  const addSale = useAddSale();
  const { data: channels } = useChannels();
  const { data: items } = useItems();
  const { data: locations } = useLocations();
  const { data: inventoryOnHand } = useInventoryOnHand();
  const { data: customers } = useCustomers();
  const addCustomer = useAddCustomer();

  const [channelId, setChannelId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [parts, setParts] = useState<PartLine[]>([{ ...emptyPart }]);
  const [showErrors, setShowErrors] = useState(false);

  const isNewCustomer = customerName.trim().length > 0 &&
    !customers?.some((c) => c.name.toLowerCase() === customerName.trim().toLowerCase());

  const handleAddNewCustomer = async () => {
    const trimmed = customerName.trim();
    if (!trimmed) return;
    await addCustomer.mutateAsync(trimmed);
    setCustomerOpen(false);
  };

  const validation = useMemo(() => {
    const errors: { partIndex: number; fields: string[] }[] = [];

    parts.forEach((part, index) => {
      const missingFields: string[] = [];

      if (!part.item_id?.trim()) missingFields.push("Part Number");
      if (!part.location_id?.trim()) missingFields.push("Location");

      const qty = Number(part.quantity);
      if (!Number.isFinite(qty) || qty < 1) missingFields.push("Quantity");

      const price = Number(part.unit_price);
      if (!Number.isFinite(price) || price < 0) missingFields.push("Unit Price");

      if (missingFields.length > 0) {
        errors.push({ partIndex: index, fields: missingFields });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [parts]);

  const getAutoLocation = (itemId: string) => {
    if (!inventoryOnHand || !itemId) return { locationId: "", locationCode: "", hasStock: false };

    const stockRows = inventoryOnHand
      .filter((row) => row.item_id === itemId && (row.quantity_on_hand ?? 0) > 0)
      .sort((a, b) => (a.quantity_on_hand ?? 0) - (b.quantity_on_hand ?? 0));

    if (stockRows.length === 0) return { locationId: "", locationCode: "", hasStock: false };

    const chosen = stockRows[0];
    const loc = locations?.find((l) => l.location_id === chosen.location_id);
    return {
      locationId: chosen.location_id?.toString() || "",
      locationCode: loc?.location_code || "",
      hasStock: true,
    };
  };

  const resetForm = () => {
    setChannelId("");
    setCustomerName("");
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

  const handlePartSelect = (index: number, itemId: string) => {
    setParts((prev) => {
      const updated = [...prev];
      const { locationId } = getAutoLocation(itemId);
      updated[index] = { ...updated[index], item_id: itemId, location_id: locationId };
      return updated;
    });
  };

  const handlePartChange = (index: number, field: keyof PartLine, value: string) => {
    setParts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);

    if (!validation.isValid) {
      return;
    }

    const lines: SaleLineInput[] = parts.map((p) => ({
      item_id: p.item_id,
      location_id: p.location_id,
      quantity: Math.trunc(Number(p.quantity)),
      unit_price: Number(p.unit_price),
      currency_code: p.currency_code,
    }));

    await addSale.mutateAsync({
      sale: {
        channel_id: channelId || undefined,
        customer_name: customerName.trim() || undefined,
      },
      lines,
    });

    posthog.capture("sale_created", {
      line_count: lines.length,
      channel_id: channelId || null,
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
    <form onSubmit={handleSubmit} className={cn(className)}>
      <div className={cn("space-y-6", variant === "inline" ? "py-0" : "py-4")}>
        <div className="flex items-center gap-4">
          <Label className="w-24 shrink-0 text-muted-foreground">Channel:</Label>
          <Select value={channelId || undefined} onValueChange={setChannelId}>
            <SelectTrigger className="min-w-0 flex-1">
              <SelectValue placeholder="Select channel" />
            </SelectTrigger>
            <SelectContent>
              {channels?.map((channel) => (
                <SelectItem key={channel.channel_id} value={channel.channel_id.toString()}>
                  {channel.channel_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <Label className="w-24 shrink-0 text-muted-foreground">Customer:</Label>
          <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={customerOpen}
                className={cn(
                  "min-w-0 flex-1 justify-between font-normal",
                  !customerName && "text-muted-foreground"
                )}
              >
                {customerName || "Select or type customer..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search or type new..."
                  value={customerName}
                  onValueChange={setCustomerName}
                />
                <CommandList>
                  <CommandEmpty>No matching customers.</CommandEmpty>
                  <CommandGroup>
                    {customers?.map((c) => (
                      <CommandItem
                        key={c.customer_id}
                        value={c.name}
                        onSelect={(val) => {
                          setCustomerName(val);
                          setCustomerOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            customerName.toLowerCase() === c.name.toLowerCase() ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {c.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {isNewCustomer && (
                    <div className="border-t p-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        disabled={addCustomer.isPending}
                        onClick={handleAddNewCustomer}
                      >
                        {addCustomer.isPending ? "Adding..." : `Add "${customerName.trim()}" as new customer`}
                      </Button>
                    </div>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
                <div className="flex items-center gap-4">
                  <Label
                    className={`w-32 shrink-0 ${showErrors && partErrors.includes("Part Number") ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    Part Number:
                  </Label>
                  <SearchablePartPicker
                    items={items}
                    value={part.item_id}
                    onSelect={(id) => handlePartSelect(index, id)}
                    hasError={showErrors && partErrors.includes("Part Number")}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <Label
                    className={`w-32 shrink-0 ${showErrors && partErrors.includes("Location") ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    Location:
                  </Label>
                  <SearchableLocationPicker
                    locations={locations}
                    value={part.location_id}
                    onSelect={(id) => handlePartChange(index, "location_id", id)}
                    hasError={showErrors && partErrors.includes("Location")}
                  />
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
                    className={`w-32 shrink-0 ${showErrors && partErrors.includes("Unit Price") ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    Unit Price:
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={part.unit_price}
                    onChange={(e) => handlePartChange(index, "unit_price", e.target.value)}
                    className={`min-w-0 flex-1 ${showErrors && partErrors.includes("Unit Price") ? "border-destructive" : ""}`}
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
        <Button type="submit" disabled={addSale.isPending}>
          {addSale.isPending ? "Creating..." : variant === "inline" ? "Create sale" : "Create"}
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
  );
}
