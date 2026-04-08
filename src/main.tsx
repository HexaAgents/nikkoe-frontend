import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
if (posthogKey) {
  import("posthog-js").then(({ default: posthog }) => {
    posthog.init(posthogKey, {
      api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
