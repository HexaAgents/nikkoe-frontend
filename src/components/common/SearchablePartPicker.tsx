import { SearchableCombobox } from "./SearchableCombobox";

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
  return (
    <SearchableCombobox
      items={items}
      value={value}
      onSelect={onSelect}
      idKey="item_id"
      labelKey="part_number"
      placeholder="Select part..."
      searchPlaceholder="Search parts..."
      emptyMessage="No parts found."
      hasError={hasError}
    />
  );
}
