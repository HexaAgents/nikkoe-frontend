import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AddReceiptForm } from "@/components/receipts/AddReceiptForm";
import { createLoggedInAuthContext, renderWithProviders } from "./helpers";

vi.mock("@/lib/analytics", () => ({
  analytics: { identify: vi.fn(), track: vi.fn(), reset: vi.fn() },
}));

const mockMutateAsync = vi.fn().mockResolvedValue({ receipt_id: "new-receipt" });

vi.mock("@/hooks/mutations", () => ({
  useAddReceipt: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  useAddItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddLocation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/queries", () => ({
  useSuppliers: () => ({ data: [{ id: 1, name: "Supplier A" }] }),
  useCurrencies: () => ({ data: [{ id: 1, name: "GBP" }] }),
  useItems: () => ({ data: { data: [{ id: 1, item_id: "PART-001" }], total: 1 } }),
  useItemSearch: () => ({ data: { data: [{ id: 1, item_id: "PART-001" }], total: 1 }, isFetching: false }),
  useLocations: () => ({ data: [{ id: 1, code: "SHELF-A" }] }),
  useInventoryOnHand: () => ({ data: [] }),
  useCurrentUser: () => ({ data: { user_id: 1, name: "Test User" } }),
  useCategories: () => ({ data: [] }),
  useItemInventory: () => ({ data: [], isLoading: false }),
}));

describe("Create Receipt Form", () => {
  beforeEach(() => {
    mockMutateAsync.mockClear();
  });

  it("renders the form with supplier, reference, note, part line, and create button", () => {
    renderWithProviders(<AddReceiptForm variant="inline" />, { auth: createLoggedInAuthContext() });
    expect(screen.getByText("Supplier:")).toBeInTheDocument();
    expect(screen.getByText("Reference:")).toBeInTheDocument();
    expect(screen.getByText("Note:")).toBeInTheDocument();
    expect(screen.getByText(/part 1/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create receipt/i })).toBeInTheDocument();
  });

  it("shows validation errors when submitting with empty required fields", async () => {
    renderWithProviders(<AddReceiptForm variant="inline" />, { auth: createLoggedInAuthContext() });

    await userEvent.click(screen.getByRole("button", { name: /create receipt/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/missing/i).length).toBeGreaterThan(0);
    });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("does not submit when quantity is 0", async () => {
    renderWithProviders(<AddReceiptForm variant="inline" />, { auth: createLoggedInAuthContext() });

    const spinbuttons = screen.getAllByRole("spinbutton");
    if (spinbuttons[0]) {
      await userEvent.clear(spinbuttons[0]);
      await userEvent.type(spinbuttons[0], "0");
    }

    await userEvent.click(screen.getByRole("button", { name: /create receipt/i }));
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("does not submit when unit cost is negative", async () => {
    renderWithProviders(<AddReceiptForm variant="inline" />, { auth: createLoggedInAuthContext() });

    const spinbuttons = screen.getAllByRole("spinbutton");
    const costInput = spinbuttons[spinbuttons.length - 1];
    if (costInput) {
      await userEvent.clear(costInput);
      await userEvent.type(costInput, "-10");
    }

    await userEvent.click(screen.getByRole("button", { name: /create receipt/i }));
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("can add additional part lines", async () => {
    renderWithProviders(<AddReceiptForm variant="inline" />, { auth: createLoggedInAuthContext() });

    expect(screen.getByText(/part 1/i)).toBeInTheDocument();
    expect(screen.queryByText(/part 2/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /add part/i }));
    expect(screen.getByText(/part 2/i)).toBeInTheDocument();
  });

  it("shows New Part and New Location buttons on each part line", () => {
    renderWithProviders(<AddReceiptForm variant="inline" />, { auth: createLoggedInAuthContext() });
    expect(screen.getByRole("button", { name: /new part/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new location/i })).toBeInTheDocument();
  });

  it("clears the form when Clear form is clicked", async () => {
    renderWithProviders(<AddReceiptForm variant="inline" />, { auth: createLoggedInAuthContext() });

    const refInput = screen.getByPlaceholderText(/po, asn/i);
    await userEvent.type(refInput, "PO-12345");
    expect(refInput).toHaveValue("PO-12345");

    await userEvent.click(screen.getByRole("button", { name: /clear form/i }));
    expect(refInput).toHaveValue("");
  });
});
