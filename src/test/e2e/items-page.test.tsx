import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import ItemsPage from "@/pages/Items";
import { createLoggedInAuthContext, renderWithProviders } from "./helpers";

vi.mock("@/lib/analytics", () => ({
  analytics: { identify: vi.fn(), track: vi.fn(), reset: vi.fn() },
}));

vi.mock("@/lib/api", () => ({
  fetchAllPages: vi.fn().mockResolvedValue([]),
  api: { get: vi.fn(), getList: vi.fn(), getListPaginated: vi.fn(), post: vi.fn(), put: vi.fn(), del: vi.fn() },
  streamParseInvoice: vi.fn(),
}));

vi.mock("@/hooks/usePrefetchPages", () => ({
  usePrefetchPages: vi.fn(),
}));

vi.mock("@/hooks/mutations", () => ({
  useAddItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddSale: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddReceipt: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddCustomer: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddLocation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/queries", () => ({
  useItems: () => ({
    data: {
      data: [
        { id: 1, item_id: "PART-001", description: "Widget", category_id: 1, categories: { name: "Electronics" }, locations: ["WH-A"], total_quantity: 10, inventory_balances: [], receipt_lines: [] },
      ],
      total: 1,
    },
    isLoading: false,
  }),
  useItemSearch: () => ({ data: { data: [], total: 0 }, isFetching: false }),
  itemsQueryKeyBase: () => ["items"],
  buildItemsQueryFn: () => () => Promise.resolve({ data: [], total: 0 }),
  useCategories: () => ({ data: [{ id: 1, name: "Electronics" }] }),
  useSuppliers: () => ({ data: [{ id: 1, name: "Supplier A" }] }),
  useLocations: () => ({ data: [{ id: 1, code: "WH-A" }] }),
  useChannels: () => ({ data: [{ id: 1, name: "Online" }] }),
  useCurrencies: () => ({ data: [{ id: 1, name: "GBP" }] }),
  useCustomers: () => ({ data: [{ id: 1, name: "Customer A" }] }),
  useInventoryOnHand: () => ({ data: [] }),
  useCurrentUser: () => ({ data: null }),
  useItemInventory: () => ({ data: [], isLoading: false }),
}));

describe("Items Page — Sale & Receipt Modals", () => {
  it("renders the New Sale and New Receipt buttons in the toolbar", () => {
    renderWithProviders(<ItemsPage />, { auth: createLoggedInAuthContext() });
    expect(screen.getByRole("button", { name: /new sale/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new receipt/i })).toBeInTheDocument();
  });

  it("opens the sale dialog when New Sale is clicked", async () => {
    renderWithProviders(<ItemsPage />, { auth: createLoggedInAuthContext() });

    await userEvent.click(screen.getByRole("button", { name: /new sale/i }));

    expect(await screen.findByText("Channel:")).toBeInTheDocument();
    expect(screen.getByText("Customer:")).toBeInTheDocument();
  });

  it("opens the receipt dialog when New Receipt is clicked", async () => {
    renderWithProviders(<ItemsPage />, { auth: createLoggedInAuthContext() });

    await userEvent.click(screen.getByRole("button", { name: /new receipt/i }));

    expect(await screen.findByText("Supplier:")).toBeInTheDocument();
    expect(screen.getByText("Reference:")).toBeInTheDocument();
  });

  it("still shows the Transfer Stock button alongside the new buttons", () => {
    renderWithProviders(<ItemsPage />, { auth: createLoggedInAuthContext() });
    expect(screen.getByRole("button", { name: /transfer stock/i })).toBeInTheDocument();
  });
});
