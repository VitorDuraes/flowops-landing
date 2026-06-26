import { defineConfig, devices } from "@playwright/test";

// E2E do WaveOps Portal. Usa o dev server (reaproveita se ja estiver na 3100).
// Modo demo (AUTH_ENFORCED=false no .env.local) permite navegar /cliente e /admin
// sem login, o que facilita testar layout e fluxos.
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- -p 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
