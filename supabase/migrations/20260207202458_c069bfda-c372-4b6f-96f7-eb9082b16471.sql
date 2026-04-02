
CREATE OR REPLACE FUNCTION public.sync_auth_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.users (auth_id, name, email_address)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.email)
  ON CONFLICT (auth_id) DO UPDATE
    SET name = COALESCE(EXCLUDED.name, public.users.name),
        email_address = COALESCE(EXCLUDED.email_address, public.users.email_address);

  RETURN NEW;
END;
$function$;
