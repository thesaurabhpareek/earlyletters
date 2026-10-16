/**
 * `npm run test:coverage` for @scribe/api: the signed-document contracts
 * (manifest, remote config, content blocks, envelope, standards). The
 * consumer run (vitest.consumers.config.ts) tests other packages' code and
 * is not part of this denominator. Thresholds: baseline of 16 Oct 2026.
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
        thresholds: { statements: 94.69, branches: 91.7, functions: 94.73, lines: 95.74 },
      }),
    },
  }),
);
