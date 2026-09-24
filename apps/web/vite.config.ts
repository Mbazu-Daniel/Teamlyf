import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Proxy target comes from env, never hardcoded: repo-root .env (API_PORT)
  // wins first, apps/web/.env can override, VITE_API_PROXY_TARGET beats both.
  const env = {
    ...loadEnv(mode, fileURLToPath(new URL("../../", import.meta.url)), ""),
    ...loadEnv(mode, fileURLToPath(new URL("./", import.meta.url)), ""),
  };
  const apiTarget = env.VITE_API_PROXY_TARGET || `http://localhost:${env.API_PORT || "3101"}`;

  return {
    server: {
      host: true,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    plugins: [tailwindcss(), tanstackStart(), viteReact()],
  };
});
