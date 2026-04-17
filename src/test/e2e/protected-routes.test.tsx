import { screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AppRoutes } from "@/routes";
import { createMockAuthContext, createLoggedInAuthContext, renderWithProviders } from "./helpers";

vi.mock("@/lib/analytics", () => ({
  analytics: { identify: vi.fn(), track: vi.fn(), reset: vi.fn() },
}));

vi.mock("@/lib/prefetch", () => ({
  prefetchAppData: vi.fn(),
}));

vi.mock("@/hooks/queries", () => {
  const stubKey = (...args: unknown[]) => ["stub", ...args];
  const stubFn = () => () => Promise.resolve({ data: [], total: 0 });
  return {
    useSales: () => ({ data: { data: [], total: 0 }, isLoading: false, isFetching: false }),
    salesQueryKeyBase: stubKey,
    buildSalesQueryFn: stubFn,
    useReceipts: () => ({ data: { data: [], total: 0 }, isLoading: false, isFetching: false }),
    receiptsQueryKeyBase: stubKey,
    buildReceiptsQueryFn: stubFn,
    useItems: () => ({ data: { data: [], total: 0 }, isLoading: false }),
    useItemSearch: () => ({ data: { data: [], total: 0 }, isFetching: false }),
    itemsQueryKeyBase: stubKey,
    buildItemsQueryFn: stubFn,
    useCategories: () => ({ data: [], isLoading: false }),
    useCategoriesPaginated: () => ({ data: { data: [], total: 0 }, isLoading: false, isFetching: false }),
    categoriesPageQueryKeyBase: stubKey,
    buildCategoriesQueryFn: stubFn,
    useSuppliers: () => ({ data: [], isLoading: false }),
    useSuppliersPaginated: () => ({ data: { data: [], total: 0 }, isLoading: false, isFetching: false }),
    suppliersPageQueryKeyBase: stubKey,
    buildSuppliersQueryFn: stubFn,
    useLocations: () => ({ data: [], isLoading: false }),
    useLocationsPaginated: () => ({ data: { data: [], total: 0 }, isLoading: false, isFetching: false }),
    locationsPageQueryKeyBase: stubKey,
    buildLocationsQueryFn: stubFn,
    useChannels: () => ({ data: [], isLoading: false }),
    useCurrencies: () => ({ data: [], isLoading: false }),
    useCustomers: () => ({ data: [], isLoading: false }),
    useInventoryOnHand: () => ({ data: [], isLoading: false }),
    useInventoryMovements: () => ({ data: [], isLoading: false }),
    useTransfers: () => ({ data: [], isLoading: false }),
    useMovementsPaginated: () => ({ data: { data: [], total: 0 }, isLoading: false, isFetching: false }),
    movementsPageQueryKeyBase: stubKey,
    buildMovementsQueryFn: stubFn,
    useCurrentUser: () => ({ data: null, isLoading: false }),
    useItemInventory: () => ({ data: [], isLoading: false }),
  };
});

describe("Protected Routes", () => {
  it.each(["/sales", "/receipts", "/items", "/quotes", "/settings"])(
    "redirects to /login when unauthenticated and visiting %s",
    async (route) => {
      const auth = createMockAuthContext({ session: null, loading: false });
      renderWithProviders(<AppRoutes />, { auth, route });
      expect(await screen.findByLabelText(/email/i)).toBeInTheDocument();
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

  it("allows unauthenticated access to /login", async () => {
    const auth = createMockAuthContext({ session: null, loading: false });
    renderWithProviders(<AppRoutes />, { auth, route: "/login" });
    expect(await screen.findByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("allows unauthenticated access to /signup", async () => {
    const auth = createMockAuthContext({ session: null, loading: false });
    renderWithProviders(<AppRoutes />, { auth, route: "/signup" });
    expect(await screen.findByRole("button", { name: /create account/i })).toBeInTheDocument();
  });
});
