// Invoice amounts selected for stock valuation. *(2026-09-06 · Codex)*
import type { ParseContext, ParsedLineContext } from "@/types/invoice.types";
import type { IsoCurrency } from "@/lib/fx";

export function validAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function netOrLegacy(gross: number, net: number | null, rate: number | null): number {
  if (validAmount(net)) return net;
  if (!validAmount(gross)) return NaN;
  // A legacy response can still supply a rate. Never assume a rate of 20%.
  return validAmount(rate) ? gross / (1 + rate / 100) : gross;
}

/** Preserve the established overseas workflow: currency alone does not establish
 * whether foreign tax should be excluded. The verified GBP workflow uses net. */
export function invoiceUnitCost(line: ParsedLineContext, iso: IsoCurrency | null): number {
  return iso === "GBP"
    ? netOrLegacy(line.unitPrice, line.unitPriceNet, line.vatRate)
    : validAmount(line.unitPrice) ? line.unitPrice : NaN;
}

export function invoiceShippingCost(
  invoice: Pick<ParseContext, "shippingTotal" | "shippingNet" | "shippingVatRate">,
  iso: IsoCurrency | null,
): number {
  if (iso !== "GBP") return validAmount(invoice.shippingTotal) ? invoice.shippingTotal : NaN;
  // Existing backend versions turn absent net freight into zero even when gross
  // freight exists. Treat that inconsistent pair as missing, not free shipping.
  const net = invoice.shippingNet === 0 && invoice.shippingTotal > 0 ? null : invoice.shippingNet;
  return netOrLegacy(invoice.shippingTotal, net, invoice.shippingVatRate);
}

/** True when the GBP cost must preserve a legacy amount with unknown tax basis. */
export function hasUnknownNetCosts(invoice: ParseContext): boolean {
  return invoice.lines.some((l) => !validAmount(l.unitPriceNet) && !validAmount(l.vatRate)) ||
    (invoice.shippingTotal > 0 && (!validAmount(invoice.shippingNet) || invoice.shippingNet === 0) &&
      !validAmount(invoice.shippingVatRate));
}
