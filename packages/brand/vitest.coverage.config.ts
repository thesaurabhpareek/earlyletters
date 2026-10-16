/**
 * `npm run test:coverage` for @scribe/brand: the public identity and the asset
 * registry. scripts/ build the registry and touchpoints and are not measured.
 * Thresholds: baseline of 15 Oct 2026 (docs/qa/COVERAGE.md).
 */
import { defineConfig } from 'vitest/config';
import { coverage, INSTRUMENTED } from '../../scripts/coverage/preset';

export default defineConfig({
  test: {
    ...INSTRUMENTED,
    coverage: coverage({
      include: ['index.ts', 'registry.ts'],
      thresholds: { statements: 0, branches: 0, functions: 0, lines: 0 },
    }),
  },
});
