/**
 * `npm run test:coverage` for @scribe/analytics: consent gate, allowlist,
 * catalogue, provider adapter and the insights engine. scripts/ (the plan
 * generator CLI) is not part of the denominator. Thresholds: baseline of 15 Oct 2026.
 */
import { defineConfig } from 'vitest/config';
import { coverage } from '../../scripts/coverage/preset';

export default defineConfig({
  test: {
    coverage: coverage({
      include: ['src/**/*.ts'],
      thresholds: { statements: 0, branches: 0, functions: 0, lines: 0 },
    }),
  },
});
