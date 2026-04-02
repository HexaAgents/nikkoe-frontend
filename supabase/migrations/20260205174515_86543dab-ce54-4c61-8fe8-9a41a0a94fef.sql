-- Add CRUD policies for categories table
CREATE POLICY "categories_crud_auth"
ON public.categories
FOR ALL
USING (true)
WITH CHECK (true);

-- Add CRUD policies for supplier_quotes table
CREATE POLICY "supplier_quotes_crud_auth"
ON public.supplier_quotes
FOR ALL
USING (true)
WITH CHECK (true);