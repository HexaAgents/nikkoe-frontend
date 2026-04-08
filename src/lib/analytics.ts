type PostHog = typeof import("posthog-js").default;

let _ph: PostHog | null = null;
const _ready = import("posthog-js").then(({ default: ph }) => {
  _ph = ph;
  return ph;
});

export const analytics = {
  identify(userId: string, properties?: Record<string, unknown>) {
    if (_ph) _ph.identify(userId, properties);
    else _ready.then((ph) => ph.identify(userId, properties));
  },

  track(event: string, properties?: Record<string, unknown>) {
    if (_ph) _ph.capture(event, properties);
    else _ready.then((ph) => ph.capture(event, properties));
  },

  reset() {
    if (_ph) _ph.reset();
    else _ready.then((ph) => ph.reset());
  },
};
