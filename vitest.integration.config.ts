import { defineConfig } from "vitest/config";
import path from "path";
import fs from "fs";

function loadEnvTest(): Record<string, string> {
  const envPath = path.resolve(__dirname, ".env.test");
  try {
    const content = fs.readFileSync(envPath, "utf-8");
    const vars: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      vars[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
    }
    return vars;
  } catch {
    return {};
  }
}

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/test/integration/**/*.{test,spec}.{ts,tsx}"],
    testTimeout: 15000,
    sequence: { concurrent: false },
    env: loadEnvTest(),
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
