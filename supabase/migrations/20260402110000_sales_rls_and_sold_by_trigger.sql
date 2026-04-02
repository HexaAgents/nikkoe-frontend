-- Add missing INSERT and UPDATE RLS policies for public.sales
-- (Only a SELECT policy existed; inserts/updates need explicit policies when RLS is enabled.)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sales_insert_auth' AND tablename = 'sales') THEN
    CREATE POLICY "sales_insert_auth" ON public.sales FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sales_update_auth' AND tablename = 'sales') THEN
    CREATE POLICY "sales_update_auth" ON public.sales FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Safety-net trigger: when a sale is inserted without sold_by, resolve it from
-- the current auth user mapped through public.users (same pattern as receipts).
CREATE OR REPLACE FUNCTION public.sales_set_sold_by()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  auth_uid uuid;
  jwt_sub text;
BEGIN
  auth_uid := auth.uid();

  IF auth_uid IS NULL THEN
    BEGIN
      jwt_sub := current_setting('request.jwt.claims', true)::json->>'sub';
      IF jwt_sub IS NOT NULL AND jwt_sub <> '' THEN
        auth_uid := jwt_sub::uuid;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        auth_uid := NULL;
    END;
  END IF;

  IF NEW.sold_by IS NULL AND auth_uid IS NOT NULL THEN
    SELECT u.user_id INTO NEW.sold_by
    FROM public.users u
    WHERE u.auth_id = auth_uid
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sales_set_sold_by ON public.sales;

CREATE TRIGGER sales_set_sold_by
  BEFORE INSERT ON public.sales
  FOR EACH ROW
  EXECUTE PROCEDURE public.sales_set_sold_by();
