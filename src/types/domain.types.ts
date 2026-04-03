export interface ReceiptWithRelations {
  receipt_id: string;
  received_at: string;
  status: string;
  reference: string | null;
  note: string | null;
  supplier_id: string | null;
  received_by: string | null;
  void_reason: string | null;
  voided_at: string | null;
  voided_by: string | null;
  suppliers: { supplier_id: string; supplier_name: string } | null;
  users: { user_id: string; name: string } | null;
}

export interface ReceiptLine {
  receipt_line_id: string;
  receipt_id: string;
  item_id: string;
  location_id: string;
  quantity: number;
  unit_cost: number;
  currency_code: string;
  items?: { part_number: string } | null;
  locations?: { location_code: string } | null;
}

export interface ReceiptLineInput {
  item_id: string;
  location_id: string;
  quantity: number;
  unit_cost: number;
  currency_code: string;
}

export interface SaleWithRelations {
  sale_id: string;
  customer_name: string | null;
  channel_id: string | null;
  sold_at: string;
  sold_by: string | null;
  status: string;
  note: string | null;
  void_reason: string | null;
  voided_at: string | null;
  voided_by: string | null;
  channels: { channel_id: string; channel_name: string } | null;
  users: { user_id: string; name: string } | null;
}

export interface SaleLine {
  sale_line_id: string;
  sale_id: string;
  item_id: string;
  location_id: string;
  quantity: number;
  unit_price: number;
  currency_code: string;
  items?: { part_number: string } | null;
  locations?: { location_code: string } | null;
}

export interface SaleLineInput {
  item_id: string;
  location_id: string;
  quantity: number;
  unit_price: number;
  currency_code: string;
}

export interface Item {
  item_id: string;
  part_number: string;
  description: string | null;
  category_id: string | null;
  categories?: { category_id: string; name: string } | null;
}

export interface InventoryBalance {
  quantity_on_hand: number;
  locations: { location_code: string } | null;
}

export interface ItemReceiptLine {
  unit_cost: number;
  receipts: { status: string } | null;
}

export interface ItemWithRelations extends Item {
  inventory_balances: InventoryBalance[];
  receipt_lines: ItemReceiptLine[];
}

export interface ItemInput {
  part_number: string;
  description?: string;
  category_id?: string;
}

export interface Category {
  category_id: string;
  name: string;
}

export interface Supplier {
  supplier_id: string;
  supplier_name: string;
  supplier_address: string | null;
  supplier_email: string | null;
  supplier_phone: string | null;
}

export interface SupplierInput {
  supplier_name: string;
  supplier_address?: string;
  supplier_email?: string;
  supplier_phone?: string;
}

export interface Location {
  location_id: string;
  location_code: string;
}

export interface Channel {
  channel_id: string;
  channel_name: string;
}

export interface Customer {
  customer_id: string;
  name: string;
}

export interface InventoryMovementWithRelations {
  movement_id: string;
  item_id: string;
  moved_at: string;
  movement_type: string;
  quantity: number;
  from_location_id: string | null;
  to_location_id: string | null;
  user_id: string | null;
  receipt_id: string | null;
  sale_id: string | null;
  note: string | null;
  receipt_line_id: string | null;
  reversed_by_movement_id: string | null;
  sale_line_id: string | null;
  items: { item_id: string; part_number: string } | null;
  from_location: { location_id: string; location_code: string } | null;
  to_location: { location_id: string; location_code: string } | null;
  users: { user_id: string; name: string } | null;
}

export interface InventoryOnHand {
  item_id: string;
  location_id: string;
  quantity_on_hand: number;
}

export interface UserProfile {
  user_id: string;
  name: string;
  email_address: string | null;
  role: string | null;
}

export interface SupplierQuoteInput {
  item_id: string;
  supplier_id: string;
  unit_cost: number;
  currency: string;
  quoted_at?: string;
  note?: string;
}
