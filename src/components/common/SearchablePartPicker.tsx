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

interface Item {
  item_id: number;
  part_number: string;
}

interface SearchablePartPickerProps {
  items: Item[] | undefined;
  value: string;
  onSelect: (itemId: string) => void;
  hasError?: boolean;
}

export function SearchablePartPicker({ items, value, onSelect, hasError }: SearchablePartPickerProps) {
  const [open, setOpen] = useState(false);

  const selectedPart = useMemo(
    () => items?.find((i) => i.item_id.toString() === value),
    [items, value]
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
          {selectedPart?.part_number || "Select part..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search parts..." />
          <CommandList>
            <CommandEmpty>No parts found.</CommandEmpty>
            <CommandGroup>
              {items?.map((item) => (
                <CommandItem
                  key={item.item_id}
                  value={item.part_number}
                  onSelect={() => {
                    onSelect(item.item_id.toString());
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.item_id.toString() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.part_number}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
