import { describe, it, expect } from "vitest";
import { computeInvoiceFinance } from "@/lib/landed-cost";

const approx = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) < tol;

describe("computeInvoiceFinance", () => {
  it("returns zeroed totals for empty input", () => {
    const r = computeInvoiceFinance([], 10, 1.15);
    expect(r.subtotal).toBe(0);
    expect(r.invoiceTotal).toBe(10);
    expect(r.grandTotalGbp).toBeCloseTo(11.5, 10);
    expect(r.lines).toEqual([]);
  });

  it("no shipping and GBP => landed equals unit price", () => {
    const r = computeInvoiceFinance(
      [
        { unitPrice: 2.5, quantity: 4 },
        { unitPrice: 1, quantity: 10 },
      ],
      0,
      1,
    );
    expect(r.subtotal).toBe(20);
    expect(r.invoiceTotal).toBe(20);
    expect(r.grandTotalGbp).toBe(20);
    expect(r.lines[0].shippingShare).toBe(0);
    expect(r.lines[0].landedUnitInvoice).toBe(2.5);
    expect(r.lines[0].landedUnitGbp).toBe(2.5);
    expect(r.lines[1].landedUnitGbp).toBe(1);
  });

  it("allocates shipping proportional to line total and sums to shipping", () => {
    // Three lines, invoice currency only (fx=1). Shares must sum to shippingTotal.
    const shipping = 10;
    const r = computeInvoiceFinance(
      [
        { unitPrice: 4, quantity: 5 },  // lineTotal 20
        { unitPrice: 2, quantity: 10 }, // lineTotal 20
        { unitPrice: 1, quantity: 60 }, // lineTotal 60
      ],
      shipping,
      1,
    );
    const totalShares = r.lines.reduce((s, l) => s + l.shippingShare, 0);
    expect(totalShares).toBeCloseTo(shipping, 10);
    // Proportions: 20/100=0.2, 20/100=0.2, 60/100=0.6
    expect(r.lines[0].shippingShare).toBeCloseTo(2, 10);
    expect(r.lines[1].shippingShare).toBeCloseTo(2, 10);
    expect(r.lines[2].shippingShare).toBeCloseTo(6, 10);
    // Per-unit slices
    expect(r.lines[0].shippingPerUnit).toBeCloseTo(0.4, 10);
    expect(r.lines[1].shippingPerUnit).toBeCloseTo(0.2, 10);
    expect(r.lines[2].shippingPerUnit).toBeCloseTo(0.1, 10);
    expect(r.lines[0].landedUnitInvoice).toBeCloseTo(4.4, 10);
    expect(r.lines[2].landedUnitInvoice).toBeCloseTo(1.1, 10);
  });

  it("applies FX rate to landed unit and grand total", () => {
    const r = computeInvoiceFinance(
      [{ unitPrice: 10, quantity: 1 }],
      2,
      0.85, // 1 EUR -> 0.85 GBP
    );
    expect(r.subtotal).toBe(10);
    expect(r.invoiceTotal).toBe(12);
    expect(r.grandTotalGbp).toBeCloseTo(10.2, 10);
    expect(r.lines[0].landedUnitInvoice).toBeCloseTo(12, 10);
    expect(r.lines[0].landedUnitGbp).toBeCloseTo(10.2, 10);
    expect(r.lines[0].landedLineGbp).toBeCloseTo(10.2, 10);
  });

  it("subtotal=0 => no shipping allocated per line (shipping still in invoice total)", () => {
    const r = computeInvoiceFinance(
      [{ unitPrice: 0, quantity: 5 }],
      7.5,
      1,
    );
    expect(r.subtotal).toBe(0);
    expect(r.invoiceTotal).toBe(7.5);
    expect(r.lines[0].shippingShare).toBe(0);
    expect(r.lines[0].shippingPerUnit).toBe(0);
    expect(r.lines[0].landedUnitInvoice).toBe(0);
  });

  it("qty<=0 => shippingPerUnit=0 without crashing", () => {
    const r = computeInvoiceFinance(
      [
        { unitPrice: 5, quantity: 0 },
        { unitPrice: 2, quantity: 5 }, // receives full shipping
      ],
      10,
      1,
    );
    expect(r.lines[0].shippingPerUnit).toBe(0);
    expect(r.lines[1].shippingShare).toBeCloseTo(10, 10);
    expect(r.lines[1].shippingPerUnit).toBeCloseTo(2, 10);
  });

  it("non-finite or non-positive fx rate falls back to 1", () => {
    const lines = [{ unitPrice: 3, quantity: 2 }];
    expect(computeInvoiceFinance(lines, 0, NaN).grandTotalGbp).toBe(6);
    expect(computeInvoiceFinance(lines, 0, -1).grandTotalGbp).toBe(6);
    expect(computeInvoiceFinance(lines, 0, 0).grandTotalGbp).toBe(6);
  });

  it("negative shipping input is treated as zero", () => {
    const r = computeInvoiceFinance([{ unitPrice: 3, quantity: 2 }], -100, 1);
    expect(r.invoiceTotal).toBe(6);
    expect(r.lines[0].shippingShare).toBe(0);
  });

  it("respects rounding precision for realistic invoice", () => {
    // Mimics the typical €-denominated electronics invoice.
    const r = computeInvoiceFinance(
      [
        { unitPrice: 0.873, quantity: 10 },
        { unitPrice: 1.95, quantity: 4 },
        { unitPrice: 12.5, quantity: 1 },
      ],
      5,
      0.8650,
    );
    // Subtotal = 8.73 + 7.8 + 12.5 = 29.03
    expect(r.subtotal).toBeCloseTo(29.03, 10);
    const sumShares = r.lines.reduce((s, l) => s + l.shippingShare, 0);
    expect(sumShares).toBeCloseTo(5, 10);
    expect(approx(r.grandTotalGbp, 34.03 * 0.865)).toBe(true);
  });
});
