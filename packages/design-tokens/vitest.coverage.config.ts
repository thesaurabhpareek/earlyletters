/**
 * `npm run test:coverage` for @scribe/design-tokens: the token tables and the
 * CSS builder (both read by the parity and contrast tests). Floors: one to two
 * points below the 16 Oct 2026 measurement (docs/qa/COVERAGE.md).
 */
import { defineConfig } from 'vitest/config';
import { coverage, INSTRUMENTED } from '../../scripts/coverage/preset';

export default defineConfig({
  test: {
    ...INSTRUMENTED,
    coverage: coverage({
      include: ['src/**/*.ts'],
      thresholds: { statements: 89, branches: 87, functions: 99, lines: 88 },
    }),
  },
});
