import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import ItemDetailPage from "@/pages/ItemDetail";
import { createLoggedInAuthContext, renderWithProviders } from "./helpers";

vi.mock("@/lib/analytics", () => ({
  analytics: { identify: vi.fn(), track: vi.fn(), reset: vi.fn() },
}));

vi.mock("@/lib/api", () => ({
  fetchAllPages: vi.fn().mockResolvedValue([]),
  api: { get: vi.fn(), getList: vi.fn(), getListPaginated: vi.fn(), post: vi.fn(), put: vi.fn(), del: vi.fn() },
  streamParseInvoice: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "1" }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock("@/hooks/mutations", () => ({
  useUpdateItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteSupplierQuote: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddSupplierQuote: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddSale: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddReceipt: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddCustomer: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddLocation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useTransferStock: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/queries", () => ({
  useItem: () => ({
    data: { id: 1, item_id: "PART-001", description: "Widget", category_id: 1, categories: { name: "Electronics" } },
    isLoading: false,
  }),
  useCategories: () => ({ data: [{ id: 1, name: "Electronics" }] }),
  useItemSupplierQuotes: () => ({ data: [] }),
  useItemInventory: () => ({ data: [] }),
  useItemReceipts: () => ({ data: [], isLoading: false }),
  useItemSales: () => ({ data: [], isLoading: false }),
  useItemTransfers: () => ({ data: [], isLoading: false }),
  useSuppliers: () => ({ data: [{ id: 1, name: "Supplier A" }] }),
  useLocations: () => ({ data: [{ id: 1, code: "WH-A" }] }),
  useChannels: () => ({ data: [{ id: 1, name: "Online" }] }),
  useCurrencies: () => ({ data: [{ id: 1, name: "GBP" }] }),
  useCustomers: () => ({ data: [{ id: 1, name: "Customer A" }] }),
  useInventoryOnHand: () => ({ data: [] }),
  useCurrentUser: () => ({ data: null }),
  useItemSearch: () => ({ data: { data: [], total: 0 }, isFetching: false }),
  useItemInventory: () => ({ data: [], isLoading: false }),
}));

describe("Item Detail Page — Sale & Receipt Modals", () => {
  it("renders the New Sale and New Receipt buttons", () => {
    renderWithProviders(<ItemDetailPage />, { auth: createLoggedInAuthContext() });
    expect(screen.getByRole("button", { name: /new sale/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new receipt/i })).toBeInTheDocument();
  });

  it("opens the sale dialog when New Sale is clicked", async () => {
    renderWithProviders(<ItemDetailPage />, { auth: createLoggedInAuthContext() });

    await userEvent.click(screen.getByRole("button", { name: /new sale/i }));

    expect(await screen.findByText("Channel:")).toBeInTheDocument();
    expect(screen.getByText("Customer:")).toBeInTheDocument();
  });

  it("opens the receipt dialog when New Receipt is clicked", async () => {
    renderWithProviders(<ItemDetailPage />, { auth: createLoggedInAuthContext() });

    await userEvent.click(screen.getByRole("button", { name: /new receipt/i }));

    expect(await screen.findByText("Supplier:")).toBeInTheDocument();
    expect(screen.getByText("Reference:")).toBeInTheDocument();
  });

  it("shows the item part number in the page heading", () => {
    renderWithProviders(<ItemDetailPage />, { auth: createLoggedInAuthContext() });
    expect(screen.getByText("PART-001")).toBeInTheDocument();
  });
});
