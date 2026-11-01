/// <reference types="node" />
/**
 * Contract-consumer tests (ADR 0017 "contract tests"): the pure parts of the
 * app's pack and remote-content clients, the Edge Functions that serve the
 * signed documents, and the publishing and size scripts, all checked against
 * this package in one run so client and server cannot drift. They live next
 * to the code they test; nothing here loads React Native.
 */
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const repo = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
  root: repo,
  test: {
    include: [
      'apps/mobile/src/lib/packs/**/*.test.ts',
      'apps/mobile/src/lib/remote/**/*.test.ts',
      'apps/mobile/src/components/content-blocks/**/*.test.ts',
      'supabase/functions/config/**/*.test.ts',
      'supabase/functions/content/**/*.test.ts',
      'scripts/packs/**/*.test.ts',
      'scripts/size/**/*.test.ts',
    ],
    environment: 'node',
    passWithNoTests: true,
  },
});
