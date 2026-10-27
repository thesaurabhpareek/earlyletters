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
 * - Floors are whole numbers one to two points below the measured value, so a
 *   pull request that adds a little untested glue still passes and a real drop
 *   does not. Files the constitution depends on (verify.ts, plan.ts) carry their
 *   own tighter per-file floors (glob keys inside `thresholds`). Raise a floor
 *   by hand when a workspace has stayed two points above it for a month.
 * - Tests, type declarations, generated code, golden files, end-to-end
 *   harnesses and command-line scripts are never part of the denominator.
 */
import type { BaseCoverageOptions, CoverageOptions } from 'vitest/node';

export interface Thresholds {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

/** Workspace floors, plus optional per-file floors keyed by a glob relative to the workspace root. */
export type Floors = Thresholds & { [glob: string]: number | Partial<Thresholds> };

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

/**
 * Instrumented runs are slower: a test near vitest's 5 s default (one that loads
 * metro.config.js, the verifier fuzz, the tracked-files privacy guard) times out
 * under v8 coverage on a busy machine. Every coverage config spreads this into
 * `test`; plain `npm test` keeps each test's own timeout.
 */
export const INSTRUMENTED = { testTimeout: 30_000, hookTimeout: 30_000 } as const;

export function coverage(opts: { include: string[]; exclude?: string[]; thresholds: Floors }): CoverageOptions {
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
    thresholds: { ...opts.thresholds } as BaseCoverageOptions['thresholds'],
  };
}
