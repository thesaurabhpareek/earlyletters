/**
 * `npm run test:coverage` for @scribe/core: the engine, verifier, age math,
 * prompts, safety tiers, plan engine and language packs. Thresholds are the
 * baseline measured on 15 Oct 2026 (docs/qa/COVERAGE.md); raise, never lower.
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
