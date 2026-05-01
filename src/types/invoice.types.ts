/**
 * Shared types for the PDF invoice parse flow.
 *
 * These are UI-side representations of the SSE stream sent by
 * `POST /api/receipts/parse-invoice/stream`. See
 * `streamParseInvoice` in `@/lib/api` for the raw callback shape.
 */

export interface ParsedLineContext {
  /** Raw part number exactly as printed on the invoice (never modified). */
  partNumber: string;
  /** Short item description from the invoice, if any. */
  description: string | null;
  /** Quantity ordered on this line. */
  quantity: number;
  /** Unit price as parsed (already normalised to per-unit decimal). Gross,
   *  i.e. VAT-inclusive, derived backend-side from `unitPriceNet * (1 + vatRate/100)`. */
  unitPrice: number;
  /** Per-unit NET price (VAT-exclusive) as printed on the invoice. Null when
   *  the invoice has no VAT system at all (e.g. overseas proforma). */
  unitPriceNet: number | null;
  /** Per-line VAT rate as a percentage (e.g. 20 for 20%). Null when the
   *  invoice has no VAT system at all; 0 for explicitly zero-rated lines. */
  vatRate: number | null;
  /** DB item id if the parser was able to match the part number, else null. */
  matchedItemId: number | null;
  /** Canonical part number from the DB if matched, else null. */
  matchedItemName: string | null;
}

/** The Net / VAT / Gross totals block as printed at the bottom of the invoice. */
export interface PrintedTotals {
  net: number;
  vat: number;
  gross: number;
}

export interface ParseContext {
  /** Supplier name as written on the invoice (may be null if not detected). */
  supplierName: string | null;
  /** True when the parser matched this supplier to a DB record. */
  supplierMatched: boolean;
  /** Invoice/reference/order number, if present. */
  reference: string | null;
  /** Currency symbol the parser detected (£, $, €, etc.). */
  currencySymbol: string | null;
  /** Total shipping/freight/postage cost from the invoice, in the invoice's
   *  currency. Gross (VAT-inclusive). 0 when none detected. */
  shippingTotal: number;
  /** Net shipping cost (VAT-exclusive). Null when no shipping or no VAT. */
  shippingNet: number | null;
  /** VAT rate applied to shipping. Null when no shipping or no VAT. */
  shippingVatRate: number | null;
  /** Net / VAT / Gross totals block as printed on the invoice, used as a
   *  cross-check against client-side computed totals. Null when not printed. */
  printedTotals: PrintedTotals | null;
  /** One entry per parsed line, in invoice order. */
  lines: ParsedLineContext[];
  /** Timestamp of the parse — lets consumers detect a fresh upload. */
  createdAt: number;
}
