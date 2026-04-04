import { z } from "zod";

export const saleInputSchema = z.object({
  customer: z.string().max(255).optional(),
  channel_id: z.number().nullable().optional(),
  sold_at: z.string().optional(),
  sold_by: z.string().optional(),
  note: z.string().max(1000).optional(),
});

export const saleLineInputSchema = z.object({
  item_id: z.number(),
  location_id: z.number(),
  quantity: z.number().int().positive(),
  unit_price: z.number().min(0),
  currency: z.string().min(1).max(10),
});

export const receiptInputSchema = z.object({
  received_at: z.string().optional(),
  received_by: z.string().optional(),
  supplier_id: z.number().nullable().optional(),
  reference: z.string().max(255).optional(),
  note: z.string().max(1000).optional(),
});

export const receiptLineInputSchema = z.object({
  item_id: z.number(),
  location_id: z.number(),
  quantity: z.number().int().positive(),
  unit_cost: z.number().min(0),
  currency: z.string().min(1).max(10),
});

const trimmedNonEmpty = z.string().trim().min(1);

export const itemInputSchema = z.object({
  part_number: trimmedNonEmpty.max(255),
  description: z.string().max(1000).optional(),
  category_id: z.number().nullable().optional(),
});

export const categoryNameSchema = trimmedNonEmpty.max(255);

export const locationInputSchema = z.object({
  location_code: trimmedNonEmpty.max(50),
  description: z.string().max(500).optional(),
});

export const supplierInputSchema = z.object({
  supplier_name: trimmedNonEmpty.max(255),
  supplier_address: z.string().optional(),
  supplier_email: z
    .string()
    .refine((val) => val === "" || z.string().email().safeParse(val).success, {
      message: "Invalid email",
    })
    .optional(),
  supplier_phone: z.string().max(20).optional(),
});

export const supplierQuoteInputSchema = z.object({
  item_id: z.number(),
  supplier_id: z.number(),
  unit_cost: z.number().min(0),
  currency: z.string().min(1).max(10),
  quoted_at: z.string().optional(),
  note: z.string().max(500).optional(),
});
