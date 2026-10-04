import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { nativeCss, webColorVars, webCss } from '../src/build-css';
import { tokens } from '../src/tokens';

const L = (h: string) => {
  const c = [1, 3, 5]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => {
  const [x, y] = [L(a), L(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

describe('design tokens', () => {
  it('generated CSS is in sync with tokens.ts (run npm run build -w @scribe/design-tokens)', () => {
    expect(readFileSync(join(__dirname, '..', 'dist', 'tokens.native.css'), 'utf8')).toBe(nativeCss());
  });

  it('light and dark define the same color names', () => {
    expect(Object.keys(tokens.dark).sort()).toEqual(Object.keys(tokens.light).sort());
  });

  for (const mode of ['light', 'dark'] as const) {
    it(`${mode}: every text pair passes WCAG AA (4.5:1)`, () => {
      const c = tokens[mode];
      const pairs: [keyof typeof c, keyof typeof c][] = [
        ['text', 'bg'], ['text', 'surface'], ['text', 'surfaceRaised'],
        ['textMuted', 'bg'], ['textMuted', 'surfaceRaised'],
        ['accent', 'bg'], ['onAccent', 'accent'],
        ['recording', 'bg'], ['success', 'bg'], ['caution', 'bg'], ['focus', 'bg'],
        // status text on the inset surfaces it actually sits on
        ['success', 'surface'], ['caution', 'surface'], ['recording', 'surface'], ['recording', 'accentSoft'],
        ['accent', 'surface'], ['accent', 'accentSoft'], ['textMuted', 'surface'], ['text', 'accentSoft'],
      ];
      for (const [f, b] of pairs) expect(ratio(c[f], c[b]), `${f} on ${b}`).toBeGreaterThanOrEqual(4.5);
    });
  }

  it('atmosphere (lamp) palette matches the website', () => {
    expect(tokens.atmosphere).toEqual({
      lamp: '#F3C98B', lampGold: '#FFE2A8', lampRose: '#F08C7C', lampDusk: '#8076E2', duskSurface: '#3B302A',
    });
  });

  it('motion tokens: soft spring and enter values', () => {
    expect(tokens.motion.soft).toEqual({ stiffness: 260, damping: 40, mass: 0.3 });
    expect(tokens.motion.enter).toEqual({ dy: 8, durationMs: 280, staggerMs: 30, staggerMax: 6 });
    expect(tokens.motion.reduceMotion.durationMs).toBe(200);
    expect([...tokens.motion.easing]).toEqual([0.2, 0, 0, 1]);
  });
});

describe('web css', () => {
  it('dist/tokens.web.css is in sync with tokens.ts', () => {
    expect(readFileSync(join(__dirname, '..', 'dist', 'tokens.web.css'), 'utf8')).toBe(webCss());
  });

  it('colour values equal apps/web globals.css', () => {
    const web = readFileSync(join(__dirname, '..', '..', '..', 'apps', 'web', 'src', 'app', 'globals.css'), 'utf8');
    const rootBlock = web.slice(web.indexOf(':root {'), web.indexOf('}', web.indexOf(':root {')));
    const siteVars: Record<string, string> = {};
    for (const m of rootBlock.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) siteVars[m[1]] = m[2].toLowerCase();
    // Tokens that were darkened for WCAG after the site copied them. The site owner
    // must adopt the token value; remove the entry once apps/web is updated.
    const STALE_ON_SITE: Record<string, string> = { recording: '#b5473a' };
    const ours = webColorVars();
    let compared = 0;
    for (const [name, value] of Object.entries(siteVars)) {
      expect(ours[name], `--${name} missing from tokens.web.css`).toBeDefined();
      if (STALE_ON_SITE[name] === value) continue;
      expect(value, `--${name}`).toBe(ours[name]);
      compared++;
    }
    expect(compared).toBeGreaterThan(15);
  });
});
