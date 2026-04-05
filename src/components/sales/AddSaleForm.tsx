import { useState, useMemo } from "react";
import { analytics } from "@/lib/analytics";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useAddSale, useAddCustomer } from "@/hooks/mutations";
import type { SaleLineInput } from "@/types/domain.types";
import { useChannels, useCurrencies, useCustomers, useItems, useLocations, useInventoryOnHand } from "@/hooks/queries";
import { PartLineCard } from "@/components/common/PartLineCard";
import type { PartLine } from "@/components/common/PartLineCard";
import { cn } from "@/lib/utils";

const emptyPart: PartLine = {
  item_id: "",
  location_id: "",
  quantity: "",
  price: "",
  currency_id: "",
};

export type AddSaleFormVariant = "inline" | "dialog";

export interface AddSaleFormProps {
  variant?: AddSaleFormVariant;
  onSuccessfulCreate?: () => void;
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
  const { data: currencies } = useCurrencies();
  const addCustomer = useAddCustomer();

  const [channelId, setChannelId] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");
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
    const headerErrors: string[] = [];
    if (!channelId) headerErrors.push("Channel");
    if (!customerId) headerErrors.push("Customer");

    const lineErrors: { partIndex: number; fields: string[] }[] = [];
    parts.forEach((part, index) => {
      const missingFields: string[] = [];
      if (!part.item_id?.trim()) missingFields.push("Part Number");
      if (!part.location_id?.trim()) missingFields.push("Location");
      const qty = Number(part.quantity);
      if (!Number.isFinite(qty) || qty < 1) missingFields.push("Quantity");
      const price = Number(part.price);
      if (!Number.isFinite(price) || price < 0) missingFields.push("Unit Price");
      if (!part.currency_id?.trim()) missingFields.push("Currency");
      if (missingFields.length > 0) lineErrors.push({ partIndex: index, fields: missingFields });
    });
    return {
      isValid: headerErrors.length === 0 && lineErrors.length === 0,
      headerErrors,
      errors: lineErrors,
    };
  }, [parts, channelId, customerId]);

  const getAutoLocation = (itemId: string) => {
    if (!inventoryOnHand || !itemId) return "";
    const numId = Number(itemId);
    const stockRows = inventoryOnHand
      .filter((row) => row.item_id === numId && (row.quantity ?? 0) > 0)
      .sort((a, b) => (a.quantity ?? 0) - (b.quantity ?? 0));
    if (stockRows.length === 0) return "";
    return stockRows[0].location_id?.toString() || "";
  };

  const resetForm = () => {
    setChannelId("");
    setCustomerId("");
    setCustomerName("");
    setParts([{ ...emptyPart }]);
    setShowErrors(false);
  };

  const handlePartSelect = (index: number, itemId: string) => {
    setParts((prev) => {
      const updated = [...prev];
      const locationId = getAutoLocation(itemId);
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
    if (!validation.isValid) return;

    const lines: SaleLineInput[] = parts.map((p) => ({
      item_id: Number(p.item_id) || undefined,
      location_id: Number(p.location_id) || undefined,
      quantity: Math.trunc(Number(p.quantity)),
      unit_price: Number(p.price),
      currency_id: Number(p.currency_id),
    }));

    await addSale.mutateAsync({
      sale: {
        channel_id_id: Number(channelId) || undefined,
        customer_id_id: Number(customerId) || undefined,
      },
      lines,
    });

    analytics.track("sale_created", {
      line_count: lines.length,
      channel_id: channelId || null,
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
    <form onSubmit={handleSubmit} className={cn(className)}>
      <div className={cn("space-y-6", variant === "inline" ? "py-0" : "py-4")}>
        {showErrors && validation.headerErrors.length > 0 && (
          <p className="text-sm text-destructive">Missing: {validation.headerErrors.join(", ")}</p>
        )}
        <div className="flex items-center gap-4">
          <Label className={`w-24 shrink-0 ${showErrors && !channelId ? "text-destructive" : "text-muted-foreground"}`}>Channel:</Label>
          <Select value={channelId || undefined} onValueChange={setChannelId}>
            <SelectTrigger className="min-w-0 flex-1">
              <SelectValue placeholder="Select channel" />
            </SelectTrigger>
            <SelectContent>
              {channels?.map((channel) => (
                <SelectItem key={channel.id} value={channel.id.toString()}>
                  {channel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <Label className={`w-24 shrink-0 ${showErrors && !customerId ? "text-destructive" : "text-muted-foreground"}`}>Customer:</Label>
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
                        key={c.id}
                        value={c.name}
                        onSelect={(val) => {
                          setCustomerName(val);
                          const match = customers?.find((cu) => cu.name.toLowerCase() === val.toLowerCase());
                          if (match) setCustomerId(String(match.id));
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

        {parts.map((part, index) => (
          <PartLineCard
            key={index}
            index={index}
            part={part}
            items={items?.map((i) => ({ item_id: i.id, part_number: i.item_id }))}
            locations={locations?.map((l) => ({ location_id: l.id, location_code: l.code }))}
            currencies={currencies}
            priceLabel="Unit Price"
            showErrors={showErrors}
            errors={getPartErrors(index)}
            canRemove={parts.length > 1}
            onPartSelect={handlePartSelect}
            onFieldChange={handlePartChange}
            onRemove={(i) => setParts(parts.filter((_, j) => j !== i))}
          />
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2 pt-6">
        <Button type="submit" disabled={addSale.isPending}>
          {addSale.isPending ? "Creating..." : variant === "inline" ? "Create sale" : "Create"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setParts([...parts, { ...emptyPart }])}>
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
