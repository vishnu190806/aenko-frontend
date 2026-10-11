import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 120000,
  expect: { timeout: 15000 },
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // One-command runs: `npm run build && npx playwright test`.
  // Playwright starts any missing service itself (backend env below picks
  // up MAL_CLIENT_ID from the invoking shell; never commit the key).
  // Prerequisites not managed here: MySQL on localhost:3306, a packaged
  // backend jar, and for the live-AI test Ollama serving llama3.1:8b.
  webServer: [
    {
      command: 'npm run preview -- --port 5173 --strictPort',
      port: 5173,
      reuseExistingServer: true,
      timeout: 60 * 1000,
    },
    {
      command: 'java -jar ../aenko-backend/target/aenko-backend-0.0.1-SNAPSHOT.jar',
      port: 8080,
      reuseExistingServer: true,
      timeout: 180 * 1000,
      env: {
        AI_ENABLED: 'true',
        AI_PROVIDER: 'ollama',
        AI_BASE_URL: 'http://localhost:11434/v1',
        AI_MODEL: 'llama3.1:8b',
        MAL_CLIENT_ID: process.env.MAL_CLIENT_ID || '',
      },
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { channel: 'chrome', viewport: { width: 1440, height: 900 } },
    },
  ],
})
