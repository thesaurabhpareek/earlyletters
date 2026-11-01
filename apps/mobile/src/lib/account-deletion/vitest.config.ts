/// <reference types="node" />
/**
 * Runs the account-deletion unit tests, which live next to the code (the app's
 * own vitest.config.ts includes test/** only). From apps/mobile:
 *   npx vitest run --config src/lib/account-deletion/vitest.config.ts
 * Coordinator: adding 'src/lib/account-deletion/**\/*.test.ts' to the app's
 * include list makes `npm test` run them too.
 */
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    include: ['*.test.ts'],
    environment: 'node',
  },
});
