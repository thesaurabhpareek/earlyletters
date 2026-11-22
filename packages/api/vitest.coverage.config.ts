/**
 * `npm run test:coverage` for @scribe/api: the signed-document contracts
 * (manifest, remote config, content blocks, envelope, standards). The
 * consumer run (vitest.consumers.config.ts) tests other packages' code and
 * is not part of this denominator. Floors: one to two points below the 16 Oct 2026 measurement (docs/qa/COVERAGE.md).
 */
import { defineConfig, mergeConfig } from 'vitest/config';
import { coverage, INSTRUMENTED } from '../../scripts/coverage/preset';
import base from './vitest.config';

export default mergeConfig(
  base,
  defineConfig({
    test: {
      ...INSTRUMENTED,
      coverage: coverage({
        include: ['src/**/*.ts'],
        thresholds: { statements: 93, branches: 90, functions: 93, lines: 94 },
      }),
    },
  }),
);
