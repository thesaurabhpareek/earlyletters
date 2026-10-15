/**
 * `npm run test:coverage` for @scribe/api: the signed-document contracts
 * (manifest, remote config, content blocks, envelope, standards). The
 * consumer run (vitest.consumers.config.ts) tests other packages' code and
 * is not part of this denominator. Thresholds: baseline of 15 Oct 2026.
 */
import { defineConfig, mergeConfig } from 'vitest/config';
import { coverage } from '../../scripts/coverage/preset';
import base from './vitest.config';

export default mergeConfig(
  base,
  defineConfig({
    test: {
      coverage: coverage({
        include: ['src/**/*.ts'],
        thresholds: { statements: 0, branches: 0, functions: 0, lines: 0 },
      }),
    },
  }),
);
