import posthog from "posthog-js";

export const analytics = {
  identify(userId: string, properties?: Record<string, unknown>) {
    posthog.identify(userId, properties);
  },

  track(event: string, properties?: Record<string, unknown>) {
    posthog.capture(event, properties);
  },

  reset() {
    posthog.reset();
  },
};
