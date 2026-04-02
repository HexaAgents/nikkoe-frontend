-- Add CHECK constraints for data validation

-- Items table
ALTER TABLE public.items
ADD CONSTRAINT chk_items_part_number_not_empty CHECK (length(trim(part_number)) > 0),
ADD CONSTRAINT chk_items_part_number_length CHECK (length(part_number) <= 255),
ADD CONSTRAINT chk_items_description_length CHECK (length(description) <= 1000);

-- Categories table
ALTER TABLE public.categories
ADD CONSTRAINT chk_categories_name_not_empty CHECK (length(trim(name)) > 0),
ADD CONSTRAINT chk_categories_name_length CHECK (length(name) <= 255);

-- Locations table
ALTER TABLE public.locations
ADD CONSTRAINT chk_locations_code_not_empty CHECK (length(trim(location_code)) > 0),
ADD CONSTRAINT chk_locations_code_length CHECK (length(location_code) <= 50);

-- Suppliers table
ALTER TABLE public.suppliers
ADD CONSTRAINT chk_suppliers_name_not_empty CHECK (length(trim(supplier_name)) > 0),
ADD CONSTRAINT chk_suppliers_name_length CHECK (length(supplier_name) <= 255),
ADD CONSTRAINT chk_suppliers_email_length CHECK (length(supplier_email) <= 255),
ADD CONSTRAINT chk_suppliers_phone_length CHECK (length(supplier_phone) <= 20),
ADD CONSTRAINT chk_suppliers_address_length CHECK (length(supplier_address) <= 500);

-- Channels table
ALTER TABLE public.channels
ADD CONSTRAINT chk_channels_name_not_empty CHECK (length(trim(channel_name)) > 0),
ADD CONSTRAINT chk_channels_name_length CHECK (length(channel_name) <= 255);

-- Receipt lines table
ALTER TABLE public.receipt_lines
ADD CONSTRAINT chk_receipt_lines_quantity_positive CHECK (quantity > 0),
ADD CONSTRAINT chk_receipt_lines_unit_cost_nonnegative CHECK (unit_cost >= 0),
ADD CONSTRAINT chk_receipt_lines_currency_not_empty CHECK (length(trim(currency)) > 0),
ADD CONSTRAINT chk_receipt_lines_currency_length CHECK (length(currency) <= 10);

-- Sale lines table
ALTER TABLE public.sale_lines
ADD CONSTRAINT chk_sale_lines_quantity_positive CHECK (quantity > 0),
ADD CONSTRAINT chk_sale_lines_unit_price_nonnegative CHECK (unit_price >= 0),
ADD CONSTRAINT chk_sale_lines_currency_not_empty CHECK (length(trim(currency)) > 0),
ADD CONSTRAINT chk_sale_lines_currency_length CHECK (length(currency) <= 10);

-- Receipts table
ALTER TABLE public.receipts
ADD CONSTRAINT chk_receipts_reference_length CHECK (length(reference) <= 255),
ADD CONSTRAINT chk_receipts_note_length CHECK (length(note) <= 1000);

-- Sales table
ALTER TABLE public.sales
ADD CONSTRAINT chk_sales_customer_length CHECK (length(customer) <= 255),
ADD CONSTRAINT chk_sales_note_length CHECK (length(note) <= 1000);

-- Supplier quotes table
ALTER TABLE public.supplier_quotes
ADD CONSTRAINT chk_supplier_quotes_unit_cost_nonnegative CHECK (unit_cost >= 0),
ADD CONSTRAINT chk_supplier_quotes_currency_not_empty CHECK (length(trim(currency)) > 0),
ADD CONSTRAINT chk_supplier_quotes_currency_length CHECK (length(currency) <= 10),
ADD CONSTRAINT chk_supplier_quotes_note_length CHECK (length(note) <= 500);