# src/types/

Shared TypeScript type definitions used across the frontend. Contains all domain entity interfaces and API response shapes in two files, mirroring the backend's Pydantic models to ensure type consistency across the API contract.

## How it works

Components, hooks, and utility modules import interfaces from this folder to type their props, API responses, and function parameters. When the backend adds or changes a field in a Pydantic model, the corresponding interface here should be updated to match so the compiler catches any mismatches at build time.

## Why this design

All types are consolidated in one file to avoid a proliferation of tiny single-interface files. They mirror the backend Pydantic models so the frontend and backend stay in sync on the API contract.

## Files

- **domain.types.ts** -- All frontend domain interfaces in one file. Contains: `ReceiptWithRelations`, `ReceiptLine`, `ReceiptLineInput`, `SaleWithRelations`, `SaleLine`, `SaleLineInput`, `Item`, `ItemWithRelations` (with nested `InventoryBalance` and `ItemReceiptLine`), `ItemInput`, `Category`, `Supplier`, `SupplierInput`, `Location`, `Channel`, `Customer`, `InventoryMovementWithRelations`, `InventoryOnHand`, `UserProfile`, and `SupplierQuoteInput`. These mirror the backend's Pydantic models to ensure type consistency across the API contract.
- **api.types.ts** -- Single `PaginatedResponse<T>` interface defining the `{ data: T[], total: number }` shape returned by all backend list endpoints. Used by `api.getList()` to type the response before unwrapping.
