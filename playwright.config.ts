import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config para testes E2E do Glass Phone SBS.
 *
 * Variáveis de ambiente esperadas:
 *   E2E_BASE_URL     (default: http://localhost:8080)
 *   E2E_ADMIN_EMAIL  (obrigatório para testes de admin)
 *   E2E_ADMIN_PASSWORD
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:8080",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    viewport: { width: 1280, height: 900 },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Usa Chromium do sistema quando PLAYWRIGHT_CHROMIUM_EXECUTABLE estiver
        // setado (útil em sandboxes de CI onde o bundled não tem libs .so).
        ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
          ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } }
          : {}),
      },
    },
  ],
});
