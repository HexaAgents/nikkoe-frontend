import { screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AppRoutes } from "@/routes";
import { createMockAuthContext, createLoggedInAuthContext, renderWithProviders } from "./helpers";

vi.mock("@/lib/analytics", () => ({
  analytics: { identify: vi.fn(), track: vi.fn(), reset: vi.fn() },
}));

vi.mock("@/hooks/queries", () => ({
  useSales: () => ({ data: [], isLoading: false }),
  useReceipts: () => ({ data: [], isLoading: false }),
  useItems: () => ({ data: [], isLoading: false }),
  useCategories: () => ({ data: [], isLoading: false }),
  useSuppliers: () => ({ data: [], isLoading: false }),
  useLocations: () => ({ data: [], isLoading: false }),
  useChannels: () => ({ data: [], isLoading: false }),
  useCustomers: () => ({ data: [], isLoading: false }),
  useInventoryOnHand: () => ({ data: [], isLoading: false }),
  useInventoryMovements: () => ({ data: [], isLoading: false }),
  useCurrentUser: () => ({ data: null, isLoading: false }),
}));

describe("Protected Routes", () => {
  it.each(["/sales", "/receipts", "/items", "/settings"])(
    "redirects to /login when unauthenticated and visiting %s",
    (route) => {
      const auth = createMockAuthContext({ session: null, loading: false });
      renderWithProviders(<AppRoutes />, { auth, route });
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    }
  );

  it("shows loading spinner while auth is checking", () => {
    const auth = createMockAuthContext({ loading: true });
    renderWithProviders(<AppRoutes />, { auth, route: "/sales" });
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
  });

  it("renders /sales page when user is authenticated (not redirected to login)", () => {
    const auth = createLoggedInAuthContext();
    renderWithProviders(<AppRoutes />, { auth, route: "/sales" });
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
  });

  it("allows unauthenticated access to /login", () => {
    const auth = createMockAuthContext({ session: null, loading: false });
    renderWithProviders(<AppRoutes />, { auth, route: "/login" });
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("allows unauthenticated access to /signup", () => {
    const auth = createMockAuthContext({ session: null, loading: false });
    renderWithProviders(<AppRoutes />, { auth, route: "/signup" });
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });
});
