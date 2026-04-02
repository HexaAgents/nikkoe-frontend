-- When a receipt is inserted without received_by, set it from the current auth user
-- mapped through public.users (auth_id = auth.uid()).
CREATE OR REPLACE FUNCTION public.receipts_set_received_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.received_by IS NULL THEN
    SELECT u.user_id INTO NEW.received_by
    FROM public.users u
    WHERE u.auth_id = (SELECT auth.uid())
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS receipts_set_received_by ON public.receipts;

CREATE TRIGGER receipts_set_received_by
  BEFORE INSERT ON public.receipts
  FOR EACH ROW
  EXECUTE PROCEDURE public.receipts_set_received_by();
