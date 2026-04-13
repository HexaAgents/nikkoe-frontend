import { useState, useMemo, useRef, useEffect } from "react";
import { Check } from "lucide-react";
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
  const blurTimeout = useRef<ReturnType<typeof setTimeout>>();

  const listRef = useRef<HTMLDivElement>(null);

  const handleBlur = () => {
    blurTimeout.current = setTimeout(() => setOpen(false), 150);
  };
  const handleFocus = () => {
    clearTimeout(blurTimeout.current);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    let armed = false;
    const timer = setTimeout(() => { armed = true; }, 200);
    const onScroll = (e: Event) => {
      if (!armed) return;
      if (listRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, [open]);

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

  const handleSelect = (id: string) => {
    onSelect(id);
    setSearch("");
    setOpen(false);
  };

  const listContent = (
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
                "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                value === id && "bg-accent text-accent-foreground"
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(id)}
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
  );

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
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(hasError && "border-destructive")}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] overflow-hidden p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div ref={listRef}>
          {listContent}
        </div>
      </PopoverContent>
    </Popover>
  );
}
