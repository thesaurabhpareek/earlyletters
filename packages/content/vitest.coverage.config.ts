/**
 * `npm run test:coverage` for @scribe/content. The copy files are data: a
 * string that no rule test reads is a string no rule checks, so every file
 * under src/ counts. Floors: one to two points below the 16 Oct 2026 measurement (docs/qa/COVERAGE.md).
 */
import { defineConfig } from 'vitest/config';
import { coverage, INSTRUMENTED } from '../../scripts/coverage/preset';

export default defineConfig({
  test: {
    ...INSTRUMENTED,
    coverage: coverage({
      include: ['src/**/*.ts'],
      thresholds: { statements: 98, branches: 98, functions: 98, lines: 98 },
    }),
  },
});
