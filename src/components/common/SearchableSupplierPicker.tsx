import { SearchableCombobox } from "./SearchableCombobox";

interface Supplier {
  id: number;
  name: string;
}

interface SearchableSupplierPickerProps {
  suppliers: Supplier[] | undefined;
  value: string;
  onSelect: (supplierId: string) => void;
  hasError?: boolean;
}

export function SearchableSupplierPicker({ suppliers, value, onSelect, hasError }: SearchableSupplierPickerProps) {
  return (
    <SearchableCombobox
      items={suppliers}
      value={value}
      onSelect={onSelect}
      idKey="id"
      labelKey="name"
      placeholder="Select supplier..."
      searchPlaceholder="Search suppliers..."
      emptyMessage="No suppliers found."
      hasError={hasError}
    />
  );
}
