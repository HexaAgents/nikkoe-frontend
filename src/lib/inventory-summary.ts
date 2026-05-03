import type { StockWithLocation } from "@/types/domain.types";

export interface InventorySummary {
  /** Sum of every stock row, including negative ones. Matches the legacy "Total Quantity" semantic. */
  total: number;
  /** Sum of stock rows where quantity > 0. Matches what the Locations table renders. */
  positiveTotal: number;
  /** positiveTotal - total. Always >= 0. > 0 means at least one location is negative. */
  negativeOffset: number;
  /** True when at least one location has quantity < 0 (i.e. an oversold location). */
  hasNegative: boolean;
  /** Rows to show in the Locations table: everything except quantity == 0 (so negatives are visible). */
  visible: StockWithLocation[];
}

/**
 * Single source of truth for how the Item Detail page summarizes inventory.
 *
 * Background: total quantity used to be computed by summing every stock row,
 * including negatives, while the Locations table only rendered rows with
 * quantity > 0. That hid negative rows from the UI but still subtracted them
 * from the total — producing apparent "8 vs 10" mismatches on the page. This
 * helper exposes both numbers so the caller can render a clear discrepancy
 * warning AND show the offending rows.
 */
export function summarizeInventory(inventory: StockWithLocation[] | undefined | null): InventorySummary {
  const rows = inventory ?? [];
  let total = 0;
  let positiveTotal = 0;
  let hasNegative = false;
  const visible: StockWithLocation[] = [];

  for (const row of rows) {
    const qty = row.quantity ?? 0;
    total += qty;
    if (qty > 0) positiveTotal += qty;
    if (qty < 0) hasNegative = true;
    if (qty !== 0) visible.push(row);
  }

  return {
    total,
    positiveTotal,
    negativeOffset: positiveTotal - total,
    hasNegative,
    visible,
  };
}
