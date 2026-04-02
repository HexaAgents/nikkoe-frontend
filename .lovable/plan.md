

## Fix: Switch from `inventory_on_hand` View to `inventory_balances` Table

### Background

The `inventory_on_hand` view was created manually via the SQL Editor. It recalculates stock from movement history, but its results are out of sync with the `inventory_balances` table (maintained by triggers). Since `inventory_balances` is the authoritative source, the app should use it instead.

### Steps

1. **Update `src/hooks/useInventoryOnHand.ts`** -- change the query from `inventory_on_hand` to `inventory_balances` (one-line change, same column names)

2. **Drop the redundant view** via a database migration:
   ```sql
   DROP VIEW IF EXISTS public.inventory_on_hand;
   ```

3. **Update `src/integrations/supabase/types.ts`** will auto-regenerate after the view is dropped (the `Views` section will become empty)

### Technical Detail

- The `inventory_balances` table has the same columns (`item_id`, `location_id`, `quantity_on_hand`) so no other code changes are needed
- The hook's filtering (`quantity_on_hand > 0`) works identically on both sources
- Dropping the view is safe since only this one hook references it

