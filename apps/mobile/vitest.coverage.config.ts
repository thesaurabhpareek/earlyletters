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
 * deletion hook (React). Thresholds: baseline of 16 Oct 2026 (docs/qa/COVERAGE.md).
 */
import { defineConfig, mergeConfig } from 'vitest/config';
import { coverage, INSTRUMENTED } from '../../scripts/coverage/preset';
import base from './vitest.config';

export default mergeConfig(
  base,
  defineConfig({
    test: {
      ...INSTRUMENTED,
      // The plan-reminders "synthetic year" property test (test/billing-plan-reminders.test.ts) takes about 70 s
      // plain and about 170 s instrumented, past its own 120 s timeout, which no config can raise. It is left out
      // of coverage runs only; `npm test` still runs it, and the other tests in that file still count here.
      // Proposed fix for its owner: a sample-size knob like SCRIBE_FUZZ_RUNS (docs/qa/COVERAGE.md, flakes).
      testNamePattern: /^(?!.*a synthetic year: every E, every zone, every plan)/,
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
        thresholds: { statements: 54.45, branches: 55, functions: 48.43, lines: 55.17 },
      }),
    },
  }),
);
