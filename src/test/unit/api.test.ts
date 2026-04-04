import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "test-token-abc" } },
      }),
    },
  },
}));

import { apiFetch, api } from "@/lib/api";

describe("apiFetch", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends GET request with auth header", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await apiFetch("/items");

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("/items");
    expect(options.headers.Authorization).toBe("Bearer test-token-abc");
    expect(options.headers["Content-Type"]).toBe("application/json");
  });

  it("returns parsed JSON on success", async () => {
    const payload = { item_id: "1", part_number: "ABC" };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const result = await apiFetch("/items/1");
    expect(result).toEqual(payload);
  });

  it("throws on non-ok response with error message from body", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Item not found" }),
    });

    await expect(apiFetch("/items/999")).rejects.toThrow("Item not found");
  });

  it("throws generic message when body has no error field", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });

    await expect(apiFetch("/fail")).rejects.toThrow("Request failed: 500");
  });

  it("throws generic message when body is not JSON", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 502,
      json: () => Promise.reject(new Error("not json")),
    });

    await expect(apiFetch("/fail")).rejects.toThrow("Request failed: 502");
  });

  it("passes custom request options", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await apiFetch("/items", { method: "POST", body: JSON.stringify({ name: "test" }) });

    const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.method).toBe("POST");
    expect(options.body).toBe('{"name":"test"}');
  });
});

describe("api convenience methods", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("api.get returns parsed response", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ sale_id: "s1" }),
    });

    const result = await api.get("/sales/s1");
    expect(result).toEqual({ sale_id: "s1" });
  });

  it("api.getList extracts data array from paginated response", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [{ id: 1 }, { id: 2 }], total: 2 }),
    });

    const result = await api.getList("/items");
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("api.post sends POST with JSON body", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ created: true }),
    });

    await api.post("/items", { part_number: "X" });

    const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ part_number: "X" });
  });

  it("api.put sends PUT with JSON body", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ updated: true }),
    });

    await api.put("/items/1", { description: "Updated" });

    const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.method).toBe("PUT");
  });

  it("api.del sends DELETE request", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await api.del("/items/1");

    const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.method).toBe("DELETE");
  });
});
