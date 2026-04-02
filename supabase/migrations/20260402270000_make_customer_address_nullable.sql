ALTER TABLE public.customer
  ALTER COLUMN address_line1 DROP NOT NULL,
  ALTER COLUMN city DROP NOT NULL,
  ALTER COLUMN country DROP NOT NULL;

NOTIFY pgrst, 'reload schema';
