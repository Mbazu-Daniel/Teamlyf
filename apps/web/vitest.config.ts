import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.tsx"],
    css: false,
    // Popups mount on the next frame; give them room when the machine is busy.
    testTimeout: 15_000,
    hookTimeout: 15_000,
  },
});
