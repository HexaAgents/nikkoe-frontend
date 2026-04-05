import { z } from "zod";

export const saleInputSchema = z.object({
  customer_id: z.number().nullable().optional(),
  channel_id: z.number().nullable().optional(),
  channel_ref: z.string().optional(),
  note: z.string().max(1000).optional(),
});

export const saleLineInputSchema = z.object({
  item_id: z.number().optional(),
  location_id: z.number().optional(),
  stock_id: z.number().optional(),
  quantity: z.number().int().positive(),
  unit_price: z.number().min(0),
  currency_id: z.number(),
});

export const receiptInputSchema = z.object({
  supplier_id: z.number().nullable().optional(),
  reference: z.string().max(255).optional(),
  note: z.string().max(1000).optional(),
});

export const receiptLineInputSchema = z.object({
  item_id: z.number().optional(),
  location_id: z.number().optional(),
  stock_id: z.number().optional(),
  quantity: z.number().int().positive(),
  unit_price: z.number().min(0),
  currency_id: z.number(),
  supplier_id: z.number().optional(),
});

const trimmedNonEmpty = z.string().trim().min(1);

export const itemInputSchema = z.object({
  item_id: trimmedNonEmpty.max(255),
  description: z.string().max(1000).optional(),
  category_id: z.number().nullable().optional(),
});

export const categoryNameSchema = trimmedNonEmpty.max(255);

export const locationInputSchema = z.object({
  code: trimmedNonEmpty.max(50),
});

export const supplierInputSchema = z.object({
  name: trimmedNonEmpty.max(255),
  address: z.string().optional(),
  email: z
    .string()
    .refine((val) => val === "" || z.string().email().safeParse(val).success, {
      message: "Invalid email",
    })
    .optional(),
  phone: z.string().max(20).optional(),
});

export const supplierQuoteInputSchema = z.object({
  item_id: z.number(),
  supplier_id: z.number(),
  cost: z.number().min(0),
  currency_id: z.number(),
  date_time: z.string().optional(),
  note: z.string().max(500).optional(),
});
