import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testSupabase } from "../helpers/test-client";
import { hasTestCredentials, signInTestUser } from "../helpers/auth";
import { CleanupTracker, uid, uuid } from "../helpers/cleanup";

const skip = !hasTestCredentials();
const cleanup = new CleanupTracker();

describe.skipIf(skip)("Categories CRUD", () => {
  const testName = uid();
  const testCategoryId = uuid();

  beforeAll(async () => {
    await signInTestUser();
  });

  afterAll(async () => {
    await cleanup.cleanupAll();
  });

  it("should insert a new category", async () => {
    const { data, error } = await testSupabase
      .from("categories")
      .insert({ category_id: testCategoryId, name: testName })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.name).toBe(testName);
    expect(data!.category_id).toBe(testCategoryId);

    cleanup.track("categories", "category_id", testCategoryId);
  });

  it("should appear in the categories list", async () => {
    const { data, error } = await testSupabase
      .from("categories")
      .select("*")
      .order("name");

    expect(error).toBeNull();
    const found = data!.find((c: Record<string, unknown>) => c.category_id === testCategoryId);
    expect(found).toBeDefined();
    expect(found!.name).toBe(testName);
  });

  it("should delete the category", async () => {
    const { error } = await testSupabase
      .from("categories")
      .delete()
      .eq("category_id", testCategoryId);

    expect(error).toBeNull();

    const { data } = await testSupabase
      .from("categories")
      .select("category_id")
      .eq("category_id", testCategoryId);

    expect(data).toHaveLength(0);
  });
});
