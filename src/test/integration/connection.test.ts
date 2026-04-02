import { describe, it, expect, beforeAll } from "vitest";
import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  testSupabase,
} from "../helpers/test-client";
import { hasTestCredentials, signInTestUser } from "../helpers/auth";

describe("Supabase Connectivity (no auth required)", () => {
  it("should have a valid Supabase URL configured", () => {
    expect(SUPABASE_URL).toMatch(/^https:\/\/.+\.supabase\.co$/);
  });

  it("should have a publishable key configured", () => {
    expect(SUPABASE_PUBLISHABLE_KEY).toBeTruthy();
    expect(SUPABASE_PUBLISHABLE_KEY.length).toBeGreaterThan(10);
  });

  it("should reach the Supabase REST endpoint", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
      },
    });
    expect(res.status).toBeLessThan(500);
  });
});

const skipAuth = !hasTestCredentials();

describe.skipIf(skipAuth)("Supabase Authenticated Access", () => {
  beforeAll(async () => {
    await signInTestUser();
  });

  it("should authenticate with test credentials", async () => {
    const {
      data: { user },
    } = await testSupabase.auth.getUser();
    expect(user).not.toBeNull();
    expect(user!.email).toBe(process.env.TEST_USER_EMAIL);
  });

  it("should read from categories table (RLS check)", async () => {
    const { error } = await testSupabase
      .from("categories")
      .select("category_id")
      .limit(1);
    expect(error).toBeNull();
  });

  it("should read from locations table (RLS check)", async () => {
    const { error } = await testSupabase
      .from("locations")
      .select("location_id")
      .limit(1);
    expect(error).toBeNull();
  });

  it("should read from items table (RLS check)", async () => {
    const { error } = await testSupabase
      .from("items")
      .select("item_id")
      .limit(1);
    expect(error).toBeNull();
  });

  it("should read from sales table (RLS check)", async () => {
    const { error } = await testSupabase
      .from("sales")
      .select("sale_id")
      .limit(1);
    expect(error).toBeNull();
  });

  it("should read from receipts table (RLS check)", async () => {
    const { error } = await testSupabase
      .from("receipts")
      .select("receipt_id")
      .limit(1);
    expect(error).toBeNull();
  });
});
