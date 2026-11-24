/// <reference types="node" />
/**
 * [BL-1790] The letter page's timed motion comes from tokens (BL-1754, CDESO-3): no typed 150, no Easing, no 96.
 * Reads the screen source because screens load React Native and cannot render under node. This proves the wiring,
 * not how the page looks; the top-bar arithmetic is in letter-top-bar.test.ts and the on-device check is BL-1786.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tokens } from '@scribe/design-tokens';

const page = readFileSync(join(__dirname, '..', 'src', 'app', 'letter', '[id].tsx'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('[BL-1790] letter page motion reads tokens', () => {
  it('the focus swap fades over swapMs', () => {
    expect(page).toContain('FadeIn.duration(tokens.motion.swapMs)');
    expect(page).not.toMatch(/FadeIn\.duration\(\s*\d/);
  });
  it('the rest fades on the veil curve and names no library curve', () => {
    expect(page).toContain("curve('veil')");
    expect(page).not.toMatch(/\bEasing\b/);
  });
  it('Back takes the rest out over cardToPage.restOutMs, at most the exit', () => {
    expect(page).toMatch(/REST_OUT_MS = tokens\.motion\.cardToPage\.restOutMs;/);
    expect(page).not.toMatch(/REST_OUT_MS = \d/);
    expect(tokens.motion.cardToPage.restOutMs).toBe(96);
    expect(tokens.motion.cardToPage.restOutMs).toBeLessThanOrEqual(tokens.motion.exitMs);
  });
});
