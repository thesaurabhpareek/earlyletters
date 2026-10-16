/**
 * `npm run test:coverage` for @scribe/design-tokens: the token tables and the
 * CSS builder (both read by the parity and contrast tests). Thresholds:
 * baseline of 16 Oct 2026 (docs/qa/COVERAGE.md).
 */
import { defineConfig } from 'vitest/config';
import { coverage, INSTRUMENTED } from '../../scripts/coverage/preset';

export default defineConfig({
  test: {
    ...INSTRUMENTED,
    coverage: coverage({
      include: ['src/**/*.ts'],
      thresholds: { statements: 90.74, branches: 88.88, functions: 100, lines: 89.79 },
    }),
  },
});
