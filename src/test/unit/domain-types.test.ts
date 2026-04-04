import { describe, it, expect } from "vitest";
import type {
  Item,
  Category,
  Location,
  Supplier,
  Channel,
  Customer,
  SaleWithRelations,
  ReceiptWithRelations,
  InventoryOnHand,
  UserProfile,
} from "@/types/domain.types";
import type { PaginatedResponse } from "@/types/api.types";

/**
 * These tests verify that objects conforming to the domain type interfaces
 * have the expected structure. While TypeScript catches type errors at
 * compile time, these tests serve as living documentation of the API
 * contract and catch regressions if the type definitions change.
 */

describe("Domain type contracts", () => {
  it("Item has required fields", () => {
    const item: Item = {
      item_id: "i-1",
      part_number: "ABC-123",
      description: null,
      category_id: null,
    };
    expect(item.item_id).toBeDefined();
    expect(item.part_number).toBeDefined();
  });

  it("Category has required fields", () => {
    const cat: Category = { category_id: "c-1", name: "Electronics" };
    expect(cat.category_id).toBeDefined();
    expect(cat.name).toBeDefined();
  });

  it("Location has required fields", () => {
    const loc: Location = { location_id: "l-1", location_code: "WH-A1" };
    expect(loc.location_id).toBeDefined();
    expect(loc.location_code).toBeDefined();
  });

  it("Supplier has required and optional fields", () => {
    const sup: Supplier = {
      supplier_id: "s-1",
      supplier_name: "Acme",
      supplier_address: null,
      supplier_email: null,
      supplier_phone: null,
    };
    expect(sup.supplier_id).toBeDefined();
    expect(sup.supplier_name).toBe("Acme");
    expect(sup.supplier_address).toBeNull();
  });

  it("Channel has required fields", () => {
    const ch: Channel = { channel_id: "ch-1", channel_name: "Online" };
    expect(ch.channel_name).toBe("Online");
  });

  it("Customer has required fields", () => {
    const cust: Customer = { customer_id: "cu-1", name: "Client A" };
    expect(cust.name).toBe("Client A");
  });

  it("SaleWithRelations includes nullable relation fields", () => {
    const sale: SaleWithRelations = {
      sale_id: "s-1",
      customer_name: "Test",
      channel_id: null,
      sold_at: "2025-01-01T00:00:00Z",
      sold_by: null,
      status: "active",
      note: null,
      void_reason: null,
      voided_at: null,
      voided_by: null,
      channels: null,
      users: null,
    };
    expect(sale.status).toBe("active");
    expect(sale.channels).toBeNull();
  });

  it("ReceiptWithRelations includes nullable relation fields", () => {
    const receipt: ReceiptWithRelations = {
      receipt_id: "r-1",
      received_at: "2025-01-01T00:00:00Z",
      status: "active",
      reference: null,
      note: null,
      supplier_id: null,
      received_by: null,
      void_reason: null,
      voided_at: null,
      voided_by: null,
      suppliers: null,
      users: null,
    };
    expect(receipt.status).toBe("active");
  });

  it("InventoryOnHand has the expected structure", () => {
    const balance: InventoryOnHand = {
      item_id: "i-1",
      location_id: "l-1",
      quantity_on_hand: 42,
    };
    expect(balance.quantity_on_hand).toBe(42);
  });

  it("UserProfile has the expected structure", () => {
    const profile: UserProfile = {
      user_id: "u-1",
      name: "Admin",
      email_address: "admin@test.com",
      role: "admin",
    };
    expect(profile.role).toBe("admin");
  });
});
