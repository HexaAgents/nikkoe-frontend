-- Add SELECT policy for sales
CREATE POLICY "sales_read_auth" ON public.sales
FOR SELECT TO authenticated
USING (true);

-- Add all CRUD policies for receipts
CREATE POLICY "receipts_read_auth" ON public.receipts
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "receipts_insert_auth" ON public.receipts
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "receipts_update_auth" ON public.receipts
FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "receipts_delete_draft_only" ON public.receipts
FOR DELETE TO authenticated
USING (status = 'DRAFT');

-- Also add policies for receipt_lines and sale_lines
CREATE POLICY "receipt_lines_read_auth" ON public.receipt_lines
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "receipt_lines_insert_auth" ON public.receipt_lines
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "receipt_lines_update_auth" ON public.receipt_lines
FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "sale_lines_read_auth" ON public.sale_lines
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "sale_lines_insert_auth" ON public.sale_lines
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "sale_lines_update_auth" ON public.sale_lines
FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);