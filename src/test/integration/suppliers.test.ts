import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testSupabase } from "../helpers/test-client";
import { hasTestCredentials, signInTestUser } from "../helpers/auth";
import { CleanupTracker, uid, uuid } from "../helpers/cleanup";

const skip = !hasTestCredentials();
const cleanup = new CleanupTracker();

describe.skipIf(skip)("Suppliers CRUD", () => {
  const testSupplierName = uid();
  const testSupplierId = uuid();

  beforeAll(async () => {
    await signInTestUser();
  });

  afterAll(async () => {
    await cleanup.cleanupAll();
  });

  it("should insert a new supplier", async () => {
    const { data, error } = await testSupabase
      .from("suppliers")
      .insert({
        supplier_id: testSupplierId,
        supplier_name: testSupplierName,
        supplier_email: "test@example.com",
        supplier_phone: "555-0100",
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.supplier_name).toBe(testSupplierName);
    expect(data!.supplier_id).toBe(testSupplierId);

    cleanup.track("suppliers", "supplier_id", testSupplierId);
  });

  it("should appear in the suppliers list", async () => {
    const { data, error } = await testSupabase
      .from("suppliers")
      .select("*")
      .order("supplier_name");

    expect(error).toBeNull();
    const found = data!.find((s: Record<string, unknown>) => s.supplier_id === testSupplierId);
    expect(found).toBeDefined();
    expect(found!.supplier_name).toBe(testSupplierName);
    expect(found!.supplier_email).toBe("test@example.com");
  });

  it("should delete the supplier", async () => {
    const { error } = await testSupabase
      .from("suppliers")
      .delete()
      .eq("supplier_id", testSupplierId);

    expect(error).toBeNull();

    const { data } = await testSupabase
      .from("suppliers")
      .select("supplier_id")
      .eq("supplier_id", testSupplierId);

    expect(data).toHaveLength(0);
  });
});
