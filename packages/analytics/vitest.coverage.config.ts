/**
 * `npm run test:coverage` for @scribe/analytics: consent gate, allowlist,
 * catalogue, provider adapter and the insights engine. scripts/ (the plan
 * generator CLI) is not part of the denominator. Floors: one to two points below the 16 Oct 2026 measurement (docs/qa/COVERAGE.md).
 */
import { defineConfig } from 'vitest/config';
import { coverage, INSTRUMENTED } from '../../scripts/coverage/preset';

export default defineConfig({
  test: {
    ...INSTRUMENTED,
    coverage: coverage({
      include: ['src/**/*.ts'],
      thresholds: { statements: 93, branches: 80, functions: 92, lines: 95 },
    }),
  },
});
