import { useState, useMemo, useRef } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
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

interface SearchableComboboxProps<T> {
  items: T[] | undefined;
  value: string;
  onSelect: (id: string) => void;
  idKey: keyof T;
  labelKey: keyof T;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  hasError?: boolean;
}

export function SearchableCombobox<T extends Record<string, unknown>>({
  items,
  value,
  onSelect,
  idKey,
  labelKey,
  placeholder = "Select...",
  emptyMessage = "No results found.",
  hasError,
}: SearchableComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const skipClose = useRef(false);

  const selectedItem = useMemo(
    () => items?.find((i) => String(i[idKey]) === value),
    [items, value, idKey]
  );

  const displayValue = selectedItem ? String(selectedItem[labelKey]) : "";

  const filtered = useMemo(() => {
    if (!items) return [];
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter((i) => String(i[labelKey]).toLowerCase().includes(q));
  }, [items, search, labelKey]);

  return (
    <Popover open={open} onOpenChange={(newOpen) => {
      if (!newOpen && skipClose.current) { skipClose.current = false; return; }
      setOpen(newOpen);
      if (newOpen) setSearch("");
    }}>
      <PopoverTrigger asChild>
        <div
          className="relative min-w-0 flex-1"
          onPointerDown={() => { skipClose.current = true; }}
        >
          <Input
            placeholder={placeholder}
            value={open ? search : displayValue}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!open) setOpen(true);
            }}
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
        <Command shouldFilter={false}>
          <CommandList>
            {filtered.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</div>
            )}
            <CommandGroup>
              {filtered.map((item) => {
                const id = String(item[idKey]);
                const label = String(item[labelKey]);
                return (
                  <CommandItem
                    key={id}
                    value={label}
                    onSelect={() => {
                      onSelect(id);
                      setSearch("");
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
