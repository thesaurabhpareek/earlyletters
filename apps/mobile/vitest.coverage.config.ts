/// <reference types="node" />
/**
 * `npm run test:coverage` for @scribe/mobile: the Node-testable surface of the
 * app, which is every `.ts` module under src/ (store, repositories, sync,
 * billing, export, capture, auth and family logic, models, reminders).
 *
 * Not in the denominator: screens and components (`.tsx`, covered on device
 * and by the Playwright journeys in e2e-web/), `src/app` (Expo Router
 * routes), `src/dev` (seed and preview tools), the Expo and native adapters
 * (`expo-adapter.ts`, `open-native.ts`, `lib/billing/status-report.app.ts`, which
 * assembles StoreKit and Supabase), the platform files of a split (`*.native.ts`,
 * `*.android.ts`, `*.web.ts`) and the account deletion hook (React). The
 * Keychain wiring, `lib/billing/letter-ledger.keychain.ts`, counts: it is
 * tested (test/billing-keychain-wiring.test.ts). Floors: one to two points below the 16 Oct 2026 measurement (docs/qa/COVERAGE.md).
 */
import { defineConfig, mergeConfig } from 'vitest/config';
import { coverage, INSTRUMENTED } from '../../scripts/coverage/preset';
import base from './vitest.config';

export default mergeConfig(
  base,
  defineConfig({
    test: {
      ...INSTRUMENTED,
      coverage: coverage({
        include: ['src/**/*.ts'],
        exclude: [
          'src/app/**',
          'src/dev/**',
          'src/**/*.tsx',
          'src/**/expo-adapter.ts',
          'src/**/*.native.ts',
          'src/lib/billing/status-report.app.ts',
          'src/**/*.android.ts',
          'src/**/*.web.ts',
          'src/lib/db/repos/open-native.ts',
          'src/lib/account-deletion/use-account-deletion.ts',
        ],
        thresholds: { statements: 53, branches: 53, functions: 47, lines: 54 },
      }),
    },
  }),
);
