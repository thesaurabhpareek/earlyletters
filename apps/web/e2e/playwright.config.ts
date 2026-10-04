/**
 * End-to-end suite for earlyletters.com (apps/web). `npm run e2e -w @scribe/web`.
 *
 * Global setup builds the site and serves it on a free port with the Resend API mocked on another
 * (support/global-setup.ts). Traces are kept for failures (CI uploads e2e/.results).
 * Known bugs live in e2e/known-bugs and are excluded here; run them with `npm run e2e:known-bugs -w @scribe/web`.
 */
import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

/** The sandbox ships Chromium at /opt/pw-browsers/chromium; elsewhere Playwright's own download is used. */
const sandboxChromium = '/opt/pw-browsers/chromium';
const executablePath = process.env.E2E_CHROMIUM_PATH ?? (existsSync(sandboxChromium) ? sandboxChromium : undefined);
const asRoot = typeof process.getuid === 'function' && process.getuid() === 0;

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.e2e.ts',
  testIgnore: '**/known-bugs/**',
  outputDir: './.results/artifacts',
  globalSetup: require.resolve('./support/global-setup'),
  fullyParallel: true,
  workers: process.env.E2E_WORKERS ? Number(process.env.E2E_WORKERS) : 3,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: [['list'], ['html', { outputFolder: './.results/report', open: 'never' }]],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1440, height: 900 },
    launchOptions: { executablePath, args: asRoot || process.env.CI ? ['--no-sandbox'] : [] },
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
