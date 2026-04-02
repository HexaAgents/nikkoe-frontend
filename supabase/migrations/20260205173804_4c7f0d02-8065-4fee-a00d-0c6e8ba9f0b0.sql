-- Make balances trigger function run with elevated privileges to bypass RLS
CREATE OR REPLACE FUNCTION public.apply_inventory_movement_to_balances()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  -- Outgoing side (from_location): subtract
  if new.from_location_id is not null then
    insert into inventory_balances (item_id, location_id, quantity_on_hand, updated_at)
    values (new.item_id, new.from_location_id, -new.quantity, now())
    on conflict (item_id, location_id) do update
      set quantity_on_hand = inventory_balances.quantity_on_hand - new.quantity,
          updated_at = now();
  end if;

  -- Incoming side (to_location): add
  if new.to_location_id is not null then
    insert into inventory_balances (item_id, location_id, quantity_on_hand, updated_at)
    values (new.item_id, new.to_location_id, new.quantity, now())
    on conflict (item_id, location_id) do update
      set quantity_on_hand = inventory_balances.quantity_on_hand + new.quantity,
          updated_at = now();
  end if;

  return new;
end;
$function$;