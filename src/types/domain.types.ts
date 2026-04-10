export interface ReceiptWithRelations {
  id: number;
  dateTime: string;
  status: string;
  reference: string | null;
  note: string | null;
  supplier_id: number | null;
  user_id: number | null;
  void_reason: string | null;
  voided_at: string | null;
  voided_by: number | null;
  suppliers: { id: number; name: string } | null;
  users: { id: number; first_name: string; last_name: string } | null;
}

export interface ReceiptLine {
  id: number;
  receipt_id: number;
  stock_id: number;
  quantity: number;
  unit_price: number;
  currency_id: number;
  supplier_id: number | null;
  items?: { id: number; item_id: string } | null;
  locations?: { id: number; code: string } | null;
  stock?: { id: number; item_id: number; location_id: number; quantity: number } | null;
  currencies?: { id: number; name: string } | null;
  suppliers?: { id: number; name: string } | null;
}

export interface ReceiptLineInput {
  stock_id?: number;
  item_id?: number;
  location_id?: number;
  quantity: number;
  unit_price: number;
  currency_id: number;
  supplier_id?: number;
}

export interface SaleWithRelations {
  id: number;
  customer_id_id: number | null;
  channel_id_id: number | null;
  channel_ref: string | null;
  date: string;
  user_id: number | null;
  status: string;
  note: string | null;
  void_reason: string | null;
  voided_at: string | null;
  voided_by: number | null;
  channels: { id: number; name: string } | null;
  users: { id: number; first_name: string; last_name: string } | null;
  customers: { id: number; name: string } | null;
}

export interface SaleLine {
  id: number;
  sale_id: number;
  stock_id: number;
  quantity: number;
  unit_price: string;
  currency_id: number;
  items?: { id: number; item_id: string } | null;
  locations?: { id: number; code: string } | null;
  stock?: { id: number; item_id: number; location_id: number; quantity: number } | null;
  currencies?: { id: number; name: string } | null;
}

export interface SaleLineInput {
  stock_id?: number;
  item_id?: number;
  location_id?: number;
  quantity: number;
  unit_price: number;
  currency_id: number;
}

export interface Item {
  id: number;
  item_id: string;
  description: string | null;
  category_id: number | null;
  search_id: string | null;
  categories?: { id: number; name: string } | null;
}

export interface InventoryBalance {
  quantity: number;
  locations: { id: number; code: string } | null;
}

export interface ItemReceiptLine {
  unit_price: number;
}

export interface ItemWithRelations extends Item {
  inventory_balances: InventoryBalance[];
  receipt_lines: ItemReceiptLine[];
  locations?: string[];
  total_quantity?: number;
}

export interface ItemInput {
  item_id: string;
  description?: string;
  category_id?: number;
}

export interface Category {
  id: number;
  name: string;
  item_count?: number;
  total_quantity?: number;
}

export interface Supplier {
  id: number;
  name: string;
  address: string | null;
  email: string | null;
  phone: string | null;
}

export interface SupplierInput {
  name: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface SupplierReceiptHistory {
  id: number;
  receipt_id: number;
  quantity: number;
  unit_price: number;
  date: string | null;
  status: string | null;
  reference: string | null;
  note: string | null;
  items: { id: number; item_id: string } | null;
  users: { id: number; first_name: string; last_name: string } | null;
  currencies: { id: number; name: string } | null;
  locations: { id: number; code: string } | null;
}

export interface Location {
  id: number;
  code: string;
  total_quantity?: number;
  part_count?: number;
}

export interface LocationItem {
  id: number;
  item_id: string;
  description: string | null;
  category: string | null;
  quantity: number;
  last_unit_price: number | null;
}

export interface Channel {
  id: number;
  name: string;
}

export interface Customer {
  id: number;
  name: string;
}

export interface Currency {
  id: number;
  name: string;
}

export interface Transfer {
  id: number;
  quantity: number;
  notes: string | null;
  date: string;
  stock_id_from_id: number | null;
  stock_id_to_id: number | null;
  user_id: number | null;
  from_stock: { id: number; item_id: number; location_id: number } | null;
  to_stock: { id: number; item_id: number; location_id: number } | null;
  from_item: { id: number; item_id: string } | null;
  to_item: { id: number; item_id: string } | null;
  from_location: { id: number; code: string } | null;
  to_location: { id: number; code: string } | null;
  items: { id: number; item_id: string } | null;
  users: { id: number; first_name: string; last_name: string } | null;
}

export interface InventoryOnHand {
  id: number;
  item_id: number;
  location_id: number;
  quantity: number;
}

export interface UserProfile {
  user_id: number;
  name: string;
  email_address: string | null;
}

export interface ItemSupplierQuote {
  id: number;
  item_id: number;
  supplier_id: number;
  cost: number;
  currency_id: number;
  date_time: string | null;
  note: string | null;
  supplier: { name: string } | null;
  currency: { name: string } | null;
}

export interface ItemReceiptHistory {
  id: number;
  receipt_id: number;
  quantity: number;
  unit_price: number;
  date: string | null;
  status: string | null;
  reference: string | null;
  note: string | null;
  suppliers: { id: number; name: string } | null;
  users: { id: number; first_name: string; last_name: string } | null;
  currencies: { id: number; name: string } | null;
  locations: { id: number; code: string } | null;
}

export interface ItemSaleHistory {
  id: number;
  sale_id: number;
  quantity: number;
  unit_price: string;
  date: string | null;
  status: string | null;
  note: string | null;
  channel_ref: string | null;
  customers: { id: number; name: string } | null;
  channels: { id: number; name: string } | null;
  users: { id: number; first_name: string; last_name: string } | null;
  currencies: { id: number; name: string } | null;
  locations: { id: number; code: string } | null;
}

export interface StockWithLocation {
  id: number;
  item_id: number;
  location_id: number;
  quantity: number;
  location: { code: string } | null;
}

export interface SupplierQuoteInput {
  item_id: number;
  supplier_id: number;
  cost: number;
  currency_id: number;
  date_time?: string;
  note?: string;
}

export interface ItemTransferHistory {
  id: number;
  quantity: number;
  date: string | null;
  notes: string | null;
  from_location: { id: number; code: string } | null;
  to_location: { id: number; code: string } | null;
  users: { id: number; first_name: string; last_name: string } | null;
}

export interface TransferInput {
  from_stock_id: number;
  to_location_id: number;
  quantity: number;
  notes?: string;
}

export interface CrossTransferInput {
  from_item_id: number;
  from_location_id: number;
  to_item_id: number;
  to_location_id: number;
  quantity: number;
  notes?: string;
}

export interface ParsedLineItem {
  part_number: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  matched_item_id: number | null;
  matched_item_name: string | null;
  matched_location_id: number | null;
  matched_location_code: string | null;
}

export interface ParseInvoiceResponse {
  supplier_name: string | null;
  matched_supplier_id: number | null;
  reference: string | null;
  currency_symbol: string | null;
  note: string | null;
  lines: ParsedLineItem[];
}
