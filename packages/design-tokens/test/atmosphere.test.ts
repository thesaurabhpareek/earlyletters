import { describe, expect, it } from 'vitest';
import { tokens } from '../src/tokens';

/** WCAG 2.x contrast, with a lamp tone composited over the paper at a given alpha. */
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
type Mode = 'light' | 'dark';
type Tone = keyof typeof a.tone;
const MODES: Mode[] = ['light', 'dark'];
const TONES = Object.keys(a.tone) as Tone[];
/** Every colour that can be text on the paper the lamp lights: reading colours and status colours. */
const TEXT_ON_PAPER = ['text', 'textMuted', 'accent', 'success', 'caution', 'recording', 'destructive', 'focus'] as const;
/**
 * The colours each scheme's peak must keep at 4.5:1. Dark: all of them. Light: the reading colours; the status
 * colours keep 4.5:1 outside the core, where they sit (apps/mobile test/lamp.test.ts, measured text boxes).
 */
const AT_PEAK: Record<Mode, readonly (typeof TEXT_ON_PAPER)[number][]> = { light: a.onLitPaper.reading, dark: TEXT_ON_PAPER };
const palette = (mode: Mode, hc: boolean) => ({ ...tokens[mode], ...(hc ? tokens.highContrast[mode] : {}) });
/** The colour a scheme draws a tone in: on paper, its paper tone where it has one. */
const toneIn = (mode: Mode, t: Tone) => (mode === 'light' ? ((a.paperTone as Partial<Record<Tone, string>>)[t] ?? a.tone[t]) : a.tone[t]);
const worst = (mode: Mode, hc: boolean, lit: number[]) => Math.min(...AT_PEAK[mode].map((k) => ratio(palette(mode, hc)[k], lit)));

/** The highest alpha at which a tone keeps the scheme's peak colours at 4.5:1 (bisection). */
function limit(mode: Mode, hc: boolean, tone: Tone): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (worst(mode, hc, mix(toneIn(mode, tone), palette(mode, hc).bg, mid)) >= 4.5) lo = mid;
    else hi = mid;
  }
  return lo;
}

describe('atmosphere tokens: the lamp palette', () => {
  it('is the website lamp: amber, gold, rose and dusk from Aurora.module.css, as #RRGGBB', () => {
    expect(a.tone).toEqual({ amber: '#F3C98B', gold: '#FFE2A8', rose: '#F08C7C', dusk: '#8076E2' });
  });

  it('dark paper is warm (red over green over blue), never a cold grey or pure black', () => {
    const [r, g, b] = rgb(tokens.dark.bg);
    expect(r).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(b);
    expect(tokens.dark.bg).not.toBe('#000000');
  });

  it('every scheme names a peak for every tone, between 0 and 1', () => {
    for (const mode of MODES) {
      expect(Object.keys(a.peak[mode]).sort()).toEqual([...TONES].sort());
      for (const t of TONES) {
        expect(a.peak[mode][t]).toBeGreaterThan(0);
        expect(a.peak[mode][t]).toBeLessThan(1);
      }
    }
  });

  it('light mode carries its warmth with gold and amber; rose and dusk are a whisper there', () => {
    expect(a.peak.light.rose).toBeLessThan(a.peak.dark.rose);
    expect(a.peak.light.dusk).toBeLessThan(a.peak.dark.dusk);
    expect(a.peak.light.gold).toBeGreaterThan(a.peak.light.rose);
    expect(a.peak.light.amber).toBeGreaterThan(a.peak.light.dusk);
  });

  it("on paper the dusk is a warm mauve (the website's dusk and rose, half and half), so late night stays warm, not grey", () => {
    expect(Object.keys(a.paperTone)).toEqual(['dusk']);
    const [r, g, b] = rgb(a.paperTone.dusk);
    const mid = [rgb(a.tone.dusk), rgb(a.tone.rose)].reduce((x, y) => x.map((v, i) => (v + y[i]) / 2));
    for (const [i, v] of [r, g, b].entries()) expect(Math.abs(v - mid[i])).toBeLessThanOrEqual(1);
    expect(r).toBeGreaterThan(b);
  });

  it('light paper reads lit, not white: gold and amber are strong enough to see (the old whole-pool caps were 0.24 and 0.12)', () => {
    expect(a.peak.light.gold).toBeGreaterThanOrEqual(0.6);
    expect(a.peak.light.amber).toBeGreaterThanOrEqual(0.3);
  });

  it('every text colour is either a reading colour (anywhere on lit paper) or a status colour (outside the core), never both', () => {
    expect([...a.onLitPaper.reading, ...a.onLitPaper.status].sort()).toEqual([...TEXT_ON_PAPER].sort());
    for (const k of a.onLitPaper.reading) expect(a.onLitPaper.status as readonly string[]).not.toContain(k);
  });
});

describe('atmosphere tokens: text keeps 4.5:1 at every tone peak (dark: every colour; light: the reading colours)', () => {
  for (const mode of MODES) {
    for (const hc of [false, true]) {
      for (const tone of TONES) {
        it(`${mode}${hc ? ' + Increase Contrast' : ''}, ${tone} at its peak (${a.peak[mode][tone]})`, () => {
          const lit = mix(toneIn(mode, tone), palette(mode, hc).bg, a.peak[mode][tone]);
          for (const k of AT_PEAK[mode]) {
            expect(ratio(palette(mode, hc)[k], lit), `${k} on ${mode} paper lit ${tone}`).toBeGreaterThanOrEqual(4.5);
          }
        });
      }
    }
  }

  it('each cap sits under its computed limit with a margin, so a rounding never tips a colour under 4.5:1', () => {
    for (const mode of MODES) {
      for (const tone of TONES) {
        const cap = Math.min(limit(mode, false, tone), limit(mode, true, tone));
        expect(a.peak[mode][tone], `${mode} ${tone}: limit ${cap.toFixed(3)}`).toBeLessThanOrEqual(cap - 0.003);
      }
    }
  });
});

describe('atmosphere tokens: scenes and dayparts', () => {
  const scenes = Object.entries(a.scene) as [string, Record<string, unknown>][];

  it('every scene and daypart names real tones and an intensity between 0 and 1', () => {
    const tones = new Set<string>(TONES);
    for (const [name, s] of scenes) {
      expect(['top', 'center', 'bottom'], name).toContain(s.anchor);
      expect(typeof s.breathe, name).toBe('boolean');
      if (s.daypart === true) {
        expect(s.core, name).toBeUndefined();
        continue;
      }
      expect(tones.has(s.core as string), `${name}.core`).toBe(true);
      expect(tones.has(s.tail as string), `${name}.tail`).toBe(true);
      expect(s.intensity as number, name).toBeGreaterThan(0);
      expect(s.intensity as number, name).toBeLessThanOrEqual(1);
    }
    for (const [name, d] of Object.entries(a.daypart)) {
      expect(tones.has(d.core), `${name}.core`).toBe(true);
      expect(tones.has(d.tail), `${name}.tail`).toBe(true);
      expect(d.intensity, name).toBeGreaterThan(0);
      expect(d.intensity, name).toBeLessThanOrEqual(1);
    }
  });

  it('the day warms as it goes: gold in the morning, amber in the evening, a rose tail at night and dusk late at night', () => {
    expect(a.daypart.morning.core).toBe('gold');
    expect(a.daypart.evening.tail).toBe('amber');
    expect(a.daypart.night.tail).toBe('rose');
    expect(a.daypart.lateNight.tail).toBe('dusk');
    // The evening is the brightest room: it is when most letters are written.
    for (const d of Object.values(a.daypart)) expect(d.intensity).toBeLessThanOrEqual(a.daypart.evening.intensity);
  });

  it('the Family tab is the quietest lit room, below the Book', () => {
    expect(a.scene.family).toMatchObject({ anchor: 'top', core: 'gold', tail: 'amber', intensity: 0.4, breathe: false });
    expect(a.scene.family.intensity).toBeLessThan(a.scene.book.intensity);
  });

  it('only the welcome, the open book and Tonight breathe; the form steps, Write, the Book, the Family tab and Read together hold still', () => {
    const breathing = scenes.filter(([, s]) => s.breathe).map(([n]) => n).sort();
    expect(breathing).toEqual(['finish', 'tonight', 'welcome']);
  });

  it('Read together is lit only at night, from below, with the still dusk pool', () => {
    expect(a.scene.readTogether).toMatchObject({ anchor: 'bottom', core: 'dusk', tail: 'dusk', breathe: false, nightOnly: true });
  });

  it('there is no scene for a screen that records, plays a voice, sells or reports a problem', () => {
    for (const name of ['listen', 'review', 'letter', 'saved', 'plus', 'paywall', 'settings', 'error', 'sheet', 'struggling']) {
      expect(a.scene, name).not.toHaveProperty(name);
    }
  });
});

describe('atmosphere motion: calm by rule', () => {
  it('arrives within the 2 s ceiling and breathes slowly: at least 8 s a cycle, a small swing, no flicker', () => {
    expect(m.lamp.arriveMs).toBeLessThanOrEqual(m.hardCeilingMs);
    expect(m.lamp.breathMs).toBeGreaterThanOrEqual(8000);
    expect(m.lamp).not.toHaveProperty('breathScale'); // opacity only: a scaled full-screen layer drops frames
    // WCAG 2.3.1 / 2.2.2 spirit: a swing this slow and this shallow is not a flash.
    expect(1 - m.lamp.breathOpacityMin).toBeLessThanOrEqual(0.15);
    // One full cycle is far slower than 3 flashes per second, and under HIG Motion's 0.2 Hz caution.
    expect(1000 / m.lamp.breathMs).toBeLessThan(0.2);
  });

  it('"Not much today" lowers the evening light to 70 percent, never out', () => {
    expect(m.lamp.dimTo).toBe(0.7);
    expect(m.lamp.dimTo).toBeGreaterThan(0);
    expect(m.lamp.dimTo).toBeLessThan(1);
  });
});
