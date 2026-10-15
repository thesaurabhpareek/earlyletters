/**
 * One coverage preset for every workspace (docs/qa/COVERAGE.md).
 *
 * Each workspace keeps a `vitest.coverage.config.ts` that calls `coverage()`
 * with its own include list and its own thresholds. `npm run test:coverage`
 * at the root runs them all (scripts/coverage/run.mjs) and merges the
 * `coverage-summary.json` files into one table (scripts/coverage/report.mjs).
 *
 * Rules:
 * - Provider is v8 (no instrumentation step, same numbers in CI and locally).
 * - `all: true`: a source file no test imports is reported at 0%, never hidden.
 * - Thresholds are the baseline measured when they were set (never lower than
 *   that day): a pull request that drops any of the four numbers fails
 *   `test:coverage`. Raise them when coverage rises; never lower them to pass.
 * - Tests, type declarations, generated code, golden files, end-to-end
 *   harnesses and command-line scripts are never part of the denominator.
 */
import type { CoverageOptions } from 'vitest/node';

export interface Thresholds {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

/** Excluded from every workspace's denominator. Paths are relative to the workspace root. */
export const ALWAYS_EXCLUDED = [
  '**/node_modules/**',
  '**/dist/**',
  '**/coverage/**',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.test.mjs',
  '**/__tests__/**',
  '**/test/**',
  '**/e2e/**',
  '**/e2e-web/**',
  '**/*.d.ts',
  '**/vitest.config.ts',
  '**/vitest.*.config.ts',
  '**/golden/**',
  '**/*.golden.*',
];

export function coverage(opts: { include: string[]; exclude?: string[]; thresholds: Thresholds }): CoverageOptions {
  return {
    provider: 'v8',
    enabled: true,
    all: true,
    clean: true,
    reportsDirectory: './coverage',
    include: opts.include,
    exclude: [...ALWAYS_EXCLUDED, ...(opts.exclude ?? [])],
    experimentalAstAwareRemapping: true,
    reporter: ['text-summary', 'json-summary', 'lcov'],
    thresholds: { ...opts.thresholds },
  };
}
