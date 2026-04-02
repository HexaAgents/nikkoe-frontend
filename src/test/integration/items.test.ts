import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testSupabase } from "../helpers/test-client";
import { hasTestCredentials, signInTestUser } from "../helpers/auth";
import { CleanupTracker, uid, uuid } from "../helpers/cleanup";

const skip = !hasTestCredentials();
const cleanup = new CleanupTracker();

describe.skipIf(skip)("Items CRUD", () => {
  const testPartNumber = uid();
  const testCategoryName = uid();
  const testCategoryId = uuid();
  const testItemId = uuid();

  beforeAll(async () => {
    await signInTestUser();

    const { error } = await testSupabase
      .from("categories")
      .insert({ category_id: testCategoryId, name: testCategoryName });

    if (error) throw new Error(`Setup failed: ${error.message}`);
    cleanup.track("categories", "category_id", testCategoryId);
  });

  afterAll(async () => {
    await cleanup.cleanupAll();
  });

  it("should insert a new item linked to a category", async () => {
    const { data, error } = await testSupabase
      .from("items")
      .insert({
        item_id: testItemId,
        part_number: testPartNumber,
        description: "Test item description",
        category_id: testCategoryId,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.part_number).toBe(testPartNumber);
    expect(data!.category_id).toBe(testCategoryId);

    cleanup.track("items", "item_id", testItemId);
  });

  it("should update the item description", async () => {
    const newDesc = "Updated description";
    const { data, error } = await testSupabase
      .from("items")
      .update({ description: newDesc })
      .eq("item_id", testItemId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data!.description).toBe(newDesc);
  });

  it("should appear in the items list with correct category", async () => {
    const { data, error } = await testSupabase
      .from("items")
      .select("*, categories(name)")
      .eq("item_id", testItemId)
      .single();

    expect(error).toBeNull();
    expect(data!.part_number).toBe(testPartNumber);
    expect(data!.categories).not.toBeNull();
    expect((data!.categories as Record<string, unknown>).name).toBe(testCategoryName);
  });

  it("should delete the item", async () => {
    const { error } = await testSupabase
      .from("items")
      .delete()
      .eq("item_id", testItemId);

    expect(error).toBeNull();

    const { data } = await testSupabase
      .from("items")
      .select("item_id")
      .eq("item_id", testItemId);

    expect(data).toHaveLength(0);
  });
});
