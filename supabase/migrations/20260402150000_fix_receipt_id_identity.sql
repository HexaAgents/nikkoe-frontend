-- receipt_id is uuid NOT NULL but has no default.
-- Add gen_random_uuid() so inserts without an explicit receipt_id work.
ALTER TABLE public.receipts
  ALTER COLUMN receipt_id SET DEFAULT gen_random_uuid();

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
