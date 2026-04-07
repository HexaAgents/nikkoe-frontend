import { useState, useEffect, useRef, useMemo } from "react";
import { Check, ChevronsUpDown, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  CommandSeparator,
} from "@/components/ui/command";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useItemSearch } from "@/hooks/queries";

const DEBOUNCE_MS = 300;

interface SearchablePartPickerProps {
  value: string;
  onSelect: (itemId: string) => void;
  hasError?: boolean;
  inStockOnly?: boolean;
}

export function SearchablePartPicker({ value, onSelect, hasError, inStockOnly }: SearchablePartPickerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const labelCacheRef = useRef<Map<string, string>>(new Map());

  const { data: results, isFetching } = useItemSearch(debouncedQuery);

  const items = useMemo(
    () =>
      results?.data.map((i) => ({
        id: String(i.id),
        partNumber: i.item_id,
        totalQuantity: (i as Record<string, unknown>).total_quantity as number ?? 0,
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

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const handleInputChange = (val: string) => {
    setInputValue(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(val.trim());
    }, DEBOUNCE_MS);
  };

  const handleSelect = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item && item.totalQuantity <= 0) {
      setPendingId(id);
      return;
    }
    confirmSelect(id);
  };

  const confirmSelect = (id: string) => {
    onSelect(id);
    setOpen(false);
    setInputValue("");
    setDebouncedQuery("");
  };

  const selectedLabel = labelCacheRef.current.get(value);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "flex-1 justify-between font-normal",
              !value && "text-muted-foreground",
              hasError && "border-destructive",
            )}
          >
            {selectedLabel || (value ? value : "Select part...")}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search parts..."
              value={inputValue}
              onValueChange={handleInputChange}
            />
            <CommandList>
              {isFetching ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : !debouncedQuery ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Type to search parts...
                </div>
              ) : items.length === 0 ? (
                <CommandEmpty>No parts found.</CommandEmpty>
              ) : null}

              {inStock.length > 0 && (
                <CommandGroup>
                  {inStock.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => handleSelect(item.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === item.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {item.partNumber}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {inStock.length > 0 && outOfStock.length > 0 && (
                <CommandSeparator />
              )}

              {outOfStock.length > 0 && (
                <CommandGroup heading="No stock">
                  {outOfStock.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => handleSelect(item.id)}
                      className="text-muted-foreground"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === item.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="flex-1">{item.partNumber}</span>
                      <span className="ml-2 text-xs text-destructive">No stock</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <AlertDialog open={!!pendingId} onOpenChange={(o) => { if (!o) setPendingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              No available stock
            </AlertDialogTitle>
            <AlertDialogDescription>
              This item has no available stock. Proceeding will result in negative inventory. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingId) confirmSelect(pendingId);
                setPendingId(null);
              }}
            >
              Continue anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
