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

describe("Domain type contracts", () => {
  it("Item has required fields", () => {
    const item: Item = {
      id: 1,
      item_id: "ABC-123",
      description: null,
      category_id: null,
      search_id: null,
    };
    expect(item.id).toBeDefined();
    expect(item.item_id).toBeDefined();
  });

  it("Category has required fields", () => {
    const cat: Category = { id: 1, name: "Electronics" };
    expect(cat.id).toBeDefined();
    expect(cat.name).toBeDefined();
  });

  it("Location has required fields", () => {
    const loc: Location = { id: 1, code: "WH-A1" };
    expect(loc.id).toBeDefined();
    expect(loc.code).toBeDefined();
  });

  it("Supplier has required and optional fields", () => {
    const sup: Supplier = {
      id: 1,
      name: "Acme",
      address: null,
      email: null,
      phone: null,
    };
    expect(sup.id).toBeDefined();
    expect(sup.name).toBe("Acme");
    expect(sup.address).toBeNull();
  });

  it("Channel has required fields", () => {
    const ch: Channel = { id: 1, name: "Online" };
    expect(ch.name).toBe("Online");
  });

  it("Customer has required fields", () => {
    const cust: Customer = { id: 1, name: "Client A" };
    expect(cust.name).toBe("Client A");
  });

  it("SaleWithRelations includes nullable relation fields", () => {
    const sale: SaleWithRelations = {
      id: 1,
      customer_id_id: null,
      channel_id_id: null,
      channel_ref: null,
      date: "2025-01-01T00:00:00Z",
      user_id: null,
      status: "ACTIVE",
      note: null,
      void_reason: null,
      voided_at: null,
      voided_by: null,
      channels: null,
      users: null,
      customers: null,
    };
    expect(sale.status).toBe("ACTIVE");
    expect(sale.channels).toBeNull();
  });

  it("ReceiptWithRelations includes nullable relation fields", () => {
    const receipt: ReceiptWithRelations = {
      id: 1,
      dateTime: "2025-01-01T00:00:00Z",
      status: "ACTIVE",
      reference: null,
      note: null,
      supplier_id: null,
      user_id: null,
      void_reason: null,
      voided_at: null,
      voided_by: null,
      suppliers: null,
      users: null,
    };
    expect(receipt.status).toBe("ACTIVE");
  });

  it("InventoryOnHand has the expected structure", () => {
    const balance: InventoryOnHand = {
      id: 1,
      item_id: 1,
      location_id: 1,
      quantity: 42,
    };
    expect(balance.quantity).toBe(42);
  });

  it("UserProfile has the expected structure", () => {
    const profile: UserProfile = {
      user_id: 1,
      name: "Admin",
      email_address: "admin@test.com",
    };
    expect(profile.user_id).toBe(1);
    expect(profile.name).toBe("Admin");
  });
});
