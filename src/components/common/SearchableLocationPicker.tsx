import { SearchableCombobox } from "./SearchableCombobox";

interface Location {
  location_id: string | number;
  location_code: string;
}

interface SearchableLocationPickerProps {
  locations: Location[] | undefined;
  value: string;
  onSelect: (locationId: string) => void;
  hasError?: boolean;
}

export function SearchableLocationPicker({ locations, value, onSelect, hasError }: SearchableLocationPickerProps) {
  return (
    <SearchableCombobox
      items={locations}
      value={value}
      onSelect={onSelect}
      idKey="location_id"
      labelKey="location_code"
      placeholder="Select location..."
      searchPlaceholder="Search locations..."
      emptyMessage="No locations found."
      hasError={hasError}
    />
  );
}
