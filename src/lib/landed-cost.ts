/**
 * Pure math for allocating a single invoice-level shipping charge across
 * line items and converting the result to GBP with a user-supplied FX rate.
 *
 * Kept side-effect-free and free of React so it can be unit-tested in
 * isolation (see src/test/unit/landed-cost.test.ts).
 */

export interface InvoiceLineInput {
  /** Unit price as printed on the invoice (per-unit, invoice currency). */
  unitPrice: number;
  /** Quantity of units on this line. */
  quantity: number;
}

export interface LineFinance {
  /** qty * unitPrice — the line's subtotal in invoice currency. */
  lineTotal: number;
  /** Share of the invoice-level shipping allocated to this line. */
  shippingShare: number;
  /** Per-unit slice of the shipping allocation. */
  shippingPerUnit: number;
  /** unitPrice + shippingPerUnit — per-unit landed cost, invoice currency. */
  landedUnitInvoice: number;
  /** landedUnitInvoice * fxRate — per-unit landed cost in GBP. */
  landedUnitGbp: number;
  /** Line-level landed cost in GBP (landedUnitGbp * quantity). */
  landedLineGbp: number;
}

export interface InvoiceFinance {
  /** Σ lineTotal across all lines, invoice currency. */
  subtotal: number;
  /** subtotal + shippingTotal, invoice currency. */
  invoiceTotal: number;
  /** invoiceTotal * fxRate — grand total in GBP. */
  grandTotalGbp: number;
  /** Per-line breakdowns, in input order. */
  lines: LineFinance[];
}

/**
 * Allocate `shippingTotal` across `lines` proportionally to each line's
 * invoice-currency subtotal (`qty * unitPrice`), then convert to GBP using
 * `fxRate` (1 if the invoice is already in GBP).
 *
 * Edge cases:
 * - Empty `lines` -> zeroed totals, no per-line rows.
 * - `subtotal === 0` -> no shipping allocated (shares stay 0).
 * - `quantity <= 0` -> `shippingPerUnit === 0` (no division by zero) but
 *   the share is still counted so the remainder gets spread across other
 *   lines proportionally.
 * - `fxRate <= 0` or non-finite -> treated as 1 (defensive fallback).
 */
export function computeInvoiceFinance(
  lines: InvoiceLineInput[],
  shippingTotal: number,
  fxRate: number,
): InvoiceFinance {
  const safeFx = Number.isFinite(fxRate) && fxRate > 0 ? fxRate : 1;
  const safeShipping = Number.isFinite(shippingTotal) && shippingTotal > 0 ? shippingTotal : 0;

  const lineTotals = lines.map((l) => {
    const qty = Number.isFinite(l.quantity) && l.quantity > 0 ? l.quantity : 0;
    const unit = Number.isFinite(l.unitPrice) && l.unitPrice >= 0 ? l.unitPrice : 0;
    return { qty, unit, lineTotal: qty * unit };
  });

  const subtotal = lineTotals.reduce((s, l) => s + l.lineTotal, 0);

  const perLine: LineFinance[] = lineTotals.map(({ qty, unit, lineTotal }) => {
    const share = subtotal > 0 ? (lineTotal / subtotal) * safeShipping : 0;
    const shipPerUnit = qty > 0 ? share / qty : 0;
    const landedUnitInvoice = unit + shipPerUnit;
    const landedUnitGbp = landedUnitInvoice * safeFx;
    return {
      lineTotal,
      shippingShare: share,
      shippingPerUnit: shipPerUnit,
      landedUnitInvoice,
      landedUnitGbp,
      landedLineGbp: landedUnitGbp * qty,
    };
  });

  const invoiceTotal = subtotal + safeShipping;

  return {
    subtotal,
    invoiceTotal,
    grandTotalGbp: invoiceTotal * safeFx,
    lines: perLine,
  };
}
