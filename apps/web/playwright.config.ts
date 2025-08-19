import { defineConfig } from '@playwright/test';

export default defineConfig({
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev -- -p 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    headless: true,
  },
});
