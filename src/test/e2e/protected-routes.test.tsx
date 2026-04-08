import { screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AppRoutes } from "@/routes";
import { createMockAuthContext, createLoggedInAuthContext, renderWithProviders } from "./helpers";

vi.mock("@/lib/analytics", () => ({
  analytics: { identify: vi.fn(), track: vi.fn(), reset: vi.fn() },
}));

vi.mock("@/lib/prefetch", () => ({
  prefetchAppData: vi.fn(),
}));

const _stubKey = (...args: unknown[]) => ["stub", ...args];
const _stubFn = () => () => Promise.resolve({ data: [], total: 0 });

vi.mock("@/hooks/queries", () => ({
  useSales: () => ({ data: { data: [], total: 0 }, isLoading: false, isFetching: false }),
  salesQueryKeyBase: _stubKey,
  buildSalesQueryFn: _stubFn,
  useReceipts: () => ({ data: { data: [], total: 0 }, isLoading: false, isFetching: false }),
  receiptsQueryKeyBase: _stubKey,
  buildReceiptsQueryFn: _stubFn,
  useItems: () => ({ data: { data: [], total: 0 }, isLoading: false }),
  useItemSearch: () => ({ data: { data: [], total: 0 }, isFetching: false }),
  itemsQueryKeyBase: _stubKey,
  buildItemsQueryFn: _stubFn,
  useCategories: () => ({ data: [], isLoading: false }),
  useCategoriesPaginated: () => ({ data: { data: [], total: 0 }, isLoading: false, isFetching: false }),
  categoriesPageQueryKeyBase: _stubKey,
  buildCategoriesQueryFn: _stubFn,
  useSuppliers: () => ({ data: [], isLoading: false }),
  useSuppliersPaginated: () => ({ data: { data: [], total: 0 }, isLoading: false, isFetching: false }),
  suppliersPageQueryKeyBase: _stubKey,
  buildSuppliersQueryFn: _stubFn,
  useLocations: () => ({ data: [], isLoading: false }),
  useLocationsPaginated: () => ({ data: { data: [], total: 0 }, isLoading: false, isFetching: false }),
  locationsPageQueryKeyBase: _stubKey,
  buildLocationsQueryFn: _stubFn,
  useChannels: () => ({ data: [], isLoading: false }),
  useCurrencies: () => ({ data: [], isLoading: false }),
  useCustomers: () => ({ data: [], isLoading: false }),
  useInventoryOnHand: () => ({ data: [], isLoading: false }),
  useInventoryMovements: () => ({ data: [], isLoading: false }),
  useTransfers: () => ({ data: [], isLoading: false }),
  useMovementsPaginated: () => ({ data: { data: [], total: 0 }, isLoading: false, isFetching: false }),
  movementsPageQueryKeyBase: _stubKey,
  buildMovementsQueryFn: _stubFn,
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
