-- SECURITY DEFINER caused auth.uid() to be NULL inside the trigger, so received_by was never set.
-- Run as invoker (default) and fall back to JWT sub claim if needed.
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
    SELECT u.user_id INTO NEW.received_by
    FROM public.users u
    WHERE u.auth_id = auth_uid
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$;
