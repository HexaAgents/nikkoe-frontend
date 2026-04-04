# src/hooks/

Custom React hooks for data fetching, mutations, and utilities. Every domain hook follows the same pattern: the component calls a hook, the hook calls `api.ts`, and `api.ts` handles JWT attachment and HTTP transport to the FastAPI backend.

## How it works

1. A component calls a hook (e.g. `useReceipts()`).
2. The hook calls a method on `src/lib/api.ts` (e.g. `api.getList("/receipts")`).
3. `api.ts` reads the JWT from the Supabase session and attaches it as a `Bearer` token.
4. The request hits the FastAPI backend, which validates the token, executes the operation, and returns data.
5. React Query caches the response and keeps the component in sync.

## Why this design

Queries and mutations are separated because they have fundamentally different React Query patterns -- queries auto-refetch and cache, mutations invalidate cache and show toasts.

## Files

- **queries.ts** -- Contains all 20 React Query read hooks. Each uses `useQuery` to fetch data from the backend API. List hooks (`useSales`, `useItems`, `useCategories`, etc.) use `api.getList()` which unwraps the `{ data, total }` pagination envelope and returns just the array. Detail hooks (`useSale`, `useReceipt`, `useItem`) use `api.get()`, and sub-resource hooks (`useItemSupplierQuotes`, `useItemInventory`, etc.) also use `api.get()`. Every hook specifies a `queryKey` array for cache management.
- **mutations.ts** -- Contains all 16 React Query write hooks. Each uses `useMutation` to send data to the backend. On success, each hook invalidates the relevant query keys (so lists auto-refresh) and shows a toast notification via Sonner; on error, shows an error toast. Covers: add/void receipts, add/void sales, add/update/delete items, add/delete categories, add/delete suppliers, add/delete locations, add customers, add/delete supplier quotes.
- **useAuth.ts** -- Consumes the AuthContext and throws a descriptive error if called outside the AuthProvider. Every component that needs session state, user info, or auth methods imports this hook rather than using `useContext` directly.
- **use-mobile.tsx** -- Returns a boolean indicating whether the viewport is below 768px. Uses a `matchMedia` listener that updates on resize, so components can adapt layout responsively.
- **use-toast.ts** -- shadcn/ui toast state management hook for the Radix-based toaster system. Manages the toast queue and provides the `toast()` function used by mutation hooks and forms.
