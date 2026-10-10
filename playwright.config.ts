import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  expect: { timeout: 7000 },
  use: {
    baseURL: "http://localhost:5179",
    browserName: "chromium",
    trace: "retain-on-failure",
  },
  reporter: [["list"], ["html", { open: "never" }]],
  webServer: {
    command: process.env.E2E_PREVIEW ? "npm run preview -- --port 5179" : "npm run dev",
    url: "http://localhost:5179",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
