/**
 * `npm run test:coverage` for @scribe/emails: templates, components and the
 * render helpers. `send.ts` talks to Resend and is covered by the ops scripts,
 * not here. Thresholds: baseline of 16 Oct 2026 (docs/qa/COVERAGE.md).
 */
import { defineConfig } from 'vitest/config';
import { coverage, INSTRUMENTED } from '../../scripts/coverage/preset';

export default defineConfig({
  test: {
    ...INSTRUMENTED,
    coverage: coverage({
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      thresholds: { statements: 95.91, branches: 81.43, functions: 97.47, lines: 98.08 },
    }),
  },
});
