/**
 * `npm run test:coverage` for @scribe/analytics: consent gate, allowlist,
 * catalogue, provider adapter and the insights engine. scripts/ (the plan
 * generator CLI) is not part of the denominator. Thresholds: baseline of 16 Oct 2026.
 */
import { defineConfig } from 'vitest/config';
import { coverage, INSTRUMENTED } from '../../scripts/coverage/preset';

export default defineConfig({
  test: {
    ...INSTRUMENTED,
    coverage: coverage({
      include: ['src/**/*.ts'],
      thresholds: { statements: 94.1, branches: 81.75, functions: 93.54, lines: 96.23 },
    }),
  },
});
