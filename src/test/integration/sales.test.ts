import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testSupabase } from "../helpers/test-client";
import { hasTestCredentials, signInTestUser } from "../helpers/auth";
import { uid, uuid } from "../helpers/cleanup";

const skip = !hasTestCredentials();

describe.skipIf(skip)("Sales Workflow", () => {
  const saleId = uuid();
  const channelId = uuid();
  let publicUserId: string;

  beforeAll(async () => {
    await signInTestUser();
    const { data: { user: authUser } } = await testSupabase.auth.getUser();
    const { data: pubUser } = await testSupabase
      .from("users").select("user_id").eq("auth_id", authUser!.id).single();
    publicUserId = pubUser!.user_id;

    await testSupabase.from("channels").insert({ channel_id: channelId, channel_name: uid() });
  });

  afterAll(async () => {
    await testSupabase.from("sales").delete().eq("sale_id", saleId);
    await testSupabase.from("channels").delete().eq("channel_id", channelId);
  });

  it("should insert a new sale", async () => {
    const { data, error } = await testSupabase
      .from("sales")
      .insert({ sale_id: saleId, channel_id: channelId, sold_by: publicUserId, note: "Integration test sale" })
      .select().single();

    expect(error).toBeNull();
    expect(data!.status).toBe("POSTED");
    expect(data!.sale_id).toBe(saleId);
  });

  it("should appear in the sales list", async () => {
    const { data, error } = await testSupabase
      .from("sales").select("*").order("sold_at", { ascending: false });

    expect(error).toBeNull();
    const found = data!.find((s: Record<string, unknown>) => s.sale_id === saleId);
    expect(found).toBeDefined();
    expect(found!.note).toBe("Integration test sale");
  });

  it("should read existing sale lines from a previous sale", async () => {
    const { data: existingSale } = await testSupabase
      .from("sales").select("sale_id").neq("sale_id", saleId).limit(1).single();

    if (!existingSale) return; // no prior data to check

    const { data, error } = await testSupabase
      .from("sale_lines").select("*").eq("sale_id", existingSale.sale_id);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    if (data!.length > 0) {
      expect(data![0]).toHaveProperty("quantity");
      expect(data![0]).toHaveProperty("unit_price");
      expect(data![0]).toHaveProperty("stock_id");
    }
  });

  it("should be able to fetch sale details by id", async () => {
    const { data, error } = await testSupabase
      .from("sales").select("*").eq("sale_id", saleId).single();

    expect(error).toBeNull();
    expect(data!.sale_id).toBe(saleId);
    expect(data!.sold_by).toBe(publicUserId);
  });
});
