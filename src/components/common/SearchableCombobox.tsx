import { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  hasError,
}: SearchableComboboxProps<T>) {
  const [open, setOpen] = useState(false);

  const selectedItem = useMemo(
    () => items?.find((i) => String(i[idKey]) === value),
    [items, value, idKey]
  );

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
            hasError && "border-destructive"
          )}
        >
          {selectedItem ? String(selectedItem[labelKey]) : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {items?.map((item) => {
                const id = String(item[idKey]);
                const label = String(item[labelKey]);
                return (
                  <CommandItem
                    key={id}
                    value={label}
                    onSelect={() => {
                      onSelect(id);
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
