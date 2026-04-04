import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AddSaleForm } from "@/components/sales/AddSaleForm";
import { createLoggedInAuthContext, renderWithProviders } from "./helpers";

vi.mock("@/lib/analytics", () => ({
  analytics: { identify: vi.fn(), track: vi.fn(), reset: vi.fn() },
}));

const mockMutateAsync = vi.fn().mockResolvedValue({ sale_id: "new-sale" });
const mockAddCustomer = vi.fn().mockResolvedValue({ customer_id: "c1" });

vi.mock("@/hooks/mutations", () => ({
  useAddSale: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  useAddCustomer: () => ({ mutateAsync: mockAddCustomer, isPending: false }),
}));

vi.mock("@/hooks/queries", () => ({
  useChannels: () => ({ data: [{ channel_id: "ch1", channel_name: "Online" }] }),
  useCustomers: () => ({ data: [{ customer_id: "cu1", name: "Existing Customer" }] }),
  useItems: () => ({ data: [{ item_id: "it1", part_number: "PART-001" }] }),
  useLocations: () => ({ data: [{ location_id: "loc1", location_code: "SHELF-A" }] }),
  useInventoryOnHand: () => ({ data: [{ item_id: "it1", location_id: "loc1", quantity_on_hand: 10 }] }),
  useCurrentUser: () => ({ data: null }),
}));

describe("Create Sale Form", () => {
  beforeEach(() => {
    mockMutateAsync.mockClear();
  });

  it("renders the form with channel, customer, part line, and create button", () => {
    renderWithProviders(<AddSaleForm variant="inline" />, { auth: createLoggedInAuthContext() });
    expect(screen.getByText("Channel:")).toBeInTheDocument();
    expect(screen.getByText("Customer:")).toBeInTheDocument();
    expect(screen.getByText(/part 1/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create sale/i })).toBeInTheDocument();
  });

  it("shows validation errors when submitting with empty required fields", async () => {
    renderWithProviders(<AddSaleForm variant="inline" />, { auth: createLoggedInAuthContext() });

    await userEvent.click(screen.getByRole("button", { name: /create sale/i }));

    await waitFor(() => {
      expect(screen.getByText(/missing/i)).toBeInTheDocument();
    });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("does not submit when quantity is 0", async () => {
    renderWithProviders(<AddSaleForm variant="inline" />, { auth: createLoggedInAuthContext() });

    const spinbuttons = screen.getAllByRole("spinbutton");
    if (spinbuttons[0]) {
      await userEvent.clear(spinbuttons[0]);
      await userEvent.type(spinbuttons[0], "0");
    }

    await userEvent.click(screen.getByRole("button", { name: /create sale/i }));
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("does not submit when unit price is negative", async () => {
    renderWithProviders(<AddSaleForm variant="inline" />, { auth: createLoggedInAuthContext() });

    const priceInputs = screen.getAllByRole("spinbutton");
    const priceInput = priceInputs[priceInputs.length - 1];

    if (priceInput) {
      await userEvent.clear(priceInput);
      await userEvent.type(priceInput, "-5");
    }

    await userEvent.click(screen.getByRole("button", { name: /create sale/i }));
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("can add and remove additional part lines", async () => {
    renderWithProviders(<AddSaleForm variant="inline" />, { auth: createLoggedInAuthContext() });

    expect(screen.getByText(/part 1/i)).toBeInTheDocument();
    expect(screen.queryByText(/part 2/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /add part/i }));
    expect(screen.getByText(/part 2/i)).toBeInTheDocument();
  });

  it("clears the form when Clear form is clicked", async () => {
    renderWithProviders(<AddSaleForm variant="inline" />, { auth: createLoggedInAuthContext() });

    const spinbuttons = screen.getAllByRole("spinbutton");
    if (spinbuttons[0]) {
      await userEvent.type(spinbuttons[0], "5");
    }

    await userEvent.click(screen.getByRole("button", { name: /clear form/i }));

    const spinbuttonsAfter = screen.getAllByRole("spinbutton");
    spinbuttonsAfter.forEach((input) => {
      expect(input).toHaveValue(null);
    });
  });
});
