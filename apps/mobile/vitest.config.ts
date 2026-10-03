/// <reference types="node" />
/**
 * Unit tests for the pure parts of src/lib (TDD 01 7.1, 7.2): the local
 * database migrator against a real SQLite engine (node:sqlite), the launch
 * sweep planner, the 18+ gate rules and date formatting. Nothing here loads
 * React Native; screens and native modules are covered on device.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
});
