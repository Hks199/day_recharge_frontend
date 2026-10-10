import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            /node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(
              id,
            )
          )
            return "react-vendor";
          if (id.includes("/node_modules/zod/")) return "validation-vendor";
        },
      },
    },
  },
  server: {
    port: 5179,
    strictPort: true,
    proxy: { "/api": { target: "http://localhost:3000", changeOrigin: false } },
  },
  test: {
    maxWorkers: 1,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
