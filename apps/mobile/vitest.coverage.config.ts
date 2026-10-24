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
      // One test, the plan-reminders "synthetic year" property test (test/billing-plan-reminders.test.ts, matched
      // by its own title so the other tests in its describe block still run), takes about 70 s plain and about
      // 170 s instrumented, past its own 120 s timeout, which no config can raise. It is left out of coverage runs
      // only; `npm test` still runs it.
      // Proposed fix for its owner: a sample-size knob like SCRIBE_FUZZ_RUNS (docs/qa/COVERAGE.md, flakes).
      testNamePattern: /^(?!.*holds every invariant and always finds the legally required slot when planned early$)/,
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
