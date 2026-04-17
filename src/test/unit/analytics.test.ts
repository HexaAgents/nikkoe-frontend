import { describe, it, expect, vi, beforeEach } from "vitest";
import posthog from "posthog-js";
import { analytics, initAnalytics } from "@/lib/analytics";

vi.mock("posthog-js", () => ({
  default: {
    init: vi.fn(),
    identify: vi.fn(),
    capture: vi.fn(),
    reset: vi.fn(),
  },
}));

describe("analytics wrapper", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    import.meta.env.VITE_POSTHOG_KEY = "test-key";
    initAnalytics();
    await new Promise((r) => setTimeout(r, 0));
  });

  it("identify delegates to posthog.identify", () => {
    analytics.identify("user-123", { plan: "pro" });
    expect(posthog.identify).toHaveBeenCalledWith("user-123", { plan: "pro" });
  });

  it("identify works without properties", () => {
    analytics.identify("user-456");
    expect(posthog.identify).toHaveBeenCalledWith("user-456", undefined);
  });

  it("track delegates to posthog.capture", () => {
    analytics.track("item_created", { item_id: "i1" });
    expect(posthog.capture).toHaveBeenCalledWith("item_created", { item_id: "i1" });
  });

  it("track works without properties", () => {
    analytics.track("page_viewed");
    expect(posthog.capture).toHaveBeenCalledWith("page_viewed", undefined);
  });

  it("reset delegates to posthog.reset", () => {
    analytics.reset();
    expect(posthog.reset).toHaveBeenCalledTimes(1);
  });
});
