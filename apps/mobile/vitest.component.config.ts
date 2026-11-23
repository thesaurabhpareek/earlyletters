/// <reference types="node" />
/**
 * Component tests (BL-278): one real component rendered to markup in Node, no device, no Jest.
 * react-native is aliased to react-native-web (already an app dependency), and the native seams a component reaches
 * (reanimated, uniwind, expo fonts, the a11y hooks) are stood in by test/component/setup.tsx. Files: test/component/*.test.tsx.
 * Kept apart from the node project so no existing test sees the alias; vitest.config.ts lists both as projects, so one `vitest run` covers both.
 */
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  define: { __DEV__: 'false' },
  resolve: {
    alias: [
      { find: /^react-native$/, replacement: 'react-native-web' },
      { find: /^@\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) },
    ],
  },
  test: {
    name: 'component',
    include: ['test/component/**/*.test.tsx'],
    environment: 'node',
    setupFiles: ['test/component/setup.tsx'],
    server: { deps: { inline: [/react-native-web/] } },
  },
});
