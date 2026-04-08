import { useState, useMemo, useRef } from "react";
import { analytics } from "@/lib/analytics";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAddSale, useAddCustomer } from "@/hooks/mutations";
import type { SaleLineInput } from "@/types/domain.types";
import { useChannels, useCurrencies, useCustomers, useLocations } from "@/hooks/queries";
import { PartLineCard } from "@/components/common/PartLineCard";
import type { PartLine } from "@/components/common/PartLineCard";
import { AddItemModal } from "@/components/modals/AddItemModal";
import { AddLocationModal } from "@/components/modals/AddLocationModal";
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
  const { data: locations } = useLocations();
  const { data: customers } = useCustomers();
  const { data: currencies } = useCurrencies();
  const addCustomer = useAddCustomer();

  const [channelId, setChannelId] = useState<string>("");
  const [channelSearch, setChannelSearch] = useState("");
  const [channelOpen, setChannelOpen] = useState(false);
  const [customerId, setCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [parts, setParts] = useState<PartLine[]>([{ ...emptyPart }]);
  const [showErrors, setShowErrors] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const skipChannelClose = useRef(false);
  const skipCustomerClose = useRef(false);

  const selectedChannel = useMemo(
    () => channels?.find((c) => String(c.id) === channelId),
    [channels, channelId]
  );

  const filteredChannels = useMemo(() => {
    if (!channels) return [];
    if (!channelSearch.trim()) return channels;
    const q = channelSearch.trim().toLowerCase();
    return channels.filter((c) => c.name.toLowerCase().includes(q));
  }, [channels, channelSearch]);

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    if (!customerName.trim()) return customers;
    const q = customerName.trim().toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q));
  }, [customers, customerName]);

  const isNewCustomer = customerName.trim().length > 0 &&
    !customers?.some((c) => c.name.toLowerCase() === customerName.trim().toLowerCase());

  const handleAddNewCustomer = async () => {
    const trimmed = customerName.trim();
    if (!trimmed) return;
    const result = await addCustomer.mutateAsync(trimmed) as { id: number };
    setCustomerName(trimmed);
    if (result?.id) setCustomerId(String(result.id));
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
      if (!part.price?.toString().trim()) {
        missingFields.push("Unit Price");
      } else {
        const price = Number(part.price);
        if (!Number.isFinite(price) || price < 0) missingFields.push("Unit Price");
      }
      if (!part.currency_id?.trim()) missingFields.push("Currency");
      if (missingFields.length > 0) lineErrors.push({ partIndex: index, fields: missingFields });
    });
    return {
      isValid: headerErrors.length === 0 && lineErrors.length === 0,
      headerErrors,
      errors: lineErrors,
    };
  }, [parts, channelId, customerId]);

  const allLocations = useMemo(
    () => locations?.map((l) => ({ location_id: String(l.id), location_code: l.code })),
    [locations],
  );

  const resetForm = () => {
    setChannelId("");
    setChannelSearch("");
    setCustomerId("");
    setCustomerName("");
    setParts([{ ...emptyPart }]);
    setShowErrors(false);
    setFormKey((k) => k + 1);
  };

  const handlePartSelect = (index: number, itemId: string) => {
    setParts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], item_id: itemId, location_id: "" };
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
    <>
      <form onSubmit={handleSubmit} className={cn(className)}>
      <div className={cn("space-y-6", variant === "inline" ? "py-0" : "py-4")}>
        {showErrors && validation.headerErrors.length > 0 && (
          <p className="text-sm text-destructive">Missing: {validation.headerErrors.join(", ")}</p>
        )}
        <div className="flex items-center gap-4">
          <Label className={`w-24 shrink-0 ${showErrors && !channelId ? "text-destructive" : "text-muted-foreground"}`}>Channel:</Label>
          <Popover open={channelOpen} onOpenChange={(newOpen) => {
            if (!newOpen && skipChannelClose.current) { skipChannelClose.current = false; return; }
            setChannelOpen(newOpen);
            if (newOpen) { setChannelSearch(""); skipChannelClose.current = false; }
          }}>
            <PopoverTrigger asChild>
              <div
                className="relative min-w-0 flex-1"
                onPointerDown={() => { skipChannelClose.current = true; }}
              >
                <Input
                  placeholder="Select channel..."
                  value={channelOpen ? channelSearch : (selectedChannel?.name ?? "")}
                  onChange={(e) => {
                    setChannelSearch(e.target.value);
                    if (!channelOpen) setChannelOpen(true);
                  }}
                  onFocus={() => setChannelOpen(true)}
                  className={cn(showErrors && !channelId && "border-destructive")}
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
                {filteredChannels.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">No channels found.</div>
                ) : (
                  filteredChannels.map((channel) => (
                    <button
                      key={channel.id}
                      type="button"
                      className={cn(
                        "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                        channelId === channel.id.toString() && "bg-accent text-accent-foreground"
                      )}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setChannelId(channel.id.toString());
                        setChannelSearch("");
                        setChannelOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          channelId === channel.id.toString() ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {channel.name}
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-4">
          <Label className={`w-24 shrink-0 ${showErrors && !customerId ? "text-destructive" : "text-muted-foreground"}`}>Customer:</Label>
          <Popover open={customerOpen} onOpenChange={(newOpen) => {
            if (!newOpen && skipCustomerClose.current) { skipCustomerClose.current = false; return; }
            setCustomerOpen(newOpen);
            if (newOpen) skipCustomerClose.current = false;
          }}>
            <PopoverTrigger asChild>
              <div
                className="relative min-w-0 flex-1"
                onPointerDown={() => { skipCustomerClose.current = true; }}
              >
                <Input
                  placeholder="Select or type customer..."
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setCustomerId("");
                    if (!customerOpen) setCustomerOpen(true);
                  }}
                  onFocus={() => setCustomerOpen(true)}
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
                {filteredCustomers.length === 0 && !isNewCustomer && (
                  <div className="py-6 text-center text-sm text-muted-foreground">No matching customers.</div>
                )}
                {filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={cn(
                      "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      customerId === String(c.id) && "bg-accent text-accent-foreground"
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setCustomerName(c.name);
                      setCustomerId(String(c.id));
                      setCustomerOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        customerId === String(c.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {c.name}
                  </button>
                ))}
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
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {parts.map((part, index) => (
          <PartLineCard
            key={index}
            index={index}
            part={part}
            locations={allLocations}
            currencies={currencies}
            priceLabel="Unit Price"
            showErrors={showErrors}
            errors={getPartErrors(index)}
            canRemove={parts.length > 1}
            onPartSelect={handlePartSelect}
            onFieldChange={handlePartChange}
            onRemove={(i) => setParts(parts.filter((_, j) => j !== i))}
            inStockOnly
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

      <AddItemModal open={isAddItemModalOpen} onOpenChange={setIsAddItemModalOpen} />
      <AddLocationModal open={isAddLocationModalOpen} onOpenChange={setIsAddLocationModalOpen} />
    </>
  );
}
