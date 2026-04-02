import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testSupabase } from "../helpers/test-client";
import { hasTestCredentials, signInTestUser } from "../helpers/auth";
import { CleanupTracker, uid, uuid } from "../helpers/cleanup";

const skip = !hasTestCredentials();
const cleanup = new CleanupTracker();

describe.skipIf(skip)("Locations CRUD", () => {
  const testCode = uid();
  const testLocationId = uuid();

  beforeAll(async () => {
    await signInTestUser();
  });

  afterAll(async () => {
    await cleanup.cleanupAll();
  });

  it("should insert a new location", async () => {
    const { data, error } = await testSupabase
      .from("locations")
      .insert({ location_id: testLocationId, location_code: testCode })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.location_code).toBe(testCode);
    expect(data!.location_id).toBe(testLocationId);

    cleanup.track("locations", "location_id", testLocationId);
  });

  it("should appear in the locations list", async () => {
    const { data, error } = await testSupabase
      .from("locations")
      .select("*")
      .order("location_code");

    expect(error).toBeNull();
    const found = data!.find((l: Record<string, unknown>) => l.location_id === testLocationId);
    expect(found).toBeDefined();
    expect(found!.location_code).toBe(testCode);
  });

  it("should delete the location", async () => {
    const { error } = await testSupabase
      .from("locations")
      .delete()
      .eq("location_id", testLocationId);

    expect(error).toBeNull();

    const { data } = await testSupabase
      .from("locations")
      .select("location_id")
      .eq("location_id", testLocationId);

    expect(data).toHaveLength(0);
  });
});
