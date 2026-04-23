import { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const mountedRef = useRef(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => { mountedRef.current = true; });
    return () => cancelAnimationFrame(id);
  }, []);

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
      if (newOpen) { setSearch(""); skipClose.current = false; }
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
            onFocus={() => { if (mountedRef.current) setOpen(true); }}
            className={cn(hasError && "border-destructive")}
          />
          <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        side="bottom"
        avoidCollisions={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</div>
          ) : (
            filtered.map((item) => {
              const id = String(item[idKey]);
              const label = String(item[labelKey]);
              return (
                <button
                  key={id}
                  type="button"
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === id && "bg-accent text-accent-foreground"
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
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
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
