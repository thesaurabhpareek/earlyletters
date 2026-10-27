/**
 * `npm run differential -w @scribe/core`: the single-edit differential between two engines
 * (test/engine.differential.ts; options in its header). Not part of `npm test`: the default
 * config only collects *.test.ts files.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/engine.differential.ts'],
    disableConsoleIntercept: true,
  },
});
