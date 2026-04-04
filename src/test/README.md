# src/test/

Test infrastructure and test files for the Nikkoe frontend. Uses Vitest as the test runner with integration tests that verify data operations against the live Supabase database and unit tests that validate schema parsing.

## How it works

1. `npm test` runs all tests (unit + integration).
2. `npm run test:watch` re-runs tests on file changes.
3. `npm run test:unit` runs only unit/validation tests.
4. `npm run test:integration` runs only integration tests, which require valid Supabase credentials in the environment.

## Why this design

Integration tests hit Supabase directly (not the backend API) to verify data operations independently of the API layer. This catches database-level issues that unit tests would miss.

## Files

- **setup.ts** -- Vitest test setup configuration file. Runs before every test file to initialize the test environment and configure global settings.
- **example.test.ts** -- Placeholder test that verifies the test runner works correctly. Contains a simple assertion to confirm Vitest is properly configured.
- **helpers/auth.ts** -- Test helper that authenticates against Supabase using test credentials and returns a session. Used by integration tests that need an authenticated client.
- **helpers/cleanup.ts** -- Test helper that deletes test data created during integration test runs to keep the database clean. Called in afterAll blocks to prevent test pollution.
- **helpers/test-client.ts** -- Creates a Supabase client configured for the test environment with test-specific credentials. Used by all integration tests as the database client.
- **integration/connection.test.ts** -- Verifies basic Supabase connectivity and authentication works in the test environment. Acts as a smoke test before running other integration tests.
- **integration/categories.test.ts** -- Integration tests for category CRUD: creates a category, verifies it exists, and deletes it. Validates the full lifecycle against the live database.
- **integration/items.test.ts** -- Integration tests for item CRUD operations against the live database. Covers creation, retrieval, update, and deletion of inventory items.
- **integration/locations.test.ts** -- Integration tests for location CRUD. Verifies that locations can be created, listed, and deleted through Supabase.
- **integration/receipts.test.ts** -- Integration tests for receipt creation and voiding, including line items. Validates that receipt operations correctly update inventory.
- **integration/sales.test.ts** -- Integration tests for sale creation and voiding. Validates the full sale lifecycle including line items and inventory impact.
- **integration/suppliers.test.ts** -- Integration tests for supplier CRUD. Covers creating, listing, and deleting suppliers against the live database.
- **validation/schemas.test.ts** -- Unit tests that verify Zod/Pydantic schema parsing: checks that valid data is accepted and invalid data is rejected with appropriate error messages. Runs without network access.
