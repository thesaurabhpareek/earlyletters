import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { nativeCss } from '../src/build-css';
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
      ];
      for (const [f, b] of pairs) expect(ratio(c[f], c[b]), `${f} on ${b}`).toBeGreaterThanOrEqual(4.5);
    });
  }
});
