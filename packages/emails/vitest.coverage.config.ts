/**
 * `npm run test:coverage` for @scribe/emails: templates, components and the
 * render helpers. `send.ts` talks to Resend and is covered by the ops scripts,
 * not here. Floors: one to two points below the 16 Oct 2026 measurement (docs/qa/COVERAGE.md).
 */
import { defineConfig } from 'vitest/config';
import { coverage, INSTRUMENTED } from '../../scripts/coverage/preset';

export default defineConfig({
  test: {
    ...INSTRUMENTED,
    coverage: coverage({
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      thresholds: { statements: 94, branches: 80, functions: 96, lines: 97 },
    }),
  },
});
