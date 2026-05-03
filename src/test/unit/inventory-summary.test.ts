import { describe, it, expect } from "vitest";
import { summarizeInventory } from "@/lib/inventory-summary";
import type { StockWithLocation } from "@/types/domain.types";

function row(quantity: number, code = "A", id = quantity + 1000): StockWithLocation {
  return {
    id,
    item_id: 1,
    location_id: id,
    quantity,
    location: { code },
  };
}

describe("summarizeInventory", () => {
  it("returns zeros for null/undefined inventory", () => {
    const a = summarizeInventory(undefined);
    const b = summarizeInventory(null);
    for (const s of [a, b]) {
      expect(s.total).toBe(0);
      expect(s.positiveTotal).toBe(0);
      expect(s.negativeOffset).toBe(0);
      expect(s.hasNegative).toBe(false);
      expect(s.visible).toEqual([]);
    }
  });

  it("returns zeros for an empty array", () => {
    const s = summarizeInventory([]);
    expect(s.total).toBe(0);
    expect(s.positiveTotal).toBe(0);
    expect(s.negativeOffset).toBe(0);
    expect(s.hasNegative).toBe(false);
    expect(s.visible).toEqual([]);
  });

  it("sums all positive rows and exposes them as visible", () => {
    const s = summarizeInventory([row(10, "S1B"), row(5, "AM7")]);
    expect(s.total).toBe(15);
    expect(s.positiveTotal).toBe(15);
    expect(s.negativeOffset).toBe(0);
    expect(s.hasNegative).toBe(false);
    expect(s.visible).toHaveLength(2);
  });

  it("filters zero-quantity rows from the visible list (they affect neither total)", () => {
    const s = summarizeInventory([row(10, "S1B"), row(0, "OLD")]);
    expect(s.total).toBe(10);
    expect(s.positiveTotal).toBe(10);
    expect(s.visible).toHaveLength(1);
    expect(s.visible[0].location?.code).toBe("S1B");
  });

  it("exposes negative rows in visible AND surfaces them via hasNegative + negativeOffset", () => {
    // The exact scenario from the bug report: TC514400Z-80 had +10 in s1b and -2 elsewhere.
    // Total renders as 8, but the Locations table used to hide the -2 row entirely.
    const s = summarizeInventory([row(10, "s1b"), row(-2, "0")]);
    expect(s.total).toBe(8);
    expect(s.positiveTotal).toBe(10);
    expect(s.negativeOffset).toBe(2);
    expect(s.hasNegative).toBe(true);
    expect(s.visible).toHaveLength(2);
    const codes = s.visible.map((r) => r.location?.code);
    expect(codes).toContain("s1b");
    expect(codes).toContain("0");
  });

  it("handles all-negative inventory", () => {
    const s = summarizeInventory([row(-3, "X"), row(-1, "Y")]);
    expect(s.total).toBe(-4);
    expect(s.positiveTotal).toBe(0);
    expect(s.negativeOffset).toBe(4);
    expect(s.hasNegative).toBe(true);
    expect(s.visible).toHaveLength(2);
  });

  it("treats missing/undefined quantity as 0", () => {
    const malformed = [
      { id: 1, item_id: 1, location_id: 1, quantity: undefined as unknown as number, location: { code: "X" } },
      row(7, "Y"),
    ];
    const s = summarizeInventory(malformed);
    expect(s.total).toBe(7);
    expect(s.positiveTotal).toBe(7);
    expect(s.hasNegative).toBe(false);
    // The undefined-quantity row is filtered from visible (treated as 0).
    expect(s.visible).toHaveLength(1);
  });
});
