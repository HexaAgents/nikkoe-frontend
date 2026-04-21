# src/types/

Shared TypeScript type definitions used across the frontend. Contains all domain entity interfaces and API response shapes, mirroring the backend's Pydantic models to ensure type consistency across the API contract.

## Database Schema

The types reflect a Supabase database with PascalCase singular table names and integer primary keys:
- **Item** (id, item_id text, description, category_id) — `item_id` is the part number, `id` is the PK
- **Sale** (id, customer_id, channel_id, channel_ref, date, user_id, status, note)
- **Sale_Stock** (id, sale_id, stock_id, quantity, unit_price, currency_id)
- **Receipt** (id, dateTime, user_id, supplier_id, status, reference, note)
- **Receipt_Stock** (id, receipt_id, stock_id, quantity, unit_price, currency_id, supplier_id)
- **Stock** (id, item_id, location_id, quantity) — intermediate entity linking items to locations
- **Currency** (id, name) — lookup table for currencies
- **Transfer** (id, quantity, notes, date, stock_id_from_id, stock_id_to_id, user_id) — inventory movements
- **User** (id, first_name, last_name, auth_id, email)

## Files

- **domain.types.ts** -- All frontend domain interfaces: ReceiptWithRelations, ReceiptLine, SaleWithRelations, SaleLine, Item, ItemWithRelations, Category, Supplier, Location, Channel, Customer, Currency, Transfer, InventoryOnHand, UserProfile, and input types for mutations. All IDs are `number` (integer). Currency is referenced by `currency_id` (FK to Currency table), not a text string.
- **api.types.ts** -- Single `PaginatedResponse<T>` interface defining the `{ data: T[], total: number }` shape returned by all backend list endpoints.
