-- Make trigger function run with elevated privileges to bypass RLS
CREATE OR REPLACE FUNCTION public.create_movement_from_sale_line()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_sold_at timestamptz;
  v_user uuid;
begin
  select sold_at, sold_by
    into v_sold_at, v_user
  from sales
  where sale_id = new.sale_id;

  insert into inventory_movements (
    moved_at, item_id, from_location_id, to_location_id, quantity,
    movement_type, sale_id, sale_line_id, user_id, note
  ) values (
    v_sold_at, new.item_id, new.location_id, null, new.quantity,
    'SALE', new.sale_id, new.sale_line_id, v_user, 'Auto from sale_lines'
  );

  return new;
end;
$function$;

-- Also fix the receipt trigger for consistency
CREATE OR REPLACE FUNCTION public.create_movement_from_receipt_line()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_received_at timestamptz;
  v_user uuid;
begin
  select received_at, received_by
    into v_received_at, v_user
  from receipts
  where receipt_id = new.receipt_id;

  insert into inventory_movements (
    moved_at, item_id, from_location_id, to_location_id, quantity,
    movement_type, receipt_id, receipt_line_id, user_id, note
  ) values (
    v_received_at, new.item_id, null, new.location_id, new.quantity,
    'RECEIPT', new.receipt_id, new.receipt_line_id, v_user, 'Auto from receipt_lines'
  );

  return new;
end;
$function$;