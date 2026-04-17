# Test Suite — nikkoe-frontend

This document explains the structure, purpose, and reasoning behind every test file and test category in the frontend test suite.

---

## Overview

The frontend test suite uses **Vitest** with two separate configurations, plus Testing Library and jsdom for component testing. Tests are organized into three categories:

```
src/test/
  setup.ts                        Vitest setup (jest-dom matchers, browser mocks)
  example.test.ts                 Smoke test — is the test runner working?

  unit/
    utils.test.ts                 cn() class name merge utility
    api.test.ts                   apiFetch and api convenience methods
    analytics.test.ts             PostHog analytics wrapper
    domain-types.test.ts          Domain type contract verification

  e2e/
    helpers.tsx                   Mock auth context + renderWithProviders utility
    login.test.tsx                Login page: wrong creds blocked, success → /sales
    signup.test.tsx               Signup page: password validation, success flow
    protected-routes.test.tsx     Route protection: unauthenticated → /login redirect
    create-sale.test.tsx          Sale form: field validation, add/clear parts
    create-receipt.test.tsx       Receipt form: field validation, inline create buttons
    quotes.test.tsx               Quotes page: multi-item form, add/remove rows, submit guard
    items-page.test.tsx           Items page: New Sale / New Receipt modal buttons
    settings.test.tsx             Change password: short/mismatched passwords blocked

  validation/
    schemas.test.ts               Zod schema validation rules

  integration/
    connection.test.ts            Supabase connectivity smoke test
    categories.test.ts            Category CRUD against live database
    items.test.ts                 Item CRUD against live database
    locations.test.ts             Location CRUD against live database
    receipts.test.ts              Receipt lifecycle against live database
    sales.test.ts                 Sale lifecycle against live database
    suppliers.test.ts             Supplier CRUD against live database

  helpers/
    auth.ts                       Test user authentication helper
    cleanup.ts                    Test data cleanup tracker
    test-client.ts                Supabase client for test environment
```

---

## Two Test Configurations

The frontend has two separate Vitest config files, each running a different subset of tests in a different environment:

| Config | Environment | Includes | Excludes | Timeout |
|--------|------------|----------|----------|---------|
| `vitest.config.ts` | **jsdom** (simulated browser) | `src/**/*.{test,spec}.*` | `src/test/integration/**` | Default (5s) |
| `vitest.integration.config.ts` | **node** (real network) | `src/test/integration/**` | Everything else | 15 seconds |

### Why two configs?

Unit tests and integration tests have fundamentally different needs:

- **Unit tests** need a fake browser environment (jsdom) for React components and DOM APIs. They should be fast (milliseconds) and run without any external services.
- **Integration tests** need real network access to talk to Supabase. They use the `node` environment because they don't render DOM. They need longer timeouts because database calls over the network are unpredictable. They run sequentially to avoid database race conditions.

Mixing these in one configuration would mean either running unit tests in `node` (breaking component tests) or running integration tests in `jsdom` (unnecessary overhead and potential compatibility issues).

---

## Running the Tests

```bash
# Unit + validation tests only (fast, no credentials needed)
npm test

# Watch mode (re-runs on file save)
npm run test:watch

# Unit tests only (excludes integration)
npm run test:unit

# Integration tests only (requires .env.test with Supabase credentials)
npm run test:integration

# Everything
npm run test:all
```

---

## `setup.ts` — Test Environment Setup

```typescript
import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", { ... });
```

### What it does

1. **Imports jest-dom matchers** — adds custom assertions like `toBeInTheDocument()`, `toBeVisible()`, and `toHaveTextContent()` to Vitest's `expect`. These are essential for component testing.

2. **Mocks `window.matchMedia`** — many UI components (especially theme-aware ones like those using `next-themes`) call `window.matchMedia()` to detect dark mode or responsive breakpoints. jsdom doesn't implement `matchMedia`, so without this mock, those components crash during tests.

### Why it exists as a setup file

Vitest runs setup files before every test file automatically. This avoids repeating the same imports and mocks in every test file.

---

## Unit Tests (`src/test/unit/`)

### `utils.test.ts` — Class Name Merge Utility

**What it tests:** The `cn()` function from `src/lib/utils.ts`, which combines `clsx` (conditional class names) with `tailwind-merge` (Tailwind CSS conflict resolution).

**Test cases:**
- Single class passes through unchanged
- Multiple classes are merged
- Tailwind conflicts resolve correctly (e.g., `cn("px-4", "px-8")` returns `"px-8"`, not `"px-4 px-8"`)
- Falsy values (`false`, `undefined`, `null`) are filtered out
- Object syntax (`{ "text-red-500": true }`) works
- Array syntax works
- Empty/no arguments return empty string

**Why test a utility function?**

`cn()` is used in virtually every component in the codebase. If it breaks (e.g., after upgrading `tailwind-merge`), the entire UI's styling breaks. These tests are trivial to write but protect against subtle regressions when dependencies are updated.

---

### `api.test.ts` — API Client

**What it tests:** The `apiFetch` function and the `api` convenience object from `src/lib/api.ts`. This module is the single point of contact between the frontend and the backend API.

**How mocking works:**

The API module depends on two things:
1. `localStorage` — to read the stored JWT token
2. `globalThis.fetch` — to make HTTP requests

Both are controlled in tests:
- `setStoredToken("test-token-abc")` writes a test token to localStorage before each test.
- `fetch` is replaced with `vi.fn()` before each test and restored after.

**Test cases for `apiFetch`:**
- Sends the auth token from localStorage in the `Authorization` header
- Omits the Authorization header when no token is stored
- Sets `Content-Type: application/json`
- Returns parsed JSON on success
- Throws with the error message from the response body on failure
- Throws a generic `"Request failed: {status}"` message when the body has no `error` field
- Throws a generic message when the response body isn't valid JSON
- Passes custom options (method, body) through to fetch

**Test cases for `api` convenience methods:**
- `api.get()` returns the full response
- `api.getList()` extracts the `data` array from a paginated response (`{ data: [...], total: N }`)
- `api.post()` sends a POST request with a JSON body
- `api.put()` sends a PUT request
- `api.del()` sends a DELETE request

**Why test the API client?**

Every query hook (`useItems`, `useSales`, etc.) and every mutation hook (`useAddItem`, `useVoidSale`, etc.) depends on this module. It handles:
- Authentication token injection (if this breaks, all API calls fail with 401)
- Error message extraction (if this breaks, users see `"[object Object]"` instead of real error messages)
- Response parsing (if `getList` breaks, every list page shows no data)

Testing this module gives confidence that the entire data layer works correctly, without needing to test every individual hook.

---

### `analytics.test.ts` — PostHog Analytics Wrapper

**What it tests:** The `analytics` object from `src/lib/analytics.ts`, which wraps PostHog's `identify`, `capture`, and `reset` methods.

**How mocking works:** PostHog is mocked via `vi.mock("posthog-js")` to avoid loading the real PostHog SDK (which would try to make network requests).

**Test cases:**
- `analytics.identify()` calls `posthog.identify()` with the correct user ID and properties
- `analytics.track()` calls `posthog.capture()` with the correct event name and properties
- `analytics.reset()` calls `posthog.reset()`
- All methods work with and without optional properties

**Why test an analytics wrapper?**

The wrapper is thin, but it's the only interface between the app and PostHog. If the PostHog API changes (e.g., `capture` is renamed), these tests catch it immediately. They also serve as documentation of how analytics events are structured.

---

### `domain-types.test.ts` — Type Contract Tests

**What it tests:** Creates objects conforming to the TypeScript interfaces defined in `src/types/domain.types.ts` and `src/types/api.types.ts`, then verifies they have the expected fields.

**Why test types at runtime?**

TypeScript types are erased at compile time — they don't exist in the JavaScript that runs in the browser. These tests serve as:

1. **Living documentation** — they show exactly what shape each API response should have.
2. **Regression detection** — if someone renames `item_id` to `id` in the type definition, these tests fail. The TypeScript compiler alone wouldn't catch all downstream effects.
3. **Contract verification** — they document the agreed-upon shape between frontend and backend.

---

## Validation Tests (`src/test/validation/`)

### `schemas.test.ts` — Zod Schema Validation

**What it tests:** All Zod validation schemas defined in `src/lib/schemas.ts`:

| Schema | What it validates |
|--------|------------------|
| `saleInputSchema` | Sale header fields (customer, channel, note) |
| `saleLineInputSchema` | Sale line items (quantity, price, currency) |
| `receiptInputSchema` | Receipt header fields (supplier, reference, note) |
| `receiptLineInputSchema` | Receipt line items (quantity, cost, currency) |
| `itemInputSchema` | Item creation (part number, description, category) |
| `categoryNameSchema` | Category name (trimmed, non-empty) |
| `locationInputSchema` | Location creation (code, description) |
| `supplierInputSchema` | Supplier creation (name, address, email, phone) |
| `supplierQuoteInputSchema` | Supplier quote (item, supplier, cost, currency) |

For each schema, tests cover:
- **Happy path** — valid minimal input, valid fully-populated input
- **Boundary values** — max length strings, zero values
- **Rejection** — missing required fields, empty strings, values exceeding limits, negative numbers, invalid emails
- **Transformation** — whitespace trimming on `part_number`, `location_code`, category names

**Why Zod schemas?**

These schemas mirror the backend's Pydantic validation models. By validating on the frontend before sending requests, we:
- Give users instant feedback without waiting for a network round-trip
- Reduce unnecessary load on the backend API
- Ensure the frontend and backend agree on what valid data looks like

---

## Integration Tests (`src/test/integration/`)

### How they work

Integration tests connect to a **real Supabase database** and perform actual CRUD operations. They:

1. **Authenticate** using test credentials from `.env.test` via the `signInTestUser()` helper.
2. **Create test data** with unique identifiers (generated by `uid()` and `uuid()` from `cleanup.ts`).
3. **Perform operations** — insert, read, update, delete.
4. **Assert results** — verify the database returned the expected data.
5. **Clean up** — the `CleanupTracker` deletes all created records in reverse order (respecting foreign key constraints).

### Test files

| File | What it tests |
|------|--------------|
| `connection.test.ts` | Can we reach Supabase? Do the credentials work? Can we read from tables? |
| `categories.test.ts` | Full category lifecycle: create, verify it exists, delete |
| `items.test.ts` | Item CRUD: create linked to a category, update, read with relations, delete |
| `locations.test.ts` | Location CRUD: create, list, delete |
| `receipts.test.ts` | Receipt lifecycle: create with line items, verify, void |
| `sales.test.ts` | Sale lifecycle: create with line items, verify, void |
| `suppliers.test.ts` | Supplier CRUD: create, list, delete |

### Why run integration tests separately?

1. **Credentials** — they need `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (plus test user credentials). These aren't available in all environments.
2. **Speed** — database calls over the network are 100-1000x slower than in-memory unit tests.
3. **Sequentiality** — tests must run one at a time to avoid race conditions (two tests creating the same category simultaneously would cause a duplicate key error).
4. **Reliability** — network issues can cause flaky failures. Keeping them separate means a flaky integration test doesn't block fast feedback from unit tests.

### The helpers

**`test-client.ts`** — Creates a Supabase client with `persistSession: false` and `autoRefreshToken: false`. These settings prevent the test client from writing to localStorage (which doesn't exist in Node) and from making background token refresh calls.

**`auth.ts`** — Provides `signInTestUser()` which authenticates once and caches the result (the `signedIn` flag prevents re-authenticating in every test). `hasTestCredentials()` allows tests to gracefully skip when credentials aren't available.

**`cleanup.ts`** — The `CleanupTracker` records every row created during a test. `cleanupAll()` deletes them in reverse insertion order, which naturally respects foreign key constraints (child rows deleted before parent rows). The `uid()` function generates unique prefixed strings (`__test_...`) so test data is easily identifiable.

---

## End-to-End User Interaction Tests (`src/test/e2e/`)

These tests simulate real user interactions with the application by rendering actual React components with mocked auth and API layers. They verify that every critical user flow works correctly — from clicking buttons to seeing the right error messages.

### `helpers.tsx` — Test Infrastructure

Provides three utilities used by all e2e tests:

- **`createMockAuthContext()`** — returns a mock `AuthContextType` with all methods as `vi.fn()`. Simulates an unauthenticated user by default (session: null).
- **`createLoggedInAuthContext()`** — extends the mock with a real session and user object. Simulates a logged-in user.
- **`renderWithProviders(ui, { auth, route })`** — wraps the component in `QueryClientProvider`, `AuthContext.Provider`, and `MemoryRouter` with the given initial route. This replicates the exact provider hierarchy from `App.tsx` so components behave the same as in the real app.

### `login.test.tsx` — Login Page (5 tests)

| Test | What it verifies |
|------|-----------------|
| Renders email, password, and sign in button | The login form appears with all expected fields |
| Does not submit when email is empty | HTML `required` attribute prevents form submission — `signIn` is never called |
| Calls signIn with entered credentials and re-enables button on failure | Types wrong email/password, clicks submit, asserts `signIn` was called with those values AND the button is re-enabled after the error so the user can retry |
| Navigates to /sales on success | When `signIn` returns `{ user, error: null }`, React Router navigates away from the login page |
| Toggles password visibility | Clicking the eye icon switches the input type between "password" (dots) and "text" (visible) |

### `signup.test.tsx` — Signup Page (5 tests)

| Test | What it verifies |
|------|-----------------|
| Renders all signup fields | Email, password, confirm password, and "Create account" button appear |
| Does not call signUp when passwords do not match | `signUp` is never called — the mismatch is caught client-side before any API call |
| Does not call signUp when password is too short | Passwords under 6 characters are rejected client-side |
| Calls signUp with valid matching passwords | Valid input passes through to `AuthContext.signUp()` with the correct arguments |
| Has a link to the login page | The "Sign in" link points to `/login` for users who already have accounts |

### `protected-routes.test.tsx` — Route Protection (9 tests)

| Test | What it verifies |
|------|-----------------|
| Redirects to /login when unauthenticated (parameterized) | Uses `it.each` over `/sales`, `/receipts`, `/items`, `/quotes`, `/settings` — when `session` is null, all five routes render the login page instead of their content |
| Shows loading spinner while auth is checking | When `loading` is true, neither the page content nor the login redirect appears — just the spinner |
| Renders /sales when authenticated | When session exists, the protected route renders its content (not the login form) |
| Allows unauthenticated access to /login | The login page renders without any auth check |
| Allows unauthenticated access to /signup | The signup page renders without any auth check |

### `create-sale.test.tsx` — Create Sale Form (6 tests)

| Test | What it verifies |
|------|-----------------|
| Renders channel, customer, part line, and create button | All form sections appear including the dropdown labels and the "Create sale" button |
| Shows validation errors with empty required fields | Clicking "Create sale" without filling Part Number, Location, Quantity, or Unit Price shows "Missing: [fields]" and does NOT call `addSale.mutateAsync` |
| Does not submit when quantity is 0 | A quantity of 0 fails the `>= 1` validation — the API is never called |
| Does not submit when unit price is negative | A negative price fails the `>= 0` validation — the API is never called |
| Can add and remove additional part lines | Clicking "Add Part" creates a "Part 2" card |
| Clears form when Clear form is clicked | All inputs reset to empty after clicking "Clear form" |

### `create-receipt.test.tsx` — Create Receipt Form (7 tests)

| Test | What it verifies |
|------|-----------------|
| Renders supplier, reference, note, part line, and create button | All form sections appear with exact labels "Supplier:", "Reference:", "Note:" |
| Shows validation errors with empty required fields | Same as sale — missing Part Number/Location/Quantity/Cost blocks submission |
| Does not submit when quantity is 0 | Same quantity validation as sale |
| Does not submit when unit cost is negative | Negative cost fails the `>= 0` validation |
| Can add additional part lines | "Add Part" creates a new part card |
| Shows New Part and New Location buttons | These inline-create buttons appear on each part line (unlike the sale form which doesn't have them) |
| Clears form when Clear form is clicked | Reference, note, and all part fields reset |

### `quotes.test.tsx` — Supplier Quotes Page (8 tests)

| Test | What it verifies |
|------|-----------------|
| Renders the page with title, supplier, date, and an item row | The page heading "Supplier Quotes", "Quote Details" card, "Items" card, and "Add Item" button all appear |
| Shows the submit button disabled when no data is filled | The "Add Quote(s)" button is disabled until a supplier is selected and at least one item row has part, cost, and currency |
| Shows 0 items ready when form is empty | The status line reads "0 items ready" before any data is entered |
| Can add additional item rows via Add Item button | Clicking "Add Item" appends a new row with its own part picker, cost, currency, and note fields |
| Can remove an item row and always keeps at least one | Clicking the trash icon removes a row; if the last row is removed, a fresh empty row is added automatically |
| Does not call mutateAsync when submit button is disabled | Clicking a disabled submit button does not fire any API calls |
| Shows the date input pre-filled with today's date | The date field defaults to the current date in YYYY-MM-DD format |
| Has optional note input on each line | Each item row includes an "Optional note" placeholder input |

### `items-page.test.tsx` — Items Page Sale & Receipt Modals (4 tests)

| Test | What it verifies |
|------|-----------------|
| Renders the New Sale and New Receipt buttons in the toolbar | Both "New Sale" and "New Receipt" buttons are visible on the Items page toolbar |
| Opens the sale dialog when New Sale is clicked | Clicking "New Sale" opens the AddSaleModal, which contains the Channel and Customer fields from AddSaleForm |
| Opens the receipt dialog when New Receipt is clicked | Clicking "New Receipt" opens the AddReceiptModal, which contains the Supplier and Reference fields from AddReceiptForm |
| Still shows the Transfer Stock button alongside the new buttons | The existing "Transfer Stock" button is still present in the toolbar alongside the new buttons |

### `settings.test.tsx` — Change Password Form (4 tests)

| Test | What it verifies |
|------|-----------------|
| Renders current, new, and confirm password fields | All three password inputs and the "Update Password" button appear |
| Does not call changePassword when new password is too short | Passwords under 6 characters are rejected client-side — `changePassword` is never called |
| Does not call changePassword when new passwords do not match | Mismatched new/confirm passwords are caught client-side |
| Calls changePassword with valid matching passwords | Valid input calls `AuthContext.changePassword("oldpass", "newpass")` with the correct arguments |

---

## How to Add New Tests

### Adding a unit test
1. Create a file in `src/test/unit/` named `<module>.test.ts`.
2. Import from `vitest` and the module under test.
3. Mock external dependencies with `vi.mock()`.
4. The file is automatically included by the default Vitest config.

### Adding a validation test for a new Zod schema
1. Define the schema in `src/lib/schemas.ts`.
2. Export it from `src/hooks/mutations.ts` (or import directly from `schemas.ts`).
3. Add test cases in `src/test/validation/schemas.test.ts`.

### Adding an integration test
1. Create a file in `src/test/integration/` named `<entity>.test.ts`.
2. Use `signInTestUser()` in `beforeAll`.
3. Use `CleanupTracker` to track and clean up created records.
4. Use `describe.skipIf(!hasTestCredentials())` to skip gracefully without credentials.
5. The file is automatically included by `vitest.integration.config.ts`.

### Adding a component test
1. Create a `.test.tsx` file next to the component or in `src/test/unit/`.
2. Use `@testing-library/react`'s `render` and `screen`.
3. Wrap the component with necessary providers (QueryClientProvider, BrowserRouter, AuthProvider).
4. The `setup.ts` file already provides jest-dom matchers and the `matchMedia` mock.

---

## Test Scripts in `package.json`

| Script | Command | What it runs |
|--------|---------|-------------|
| `test` | `vitest run` | Unit + validation tests (default config, excludes integration) |
| `test:watch` | `vitest` | Same as `test` but re-runs on file changes |
| `test:unit` | `vitest run --exclude src/test/integration/**` | Explicitly unit-only |
| `test:integration` | `vitest run --config vitest.integration.config.ts` | Integration tests only |
| `test:all` | `vitest run && vitest run --config vitest.integration.config.ts` | Everything |
| `typecheck` | `tsc --noEmit` | TypeScript type checking (not tests, but related quality check) |
