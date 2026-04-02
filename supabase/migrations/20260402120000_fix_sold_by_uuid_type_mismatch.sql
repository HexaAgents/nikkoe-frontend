-- Fix: users.user_id may be text/serial while sales.sold_by is uuid,
-- causing "invalid input syntax for type uuid" inside the trigger.
-- Wrap the assignment in an exception handler so the insert succeeds
-- (sold_by stays NULL when the types are incompatible).

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
    BEGIN
      SELECT u.user_id INTO NEW.sold_by
      FROM public.users u
      WHERE u.auth_id = auth_uid
      LIMIT 1;
    EXCEPTION
      WHEN OTHERS THEN
        -- user_id value cannot be cast to sold_by column type; leave NULL
        NEW.sold_by := NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Apply the same safety to the receipts trigger
CREATE OR REPLACE FUNCTION public.receipts_set_received_by()
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

  IF NEW.received_by IS NULL AND auth_uid IS NOT NULL THEN
    BEGIN
      SELECT u.user_id INTO NEW.received_by
      FROM public.users u
      WHERE u.auth_id = auth_uid
      LIMIT 1;
    EXCEPTION
      WHEN OTHERS THEN
        NEW.received_by := NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;
