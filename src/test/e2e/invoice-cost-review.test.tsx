// Adversarial receipt payload checks. *(2026-09-06 · Codex)*
// Real form, real child controls and receipt mutation; only external I/O is mocked.
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddReceiptForm } from "@/components/receipts/AddReceiptForm";
import { streamParseInvoice } from "@/lib/api";
import { createLoggedInAuthContext, renderWithProviders } from "./helpers";

const state = vi.hoisted(() => ({
  save: vi.fn().mockResolvedValue({ receipt_id: 1 }),
  currencies: [{ id: 1, name: "GBP" }, { id: 2, name: "USD" }, { id: 3, name: "EUR" }],
  suppliers: [{ id: 1, name: "Supplier A" }],
  locations: [{ id: 1, code: "SHELF-A" }],
  fx: { rate: 0.8 as number | null, isFetching: false, error: null as Error | null, refetch: vi.fn() },
  finishStream: true,
}));
vi.mock("@/lib/analytics", () => ({ analytics: { identify: vi.fn(), track: vi.fn(), reset: vi.fn() } }));
vi.mock("@/lib/api", async (original) => ({ ...(await original<object>()), streamParseInvoice: vi.fn() }));
vi.mock("@/hooks/useFxRate", () => ({ useFxRate: () => state.fx }));
vi.mock("@/hooks/mutations", () => ({
  useAddReceipt: () => ({ mutateAsync: state.save, isPending: false }),
  useAddItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddLocation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddSupplier: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateSupplierAlias: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateSupplierPartMapping: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/hooks/queries", () => ({
  useSuppliers: () => ({ data: state.suppliers }),
  useCurrencies: () => ({ data: state.currencies }),
  useLocations: () => ({ data: state.locations }),
  useItems: () => ({ data: { data: [], total: 0 } }),
  useItemSearch: () => ({ data: { data: [], total: 0 }, isFetching: false }),
  useInventoryOnHand: () => ({ data: [] }),
  useCurrentUser: () => ({ data: { user_id: 1, name: "Test User" } }),
  useCategories: () => ({ data: [] }),
  useItemInventory: () => ({ data: [], isLoading: false }),
}));

type Callbacks = Parameters<typeof streamParseInvoice>[1];
type Header = Parameters<Callbacks["onHeader"]>[0];
type Line = Parameters<Callbacks["onLine"]>[0];
function line(id: number, net: number, rate: number | null, quantity = 1): Line {
  return {
    part_number: `PART-${id}`, description: null, quantity,
    unit_price: net * (1 + (rate ?? 0) / 100), unit_price_net: net, vat_rate: rate,
    matched_item_id: id, matched_item_name: `PART-${id}`,
    matched_location_id: 1, matched_location_code: "SHELF-A",
  };
}
async function upload(lines: Line[], overrides: Partial<Header> = {}) {
  vi.mocked(streamParseInvoice).mockImplementation(async (_file, cb) => {
    cb.onHeader({ supplier_name: "Supplier A", matched_supplier_id: 1,
      reference: "INV-REVIEW", currency_symbol: "£", shipping_total: 0,
      shipping_net: 0, shipping_vat_rate: null, printed_totals: null,
      total_lines: lines.length, ...overrides });
    lines.forEach((entry) => cb.onLine(entry));
    if (state.finishStream) cb.onDone?.({ total: lines.length });
  });
  const view = renderWithProviders(<AddReceiptForm />, { auth: createLoggedInAuthContext() });
  const input = view.container.querySelector<HTMLInputElement>('input[type="file"]');
  expect(input).not.toBeNull();
  await userEvent.upload(input!, new File(["fixture"], "invoice.pdf", { type: "application/pdf" }));
  await screen.findByText(/Parsed .* line item/);
  return view;
}
async function submit() {
  await userEvent.click(screen.getByRole("button", { name: /^create receipt$/i }));
  await waitFor(() => expect(state.save).toHaveBeenCalledTimes(1));
  return state.save.mock.calls[0][0].lines as Array<{ item_id: number; quantity: number; unit_price: number; currency_id: number }>;
}
function card(index: number) {
  const title = screen.getByText(new RegExp(`^Part ${index + 1}$`, "i"));
  return title.closest('div.border') as HTMLElement;
}

describe("Invoice import cost contract", () => {
  beforeEach(() => {
    state.save.mockClear(); vi.mocked(streamParseInvoice).mockReset();
    state.fx.rate = 0.8; state.fx.error = null; state.finishStream = true;
  });

  it.each([20, 5, 0, null])("GBP saves net at VAT rate %s without hard-coding 20%%", async (rate) => {
    await upload([line(1, 1.99, rate, 10)]);
    expect((await submit())[0]).toMatchObject({ item_id: 1, unit_price: 1.99, quantity: 10, currency_id: 1 });
  });

  it("allocates net freight using net product values across mixed VAT rates", async () => {
    await upload([line(1, 10, 20, 2), line(2, 5, 5, 4)], {
      shipping_net: 8, shipping_total: 9.6, shipping_vat_rate: 20,
    });
    expect((await submit()).map((l) => l.unit_price)).toEqual([12, 6]);
  });

  it("explicit zero price remains zero and does not fall back to gross", async () => {
    await upload([{ ...line(1, 0, 20), unit_price: 2 }]);
    expect((await submit())[0].unit_price).toBe(0);
  });

  it("legacy shipping with no net value retains the charge", async () => {
    await upload([line(1, 10, 0, 2)], { shipping_net: null, shipping_total: 6 });
    expect((await submit())[0].unit_price).toBe(13);
  });

  it("handles the deployed backend's missing-net shipping sentinel without dropping freight", async () => {
    await upload([line(1, 10, 0, 2)], { shipping_net: 0, shipping_total: 6, shipping_vat_rate: null });
    expect((await submit())[0].unit_price).toBe(13);
  });

  it("preserves a legacy item price when net and VAT are unknown", async () => {
    await upload([{ ...line(1, 10, null), unit_price_net: null }]);
    expect((await submit())[0].unit_price).toBe(10);
  });

  it("derives missing net from a known VAT rate in both saved cost and displayed invoice totals", async () => {
    await upload([{ ...line(1, 10, 20), unit_price_net: null }], {
      printed_totals: { net: 10, vat: 2, gross: 12 },
    });
    expect(screen.queryByText(/Computed total differs/)).not.toBeInTheDocument();
    expect((await submit())[0].unit_price).toBe(10);
  });

  it("preserves existing overseas proforma FX behaviour", async () => {
    await upload([line(1, 10, null, 2)], { currency_symbol: "$", shipping_net: 4, shipping_total: 4 });
    expect((await submit())[0]).toMatchObject({ unit_price: 9.6, currency_id: 1 });
  });

  it("removing the first imported item preserves the second item's price and identity", async () => {
    await upload([line(1, 10, 0), line(2, 25, 0)]);
    // The existing icon-only remove button has no accessible name.
    const remove = card(0).querySelector('button:has(svg.lucide-trash2)');
    expect(remove).not.toBeNull();
    await userEvent.click(remove!);
    const dialog = screen.queryByRole("dialog");
    if (dialog) await userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(await submit()).toEqual([expect.objectContaining({ item_id: 2, unit_price: 25 })]);
  });

  it("a manually corrected unit cost survives quantity changes", async () => {
    await upload([line(1, 10, 20, 2)]);
    const [qty, cost] = within(card(0)).getAllByRole("spinbutton");
    fireEvent.change(cost, { target: { value: "7.25" } });
    fireEvent.change(qty, { target: { value: "3" } });
    expect(screen.getByText("£21.75")).toBeInTheDocument();
    expect((await submit())[0]).toMatchObject({ unit_price: 7.25, quantity: 3 });
  });

  it("preserves four-decimal net prices for inexpensive components", async () => {
    await upload([line(1, 0.0004, 20, 10000)]);
    expect((await submit())[0].unit_price).toBe(0.0004);
  });

  it("allocates freight to zero-priced samples instead of losing the charge", async () => {
    await upload([line(1, 0, 0, 2), line(2, 0, 0, 3)], { shipping_net: 10, shipping_total: 12, shipping_vat_rate: 20 });
    const saved = await submit();
    expect(saved.map((l) => l.unit_price)).toEqual([2, 2]);
    expect(saved.reduce((sum, l) => sum + l.quantity * l.unit_price, 0)).toBe(10);
  });

  it("editing freight changes both saved costs and the shipping VAT breakdown", async () => {
    await upload([line(1, 10, 20, 2)], { shipping_net: 4, shipping_total: 4.8, shipping_vat_rate: 20 });
    const shipping = screen.getAllByRole("spinbutton")[0];
    fireEvent.change(shipping, { target: { value: "8" } });
    // Current net 20+8, VAT 5.6, gross 33.6, saved stock cost 28.
    expect(screen.getByText("£33.60")).toBeInTheDocument();
    expect((await submit())[0].unit_price).toBe(14);
  });

  it("recalculates item and freight bases when the invoice currency is corrected", async () => {
    await upload([line(1, 10, 20, 2)], { currency_symbol: "$", shipping_net: 4, shipping_total: 4.8, shipping_vat_rate: 20 });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "GBP" } });
    expect((await submit())[0].unit_price).toBe(12);
  });

  it("retains a manually edited freight amount when currency is corrected", async () => {
    await upload([line(1, 10, 20, 2)], { currency_symbol: "$", shipping_net: 4, shipping_total: 4.8, shipping_vat_rate: 20 });
    fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "6" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "GBP" } });
    expect((await submit())[0].unit_price).toBe(13);
  });

  it("unknown currency requires selection instead of silently treating the amount as GBP", async () => {
    await upload([line(1, 10, 20)], { currency_symbol: null });
    await userEvent.click(screen.getByRole("button", { name: /^create receipt$/i }));
    expect(state.save).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "GBP" } });
    expect((await submit())[0].unit_price).toBe(10);
  });

  it("missing FX never saves foreign prices at an invented 1:1 rate", async () => {
    state.fx.rate = null; state.fx.error = new Error("offline");
    await upload([line(1, 10, null)], { currency_symbol: "$" });
    await userEvent.click(screen.getByRole("button", { name: /^create receipt$/i }));
    expect(state.save).not.toHaveBeenCalled();
    fireEvent.change(screen.getAllByRole("spinbutton")[1], { target: { value: "0.75" } });
    expect((await submit())[0].unit_price).toBe(7.5);
  });

  it("an incomplete stream cannot save only part of an invoice", async () => {
    state.finishStream = false;
    await upload([line(1, 10, 20)]);
    expect(screen.getByRole("alert")).toHaveTextContent("Invoice import is incomplete");
    await userEvent.click(screen.getByRole("button", { name: /^create receipt$/i }));
    expect(state.save).not.toHaveBeenCalled();
  });

  it("warns when legacy charges have an unknown tax basis instead of calling them verified net", async () => {
    await upload([{ ...line(1, 10, null), unit_price_net: null }]);
    expect(screen.getByRole("alert")).toHaveTextContent("Some net amounts are unavailable");
    expect((await submit())[0].unit_price).toBe(10);
  });

  it("manual rows do not take freight away from automatically priced imports", async () => {
    await upload([line(1, 10, 0, 2)], { shipping_net: 4, shipping_total: 4 });
    await userEvent.click(screen.getByRole("button", { name: /^add part$/i }));
    const [qty, cost] = within(card(1)).getAllByRole("spinbutton");
    fireEvent.change(qty, { target: { value: "2" } });
    fireEvent.change(cost, { target: { value: "100" } });
    await waitFor(() => expect(within(card(0)).getAllByRole("spinbutton")[1]).toHaveValue(12));
    expect(cost).toHaveValue(100);
  });

  it("fractional freight and a precise FX rate do not trip native number-input validation", async () => {
    state.fx.rate = 0.856721;
    await upload([line(1, 10, null, 2)], { currency_symbol: "€", shipping_net: 1.2345, shipping_total: 1.2345 });
    const [shipping, rate] = screen.getAllByRole("spinbutton") as HTMLInputElement[];
    expect(shipping.checkValidity()).toBe(true);
    expect(rate.checkValidity()).toBe(true);
    expect((await submit())[0].unit_price).toBe(9.096);
  });

  it("invalid parsed prices block saving rather than turning an item into free stock", async () => {
    await upload([{ ...line(1, 10, null), unit_price: NaN, unit_price_net: null }]);
    await userEvent.click(screen.getByRole("button", { name: /^create receipt$/i }));
    expect(state.save).not.toHaveBeenCalled();
    fireEvent.change(within(card(0)).getAllByRole("spinbutton")[1], { target: { value: "10" } });
    expect((await submit())[0].unit_price).toBe(10);
  });
});
