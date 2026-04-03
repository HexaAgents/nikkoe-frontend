# nikkoe-frontend

React SPA for the Nikkoe inventory management platform.

## Setup

```bash
npm install
npm run dev
```

The app starts on `http://localhost:8080`.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (default: `http://localhost:3000/api`) |
| `VITE_SUPABASE_URL` | Supabase project URL (used only for auth) |
| `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase anon key (used only for auth) |
| `VITE_POSTHOG_KEY` | PostHog analytics key |
| `VITE_POSTHOG_HOST` | PostHog host URL |

## Architecture

This frontend communicates with the **nikkoe-backend** Express API for all data operations. Supabase is used client-side **only** for authentication (login, signup, session management). The JWT from Supabase Auth is forwarded as a Bearer token to the backend on every API request.

## Project Structure

```
src/
  main.tsx               Entry point -- initializes PostHog analytics, renders <App />
  App.tsx                 Provider tree -- QueryClient, tooltips, toasters, router, auth
  routes.tsx              All route definitions -- public (login/signup), protected (app pages), 404
  App.css / index.css     Global styles and Tailwind CSS configuration

  lib/
    api.ts               HTTP client -- attaches JWT, provides get/getList/post/put/del methods
    analytics.ts          Thin PostHog wrapper -- identify, track, reset (decouples SDK from components)
    utils.ts             cn() utility for merging Tailwind class names
    exportToExcel.ts      Generates and downloads .xlsx files from data arrays

  integrations/
    supabase/
      client.ts          Supabase client singleton (anon key, localStorage sessions)

  contexts/
    AuthContext.tsx       Auth provider -- session state, signIn, signUp, signOut, changePassword

  types/
    domain.types.ts      All domain interfaces (Receipt, Sale, Item, Supplier, Category, etc.)
    api.types.ts          PaginatedResponse<T> interface for backend list responses

  hooks/
    useAuth.ts           Consumes AuthContext, throws if used outside provider
    queries.ts           All React Query read hooks (20 hooks for fetching lists and details)
    mutations.ts          All React Query write hooks (16 hooks for create/update/delete/void)
    use-mobile.tsx       Media query hook for mobile viewport detection
    use-toast.ts          shadcn/ui toast state management

  components/
    auth/
      ProtectedRoute.tsx  Route guard -- loading spinner, redirect if unauthenticated, render children

    layout/
      MainLayout.tsx     Page shell -- top bar + scrollable main content area
      AppTopBar.tsx       Navigation bar -- logo, Sales/Receipts links, Settings, sign out

    common/
      DataTable.tsx       Generic table with search, pagination, export, row click handling
      SearchableCombobox.tsx  Generic typeahead combobox parameterized by idKey/labelKey
      SearchablePartPicker.tsx  Part-number combobox (wraps SearchableCombobox)
      SearchableLocationPicker.tsx  Location-code combobox (wraps SearchableCombobox)
      PartLineCard.tsx    Shared line-item card (part picker, location, quantity, price, currency)

    modals/
      AddItemModal.tsx         Dialog for creating an item
      AddCategoryModal.tsx     Dialog for creating a category
      AddLocationModal.tsx     Dialog for creating a location
      AddSupplierModal.tsx     Dialog for creating a supplier
      AddSupplierQuoteModal.tsx  Dialog for adding a supplier quote
      AddReceiptModal.tsx      Dialog wrapper around AddReceiptForm
      AddSaleModal.tsx         Dialog wrapper around AddSaleForm

    receipts/
      AddReceiptForm.tsx  Multi-line receipt form (supplier, reference, note, dynamic part lines)

    sales/
      AddSaleForm.tsx     Multi-line sale form (channel, customer, dynamic part lines with auto-location)

    settings/
      ChangePasswordForm.tsx  Password change form using centralized auth
      AddUserForm.tsx          New user creation form via backend API

    ui/
      *.tsx               ~45 shadcn/ui primitives (button, input, dialog, table, select, etc.)

    NavLink.tsx           React Router NavLink wrapper with active/pending class support

  pages/
    Index.tsx            Redirects to /sales
    Login.tsx            Email/password login using auth context
    Signup.tsx            Email/password registration using auth context
    NotFound.tsx          404 page
    Receipts.tsx          Receipt list with inline creation form and history table
    ReceiptDetail.tsx     Single receipt view with lines table and void dialog
    Sales.tsx             Sale list with inline creation form and history table
    SaleDetail.tsx        Single sale view with lines table and void dialog
    Items.tsx             Item list with computed columns (stock, avg cost)
    ItemDetail.tsx        Item detail with editing, quotes, inventory, sales, receipts sub-tables
    Categories.tsx        Category CRUD list
    Suppliers.tsx         Supplier CRUD list
    Locations.tsx         Location CRUD list
    Log.tsx               Read-only inventory movements table
    Settings.tsx          Tabbed settings -- password, add user, and embedded inventory pages

  test/
    setup.ts             Vitest configuration
    example.test.ts       Placeholder test
    helpers/              Auth, cleanup, and test client utilities for integration tests
    integration/          Integration tests against Supabase (categories, items, locations, etc.)
    validation/           Zod schema unit tests
```
