-- Index for fast inventory_balances lookups by item_id
CREATE INDEX IF NOT EXISTS idx_inventory_balances_item_id ON public.inventory_balances (item_id);

-- Index for fast receipt_lines lookups by item_id (for avg unit cost)
CREATE INDEX IF NOT EXISTS idx_receipt_lines_item_id ON public.receipt_lines (item_id);

-- Index for filtering posted receipts when computing avg cost
CREATE INDEX IF NOT EXISTS idx_receipts_status ON public.receipts (status);