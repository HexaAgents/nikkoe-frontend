import { describe, it, expect } from "vitest";
import {
  saleInputSchema,
  saleLineInputSchema,
} from "@/hooks/useSales";
import {
  receiptInputSchema,
  receiptLineInputSchema,
} from "@/hooks/useReceipts";
import { itemInputSchema } from "@/hooks/useItems";
import { categoryNameSchema } from "@/hooks/useCategories";
import { locationInputSchema } from "@/hooks/useLocations";
import { supplierInputSchema } from "@/hooks/useSuppliers";
import { supplierQuoteInputSchema } from "@/hooks/useSupplierQuotes";

describe("saleInputSchema", () => {
  it("accepts a valid minimal sale", () => {
    expect(() => saleInputSchema.parse({})).not.toThrow();
  });

  it("accepts a fully populated sale", () => {
    const result = saleInputSchema.parse({
      customer: "Acme Corp",
      channel_id: 1,
      sold_at: new Date().toISOString(),
      sold_by: "550e8400-e29b-41d4-a716-446655440000",
      note: "Test note",
    });
    expect(result.customer).toBe("Acme Corp");
  });

  it("rejects customer exceeding 255 characters", () => {
    const result = saleInputSchema.safeParse({ customer: "x".repeat(256) });
    expect(result.success).toBe(false);
  });

  it("rejects note exceeding 1000 characters", () => {
    const result = saleInputSchema.safeParse({ note: "x".repeat(1001) });
    expect(result.success).toBe(false);
  });

  it("allows empty string for customer", () => {
    expect(() => saleInputSchema.parse({ customer: "" })).not.toThrow();
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
    currency: "USD",
  };

  it("accepts a valid sale line", () => {
    const result = saleLineInputSchema.parse(validLine);
    expect(result.quantity).toBe(5);
  });

  it("rejects missing item_id", () => {
    const { item_id, ...rest } = validLine;
    const result = saleLineInputSchema.safeParse(rest);
    expect(result.success).toBe(false);
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

  it("rejects empty currency", () => {
    const result = saleLineInputSchema.safeParse({
      ...validLine,
      currency: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects currency longer than 10 characters", () => {
    const result = saleLineInputSchema.safeParse({
      ...validLine,
      currency: "TOOLONGCURR",
    });
    expect(result.success).toBe(false);
  });
});

describe("receiptInputSchema", () => {
  it("accepts a valid minimal receipt", () => {
    expect(() => receiptInputSchema.parse({})).not.toThrow();
  });

  it("accepts a fully populated receipt", () => {
    const result = receiptInputSchema.parse({
      received_at: new Date().toISOString(),
      received_by: "550e8400-e29b-41d4-a716-446655440000",
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
    unit_cost: 5.5,
    currency: "USD",
  };

  it("accepts a valid receipt line", () => {
    const result = receiptLineInputSchema.parse(validLine);
    expect(result.unit_cost).toBe(5.5);
  });

  it("rejects missing location_id", () => {
    const { location_id, ...rest } = validLine;
    const result = receiptLineInputSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects zero quantity", () => {
    const result = receiptLineInputSchema.safeParse({
      ...validLine,
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative unit_cost", () => {
    const result = receiptLineInputSchema.safeParse({
      ...validLine,
      unit_cost: -1,
    });
    expect(result.success).toBe(false);
  });

  it("allows zero unit_cost", () => {
    expect(() =>
      receiptLineInputSchema.parse({ ...validLine, unit_cost: 0 })
    ).not.toThrow();
  });
});

describe("itemInputSchema", () => {
  it("accepts a valid item with part_number only", () => {
    const result = itemInputSchema.parse({ part_number: "ABC-123" });
    expect(result.part_number).toBe("ABC-123");
  });

  it("accepts a fully populated item", () => {
    const result = itemInputSchema.parse({
      part_number: "ABC-123",
      description: "A test part",
      category_id: 1,
    });
    expect(result.category_id).toBe(1);
  });

  it("rejects missing part_number", () => {
    const result = itemInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty part_number", () => {
    const result = itemInputSchema.safeParse({ part_number: "" });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only part_number", () => {
    const result = itemInputSchema.safeParse({ part_number: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects part_number exceeding 255 characters", () => {
    const result = itemInputSchema.safeParse({
      part_number: "x".repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it("rejects description exceeding 1000 characters", () => {
    const result = itemInputSchema.safeParse({
      part_number: "OK",
      description: "x".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("allows null for category_id", () => {
    expect(() =>
      itemInputSchema.parse({ part_number: "OK", category_id: null })
    ).not.toThrow();
  });

  it("trims whitespace from part_number", () => {
    const result = itemInputSchema.parse({ part_number: "  ABC-123  " });
    expect(result.part_number).toBe("ABC-123");
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
    const result = locationInputSchema.parse({ location_code: "WH-A1" });
    expect(result.location_code).toBe("WH-A1");
  });

  it("rejects missing location_code", () => {
    const result = locationInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty location_code", () => {
    const result = locationInputSchema.safeParse({ location_code: "" });
    expect(result.success).toBe(false);
  });

  it("rejects location_code exceeding 50 characters", () => {
    const result = locationInputSchema.safeParse({
      location_code: "x".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from location_code", () => {
    const result = locationInputSchema.parse({ location_code: "  WH-B2  " });
    expect(result.location_code).toBe("WH-B2");
  });

  it("allows description up to 500 characters", () => {
    expect(() =>
      locationInputSchema.parse({
        location_code: "WH",
        description: "x".repeat(500),
      })
    ).not.toThrow();
  });

  it("rejects description exceeding 500 characters", () => {
    const result = locationInputSchema.safeParse({
      location_code: "WH",
      description: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("supplierInputSchema", () => {
  it("accepts a valid supplier with name only", () => {
    const result = supplierInputSchema.parse({ supplier_name: "Acme" });
    expect(result.supplier_name).toBe("Acme");
  });

  it("accepts a fully populated supplier", () => {
    const result = supplierInputSchema.parse({
      supplier_name: "Acme Corp",
      supplier_address: "123 Main St",
      supplier_email: "contact@acme.com",
      supplier_phone: "555-0100",
    });
    expect(result.supplier_email).toBe("contact@acme.com");
  });

  it("rejects missing supplier_name", () => {
    const result = supplierInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty supplier_name", () => {
    const result = supplierInputSchema.safeParse({ supplier_name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects supplier_name exceeding 255 characters", () => {
    const result = supplierInputSchema.safeParse({
      supplier_name: "x".repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = supplierInputSchema.safeParse({
      supplier_name: "OK",
      supplier_email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("allows empty string for email", () => {
    expect(() =>
      supplierInputSchema.parse({
        supplier_name: "OK",
        supplier_email: "",
      })
    ).not.toThrow();
  });

  it("rejects phone exceeding 20 characters", () => {
    const result = supplierInputSchema.safeParse({
      supplier_name: "OK",
      supplier_phone: "1".repeat(21),
    });
    expect(result.success).toBe(false);
  });
});

describe("supplierQuoteInputSchema", () => {
  const validQuote = {
    item_id: 1,
    supplier_id: 1,
    unit_cost: 12.5,
    currency: "USD",
  };

  it("accepts a valid quote", () => {
    const result = supplierQuoteInputSchema.parse(validQuote);
    expect(result.unit_cost).toBe(12.5);
  });

  it("accepts a quote with optional fields", () => {
    const result = supplierQuoteInputSchema.parse({
      ...validQuote,
      quoted_at: new Date().toISOString(),
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

  it("rejects negative unit_cost", () => {
    const result = supplierQuoteInputSchema.safeParse({
      ...validQuote,
      unit_cost: -1,
    });
    expect(result.success).toBe(false);
  });

  it("allows zero unit_cost", () => {
    expect(() =>
      supplierQuoteInputSchema.parse({ ...validQuote, unit_cost: 0 })
    ).not.toThrow();
  });

  it("rejects note exceeding 500 characters", () => {
    const result = supplierQuoteInputSchema.safeParse({
      ...validQuote,
      note: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty currency", () => {
    const result = supplierQuoteInputSchema.safeParse({
      ...validQuote,
      currency: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects currency longer than 10 characters", () => {
    const result = supplierQuoteInputSchema.safeParse({
      ...validQuote,
      currency: "TOOLONGCURR",
    });
    expect(result.success).toBe(false);
  });
});
