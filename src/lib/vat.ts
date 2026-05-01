/**
 * Pure math for computing the Net / VAT / Gross breakdown of a parsed
 * invoice, at three levels: per line, shipping, and totals.
 *
 * Independent of `landed-cost.ts` (shipping allocation + FX conversion):
 * VAT is a per-line property of the invoice itself, while landed cost is a
 * post-hoc allocation of freight and FX onto stock cost. They share inputs
 * but compose orthogonally.
 *
 * Kept side-effect-free and free of React so it can be unit-tested in
 * isolation (see src/test/unit/vat.test.ts).
 */

export interface VatLine {
  /** Quantity on this line. Non-positive values are clamped to 0. */
  quantity: number;
  /** Per-unit NET price. Negative or non-finite values are clamped to 0. */
  unitNet: number;
  /** Per-line VAT rate as a percentage (e.g. 20 for 20%). null/non-finite
   *  treated as no VAT (rate 0). */
  vatRate: number | null;
}

export interface VatTotals {
  net: number;
  vat: number;
  gross: number;
}

export interface VatPerLine extends VatTotals {
  /** Effective VAT rate used for this line; null when no VAT. */
  rate: number | null;
}

export interface VatShipping extends VatTotals {
  /** Effective VAT rate used for shipping; null when no shipping or no VAT. */
  rate: number | null;
}

export interface VatBreakdown {
  /** Per-line breakdowns, in input order. */
  perLine: VatPerLine[];
  /** Σ across product lines. */
  subtotal: VatTotals;
  /** Shipping breakdown (zeroes when there is no shipping). */
  shipping: VatShipping;
  /** subtotal + shipping. */
  total: VatTotals;
}

/** Coerce a number with a non-negative-finite contract; bad inputs → 0. */
function safe(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function safeRate(rate: number | null | undefined): number {
  if (rate == null) return 0;
  return Number.isFinite(rate) && rate > 0 ? rate : 0;
}

/**
 * Compute the Net / VAT / Gross breakdown for an invoice's product lines
 * plus its shipping charge.
 *
 * Edge cases:
 * - Empty `lines` -> zeroed subtotal, no per-line rows.
 * - `unitNet < 0` or `quantity <= 0` -> contribute 0 to net/vat/gross.
 * - `vatRate` null/missing -> treated as 0% (net == gross, vat = 0). The
 *   returned `rate` is preserved as-printed (null in / null out) so the UI
 *   can distinguish "no VAT system" from "explicit 0% line".
 * - `shippingNet < 0` -> clamped to 0.
 */
export function computeVatBreakdown(
  lines: VatLine[],
  shippingNet: number,
  shippingVatRate: number | null,
): VatBreakdown {
  const perLine: VatPerLine[] = lines.map((l) => {
    const qty = safe(l.quantity);
    const unitNet = safe(l.unitNet);
    const rate = safeRate(l.vatRate);
    const net = unitNet * qty;
    const vat = (net * rate) / 100;
    return {
      net,
      vat,
      gross: net + vat,
      rate: l.vatRate == null ? null : l.vatRate,
    };
  });

  const subtotal: VatTotals = perLine.reduce(
    (acc, l) => ({
      net: acc.net + l.net,
      vat: acc.vat + l.vat,
      gross: acc.gross + l.gross,
    }),
    { net: 0, vat: 0, gross: 0 },
  );

  const shipNet = safe(shippingNet);
  const shipRate = safeRate(shippingVatRate);
  const shipVat = (shipNet * shipRate) / 100;
  const shipping: VatShipping = {
    net: shipNet,
    vat: shipVat,
    gross: shipNet + shipVat,
    rate: shipNet > 0 ? (shippingVatRate ?? null) : null,
  };

  const total: VatTotals = {
    net: subtotal.net + shipping.net,
    vat: subtotal.vat + shipping.vat,
    gross: subtotal.gross + shipping.gross,
  };

  return { perLine, subtotal, shipping, total };
}

/**
 * Whether any line or shipping has a non-null VAT rate. Useful to gate the
 * VAT-breakdown UI: invoices from non-VAT-registered overseas suppliers
 * have all-null rates, in which case the UI should hide the breakdown.
 */
export function hasVatInfo(
  lines: VatLine[],
  shippingVatRate: number | null,
): boolean {
  if (shippingVatRate != null) return true;
  return lines.some((l) => l.vatRate != null);
}
