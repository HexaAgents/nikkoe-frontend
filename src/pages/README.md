# src/pages/

Page-level components, one per route. Each authenticated page renders inside `MainLayout` (top bar + scrollable content area) and fetches data via React Query hooks. Login, Signup, and NotFound have their own standalone layouts.

## How it works

Every authenticated page follows the same pattern: it mounts inside `MainLayout`, calls one or more query hooks to fetch data, and renders the results using shared components like `DataTable` and modal dialogs. Pages never call the API directly -- they always go through hooks. Several pages accept an `embedded` prop that strips `MainLayout` and the page title so they can be reused inside the Settings page's tab content.

## Why this design

Embedded mode lets the Settings page reuse Items, Categories, Suppliers, Locations, and Log pages without duplicating their code. Each component serves both its standalone route and its embedded appearance.

## Files

- **Index.tsx** -- Root page at `/`. Immediately redirects to `/sales` using React Router's `Navigate` component. Contains no UI of its own.
- **Login.tsx** -- Login page at `/login`. Renders an email/password form with the Nikko logo. Calls `signIn()` from the auth context on submit; on success, identifies the user in PostHog analytics and navigates to `/sales`; on failure, shows an error toast.
- **Signup.tsx** -- Registration page at `/signup`. Email/password form with confirm password field. Validates password match and minimum 6 characters client-side, then calls `signUp()` from auth context. On success, navigates to `/login` with a confirmation message.
- **NotFound.tsx** -- 404 page for unmatched routes. Logs the attempted path to `console.error` for debugging and displays a "Page not found" message with a link to home.
- **Sales.tsx** -- Sale list page at `/sales`. Embeds `AddSaleForm` inline at the top for quick entry, with a toggleable "Show recent sales" button that reveals the history table. The table uses `DataTable` with customer, channel, and date columns, a "Show Voided" checkbox filter, and Excel export. Clicking a row navigates to the sale detail page.
- **SaleDetail.tsx** -- Single sale detail at `/sales/:id`. Shows a metadata card (date, customer, channel, note) and a sale lines table (part, location, quantity, price, currency). Includes a void dialog with an optional reason textarea, and shows void info if already voided.
- **Receipts.tsx** -- Receipt list page at `/receipts`. Mirrors the Sales page structure: inline `AddReceiptForm`, toggleable history, `DataTable` with supplier, reference, and date columns.
- **ReceiptDetail.tsx** -- Single receipt detail at `/receipts/:id`. Mirrors SaleDetail: metadata card, lines table, and void dialog. Shows void info if already voided.
- **Items.tsx** -- Item list page at `/items`. Renders items in a `DataTable` with computed columns: category name, stock locations (comma-separated), total quantity (sum of balances), and average unit cost (from posted receipt lines). The toolbar includes "New Sale", "New Receipt", and "Transfer Stock" buttons; the sale and receipt buttons open the same `AddSaleModal` / `AddReceiptModal` dialogs used on their respective pages. Supports `embedded` mode for the Settings page.
- **ItemDetail.tsx** -- Item detail at `/items/:id`, the most complex page. Shows item info (description, category, total quantity, current supplier price) with inline editing for description and category. The "Current Supplier Price" field displays the cost, currency, and supplier name from the most recent quote. Five sub-sections: supplier quotes (with add/delete), inventory locations with transfer buttons, receipt history (clickable to receipt detail), sales history (clickable to sale detail), and stock movements. The Add Quote modal pre-fills with the latest quote's supplier, cost, and currency. Uses 7 separate query hooks.
- **Categories.tsx** -- Category CRUD list at `/categories`. `DataTable` with a name column and "Add Category" button that opens a modal. Supports `embedded` mode.
- **Suppliers.tsx** -- Supplier CRUD list at `/suppliers`. `DataTable` with name, address, email, phone columns and "Add Supplier" button. Supports `embedded` mode.
- **Locations.tsx** -- Location CRUD list at `/locations`. `DataTable` with location code column and "Add Location" button. Supports `embedded` mode.
- **Log.tsx** -- Read-only inventory movements table at `/log`. `DataTable` with columns for date, type, item, quantity, from/to locations, user, and reference. Supports `embedded` mode.
- **Quotes.tsx** -- Supplier quotes page at `/quotes`. Allows adding supplier quotes for multiple items under the same supplier in a single session. The page has two cards: a "Quote Details" card with shared supplier select and date picker, and an "Items" card with a dynamic list of item rows. Each row has a searchable part picker, unit cost input, currency select, optional note, and a remove button. Clicking "Add Item" appends a new empty row. The submit button loops through all valid rows and calls `useAddSupplierQuote` for each one. Uses the same fields as the single-item `AddSupplierQuoteModal` on the ItemDetail page, but with supplier, date shared at the top and currency per-item.
- **Settings.tsx** -- Tabbed settings page at `/settings` with sidebar navigation. "General" section embeds `ChangePasswordForm` and `AddUserForm`. Inventory sections embed Items, Suppliers, Categories, Locations, and Log pages using their `embedded` mode (which renders without MainLayout or page title).
