/**
 * `npm run test:coverage` for @scribe/experiments: the WER scorer and the
 * edit-pass comparison. run.ts and edit-compare.ts are Mac command-line
 * entry points over real recordings and are not measured.
 * Thresholds: baseline of 15 Oct 2026 (docs/qa/COVERAGE.md).
 */
import { defineConfig } from 'vitest/config';
import { coverage, INSTRUMENTED } from '../scripts/coverage/preset';

export default defineConfig({
  test: {
    ...INSTRUMENTED,
    coverage: coverage({
      include: ['score.ts', 'edits.ts'],
      thresholds: { statements: 0, branches: 0, functions: 0, lines: 0 },
    }),
  },
});
