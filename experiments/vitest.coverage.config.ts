/**
 * `npm run test:coverage` for @scribe/experiments: the WER scorer and the
 * edit-pass comparison. run.ts and edit-compare.ts are Mac command-line
 * entry points over real recordings and are not measured.
 * Floors: one to two points below the 16 Oct 2026 measurement (docs/qa/COVERAGE.md).
 */
import { defineConfig } from 'vitest/config';
import { coverage, INSTRUMENTED } from '../scripts/coverage/preset';

export default defineConfig({
  test: {
    ...INSTRUMENTED,
    coverage: coverage({
      include: ['score.ts', 'edits.ts'],
      thresholds: { statements: 97, branches: 90, functions: 97, lines: 97 },
    }),
  },
});
