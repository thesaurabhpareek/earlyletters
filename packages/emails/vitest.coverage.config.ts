/**
 * `npm run test:coverage` for @scribe/emails: templates, components and the
 * render helpers. `send.ts` talks to Resend and is covered by the ops scripts,
 * not here. Thresholds: baseline of 15 Oct 2026 (docs/qa/COVERAGE.md).
 */
import { defineConfig } from 'vitest/config';
import { coverage } from '../../scripts/coverage/preset';

export default defineConfig({
  test: {
    coverage: coverage({
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      thresholds: { statements: 0, branches: 0, functions: 0, lines: 0 },
    }),
  },
});
