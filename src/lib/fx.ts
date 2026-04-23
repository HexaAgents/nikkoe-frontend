/**
 * Live currency conversion helpers backed by Frankfurter
 * (https://api.frankfurter.dev/v1). Uses ECB reference rates published daily;
 * no API key required; CORS is open for browser use
 * (`access-control-allow-origin: *`).
 *
 * We only support the three symbols the invoice parser emits today (£, $, €),
 * but the ISO type is deliberately open-ended so new currencies can be added
 * in one place.
 */

export type IsoCurrency = "GBP" | "USD" | "EUR";

const SYMBOL_TO_ISO: Record<string, IsoCurrency> = {
  "£": "GBP",
  "$": "USD",
  "€": "EUR",
};

/**
 * Map a currency symbol (e.g. "£") to its ISO 4217 code (e.g. "GBP").
 * Accepts the symbol itself OR an already-ISO string. Returns null when
 * the symbol is unknown so callers can disable FX features gracefully.
 */
export function symbolToIso(sym: string | null | undefined): IsoCurrency | null {
  if (!sym) return null;
  const trimmed = sym.trim();
  if (trimmed in SYMBOL_TO_ISO) return SYMBOL_TO_ISO[trimmed];
  const upper = trimmed.toUpperCase();
  if (upper === "GBP" || upper === "USD" || upper === "EUR") return upper;
  return null;
}

/** Human-facing symbol for an ISO code. */
export function isoToSymbol(iso: IsoCurrency): string {
  switch (iso) {
    case "GBP": return "£";
    case "USD": return "$";
    case "EUR": return "€";
  }
}

/**
 * Fetch the latest mid-market rate converting 1 unit of `from` into GBP.
 * Returns 1 when from === "GBP". Throws on network / non-200 / malformed
 * response so callers can decide how to surface failure.
 */
export async function fetchGbpRate(from: IsoCurrency): Promise<number> {
  if (from === "GBP") return 1;

  const url = `https://api.frankfurter.dev/v1/latest?base=${from}&symbols=GBP`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`FX rate fetch failed (${res.status})`);
  }
  const body: unknown = await res.json();
  const rate =
    typeof body === "object" && body !== null && "rates" in body
      ? (body as { rates?: { GBP?: unknown } }).rates?.GBP
      : undefined;
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    throw new Error("FX rate fetch returned an invalid value");
  }
  return rate;
}
