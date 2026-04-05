import { describe, it, expect } from "vitest";
import {
  saleInputSchema,
  saleLineInputSchema,
} from "@/hooks/mutations";
import {
  receiptInputSchema,
  receiptLineInputSchema,
} from "@/hooks/mutations";
import { itemInputSchema } from "@/hooks/mutations";
import { categoryNameSchema } from "@/hooks/mutations";
import { locationInputSchema } from "@/hooks/mutations";
import { supplierInputSchema } from "@/hooks/mutations";
import { supplierQuoteInputSchema } from "@/hooks/mutations";

describe("saleInputSchema", () => {
  it("accepts a valid minimal sale", () => {
    expect(() => saleInputSchema.parse({})).not.toThrow();
  });

  it("accepts a fully populated sale", () => {
    const result = saleInputSchema.parse({
      customer_id: 1,
      channel_id: 1,
      channel_ref: "REF-001",
      note: "Test note",
    });
    expect(result.customer_id).toBe(1);
  });

  it("rejects note exceeding 1000 characters", () => {
    const result = saleInputSchema.safeParse({ note: "x".repeat(1001) });
    expect(result.success).toBe(false);
  });

  it("allows null for customer_id", () => {
    expect(() => saleInputSchema.parse({ customer_id: null })).not.toThrow();
  });

  it("allows null for channel_id", () => {
    expect(() => saleInputSchema.parse({ channel_id: null })).not.toThrow();
  });
});

describe("saleLineInputSchema", () => {
  const validLine = {
    item_id: 1,
    location_id: 1,
    quantity: 5,
    unit_price: 10.0,
    currency_id: 1,
  };

  it("accepts a valid sale line", () => {
    const result = saleLineInputSchema.parse(validLine);
    expect(result.quantity).toBe(5);
  });

  it("allows missing item_id (optional field)", () => {
    const { item_id, ...rest } = validLine;
    const result = saleLineInputSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("rejects zero quantity", () => {
    const result = saleLineInputSchema.safeParse({ ...validLine, quantity: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative quantity", () => {
    const result = saleLineInputSchema.safeParse({
      ...validLine,
      quantity: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative unit_price", () => {
    const result = saleLineInputSchema.safeParse({
      ...validLine,
      unit_price: -5,
    });
    expect(result.success).toBe(false);
  });

  it("allows zero unit_price", () => {
    expect(() =>
      saleLineInputSchema.parse({ ...validLine, unit_price: 0 })
    ).not.toThrow();
  });
});

describe("receiptInputSchema", () => {
  it("accepts a valid minimal receipt", () => {
    expect(() => receiptInputSchema.parse({})).not.toThrow();
  });

  it("accepts a fully populated receipt", () => {
    const result = receiptInputSchema.parse({
      supplier_id: 1,
      reference: "PO-12345",
      note: "Test note",
    });
    expect(result.reference).toBe("PO-12345");
  });

  it("rejects reference exceeding 255 characters", () => {
    const result = receiptInputSchema.safeParse({
      reference: "x".repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it("rejects note exceeding 1000 characters", () => {
    const result = receiptInputSchema.safeParse({ note: "x".repeat(1001) });
    expect(result.success).toBe(false);
  });

  it("allows empty string for reference", () => {
    expect(() => receiptInputSchema.parse({ reference: "" })).not.toThrow();
  });

  it("allows null for supplier_id", () => {
    expect(() =>
      receiptInputSchema.parse({ supplier_id: null })
    ).not.toThrow();
  });
});

describe("receiptLineInputSchema", () => {
  const validLine = {
    item_id: 1,
    location_id: 1,
    quantity: 10,
    unit_price: 5.5,
    currency_id: 1,
  };

  it("accepts a valid receipt line", () => {
    const result = receiptLineInputSchema.parse(validLine);
    expect(result.unit_price).toBe(5.5);
  });

  it("allows missing location_id (optional field)", () => {
    const { location_id, ...rest } = validLine;
    const result = receiptLineInputSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("rejects zero quantity", () => {
    const result = receiptLineInputSchema.safeParse({
      ...validLine,
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative unit_price", () => {
    const result = receiptLineInputSchema.safeParse({
      ...validLine,
      unit_price: -1,
    });
    expect(result.success).toBe(false);
  });

  it("allows zero unit_price", () => {
    expect(() =>
      receiptLineInputSchema.parse({ ...validLine, unit_price: 0 })
    ).not.toThrow();
  });
});

describe("itemInputSchema", () => {
  it("accepts a valid item with item_id only", () => {
    const result = itemInputSchema.parse({ item_id: "ABC-123" });
    expect(result.item_id).toBe("ABC-123");
  });

  it("accepts a fully populated item", () => {
    const result = itemInputSchema.parse({
      item_id: "ABC-123",
      description: "A test part",
      category_id: 1,
    });
    expect(result.category_id).toBe(1);
  });

  it("rejects missing item_id", () => {
    const result = itemInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty item_id", () => {
    const result = itemInputSchema.safeParse({ item_id: "" });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only item_id", () => {
    const result = itemInputSchema.safeParse({ item_id: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects item_id exceeding 255 characters", () => {
    const result = itemInputSchema.safeParse({
      item_id: "x".repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it("rejects description exceeding 1000 characters", () => {
    const result = itemInputSchema.safeParse({
      item_id: "OK",
      description: "x".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("allows null for category_id", () => {
    expect(() =>
      itemInputSchema.parse({ item_id: "OK", category_id: null })
    ).not.toThrow();
  });

  it("trims whitespace from item_id", () => {
    const result = itemInputSchema.parse({ item_id: "  ABC-123  " });
    expect(result.item_id).toBe("ABC-123");
  });
});

describe("categoryNameSchema", () => {
  it("accepts a valid category name", () => {
    expect(categoryNameSchema.parse("Electronics")).toBe("Electronics");
  });

  it("rejects empty string", () => {
    const result = categoryNameSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only string", () => {
    const result = categoryNameSchema.safeParse("   ");
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding 255 characters", () => {
    const result = categoryNameSchema.safeParse("x".repeat(256));
    expect(result.success).toBe(false);
  });

  it("trims whitespace", () => {
    expect(categoryNameSchema.parse("  Bolts  ")).toBe("Bolts");
  });
});

describe("locationInputSchema", () => {
  it("accepts a valid location", () => {
    const result = locationInputSchema.parse({ code: "WH-A1" });
    expect(result.code).toBe("WH-A1");
  });

  it("rejects missing code", () => {
    const result = locationInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty code", () => {
    const result = locationInputSchema.safeParse({ code: "" });
    expect(result.success).toBe(false);
  });

  it("rejects code exceeding 50 characters", () => {
    const result = locationInputSchema.safeParse({
      code: "x".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from code", () => {
    const result = locationInputSchema.parse({ code: "  WH-B2  " });
    expect(result.code).toBe("WH-B2");
  });
});

describe("supplierInputSchema", () => {
  it("accepts a valid supplier with name only", () => {
    const result = supplierInputSchema.parse({ name: "Acme" });
    expect(result.name).toBe("Acme");
  });

  it("accepts a fully populated supplier", () => {
    const result = supplierInputSchema.parse({
      name: "Acme Corp",
      address: "123 Main St",
      email: "contact@acme.com",
      phone: "555-0100",
    });
    expect(result.email).toBe("contact@acme.com");
  });

  it("rejects missing name", () => {
    const result = supplierInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = supplierInputSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding 255 characters", () => {
    const result = supplierInputSchema.safeParse({
      name: "x".repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = supplierInputSchema.safeParse({
      name: "OK",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("allows empty string for email", () => {
    expect(() =>
      supplierInputSchema.parse({
        name: "OK",
        email: "",
      })
    ).not.toThrow();
  });

  it("rejects phone exceeding 20 characters", () => {
    const result = supplierInputSchema.safeParse({
      name: "OK",
      phone: "1".repeat(21),
    });
    expect(result.success).toBe(false);
  });
});

describe("supplierQuoteInputSchema", () => {
  const validQuote = {
    item_id: 1,
    supplier_id: 1,
    cost: 12.5,
    currency_id: 1,
  };

  it("accepts a valid quote", () => {
    const result = supplierQuoteInputSchema.parse(validQuote);
    expect(result.cost).toBe(12.5);
  });

  it("accepts a quote with optional fields", () => {
    const result = supplierQuoteInputSchema.parse({
      ...validQuote,
      date_time: new Date().toISOString(),
      note: "Bulk discount",
    });
    expect(result.note).toBe("Bulk discount");
  });

  it("rejects missing item_id", () => {
    const { item_id, ...rest } = validQuote;
    const result = supplierQuoteInputSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing supplier_id", () => {
    const { supplier_id, ...rest } = validQuote;
    const result = supplierQuoteInputSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects negative cost", () => {
    const result = supplierQuoteInputSchema.safeParse({
      ...validQuote,
      cost: -1,
    });
    expect(result.success).toBe(false);
  });

  it("allows zero cost", () => {
    expect(() =>
      supplierQuoteInputSchema.parse({ ...validQuote, cost: 0 })
    ).not.toThrow();
  });

  it("rejects note exceeding 500 characters", () => {
    const result = supplierQuoteInputSchema.safeParse({
      ...validQuote,
      note: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});
