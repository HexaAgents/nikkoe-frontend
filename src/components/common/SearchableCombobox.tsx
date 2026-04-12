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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

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
                "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground md:py-1.5",
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

  if (isMobile) {
    return (
      <>
        <div
          className="relative min-w-0 flex-1"
          onClick={() => setOpen(true)}
        >
          <Input
            placeholder={placeholder}
            value={displayValue}
            readOnly
            className={cn("cursor-pointer", hasError && "border-destructive")}
          />
          <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
        </div>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{placeholder}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-2">
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-[60dvh] overflow-y-auto px-2 pb-4">
              {listContent}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

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
        {listContent}
      </PopoverContent>
    </Popover>
  );
}
