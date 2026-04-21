type PostHog = typeof import("posthog-js").default;

let _ph: PostHog | null = null;
let _ready: Promise<PostHog | null> = Promise.resolve(null);

export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return;

  _ready = import("posthog-js").then(({ default: ph }) => {
    ph.init(key, {
      api_host: "/nk",
      ui_host: "https://us.posthog.com",
      person_profiles: "identified_only",
    });
    _ph = ph;
    return ph;
  });
}

export const analytics = {
  identify(userId: string, properties?: Record<string, unknown>) {
    if (_ph) _ph.identify(userId, properties);
    else _ready.then((ph) => ph?.identify(userId, properties));
  },

  track(event: string, properties?: Record<string, unknown>) {
    if (_ph) _ph.capture(event, properties);
    else _ready.then((ph) => ph?.capture(event, properties));
  },

  reset() {
    if (_ph) _ph.reset();
    else _ready.then((ph) => ph?.reset());
  },
};
