// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { headingAnchors } from './src/lib/heading-anchors.mjs';

// Static site only. No adapter, no server output, no integrations that load
// third-party code in the browser. Vercel serves dist/ as files.
export default defineConfig({
  site: 'https://earlyletters.com',
  output: 'static',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  // No prefetch, no dev toolbar in output, no telemetry-dependent features.
  devToolbar: { enabled: false },
  markdown: {
    processor: satteri({
      // Content rules: straight quotes only, so turn off smart punctuation.
      features: { smartPunctuation: false },
      hastPlugins: [headingAnchors()],
    }),
  },
});
