/** Runs only the tests of open bugs (e2e/known-bugs). They are expected to fail until the bug is fixed. */
import { defineConfig } from '@playwright/test';
import base from '../playwright.config';

export default defineConfig({
  ...base,
  testDir: '.',
  testMatch: '**/*.e2e.ts',
  testIgnore: [],
  outputDir: '../.results/known-bugs-artifacts',
  reporter: [['list']],
});
