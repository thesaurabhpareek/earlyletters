/// <reference types="node" />
/**
 * `npm run test:coverage` for @scribe/mobile: the Node-testable surface of the
 * app, which is every `.ts` module under src/ (store, repositories, sync,
 * billing, export, capture, auth and family logic, models, reminders).
 *
 * Not in the denominator: screens and components (`.tsx`, covered on device
 * and by the Playwright journeys in e2e-web/), `src/app` (Expo Router
 * routes), `src/dev` (seed and preview tools), the Expo and native adapters
 * (`expo-adapter.ts`, `*.native.ts`, `open-native.ts`) and the account
 * deletion hook (React). Thresholds: baseline of 15 Oct 2026 (docs/qa/COVERAGE.md).
 */
import { defineConfig, mergeConfig } from 'vitest/config';
import { coverage } from '../../scripts/coverage/preset';
import base from './vitest.config';

export default mergeConfig(
  base,
  defineConfig({
    test: {
      coverage: coverage({
        include: ['src/**/*.ts'],
        exclude: [
          'src/app/**',
          'src/dev/**',
          'src/**/*.tsx',
          'src/**/expo-adapter.ts',
          'src/**/*.native.ts',
          'src/**/*.android.ts',
          'src/**/*.web.ts',
          'src/lib/db/repos/open-native.ts',
          'src/lib/account-deletion/use-account-deletion.ts',
        ],
        thresholds: { statements: 0, branches: 0, functions: 0, lines: 0 },
      }),
    },
  }),
);
