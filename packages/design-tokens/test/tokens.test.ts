import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { nativeCss, webCss } from '../src/build-css';
import { tokens } from '../src/tokens';

/** WCAG 2.x relative luminance of #RRGGBB, optionally alpha-composited over a background. */
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const over = (fg: string, bg: string): string => {
  if (fg.length !== 9) return fg;
  const a = parseInt(fg.slice(7, 9), 16) / 255;
  const [f, b] = [rgb(fg), rgb(bg)];
  return '#' + f.map((x, i) => Math.round((x * a + b[i] * (1 - a)) * 255).toString(16).padStart(2, '0')).join('');
};
const L = (h: string) => {
  const c = rgb(h).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => {
  const [x, y] = [L(over(a, b)), L(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

type Mode = 'light' | 'dark';
type C = (typeof tokens)['light'];
const MODES: Mode[] = ['light', 'dark'];
const palette = (mode: Mode, hc = false): Record<keyof C, string> => ({ ...tokens[mode], ...(hc ? tokens.highContrast[mode] : {}) });

/** Text pairs: 4.5:1 (WCAG 1.4.3). */
const TEXT_PAIRS: [keyof C, keyof C][] = [
  ['text', 'bg'], ['text', 'surface'], ['text', 'surfaceRaised'], ['text', 'accentSoft'],
  ['textMuted', 'bg'], ['textMuted', 'surface'], ['textMuted', 'surfaceRaised'], ['textMuted', 'accentSoft'],
  ['accent', 'bg'], ['accent', 'surface'], ['accent', 'surfaceRaised'], ['accent', 'accentSoft'],
  ['onAccent', 'accent'], ['onDestructive', 'destructive'], ['bg', 'text'],
  ['destructive', 'bg'], ['destructive', 'surfaceRaised'],
  ['recording', 'bg'], ['success', 'bg'], ['caution', 'bg'], ['focus', 'bg'],
];
/** Non-text pairs: 3:1 (WCAG 1.4.11): control boundaries, focus, edit marks, filled controls. */
const SURFACES: (keyof C)[] = ['bg', 'surface', 'surfaceRaised'];
const NON_TEXT_PAIRS: [keyof C, keyof C][] = [
  ...SURFACES.map((s) => ['controlBorder', s] as [keyof C, keyof C]),
  ['controlBorder', 'accentSoft'],
  ...SURFACES.map((s) => ['focus', s] as [keyof C, keyof C]),
  ...SURFACES.map((s) => ['editMark', s] as [keyof C, keyof C]),
  ['accent', 'bg'], ['recording', 'bg'], ['destructive', 'bg'],
];

describe('design tokens: generated CSS', () => {
  it('tokens.native.css is in sync with tokens.ts (run npm run build -w @scribe/design-tokens)', () => {
    expect(readFileSync(join(__dirname, '..', 'dist', 'tokens.native.css'), 'utf8')).toBe(nativeCss());
  });
  it('tokens.web.css is in sync with tokens.ts', () => {
    expect(readFileSync(join(__dirname, '..', 'dist', 'tokens.web.css'), 'utf8')).toBe(webCss());
  });
  it('control boundaries never map to the decorative line colour', () => {
    expect(nativeCss()).toContain(`--color-input: ${tokens.light.controlBorder};`);
    expect(nativeCss()).toContain(`--color-destructive: ${tokens.light.destructive};`);
  });
});

describe('design tokens: colour', () => {
  it('light and dark define the same color names', () => {
    expect(Object.keys(tokens.dark).sort()).toEqual(Object.keys(tokens.light).sort());
  });
  it('high-contrast overrides only touch existing names, the same ones in both modes', () => {
    expect(Object.keys(tokens.highContrast.dark).sort()).toEqual(Object.keys(tokens.highContrast.light).sort());
    for (const k of Object.keys(tokens.highContrast.light)) expect(tokens.light).toHaveProperty(k);
  });
  it('destructive is its own role (may equal recording today, but is never the same token)', () => {
    expect(tokens.light).toHaveProperty('destructive');
    expect(tokens.light).toHaveProperty('onDestructive');
  });

  for (const mode of MODES) {
    for (const hc of [false, true]) {
      const tag = `${mode}${hc ? ' + Increase Contrast' : ''}`;
      it(`${tag}: every text pair passes WCAG AA (4.5:1)`, () => {
        const c = palette(mode, hc);
        for (const [f, b] of TEXT_PAIRS) expect(ratio(c[f], c[b]), `${f} on ${b}`).toBeGreaterThanOrEqual(4.5);
      });
      it(`${tag}: every non-text pair passes WCAG 1.4.11 (3:1)`, () => {
        const c = palette(mode, hc);
        for (const [f, b] of NON_TEXT_PAIRS) expect(ratio(c[f], c[b]), `${f} on ${b}`).toBeGreaterThanOrEqual(3);
      });
    }
    it(`${mode} + Increase Contrast: muted text and accent reach 7:1, control edges 4.5:1`, () => {
      const c = palette(mode, true);
      for (const s of SURFACES) {
        expect(ratio(c.textMuted, c[s]), `textMuted on ${s}`).toBeGreaterThanOrEqual(7);
        expect(ratio(c.accent, c[s]), `accent on ${s}`).toBeGreaterThanOrEqual(7);
        expect(ratio(c.controlBorder, c[s]), `controlBorder on ${s}`).toBeGreaterThanOrEqual(4.5);
        expect(ratio(c.line, c[s]), `line on ${s}`).toBeGreaterThanOrEqual(3);
      }
    });
    it(`${mode}: the old alpha borders that failed 1.4.11 stay failing, so nobody brings them back`, () => {
      const c = tokens[mode];
      // textMuted at 60% (TDD 09 2.7) and line as a control edge: below 3:1 in light.
      if (mode === 'light') {
        expect(ratio(c.textMuted + '99', c.bg)).toBeLessThan(3);
        expect(ratio(c.line, c.surfaceRaised)).toBeLessThan(3);
      }
    });
  }
});

describe('design tokens: type', () => {
  it(`no style is smaller than ${tokens.minFontSize} pt at the default size, and line height is at least the size`, () => {
    for (const [name, t] of Object.entries(tokens.type)) {
      expect(t.fontSize, name).toBeGreaterThanOrEqual(tokens.minFontSize);
      expect(t.lineHeight, name).toBeGreaterThanOrEqual(t.fontSize);
    }
  });
  it('reading and body text is never capped at accessibility sizes (DESIGN_LANGUAGE 3, TDD 09 C1)', () => {
    for (const name of ['body', 'callout', 'label', 'labelSmall', 'letterBody', 'signature', 'prompt'] as const) {
      expect(tokens.type[name].maxScale, name).toBeNull();
    }
  });
  it('capped display styles still reach at least 1.6x', () => {
    for (const t of Object.values(tokens.type)) if (t.maxScale !== null) expect(t.maxScale).toBeGreaterThanOrEqual(1.6);
  });
  it('every bundled face exists in fonts/ with its OFL licence', () => {
    const dir = join(__dirname, '..', 'fonts');
    const faces = Object.entries(tokens.fontFamily).filter(([k]) => !k.startsWith('web')).map(([, v]) => v);
    for (const f of faces) expect(existsSync(join(dir, `${f}.ttf`)), f).toBe(true);
    for (const l of ['OFL-Literata.txt', 'OFL-Mukta.txt', 'OFL-TiroDevanagariHindi.txt']) expect(existsSync(join(dir, l)), l).toBe(true);
  });
});

describe('design tokens: motion and targets', () => {
  const m = tokens.motion;
  it('no timed motion exceeds the 2 s ceiling, and the content sequence fits under 900 ms', () => {
    for (const ms of [m.fadeMs, m.exitMs, m.enter.durationMs, m.sequenceMaxMs, m.newMarkMs, m.drawMs]) expect(ms).toBeLessThanOrEqual(m.hardCeilingMs);
    expect(m.enter.durationMs + m.staggerMs * (m.staggerMax - 1)).toBeLessThanOrEqual(m.sequenceMaxMs);
    expect(m.reduceMotion.durationMs).toBe(m.fadeMs);
  });
  it('springs are critically or near-critically damped (no bouncy UI)', () => {
    for (const k of ['snappy', 'standard', 'gentle'] as const) {
      const s = m[k];
      const zeta = s.damping / (2 * Math.sqrt(s.stiffness * s.mass));
      expect(zeta, k).toBeGreaterThanOrEqual(0.9);
    }
  });
  it('targets meet HIG 44 pt and the primary 56 pt rule', () => {
    expect(tokens.target.min).toBeGreaterThanOrEqual(44);
    expect(tokens.target.primary).toBeGreaterThanOrEqual(56);
    expect(tokens.target.capture).toBeGreaterThanOrEqual(tokens.target.primary);
  });
});
