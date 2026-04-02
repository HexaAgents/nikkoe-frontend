-- Remove default_cost and default_currency columns from items table
ALTER TABLE public.items DROP COLUMN IF EXISTS default_cost;
ALTER TABLE public.items DROP COLUMN IF EXISTS default_currency;