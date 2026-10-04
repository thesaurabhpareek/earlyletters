import { describe, expect, it } from 'vitest';
import { tokens } from '../src/tokens';

/** WCAG 2.x contrast, with the lamp composited over the paper at a given alpha. */
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (fg: string, bg: string, a: number) => rgb(fg).map((v, i) => v * a + rgb(bg)[i] * (1 - a));
const lum = (c: number[]) => {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (fg: string, lit: number[]) => {
  const [hi, lo] = [lum(rgb(fg)), lum(lit)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const a = tokens.atmosphere;
const m = tokens.motion;
const TEXT_ON_PAPER = ['text', 'textMuted', 'accent', 'success', 'caution', 'recording', 'destructive', 'focus'] as const;

describe('atmosphere tokens: lamp light', () => {
  it('is the website lamp amber, and a whisper in light mode (12% or less)', () => {
    expect(a.lamp).toBe('#F3C98B');
    expect(a.peak.light).toBeLessThanOrEqual(0.12);
    expect(a.peak.light).toBeLessThan(a.peak.dark);
  });

  for (const mode of ['light', 'dark'] as const) {
    for (const hc of [false, true]) {
      it(`${mode}${hc ? ' + Increase Contrast' : ''}: every text colour keeps 4.5:1 on paper at the lamp's brightest point`, () => {
        const c = { ...tokens[mode], ...(hc ? tokens.highContrast[mode] : {}) };
        const lit = mix(a.lamp, c.bg, a.peak[mode]);
        for (const k of TEXT_ON_PAPER) expect(ratio(c[k], lit), `${k} on lit ${mode} paper`).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it('dark paper is warm (red over green over blue), never a cold grey or pure black', () => {
    const [r, g, b] = rgb(tokens.dark.bg);
    expect(r).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(b);
    expect(tokens.dark.bg).not.toBe('#000000');
  });

  it('arrives within the 2 s ceiling and breathes slowly: at least 8 s a cycle, a small swing, no flicker', () => {
    expect(m.lamp.arriveMs).toBeLessThanOrEqual(m.hardCeilingMs);
    expect(m.lamp.breathMs).toBeGreaterThanOrEqual(8000);
    expect(m.lamp).not.toHaveProperty('breathScale'); // opacity only: a scaled full-screen layer drops frames
    // WCAG 2.3.1 / 2.2.2 spirit: a swing this slow and this shallow is not a flash.
    expect(1 - m.lamp.breathOpacityMin).toBeLessThanOrEqual(0.15);
    // One full cycle is far slower than 3 flashes per second.
    expect(1000 / (m.lamp.breathMs / 2)).toBeLessThan(0.3);
  });
});
