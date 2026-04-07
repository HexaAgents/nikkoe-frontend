import { useState, useEffect, useRef, useMemo } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
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
} from "@/components/ui/command";
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
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const labelCacheRef = useRef<Map<string, string>>(new Map());

  const { data: results, isFetching } = useItemSearch(debouncedQuery, { inStockOnly: !!inStockOnly });

  const items = useMemo(
    () => results?.data.map((i) => ({ id: String(i.id), partNumber: i.item_id })) ?? [],
    [results],
  );

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
    onSelect(id);
    setOpen(false);
    setInputValue("");
    setDebouncedQuery("");
  };

  const selectedLabel = labelCacheRef.current.get(value);

  return (
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
            <CommandGroup>
              {items.map((item) => (
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
