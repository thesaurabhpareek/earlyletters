/// <reference types="node" />
/**
 * Unit tests for the pure parts of src/lib (TDD 01 7.1, 7.2): the local
 * database migrator against a real SQLite engine (node:sqlite), the launch
 * sweep planner, the 18+ gate rules and date formatting. Nothing here loads
 * React Native; screens and native modules are covered on device.
 */
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Two projects, one `vitest run`: the Node suite (this file's settings) and the component suite
    // (vitest.component.config.ts, BL-278). A file filter that matches only one of them still exits 0.
    projects: [
      {
        // The app's `@/` alias, for tests of pure modules that import their siblings through it.
        resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
        test: {
          name: 'node',
          // test/ for the store, capture and sync engines; src/**/*.test.ts for tests kept next to their module
          // (packs, remote, language, account deletion). All run in Node: nothing here loads React Native.
          include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
          environment: 'node',
        },
      },
      './vitest.component.config.ts',
    ],
  },
});
