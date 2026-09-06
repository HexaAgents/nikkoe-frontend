// General cost-basis and legacy compatibility checks. *(2026-09-06 · Codex)*
import { describe, expect, it } from "vitest";
import { invoiceShippingCost, invoiceUnitCost } from "@/lib/invoice-cost";
import type { ParsedLineContext } from "@/types/invoice.types";

const item: ParsedLineContext = { partNumber: "ANY", description: null, quantity: 1,
  unitPrice: 12, unitPriceNet: 10, vatRate: 20, matchedItemId: 1, matchedItemName: "ANY" };

describe("Invoice cost selection", () => {
  it.each([null, undefined, -1, NaN, Infinity])("rejects invalid net %s and derives from a known rate", (net) => {
    expect(invoiceUnitCost({ ...item, unitPriceNet: net as number | null }, "GBP")).toBe(10);
  });
  it.each([0, 5, 7.5, 17.5, 20, 25])("handles rate %s without supplier-specific rules", (rate) => {
    const gross = 13.7 * (1 + rate / 100);
    expect(invoiceUnitCost({ ...item, unitPrice: gross, unitPriceNet: null, vatRate: rate }, "GBP")).toBeCloseTo(13.7, 10);
  });
  it.each(["EUR", "USD", null] as const)("preserves gross for unverified %s tax workflows", (iso) => {
    expect(invoiceUnitCost(item, iso)).toBe(12);
    expect(invoiceShippingCost({ shippingNet: 10, shippingTotal: 12, shippingVatRate: 20 }, iso)).toBe(12);
  });
  it("does not silently fabricate a zero cost when all prices are invalid", () => {
    expect(invoiceUnitCost({ ...item, unitPrice: Infinity, unitPriceNet: null }, "GBP")).toBeNaN();
  });
  it("still accepts valid net if redundant gross is malformed", () => {
    expect(invoiceUnitCost({ ...item, unitPrice: NaN }, "GBP")).toBe(10);
  });
  it.each([null, 0, NaN, -1, Infinity])("retains legacy freight when net=%s", (net) => {
    expect(invoiceShippingCost({ shippingNet: net, shippingTotal: 12, shippingVatRate: 20 }, "GBP")).toBe(10);
    expect(invoiceShippingCost({ shippingNet: net, shippingTotal: 12, shippingVatRate: null }, "GBP")).toBe(12);
  });
});
