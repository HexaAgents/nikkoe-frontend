-- Drop the receipts_set_received_by trigger (same user_id→uuid mismatch as sales).
DROP TRIGGER IF EXISTS receipts_set_received_by ON public.receipts;
DROP FUNCTION IF EXISTS public.receipts_set_received_by();

-- Force PostgREST to reload its schema cache.
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
