/**
 * End-to-end tests of the real app, built for the web (Expo export) and driven in Chromium at phone size.
 * This is a stand-in for a device, not a replacement: it proves the screens, flows and failure paths render and
 * behave, it cannot prove native behaviour (microphone hardware, haptics, background audio, StoreKit). The native
 * flows live in apps/mobile/e2e (Maestro) and need a Mac and a simulator.
 *
 *   npm run e2e:web -w @scribe/mobile          build the web export if missing, serve it, run every flow
 *   JOURNEY_SHOTS=1 npm run e2e:web ...        also write one screenshot per recorded step (docs/release/journey)
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.flow\.ts$/,
  globalSetup: './support/global-setup.ts',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { outputFolder: '.results/report', open: 'never' }]],
  outputDir: '.results/artifacts',
  use: {
    baseURL: process.env.E2E_WEB_URL, // set by global setup
    ...devices['iPhone 13'],
    browserName: 'chromium',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
      args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
    },
    permissions: ['microphone'],
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
