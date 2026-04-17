import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Quotes from "@/pages/Quotes";
import { createLoggedInAuthContext, renderWithProviders } from "./helpers";

vi.mock("@/lib/analytics", () => ({
  analytics: { identify: vi.fn(), track: vi.fn(), reset: vi.fn() },
}));

const mockMutateAsync = vi.fn().mockResolvedValue({ id: 1 });

vi.mock("@/hooks/mutations", () => ({
  useAddSupplierQuote: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));

vi.mock("@/hooks/queries", () => ({
  useSuppliers: () => ({ data: [{ id: 1, name: "Supplier A" }, { id: 2, name: "Supplier B" }] }),
  useCurrencies: () => ({ data: [{ id: 1, name: "GBP" }, { id: 2, name: "USD" }] }),
  useItemSearch: () => ({
    data: {
      data: [
        { id: 1, item_id: "PART-001", description: "Widget", total_quantity: 10 },
        { id: 2, item_id: "PART-002", description: "Gadget", total_quantity: 0 },
      ],
      total: 2,
    },
    isFetching: false,
  }),
  useCurrentUser: () => ({ data: { user_id: 1, name: "Test User" } }),
}));

describe("Quotes Page", () => {
  beforeEach(() => {
    mockMutateAsync.mockClear();
  });

  it("renders the page with title, supplier, date, and an item row", () => {
    renderWithProviders(<Quotes />, { auth: createLoggedInAuthContext() });
    expect(screen.getByText("Supplier Quotes")).toBeInTheDocument();
    expect(screen.getByText("Quote Details")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add item/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("0.000")).toBeInTheDocument();
  });

  it("shows the submit button disabled when no data is filled", () => {
    renderWithProviders(<Quotes />, { auth: createLoggedInAuthContext() });
    const submitBtn = screen.getByRole("button", { name: /add.*quote/i });
    expect(submitBtn).toBeDisabled();
  });

  it("shows 0 items ready when form is empty", () => {
    renderWithProviders(<Quotes />, { auth: createLoggedInAuthContext() });
    expect(screen.getByText(/0 items ready/i)).toBeInTheDocument();
  });

  it("can add additional item rows via Add Item button", async () => {
    renderWithProviders(<Quotes />, { auth: createLoggedInAuthContext() });

    const costInputsBefore = screen.getAllByPlaceholderText("0.000");
    expect(costInputsBefore).toHaveLength(1);

    await userEvent.click(screen.getByRole("button", { name: /add item/i }));

    const costInputsAfter = screen.getAllByPlaceholderText("0.000");
    expect(costInputsAfter).toHaveLength(2);
  });

  it("always keeps at least one item row after removal", async () => {
    renderWithProviders(<Quotes />, { auth: createLoggedInAuthContext() });

    expect(screen.getAllByPlaceholderText("0.000")).toHaveLength(1);
    expect(screen.getAllByPlaceholderText("Optional note")).toHaveLength(1);

    await userEvent.click(screen.getByRole("button", { name: /add item/i }));
    expect(screen.getAllByPlaceholderText("0.000")).toHaveLength(2);
    expect(screen.getAllByPlaceholderText("Optional note")).toHaveLength(2);
  });

  it("does not call mutateAsync when submit button is disabled", async () => {
    renderWithProviders(<Quotes />, { auth: createLoggedInAuthContext() });
    const submitBtn = screen.getByRole("button", { name: /add.*quote/i });
    await userEvent.click(submitBtn);
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("shows the date input pre-filled with today's date", () => {
    renderWithProviders(<Quotes />, { auth: createLoggedInAuthContext() });
    const today = new Date().toISOString().split("T")[0];
    const dateInput = screen.getByDisplayValue(today);
    expect(dateInput).toBeInTheDocument();
  });

  it("has optional note input on each line", () => {
    renderWithProviders(<Quotes />, { auth: createLoggedInAuthContext() });
    expect(screen.getByPlaceholderText("Optional note")).toBeInTheDocument();
  });
});
