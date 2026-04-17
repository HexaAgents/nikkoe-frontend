import { useState, useEffect, useRef, useMemo } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useItemSearch } from "@/hooks/queries";

const DEBOUNCE_MS = 300;

interface SearchablePartPickerProps {
  value: string;
  onSelect: (itemId: string) => void;
  hasError?: boolean;
  inStockOnly?: boolean;
  initialLabel?: string;
}

export function SearchablePartPicker({ value, onSelect, hasError, initialLabel }: SearchablePartPickerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const labelCacheRef = useRef<Map<string, string>>(new Map());
  const skipClose = useRef(false);

  const { data: results, isFetching } = useItemSearch(debouncedQuery);

  const items = useMemo(
    () =>
      results?.data.map((i) => ({
        id: String(i.id),
        partNumber: i.item_id,
        description: i.description || null,
        totalQuantity: ((i as Record<string, unknown>).total_quantity as number) ?? 0,
      })) ?? [],
    [results],
  );

  const inStock = useMemo(() => items.filter((i) => i.totalQuantity > 0), [items]);
  const outOfStock = useMemo(() => items.filter((i) => i.totalQuantity <= 0), [items]);

  useEffect(() => {
    for (const item of items) {
      labelCacheRef.current.set(item.id, item.partNumber);
    }
  }, [items]);

  if (initialLabel && value) {
    labelCacheRef.current.set(value, initialLabel);
  }

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const handleInputChange = (val: string) => {
    setInputValue(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(val.trim());
    }, DEBOUNCE_MS);
    if (!open) setOpen(true);
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    setOpen(false);
    setInputValue("");
    setDebouncedQuery("");
  };

  const selectedLabel = labelCacheRef.current.get(value);

  return (
    <Popover open={open} onOpenChange={(newOpen) => {
      if (!newOpen && skipClose.current) { skipClose.current = false; return; }
      setOpen(newOpen);
      if (newOpen) {
        setInputValue("");
        setDebouncedQuery("");
        skipClose.current = false;
      }
    }}>
      <PopoverTrigger asChild>
        <div
          className="relative min-w-0 flex-1"
          onPointerDown={() => { skipClose.current = true; }}
        >
          <Input
            placeholder="Select part..."
            value={open ? inputValue : (selectedLabel || (value ? value : ""))}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setOpen(true)}
            className={cn(hasError && "border-destructive")}
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
          {isFetching ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {debouncedQuery ? "No parts found." : "Start typing to search..."}
            </div>
          ) : null}

          {inStock.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                value === item.id && "bg-accent text-accent-foreground",
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(item.id)}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4 shrink-0",
                  value === item.id ? "opacity-100" : "opacity-0",
                )}
              />
              <span className="truncate">
                {item.partNumber}
                {item.description && (
                  <span className="ml-2 text-xs text-muted-foreground">{item.description}</span>
                )}
              </span>
            </button>
          ))}

          {inStock.length > 0 && outOfStock.length > 0 && <div className="-mx-1 h-px bg-border" />}

          {outOfStock.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">No stock</div>
              {outOfStock.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground",
                    value === item.id && "bg-accent text-accent-foreground",
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(item.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === item.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {item.partNumber}
                    {item.description && (
                      <span className="ml-2 text-xs">{item.description}</span>
                    )}
                  </span>
                  <span className="ml-2 shrink-0 text-xs text-destructive">No stock</span>
                </button>
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
