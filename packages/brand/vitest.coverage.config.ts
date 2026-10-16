/**
 * `npm run test:coverage` for @scribe/brand: the public identity and the asset
 * registry. scripts/ build the registry and touchpoints and are not measured.
 * Floors: one to two points below the 16 Oct 2026 measurement (docs/qa/COVERAGE.md).
 */
import { defineConfig } from 'vitest/config';
import { coverage, INSTRUMENTED } from '../../scripts/coverage/preset';

export default defineConfig({
  test: {
    ...INSTRUMENTED,
    coverage: coverage({
      include: ['index.ts', 'registry.ts'],
      thresholds: { statements: 89, branches: 66, functions: 80, lines: 89 },
    }),
  },
});
