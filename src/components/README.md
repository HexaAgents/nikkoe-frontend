# src/components/

All React components organized by responsibility. Subfolders separate layout shells, reusable common widgets, modal dialogs, domain-specific forms (receipts, sales, settings), and shadcn/ui primitives. Top-level files are small one-off components that don't belong to a specific group.

## How it works

Page components import from these subfolders to compose their UI. Common components like `DataTable` and `SearchableCombobox` are generic and parameterized so they work with any entity type. Domain forms (`AddReceiptForm`, `AddSaleForm`) share `PartLineCard` for line-item entry, and modals wrap simple creation forms in a Radix Dialog overlay.

## Why this design

`common/` exists to avoid duplicating logic across pages. `SearchableCombobox` is generic to avoid a separate picker component per entity. `PartLineCard` is shared because receipt and sale forms have identical line-item structure.

## Files

**NavLink.tsx** -- Wrapper around React Router's `NavLink` that accepts separate `activeClassName` and `pendingClassName` props. Merges them with the base className using `cn()` when the route matches. Used in `AppTopBar` for highlighting the active nav link.

### auth/

Authentication route guards.

- **ProtectedRoute.tsx** -- Route guard component that checks auth state from `useAuth()`. Shows a centered loading spinner while auth resolves, redirects to `/login` if there's no session, or renders its children if the user is authenticated.

### layout/

Page shell shared by all authenticated views.

- **MainLayout.tsx** -- Page shell used by every authenticated page. Renders `AppTopBar` at the top and wraps page content in a scrollable `<main>` element with consistent padding.
- **AppTopBar.tsx** -- Top navigation bar rendered on every authenticated page. Contains the brand logo and name, primary nav links (Sales, Receipts), and utility actions (Settings gear icon, user email display, Sign Out button). Uses `NavLink` for active-state highlighting.

### common/

Reusable components shared across multiple pages.

- **DataTable.tsx** -- Generic data table component used by every list page. Accepts a typed data array and column definitions, provides client-side search (filtering by configurable keys), client-side pagination (configurable page size, default 20), Excel export via `exportToExcel`, optional row click handling, and custom row styling. The `idKey` prop is required for stable React keys.
- **SearchableCombobox.tsx** -- Generic typeahead combobox built on Radix Popover and cmdk Command. Parameterized by `idKey` and `labelKey` so it works with any entity type without duplication. Handles open/close state, search filtering, and selection.
- **SearchablePartPicker.tsx** -- Thin wrapper around `SearchableCombobox` pre-configured for items. Uses `item_id` as the ID key and `part_number` as the label, with item-specific placeholder text.
- **SearchableLocationPicker.tsx** -- Thin wrapper around `SearchableCombobox` pre-configured for locations. Uses `location_id` and `location_code`. Passes through all other props to the underlying combobox.
- **PartLineCard.tsx** -- Shared card component for a single line item in receipt and sale forms. Contains a part picker, location picker, quantity input, price input (with configurable label for "Unit Cost" vs "Unit Price"), and currency select. Displays validation errors by highlighting invalid fields in red.

### modals/

Dialog forms for creating entities.

- **AddItemModal.tsx** -- Dialog form for creating a new inventory item. Fields: part number (required), description (optional), category select (populated from useCategories). Calls `useAddItem` mutation on submit.
- **AddCategoryModal.tsx** -- Dialog form for creating a new category. Single required name field. Calls `useAddCategory` mutation.
- **AddLocationModal.tsx** -- Dialog form for creating a new location. Single required location code field. Calls `useAddLocation` mutation.
- **AddSupplierModal.tsx** -- Dialog form for creating a new supplier. Fields: name (required), address, email, phone. Calls `useAddSupplier` mutation.
- **AddSupplierQuoteModal.tsx** -- Dialog form for adding a supplier quote to an item. Fields: supplier select (from useSuppliers), date, unit cost, currency, note. Accepts an optional `latestQuote` prop; when provided, the form pre-fills supplier, unit cost, and currency from the most recent quote each time the modal opens. Calls `useAddSupplierQuote` mutation.
- **AddReceiptModal.tsx** -- Dialog wrapper that renders the `AddReceiptForm` component inside a Radix Dialog with a title and scroll handling. Does not contain form logic itself.
- **AddSaleModal.tsx** -- Dialog wrapper that renders the `AddSaleForm` component inside a Radix Dialog. Does not contain form logic itself.

### receipts/

- **AddReceiptForm.tsx** -- Multi-line receipt creation form that supports two modes: `inline` (rendered directly on the Receipts page) and `dialog` (rendered inside AddReceiptModal). Header section has supplier select, reference field, and note textarea. Below that is a dynamic list of `PartLineCard` components for line items, with inline "New Part" and "New Location" buttons that open their respective modals. Client-side validation checks all part lines before submission.

### sales/

- **AddSaleForm.tsx** -- Multi-line sale creation form, structurally similar to AddReceiptForm. Header has channel select and a customer combobox with inline "add new customer" flow via `useAddCustomer`. When a part is selected, auto-selects the location with the lowest positive stock from `useInventoryOnHand`. Supports inline and dialog modes.

### settings/

- **ChangePasswordForm.tsx** -- Standalone form for changing the current user's password. Calls `changePassword()` from the auth context, which sends the request to the backend's `/api/auth/change-password` endpoint. Validates password length and confirmation match client-side.
- **AddUserForm.tsx** -- Standalone form for creating a new user account. Calls `apiFetch('/users')` directly (not through a hook) to POST the email and password to the backend. The backend creates the account via the Supabase Auth admin API.

### ui/

~45 shadcn/ui primitive components auto-generated from the shadcn CLI (button, input, dialog, select, table, toast, etc.). These are Radix UI primitives styled with Tailwind CSS -- not custom application code.
