import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testSupabase } from "../helpers/test-client";
import { hasTestCredentials, signInTestUser } from "../helpers/auth";
import { uid, uuid } from "../helpers/cleanup";

const skip = !hasTestCredentials();

describe.skipIf(skip)("Receipts Workflow", () => {
  const receiptId = uuid();
  const testRef = uid();
  let publicUserId: string;

  beforeAll(async () => {
    await signInTestUser();
    const { data: { user: authUser } } = await testSupabase.auth.getUser();
    const { data: pubUser } = await testSupabase
      .from("users").select("user_id").eq("auth_id", authUser!.id).single();
    publicUserId = pubUser!.user_id;
  });

  afterAll(async () => {
    await testSupabase.from("receipts").delete().eq("receipt_id", receiptId);
  });

  it("should insert a new receipt", async () => {
    const { data, error } = await testSupabase
      .from("receipts")
      .insert({ receipt_id: receiptId, reference: testRef, received_by: publicUserId, note: "Integration test receipt" })
      .select().single();

    expect(error).toBeNull();
    expect(data!.reference).toBe(testRef);
    expect(data!.status).toBe("POSTED");
  });

  it("should appear in the receipts list", async () => {
    const { data, error } = await testSupabase
      .from("receipts").select("*").order("received_at", { ascending: false });

    expect(error).toBeNull();
    const found = data!.find((r: Record<string, unknown>) => r.receipt_id === receiptId);
    expect(found).toBeDefined();
    expect(found!.reference).toBe(testRef);
  });

  it("should read existing receipt lines from a previous receipt", async () => {
    const { data: existingReceipt } = await testSupabase
      .from("receipts").select("receipt_id").neq("receipt_id", receiptId).limit(1).single();

    if (!existingReceipt) return; // no prior data to check

    const { data, error } = await testSupabase
      .from("receipt_lines").select("*").eq("receipt_id", existingReceipt.receipt_id);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    if (data!.length > 0) {
      expect(data![0]).toHaveProperty("quantity");
      expect(data![0]).toHaveProperty("unit_cost");
      expect(data![0]).toHaveProperty("stock_id");
    }
  });

  it("should be able to fetch receipt details by id", async () => {
    const { data, error } = await testSupabase
      .from("receipts").select("*").eq("receipt_id", receiptId).single();

    expect(error).toBeNull();
    expect(data!.receipt_id).toBe(receiptId);
    expect(data!.received_by).toBe(publicUserId);
  });
});
