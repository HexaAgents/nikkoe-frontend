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
  /** Unit price as parsed (already normalised to per-unit decimal). */
  unitPrice: number;
  /** DB item id if the parser was able to match the part number, else null. */
  matchedItemId: number | null;
  /** Canonical part number from the DB if matched, else null. */
  matchedItemName: string | null;
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
  /** One entry per parsed line, in invoice order. */
  lines: ParsedLineContext[];
  /** Timestamp of the parse — lets consumers detect a fresh upload. */
  createdAt: number;
}
