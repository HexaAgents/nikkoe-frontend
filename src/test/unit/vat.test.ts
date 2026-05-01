import { describe, it, expect } from "vitest";
import { computeVatBreakdown, hasVatInfo } from "@/lib/vat";

const approx = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) < tol;

describe("computeVatBreakdown", () => {
  it("returns zeroed totals for empty input", () => {
    const r = computeVatBreakdown([], 0, null);
    expect(r.perLine).toEqual([]);
    expect(r.subtotal).toEqual({ net: 0, vat: 0, gross: 0 });
    expect(r.shipping).toEqual({ net: 0, vat: 0, gross: 0, rate: null });
    expect(r.total).toEqual({ net: 0, vat: 0, gross: 0 });
  });

  it("all 20% VAT (TME-style) — analytical match", () => {
    // Mirrors the 4261509868.pdf product lines (per-unit nets, 20% VAT).
    const r = computeVatBreakdown(
      [
        { quantity: 4, unitNet: 1.05, vatRate: 20 }, // 4.20 net
        { quantity: 2, unitNet: 0.616, vatRate: 20 }, // 1.232 net
        { quantity: 1, unitNet: 0.205, vatRate: 20 }, // 0.205 net
      ],
      7.7,
      20,
    );

    expect(approx(r.subtotal.net, 4.2 + 1.232 + 0.205)).toBe(true);
    expect(approx(r.subtotal.vat, (4.2 + 1.232 + 0.205) * 0.2)).toBe(true);
    expect(approx(r.subtotal.gross, r.subtotal.net + r.subtotal.vat)).toBe(true);

    expect(approx(r.shipping.net, 7.7)).toBe(true);
    expect(approx(r.shipping.vat, 1.54)).toBe(true);
    expect(approx(r.shipping.gross, 9.24)).toBe(true);
    expect(r.shipping.rate).toBe(20);

    expect(approx(r.total.net, r.subtotal.net + 7.7)).toBe(true);
    expect(approx(r.total.vat, r.subtotal.vat + 1.54)).toBe(true);
    expect(approx(r.total.gross, r.subtotal.gross + 9.24)).toBe(true);
  });

  it("preserves null vatRate per-line for downstream UI", () => {
    const r = computeVatBreakdown(
      [
        { quantity: 1, unitNet: 9, vatRate: null }, // overseas proforma
      ],
      0,
      null,
    );
    expect(r.perLine[0].rate).toBeNull();
    expect(r.perLine[0].vat).toBe(0);
    expect(r.perLine[0].net).toBe(9);
    expect(r.perLine[0].gross).toBe(9);
  });

  it("mixed VAT rates per line", () => {
    const r = computeVatBreakdown(
      [
        { quantity: 10, unitNet: 1, vatRate: 20 }, // 10 net, 2 vat
        { quantity: 5, unitNet: 2, vatRate: 5 }, //  10 net, 0.5 vat
        { quantity: 3, unitNet: 1, vatRate: 0 }, //   3 net, 0 vat
      ],
      0,
      null,
    );
    expect(approx(r.subtotal.net, 23)).toBe(true);
    expect(approx(r.subtotal.vat, 2.5)).toBe(true);
    expect(approx(r.subtotal.gross, 25.5)).toBe(true);
    expect(r.perLine[2].rate).toBe(0);
    expect(r.perLine[2].vat).toBe(0);
  });

  it("zero VAT (Hongtaiyu shape): net == gross, vat == 0", () => {
    const r = computeVatBreakdown(
      [
        { quantity: 1, unitNet: 9, vatRate: null },
        { quantity: 33, unitNet: 8.5, vatRate: null },
      ],
      0,
      null,
    );
    expect(r.subtotal.net).toBe(9 + 33 * 8.5);
    expect(r.subtotal.vat).toBe(0);
    expect(r.subtotal.gross).toBe(r.subtotal.net);
    expect(r.total.gross).toBe(r.subtotal.net);
    expect(r.shipping).toEqual({ net: 0, vat: 0, gross: 0, rate: null });
  });

  it("no shipping → shipping totals all zero, rate null", () => {
    const r = computeVatBreakdown(
      [{ quantity: 7, unitNet: 1, vatRate: 20 }],
      0,
      20,
    );
    expect(r.shipping.net).toBe(0);
    expect(r.shipping.vat).toBe(0);
    expect(r.shipping.gross).toBe(0);
    expect(r.shipping.rate).toBeNull();
  });

  it("shipping with its own VAT rate", () => {
    const r = computeVatBreakdown(
      [{ quantity: 1, unitNet: 100, vatRate: 0 }],
      10,
      20,
    );
    expect(r.shipping.net).toBe(10);
    expect(approx(r.shipping.vat, 2)).toBe(true);
    expect(approx(r.shipping.gross, 12)).toBe(true);
    expect(r.shipping.rate).toBe(20);
    expect(approx(r.total.gross, 112)).toBe(true);
  });

  it("clamps negative inputs to zero", () => {
    const r = computeVatBreakdown(
      [
        { quantity: -1, unitNet: 100, vatRate: 20 }, // qty < 0 → 0
        { quantity: 5, unitNet: -2, vatRate: 20 }, // unitNet < 0 → 0
        { quantity: 2, unitNet: 5, vatRate: 20 }, // valid: 10 net, 2 vat
      ],
      -5,
      20,
    );
    expect(approx(r.subtotal.net, 10)).toBe(true);
    expect(approx(r.subtotal.vat, 2)).toBe(true);
    expect(r.shipping.net).toBe(0);
    expect(r.shipping.vat).toBe(0);
  });

  it("non-finite rate is treated as 0%", () => {
    const r = computeVatBreakdown(
      [{ quantity: 1, unitNet: 50, vatRate: NaN }],
      0,
      Infinity,
    );
    expect(r.subtotal.vat).toBe(0);
    expect(r.subtotal.gross).toBe(50);
  });
});

describe("hasVatInfo", () => {
  it("false when every line and shipping is null-rated", () => {
    expect(
      hasVatInfo(
        [
          { quantity: 1, unitNet: 1, vatRate: null },
          { quantity: 2, unitNet: 1, vatRate: null },
        ],
        null,
      ),
    ).toBe(false);
  });

  it("true when any line has a rate (even 0)", () => {
    expect(
      hasVatInfo([{ quantity: 1, unitNet: 1, vatRate: 0 }], null),
    ).toBe(true);
  });

  it("true when shipping has a rate", () => {
    expect(
      hasVatInfo([{ quantity: 1, unitNet: 1, vatRate: null }], 20),
    ).toBe(true);
  });
});
