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

interface Location {
  location_id: number;
  location_code: string;
}

interface SearchableLocationPickerProps {
  locations: Location[] | undefined;
  value: string;
  onSelect: (locationId: string) => void;
  hasError?: boolean;
}

export function SearchableLocationPicker({ locations, value, onSelect, hasError }: SearchableLocationPickerProps) {
  const [open, setOpen] = useState(false);

  const selectedLocation = useMemo(
    () => locations?.find((l) => l.location_id.toString() === value),
    [locations, value]
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
          {selectedLocation?.location_code || "Select location..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search locations..." />
          <CommandList>
            <CommandEmpty>No locations found.</CommandEmpty>
            <CommandGroup>
              {locations?.map((loc) => (
                <CommandItem
                  key={loc.location_id}
                  value={loc.location_code}
                  onSelect={() => {
                    onSelect(loc.location_id.toString());
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === loc.location_id.toString() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {loc.location_code}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
