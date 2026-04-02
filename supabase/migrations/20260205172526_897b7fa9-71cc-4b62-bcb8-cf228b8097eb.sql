-- Update void_receipt function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.void_receipt(p_receipt_id bigint, p_voided_by uuid, p_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_status text;
BEGIN
  SELECT status INTO v_status
  FROM public.receipts
  WHERE receipt_id = p_receipt_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Receipt % not found', p_receipt_id;
  END IF;

  IF v_status = 'VOIDED' THEN
    RETURN;
  END IF;

  IF v_status <> 'POSTED' THEN
    RAISE EXCEPTION 'Receipt % must be POSTED to void (current status=%)', p_receipt_id, v_status;
  END IF;

  INSERT INTO public.inventory_movements (
    moved_at,
    item_id,
    from_location_id,
    to_location_id,
    quantity,
    movement_type,
    receipt_id,
    receipt_line_id,
    user_id,
    note
  )
  SELECT
    now(),
    rl.item_id,
    rl.location_id,
    NULL,
    rl.quantity,
    'ADJUSTMENT',
    rl.receipt_id,
    rl.receipt_line_id,
    p_voided_by,
    COALESCE('Void receipt #' || rl.receipt_id || COALESCE(' - '||p_reason, ''), 'Void receipt')
  FROM public.receipt_lines rl
  WHERE rl.receipt_id = p_receipt_id;

  UPDATE public.receipts
  SET status='VOIDED',
      voided_at=now(),
      voided_by=p_voided_by,
      void_reason=p_reason
  WHERE receipt_id = p_receipt_id;
END;
$function$;

-- Update void_sale function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.void_sale(p_sale_id bigint, p_voided_by uuid, p_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_status text;
BEGIN
  SELECT status INTO v_status
  FROM public.sales
  WHERE sale_id = p_sale_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale % not found', p_sale_id;
  END IF;

  IF v_status = 'VOIDED' THEN
    RETURN;
  END IF;

  IF v_status <> 'POSTED' THEN
    RAISE EXCEPTION 'Sale % must be POSTED to void (current status=%)', p_sale_id, v_status;
  END IF;

  INSERT INTO public.inventory_movements (
    moved_at,
    item_id,
    from_location_id,
    to_location_id,
    quantity,
    movement_type,
    sale_id,
    sale_line_id,
    user_id,
    note
  )
  SELECT
    now(),
    sl.item_id,
    NULL,
    sl.location_id,
    sl.quantity,
    'ADJUSTMENT',
    sl.sale_id,
    sl.sale_line_id,
    p_voided_by,
    COALESCE('Void sale #' || sl.sale_id || COALESCE(' - '||p_reason, ''), 'Void sale')
  FROM public.sale_lines sl
  WHERE sl.sale_id = p_sale_id;

  UPDATE public.sales
  SET status='VOIDED',
      voided_at=now(),
      voided_by=p_voided_by,
      void_reason=p_reason
  WHERE sale_id = p_sale_id;
END;
$function$;