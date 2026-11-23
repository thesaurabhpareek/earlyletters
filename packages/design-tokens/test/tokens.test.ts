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
  ['text', 'glassFallback'], ['textMuted', 'glassFallback'], ['accent', 'glassFallback'], ['text', 'bg'], ['text', 'surface'], ['text', 'surfaceRaised'], ['text', 'accentSoft'],
  ['textMuted', 'bg'], ['textMuted', 'surface'], ['textMuted', 'surfaceRaised'], ['textMuted', 'accentSoft'],
  ['accent', 'bg'], ['accent', 'surface'], ['accent', 'surfaceRaised'], ['accent', 'accentSoft'],
  ['onAccent', 'accent'], ['onDestructive', 'destructive'], ['bg', 'text'],
  ['destructive', 'bg'], ['destructive', 'surfaceRaised'],
  ['recording', 'bg'], ['success', 'bg'], ['caution', 'bg'], ['focus', 'bg'],
  // Status words on every surface they can sit on (A11Y audit 20 Nov): a notice on surface, a selected row on accentSoft.
  ...(['success', 'caution', 'recording', 'destructive', 'focus'] as (keyof C)[]).flatMap((f) =>
    (['bg', 'surface', 'surfaceRaised', 'accentSoft', 'glassFallback'] as (keyof C)[]).map((b) => [f, b] as [keyof C, keyof C]),
  ),
];
/** Non-text pairs: 3:1 (WCAG 1.4.11): control boundaries, focus, edit marks, filled controls. */
const SURFACES: (keyof C)[] = ['bg', 'surface', 'surfaceRaised', 'glassFallback'];
const NON_TEXT_PAIRS: [keyof C, keyof C][] = [
  ...SURFACES.map((s) => ['controlBorder', s] as [keyof C, keyof C]),
  ['controlBorder', 'accentSoft'],
  ...SURFACES.map((s) => ['focus', s] as [keyof C, keyof C]),
  ...SURFACES.map((s) => ['editMark', s] as [keyof C, keyof C]),
  ['accent', 'bg'], ['recording', 'bg'], ['destructive', 'bg'],
];
/** The picture frame (ruling 27, NS-01-R41) on the three page surfaces. In light it keeps `line` (see the mediaFrame tests). */
const FRAME_PAIRS: [keyof C, keyof C][] = (['bg', 'surface', 'surfaceRaised'] as (keyof C)[]).map((s) => ['mediaFrame', s]);

/**
 * Glyph pairs: every icon colour the app draws (tab bar, header, rows, the lock, the recording disc's
 * mic) on every surface it sits on. Icons carry meaning, so they need 3:1 (WCAG 1.4.11), and the glyphs
 * that stand in for a word (Settings gear, back arrow, lock) are drawn with the text-grade roles.
 */
const GLYPH_ROLES: (keyof C)[] = ['text', 'textMuted', 'accent', 'editMark', 'destructive', 'recording', 'success', 'caution', 'focus'];
const GLYPH_PAIRS: [keyof C, keyof C][] = [
  ...GLYPH_ROLES.flatMap((g) => SURFACES.map((s) => [g, s] as [keyof C, keyof C])),
  ['text', 'accentSoft'], ['textMuted', 'accentSoft'], ['accent', 'accentSoft'], ['editMark', 'accentSoft'],
  // Glyphs on filled controls and on the recording disc.
  ['onAccent', 'accent'], ['onAccent', 'recording'], ['onDestructive', 'destructive'],
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
      it(`${tag}: every glyph pair passes 3:1, and the glyphs that replace words pass 4.5:1`, () => {
        const c = palette(mode, hc);
        for (const [f, b] of GLYPH_PAIRS) expect(ratio(c[f], c[b]), `${f} on ${b}`).toBeGreaterThanOrEqual(3);
        // Settings gear, back arrow, lock and tab icons are drawn with these roles on the page surfaces.
        for (const g of ['text', 'textMuted', 'accent'] as const) {
          for (const s of SURFACES) expect(ratio(c[g], c[s]), `${g} on ${s}`).toBeGreaterThanOrEqual(4.5);
        }
      });
    }
    for (const hc of [false, true]) {
      if (mode === 'light' && !hc) continue;
      it(`${mode}${hc ? ' + Increase Contrast' : ''}: the picture frame mediaFrame passes 3:1 on bg, surface and surfaceRaised (ruling 27)`, () => {
        const c = palette(mode, hc);
        for (const [f, b] of FRAME_PAIRS) expect(ratio(c[f], c[b]), `${f} on ${b}`).toBeGreaterThanOrEqual(3);
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
    it(`${mode}: the other scheme's glyph colours fail on this scheme's pages, which is why nothing may read tokens.light or tokens.dark directly`, () => {
      // QA journey J18: ink on the dark page was 1.24:1 (Settings gear) and 1.13:1 (lock), the light
      // accent 3.16:1 (back arrow), the light recording red 3.29:1 (disc). Same mistake in reverse for light.
      const here = tokens[mode];
      const other = tokens[mode === 'light' ? 'dark' : 'light'];
      expect(ratio(other.text, here.bg)).toBeLessThan(3);
      expect(ratio(other.accent, here.bg)).toBeLessThan(4.5);
      expect(ratio(other.recording, here.bg)).toBeLessThan(4.5);
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

describe('design tokens: picture frame and sizes (ruling 27, NS-01-R40 to R42, BL-956)', () => {
  it('mediaFrame is dark #716A62; light keeps line (1.26:1 by the ruling: the frame there is the page edge, not a boundary)', () => {
    expect(tokens.dark.mediaFrame).toBe('#716A62');
    expect(tokens.light.mediaFrame).toBe(tokens.light.line);
  });
  it('under Increase Contrast the frame follows the hairline colour in both modes (D-S02 note)', () => {
    for (const m of MODES) expect(tokens.highContrast[m].mediaFrame).toBe(tokens.highContrast[m].line);
  });
  it('mediaFrame reaches native and web CSS as --color-media-frame, in every block', () => {
    expect(nativeCss()).toContain(`--color-media-frame: ${tokens.dark.mediaFrame};`);
    expect(webCss()).toContain(`--color-media-frame: ${tokens.light.mediaFrame};`);
    expect(webCss()).toContain(`--color-media-frame: ${tokens.highContrast.dark.mediaFrame};`);
  });
  it('the frame is one control-weight stroke, never the 0.5 pt decorative hairline (R41)', () => {
    expect(tokens.stroke.control).toBe(1);
  });
  const p = tokens.picture;
  it('the sizes design set are pinned: Ready thumbnail 160 pt, 88 pt from AX3 (A-S06), lens thumbnail 72 pt (B-S04)', () => {
    expect([p.thumbMaxPt, p.thumbAxMaxPt, p.lensThumbPt]).toEqual([160, 88, 72]);
  });
  it('a picture is smaller at large text than at the default size, and no larger than the lens-free Ready thumbnail', () => {
    expect(p.thumbAxMaxPt).toBeLessThan(p.thumbMaxPt);
    expect(p.letterAxMaxPt).toBeLessThanOrEqual(p.thumbMaxPt);
    expect(p.lensThumbPt).toBeLessThan(p.thumbMaxPt);
  });
  it('PROPOSED letter-page numbers use the existing 88 pt step, and the ratios are real fractions', () => {
    expect(p.letterAxMaxPt).toBe(p.thumbAxMaxPt);
    expect(p.letterColumnRatio).toBeGreaterThan(0);
    expect(p.letterColumnRatio).toBeLessThan(1);
    expect(p.letterWindowRatio).toBeGreaterThan(0);
    expect(p.letterWindowRatio).toBeLessThan(p.letterColumnRatio);
  });
  it('Dynamic Type pair: at AX5 on an SE 3 (375 x 667) the letter picture leaves room for the dateline and a first line of words', () => {
    const se3Height = 667;
    const dateline = tokens.type.letterDateline.lineHeight * tokens.type.letterDateline.maxScale!;
    expect(p.letterAxMaxPt + dateline + tokens.space[4]).toBeLessThan(se3Height * 0.4);
  });
  it('Dynamic Type pair: on Ready at AX3 and up the thumbnail plus Speak and Type (two 64 pt twins) leave the SE 3 screen to the prompt', () => {
    expect(p.thumbAxMaxPt + 2 * tokens.target.capture).toBeLessThan(667 / 2);
  });
});

describe('design tokens: type', () => {
  it(`no style is smaller than ${tokens.minFontSize} pt at the default size, and line height is at least the size`, () => {
    for (const [name, t] of Object.entries(tokens.type)) {
      expect(t.fontSize, name).toBeGreaterThanOrEqual(tokens.minFontSize);
      expect(t.lineHeight, name).toBeGreaterThanOrEqual(t.fontSize);
    }
  });
  it('reading and body text is never capped at accessibility sizes (DESIGN_LANGUAGE 3, TDD 09 C1)', () => {
    for (const name of ['body', 'callout', 'label', 'labelSmall', 'letterBody', 'nameField', 'signature', 'prompt'] as const) {
      expect(tokens.type[name].maxScale, name).toBeNull();
    }
  });
  it('capped display styles still reach at least 1.6x, or are already larger at their cap than display is at its own', () => {
    const displayCap = tokens.type.display.fontSize * tokens.type.display.maxScale!;
    for (const [name, t] of Object.entries(tokens.type)) {
      if (t.maxScale === null) continue;
      // The month numeral is 64 pt: at 1.4x it is 90 pt, far past display's 54 pt cap.
      expect(t.maxScale >= 1.6 || t.fontSize * t.maxScale >= displayCap, name).toBe(true);
    }
  });
  it('the two literary lines of the experience pass: Tonight\'s prompt and the month numeral', () => {
    expect(tokens.type.promptHero).toMatchObject({ fontFamily: tokens.fontFamily.serif, fontSize: 28, lineHeight: 36, letterSpacing: 0, dynamicTypeStyle: 'title1', maxScale: 1.8 });
    expect(tokens.type.numeral).toMatchObject({ fontFamily: tokens.fontFamily.serifMedium, fontSize: 64, lineHeight: 96, letterSpacing: 1, dynamicTypeStyle: 'largeTitle', maxScale: 1.4 });
    expect(tokens.type.numeral.fontVariant).toEqual(['lining-nums', 'proportional-nums']);
    // Tonight's prompt is larger than the old card prompt, and smaller than the first-run hero.
    expect(tokens.type.promptHero.fontSize).toBeGreaterThan(tokens.type.prompt.fontSize);
    expect(tokens.type.promptHero.fontSize).toBeLessThan(tokens.type.hero.fontSize);
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
    for (const ms of [m.fadeMs, m.exitMs, m.enter.durationMs, m.sequenceMaxMs, m.newMarkMs, m.drawMs, m.lamp.arriveMs, m.carry.ms]) expect(ms).toBeLessThanOrEqual(m.hardCeilingMs);
    expect(m.enter.durationMs + m.staggerMs * (m.staggerMax - 1)).toBeLessThanOrEqual(m.sequenceMaxMs);
    expect(m.reduceMotion.durationMs).toBe(m.fadeMs);
  });
  it('the Moments flight carries in 320 ms (O-58): one move, at most 420 ms, and the leave fits inside it', () => {
    expect(m.carry.ms).toBe(320);
    expect(m.carry.ms).toBeLessThanOrEqual(420);
    expect(m.exitMs).toBeLessThanOrEqual(m.carry.ms);
    expect(m.carry.ms).toBeLessThanOrEqual(m.sequenceMaxMs);
  });
  it('[BL-1495] the Moments flight, stepped ms by ms on three phones: starts at the source, lands exactly on the slot at carry.ms, never doubles back, never leaves the screen, never overshoots', () => {
    // CSS-style cubic bezier through (0,0), (x1,y1), (x2,y2), (1,1), solved for y at time x by bisection.
    const [x1, y1, x2, y2] = m.easing;
    const axis = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s ** 2 * (1 - s) + s ** 3;
    const progress = (t: number): number => {
      const x = Math.min(1, Math.max(0, t / m.carry.ms));
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 50; i++) {
        const mid = (lo + hi) / 2;
        if (axis(x1, x2, mid) < x) lo = mid;
        else hi = mid;
      }
      return axis(y1, y2, (lo + hi) / 2);
    };
    const phones = [
      { name: 'SE 3', w: 375, h: 667 },
      { name: 'iPhone 16', w: 393, h: 852 },
      { name: 'large', w: 430, h: 932 },
    ];
    for (const p of phones) {
      // BL-1842: the geometry comes from the real layout tokens, not from numbers made up here. The tray tile is the
      // 44 pt thumbnail (moments tab spec 07, = target.min); the lead slot spans the content width between the screen
      // gutters, which are 16 on a window under compactBelowWidth and 20 above (tokens.layout). The vertical places
      // (a tile near the bottom of the sheet, a slot near the top of capture) are not tokens anywhere yet.
      const gutter = p.w < tokens.layout.compactBelowWidth ? tokens.layout.gutter.compact : tokens.layout.gutter.regular;
      const slot = p.w - 2 * gutter;
      const from = { x: gutter, y: p.h - 120, size: tokens.target.min };
      const to = { x: gutter, y: 120, size: slot };
      expect(to.size, `${p.name} the lead slot is larger than the tray tile (spec 3.4)`).toBeGreaterThan(from.size);
      expect(to.x + to.size, `${p.name} the slot sits inside the right gutter`).toBe(p.w - gutter);
      let prev = -1;
      for (let t = 0; t <= m.carry.ms + 20; t++) {
        const pr = progress(t);
        expect(pr, `${p.name} ${t} ms`).toBeGreaterThanOrEqual(prev);
        expect(pr, `${p.name} ${t} ms`).toBeLessThanOrEqual(1);
        prev = pr;
        const size = from.size + (to.size - from.size) * pr;
        const x = from.x + (to.x - from.x) * pr;
        const y = from.y + (to.y - from.y) * pr;
        expect(x, `${p.name} ${t} ms left`).toBeGreaterThanOrEqual(0);
        expect(y, `${p.name} ${t} ms top`).toBeGreaterThanOrEqual(0);
        expect(x + size, `${p.name} ${t} ms right`).toBeLessThanOrEqual(p.w);
        expect(y + size, `${p.name} ${t} ms bottom`).toBeLessThanOrEqual(p.h);
      }
      expect(progress(0)).toBeCloseTo(0, 9);
      expect(progress(m.carry.ms - 1)).toBeLessThan(1);
      expect(progress(m.carry.ms)).toBeCloseTo(1, 9);
      expect(progress(m.carry.ms + 20)).toBeCloseTo(1, 9);
    }
    // The 160 ms leave runs inside the flight, not after it; the whole hand-off is the flight and no more.
    expect(m.exitMs).toBeLessThan(m.carry.ms);
    // Moving fast early, settling late: at half the time more than half the distance is covered (no linear drift).
    expect(progress(m.carry.ms / 2)).toBeGreaterThan(0.5);
  });
  it('the saved moment files the letter in order, and inside the 900 ms sequence (MOTION 5e)', () => {
    expect(0).toBeLessThan(m.file.chipAtMs);
    expect(m.file.chipAtMs).toBeLessThan(m.file.moveAtMs);
    expect(m.file.moveAtMs).toBeLessThan(m.sequenceMaxMs);
    // The letter's words are never at partial opacity for longer than the 350 ms exit (EXPERIENCE_PASS S21).
    expect(m.sequenceMaxMs - m.file.moveAtMs).toBeLessThanOrEqual(350);
    expect(m.file.scale).toBeGreaterThan(0.8);
    expect(m.file.scale).toBeLessThan(1);
    expect(m.file.dy).toBeGreaterThan(0);
  });
  it('a page turn and the cover opening are small moves inside the sequence ceiling', () => {
    expect(m.pageTurn.dx).toBe(24);
    expect(m.cover.dx).toBeLessThanOrEqual(m.pageTurn.dx);
    expect(m.cover.holdMs + m.enter.durationMs).toBeLessThanOrEqual(m.sequenceMaxMs);
    expect(m.exitMs).toBeLessThan(m.enter.durationMs); // exits are quicker than entries
  });
  it('a card grows into its page with its content arriving late, after a short hold while the Book goes (MOTION 5f)', () => {
    expect(m.cardToPage.contentFrom).toBeGreaterThan(0.5);
    expect(m.cardToPage.contentFrom).toBeLessThan(1);
    // The card holds while the Book's light leaves, and starts to grow before the light has quite gone.
    expect(m.cardToPage.holdMs).toBeGreaterThan(0);
    expect(m.cardToPage.holdMs).toBeLessThan(m.lamp.leaveMs);
    // Short of the next card's words (a 12 pt gap and 16 pt of padding past a card's edge).
    expect(m.cardToPage.clearPt).toBeGreaterThan(0);
    expect(m.cardToPage.clearPt).toBeLessThan(28);
  });
  it('between rooms the light leaves as fast as an exit and comes back as fast as an entry; a dissolve fits the sequence', () => {
    expect(m.lamp.leaveMs).toBe(m.exitMs);
    expect(m.lamp.returnMs).toBe(m.enter.durationMs);
    expect(m.lamp.leaveMs).toBeLessThan(m.lamp.returnMs);
    expect(m.lamp.returnMs).toBeLessThan(m.lamp.arriveMs);
    expect(m.route.dissolveMs).toBeLessThanOrEqual(m.sequenceMaxMs);
    expect(m.swapMs).toBeLessThan(m.fadeMs);
  });
  it('the idle listening breath is 8 breaths a minute or slower, under HIG Motion\'s 0.2 Hz caution', () => {
    expect(m.breathIdleMs).toBe(7500);
    expect(60000 / m.breathIdleMs).toBeLessThanOrEqual(8);
    expect(1000 / m.breathIdleMs).toBeLessThan(0.2);
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
