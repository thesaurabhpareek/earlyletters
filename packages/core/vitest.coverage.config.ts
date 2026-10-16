/**
 * `npm run test:coverage` for @scribe/core: the engine, verifier, age math,
 * prompts, safety tiers, plan engine and language packs. Thresholds are the
 * baseline measured on 16 Oct 2026 (docs/qa/COVERAGE.md); raise, never lower.
 *
 * The verifier and language fuzz tests run 2000 generated cases here instead
 * of 10000 (same seed, so the same first 2000 cases). Instrumented, one 10000
 * run blocks its worker for about 40 s in a single synchronous call, and on a
 * busy machine vitest's worker-to-main report times out ("Timeout calling
 * onTaskUpdate") although every test passed. `npm test` and CI `unit` keep the
 * full 10000; nightly runs 100000. An explicit SCRIBE_FUZZ_RUNS still wins.
 */
import { defineConfig } from 'vitest/config';
import { coverage, INSTRUMENTED } from '../../scripts/coverage/preset';

export default defineConfig({
  test: {
    ...INSTRUMENTED,
    env: { SCRIBE_FUZZ_RUNS: process.env.SCRIBE_FUZZ_RUNS ?? '2000' },
    coverage: coverage({
      include: ['src/**/*.ts'],
      thresholds: { statements: 94.21, branches: 88.87, functions: 96.9, lines: 97.27 },
    }),
  },
});
