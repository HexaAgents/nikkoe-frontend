-- The sales_set_sold_by trigger causes "invalid input syntax for type uuid"
-- because users.user_id is not a UUID while sales.sold_by is.
-- Drop the trigger entirely; sold_by will be NULL (acceptable for now).
DROP TRIGGER IF EXISTS sales_set_sold_by ON public.sales;
DROP FUNCTION IF EXISTS public.sales_set_sold_by();

-- Notify PostgREST to reload its schema cache so stale column metadata
-- (e.g. a missing 'customer' column) is refreshed.
NOTIFY pgrst, 'reload schema';
