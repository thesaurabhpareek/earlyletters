/**
 * `npm run test:coverage` for @scribe/content. The copy files are data: a
 * string that no rule test reads is a string no rule checks, so every file
 * under src/ counts. Thresholds: baseline of 15 Oct 2026 (docs/qa/COVERAGE.md).
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
