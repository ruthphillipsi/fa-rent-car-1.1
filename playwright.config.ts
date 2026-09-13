import { defineConfig, type PlaywrightTestConfig } from '@playwright/test';

const serverOptions = {
  reuseExistingServer: !process.env.CI,
  gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
  timeout: 120_000,
} satisfies Partial<PlaywrightTestConfig['webServer']>;

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    trace: 'off',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 } } },
    {
      name: 'mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'mobile-small',
      use: {
        browserName: 'chromium',
        viewport: { width: 360, height: 800 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: [
    {
      ...serverOptions,
      command: 'pnpm --filter @fa/api start',
      url: 'http://127.0.0.1:4000/api/v1/health',
    },
    {
      ...serverOptions,
      command: 'pnpm --filter @fa/web-admin dev',
      url: 'http://127.0.0.1:3000/login',
    },
    {
      ...serverOptions,
      command: 'pnpm --filter @fa/web-customer dev',
      url: 'http://127.0.0.1:3001',
    },
  ],
});
