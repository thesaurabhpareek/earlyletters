import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { en } from '@scribe/content';
import { tokens, type Daypart, type LampScene } from '@scribe/design-tokens';
import {
  ANCHORS,
  LAMP_KEYS,
  NIGHT,
  PAPER_ANCHORS,
  PAPER_SHAPE,
  STATUS_CLEAR_FROM,
  STOPS,
  breathKeyframes,
  coverTarget,
  createRoomsStore,
  geometryKey,
  grainMean,
  lampAllowed,
  lampGeometry,
  lampMemory,
  lampStops,
  litPaperAt,
  planLampMount,
  resolveLamp,
  shouldBreathe,
  type LampBox,
  type LampLight,
} from '../src/components/ui/lamp.logic';

const A = tokens.atmosphere;
const rgbOf = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const SCENES = Object.keys(A.scene) as LampScene[];
const DAYPARTS = Object.keys(A.daypart) as Daypart[];

describe('Lamp scenes resolve from tokens', () => {
  it('the gate is a still, centred pool at 0.6; the welcome a breathing top light at full strength', () => {
    expect(resolveLamp({ scene: 'gate' })).toEqual({ anchor: 'center', core: 'gold', tail: 'amber', intensity: 0.6, breathe: false });
    expect(resolveLamp({ scene: 'welcome' })).toEqual({ anchor: 'top', core: 'gold', tail: 'amber', intensity: 1, breathe: true });
    expect(resolveLamp({ scene: 'form' })).toMatchObject({ intensity: 0.5, breathe: false });
    expect(resolveLamp({ scene: 'book' })).toMatchObject({ anchor: 'top', intensity: 0.6, breathe: false });
  });

  it("Tonight takes its tones and strength from the time of day, the greeting's own keys", () => {
    expect(DAYPARTS.sort()).toEqual(Object.keys(en.tonight.greeting).sort());
    for (const d of DAYPARTS) {
      const want = A.daypart[d];
      expect(resolveLamp({ scene: 'tonight', daypart: d }), d).toEqual({ anchor: 'top', core: want.core, tail: want.tail, intensity: want.intensity, breathe: true });
    }
  });

  it('Read together shows its still dusk pool, from below, only in the evening and later', () => {
    expect(NIGHT).toEqual(['evening', 'night', 'lateNight']);
    for (const d of DAYPARTS) {
      const l = resolveLamp({ scene: 'readTogether', daypart: d });
      if (NIGHT.includes(d)) expect(l, d).toEqual({ anchor: 'bottom', core: 'dusk', tail: 'dusk', intensity: 1, breathe: false });
      else expect(l, d).toBeNull();
    }
    expect(resolveLamp({ scene: 'readTogether' })).toBeNull();
  });

  it('intensity multiplies the scene (lights down for "Not much today", half at the end of the book), clamped to 0..1', () => {
    expect(resolveLamp({ scene: 'tonight', daypart: 'evening', intensity: tokens.motion.lamp.dimTo })!.intensity).toBeCloseTo(0.7);
    expect(resolveLamp({ scene: 'readTogether', daypart: 'night', intensity: 0.5 })!.intensity).toBe(0.5);
    expect(resolveLamp({ scene: 'welcome', intensity: 9 })!.intensity).toBe(1);
    expect(resolveLamp({ scene: 'welcome', intensity: -1 })!.intensity).toBe(0);
    expect(resolveLamp({ scene: 'welcome', intensity: NaN })!.intensity).toBe(0);
  });

  it('`still` stops a breathing scene; `anchor` overrides where the light sits', () => {
    expect(resolveLamp({ scene: 'welcome', still: true })!.breathe).toBe(false);
    expect(resolveLamp({ scene: 'welcome', anchor: 'center' })!.anchor).toBe('center');
  });

  it("without a scene it is #99's warm pool, so screens that have not moved to scenes keep their light", () => {
    expect(resolveLamp({})).toEqual({ anchor: 'top', core: 'gold', tail: 'amber', intensity: 1, breathe: true });
    expect(resolveLamp({ anchor: 'center' })!.anchor).toBe('center');
  });

  it('anchors are where the spec puts them: top, centre and bottom of the screen', () => {
    expect(ANCHORS).toEqual({ top: { cx: 0.5, cy: 0, r: 0.95 }, center: { cx: 0.5, cy: 0.42, r: 0.8 }, bottom: { cx: 0.5, cy: 1, r: 0.9 } });
  });

  it('on paper the core sits above or beside the text block: above the top edge, over the upper third, below the bottom edge', () => {
    expect(PAPER_ANCHORS.top.cy).toBeLessThan(0);
    expect(PAPER_ANCHORS.center.cy).toBeLessThan(ANCHORS.center.cy);
    expect(PAPER_ANCHORS.bottom.cy).toBeGreaterThan(1);
    for (const a of Object.values(PAPER_ANCHORS)) expect(a.cx).toBe(0.5);
  });
});

describe('Lamp accessibility', () => {
  it('draws nothing under Increase Contrast or Reduce Transparency (plain paper)', () => {
    expect(lampAllowed({ highContrast: false, reduceTransparency: false })).toBe(true);
    expect(lampAllowed({ highContrast: true, reduceTransparency: false })).toBe(false);
    expect(lampAllowed({ highContrast: false, reduceTransparency: true })).toBe(false);
  });

  it('only breathes for a breathing scene, while visible, focused and active, and never under Reduce Motion', () => {
    const on = { reduced: false, appActive: true, focused: true, visible: true, breathe: true };
    expect(shouldBreathe(on)).toBe(true);
    expect(shouldBreathe({ ...on, breathe: false })).toBe(false);
    expect(shouldBreathe({ ...on, reduced: true })).toBe(false);
    expect(shouldBreathe({ ...on, appActive: false })).toBe(false);
    expect(shouldBreathe({ ...on, focused: false })).toBe(false);
    expect(shouldBreathe({ ...on, visible: false })).toBe(false);
  });

  it('breathing is opacity only, from rest to a shallow dip, never a flash', () => {
    const k = breathKeyframes();
    expect(Object.keys(k.from)).toEqual(['opacity']);
    expect(Object.keys(k.to)).toEqual(['opacity']);
    expect(k.from.opacity).toBe(1);
    expect(k.to.opacity).toBe(tokens.motion.lamp.breathOpacityMin);
    expect(1 - k.to.opacity).toBeLessThanOrEqual(0.15);
  });

  it('Reduce Motion: the lamp starts in its final state, still, with nothing to arrive', () => {
    const welcome = resolveLamp({ scene: 'welcome' })!;
    expect(planLampMount(undefined, welcome, true)).toEqual([{ light: { anchor: 'top', core: 'gold', tail: 'amber' }, from: 1, to: 1, ms: 0 }]);
    const memory = { light: { anchor: 'center' as const, core: 'gold' as const, tail: 'amber' as const }, level: 0.6 };
    expect(planLampMount(memory, welcome, true, { key: 'firstRun' })).toEqual([{ light: { anchor: 'top', core: 'gold', tail: 'amber' }, from: 1, to: 1, ms: 0 }]);
    // An unlit room over it: the light goes at once and comes back at once.
    expect(coverTarget(true, true)).toEqual({ to: 0, ms: 0 });
    expect(coverTarget(false, true)).toEqual({ to: 1, ms: 0 });
  });

  it('under a sheet the room keeps its light and only pauses its breath', () => {
    const on = { reduced: false, appActive: true, focused: true, visible: true, breathe: true };
    expect(shouldBreathe({ ...on, sheetUp: true })).toBe(false);
    expect(shouldBreathe({ ...on, sheetUp: false })).toBe(true);
  });
});

describe('Lamp gradient', () => {
  it('dark: four stops that fade to nothing at the edge, so no hard edge ever shows', () => {
    expect(STOPS[0].opacity).toBe(1);
    expect(STOPS[STOPS.length - 1].opacity).toBe(0);
    for (let i = 1; i < STOPS.length; i++) expect(STOPS[i].opacity).toBeLessThan(STOPS[i - 1].opacity);
  });

  it("dark: #99's look kept exactly at its stops (core tone at the centre, the tail tone from the first stop), smooth between them", () => {
    const night = resolveLamp({ scene: 'tonight', daypart: 'night' })!;
    const stops = lampStops(night, 'dark');
    expect(stops[0]).toEqual({ offset: 0, color: A.tone.amber, opacity: A.peak.dark.amber });
    for (const k of STOPS.slice(1)) {
      const s = stops.find((x) => x.offset === k.offset)!;
      expect(s, `#99's stop at ${k.offset}`).toBeDefined();
      expect(s.color).toBe(A.tone.rose);
      expect(s.opacity).toBeCloseTo(k.opacity * A.peak.dark.rose, 4);
    }
    // Many stops on one smooth, falling curve: no corner between #99's four points (the corners showed as rings).
    expect(stops.length).toBeGreaterThanOrEqual(PAPER_SHAPE.stops);
    for (let i = 1; i < stops.length; i++) expect(stops[i].opacity).toBeLessThanOrEqual(stops[i - 1].opacity);
    const tail = stops.filter((s) => s.offset >= STOPS[1].offset);
    for (let i = 2; i < tail.length; i++) {
      const s1 = (tail[i - 1].opacity - tail[i - 2].opacity) / (tail[i - 1].offset - tail[i - 2].offset);
      const s2 = (tail[i].opacity - tail[i - 1].opacity) / (tail[i].offset - tail[i - 1].offset);
      expect(Math.abs(s2 - s1), `slope change at ${tail[i - 1].offset}`).toBeLessThan(0.25 * A.peak.dark.rose * 10);
    }
  });

  it('light: late night and Read together stay warm on paper: the dusk is drawn as its paper tone, a warm mauve', () => {
    const dusk = rgbOf(A.paperTone.dusk);
    expect(dusk[0]).toBeGreaterThan(dusk[2]); // red over blue: warm, where the website's dusk blue reads grey on cream
    const late = lampStops(resolveLamp({ scene: 'tonight', daypart: 'lateNight' })!, 'light');
    expect(late[late.length - 1].color).toBe(A.paperTone.dusk);
    const rt = lampStops(resolveLamp({ scene: 'readTogether', daypart: 'night' })!, 'light');
    expect(new Set(rt.map((s) => s.color))).toEqual(new Set([A.paperTone.dusk]));
    // Dark keeps the website's dusk.
    expect(lampStops(resolveLamp({ scene: 'readTogether', daypart: 'night' })!, 'dark')[0].color).toBe(A.tone.dusk);
  });

  it('light: many eased stops (no corner in the curve, so no rings), falling smoothly from the core tone at its peak to nothing', () => {
    const evening = resolveLamp({ scene: 'tonight', daypart: 'evening' })!;
    const stops = lampStops(evening, 'light');
    expect(stops).toHaveLength(PAPER_SHAPE.stops);
    expect(PAPER_SHAPE.stops).toBeGreaterThanOrEqual(16);
    expect(stops[0]).toEqual({ offset: 0, color: A.tone.gold, opacity: A.peak.light.gold });
    expect(stops[stops.length - 1]).toMatchObject({ offset: 1, color: A.tone.amber, opacity: 0 });
    for (let i = 1; i < stops.length; i++) {
      expect(stops[i].opacity).toBeLessThan(stops[i - 1].opacity);
      // Even spacing, and no step between two stops bigger than an eighth of the peak: a smooth curve.
      expect(stops[i].offset - stops[i - 1].offset).toBeCloseTo(1 / (PAPER_SHAPE.stops - 1), 3);
      expect(stops[i - 1].opacity - stops[i].opacity).toBeLessThanOrEqual(A.peak.light.gold / 8);
    }
  });

  it('light: the pool is round and sized by the longer side, whatever the box', () => {
    for (const box of [{ width: 402, height: 874 }, { width: 1024, height: 1366 }, { width: 874, height: 402 }]) {
      const g = lampGeometry('top', 'light', box);
      expect(g.units).toBe('userSpaceOnUse');
      expect(g.r).toBeCloseTo(PAPER_ANCHORS.top.r * Math.max(box.width, box.height));
      expect(g.cx).toBeCloseTo(box.width / 2);
    }
    expect(lampGeometry('top', 'dark', { width: 402, height: 874 })).toEqual({ units: 'objectBoundingBox', ...ANCHORS.top });
  });

  /** WCAG 2.x, sRGB. */
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const lum = (c: number[]) => {
    const [r, g, b] = c.map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a: number[], b: number[]) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const READING = A.onLitPaper.reading;
  const STATUS = A.onLitPaper.status;
  /** Every light a room can show, at full strength and the top of the breath: the brightest the pool can ever be. */
  const lights: [string, LampLight][] = [
    ['no scene (#99)', resolveLamp({})!],
    ...SCENES.filter((s) => s !== 'tonight' && s !== 'readTogether').map((s) => [s, { ...resolveLamp({ scene: s })!, intensity: 1 }] as [string, LampLight]),
    ...DAYPARTS.map((d) => [`tonight ${d}`, { ...resolveLamp({ scene: 'tonight', daypart: d })!, intensity: 1 }] as [string, LampLight]),
    ['readTogether', resolveLamp({ scene: 'readTogether', daypart: 'night' })!],
  ];
  /** The phones the app runs on, portrait only (app.config: orientation portrait, no tablet): 17 Pro, SE, Pro Max. */
  const BOXES: LampBox[] = [
    { width: 402, height: 874 },
    { width: 375, height: 667 },
    { width: 440, height: 956 },
  ];
  /** Every point of a grid over the box, edges included. */
  const grid = (box: LampBox, n = 24) =>
    Array.from({ length: (n + 1) * (n + 1) }, (_, i) => [((i % (n + 1)) / n) * box.width, (Math.floor(i / (n + 1)) / n) * box.height]);

  /** The darkest a set of colours gets against the lit paper over a box's grid, and where (one assertion per light). */
  function worstOver(light: LampLight, scheme: 'light' | 'dark', box: LampBox, keys: readonly (keyof typeof tokens.light)[], from = 0) {
    const c = tokens[scheme];
    const fg = keys.map((k) => [k, lum(rgb(c[k]))] as const);
    let worst = { ratio: Infinity, at: '' };
    for (const [x, y] of grid(box)) {
      if (y < from * box.height) continue;
      const bg = lum(litPaperAt(light, scheme, c.bg, box, x, y));
      for (const [k, l] of fg) {
        const r = (Math.max(l, bg) + 0.05) / (Math.min(l, bg) + 0.05);
        if (r < worst.ratio) worst = { ratio: r, at: `${k} at ${Math.round(x)},${Math.round(y)} of ${box.width}x${box.height}` };
      }
    }
    return worst;
  }

  it('dark: every text colour keeps 4.5:1 everywhere, in every scene and daypart', () => {
    for (const [name, light] of lights) {
      for (const box of BOXES) {
        const w = worstOver(light, 'dark', box, [...READING, ...STATUS]);
        expect(w.ratio, `dark ${name}: ${w.at}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('light: every reading colour (text, textMuted, accent, focus) keeps 4.5:1 everywhere, even at the core', () => {
    for (const [name, light] of lights) {
      for (const box of BOXES) {
        const w = worstOver(light, 'light', box, READING);
        expect(w.ratio, `light ${name}: ${w.at}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it(`light: in a room lit from the top every status colour keeps 4.5:1 from ${STATUS_CLEAR_FROM * 100} percent of the height down`, () => {
    for (const [name, light] of lights.filter(([, l]) => l.anchor === 'top')) {
      for (const box of BOXES) {
        const w = worstOver(light, 'light', box, STATUS, STATUS_CLEAR_FROM);
        expect(w.ratio, `light ${name}: ${w.at}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  /**
   * Where text actually sits, each in its own colour: the text boxes on the lit paper of the web build (402 x 874,
   * no safe area, so the text is as close to a top light as it can be), measured on 16 Oct 2026. Text on a card,
   * a button fill or the tab bar is on its own surface and is not listed. On a phone the top inset moves the text
   * further from a top light; the reading colours keep 4.5:1 anywhere (above), so a move never breaks them.
   */
  type Box = { what: string; token: keyof typeof tokens.light; x: number; y: number; w: number; h: number };
  /**
   * The light a screen shows today, read from its own <Lamp /> (scene and anchor), so a box is checked under the lamp
   * that is actually on screen; plus the scene its package will move it to.
   */
  const shown = (file: string): LampLight[] =>
    [...readFileSync(join(SRC, file), 'utf8').matchAll(/<Lamp(?:View)?\b([^>]*)\/?>/g)].map((m) => {
      const scene = /scene="([^"]+)"/.exec(m[1])?.[1] as LampScene | undefined;
      const anchor = /anchor="([^"]+)"/.exec(m[1])?.[1] as LampLight['anchor'] | undefined;
      return resolveLamp({ scene, anchor, daypart: 'evening' })!;
    });
  const ROOMS: { room: string; box: LampBox; lights: LampLight[]; text: Box[] }[] = [
    {
      room: 'Tonight',
      box: { width: 402, height: 808 },
      lights: [
        ...shown('app/(tabs)/index.tsx'),
        ...DAYPARTS.map((d) => resolveLamp({ scene: 'tonight', daypart: d })!),
        resolveLamp({ scene: 'tonight', daypart: 'evening', intensity: tokens.motion.lamp.dimTo })!,
      ],
      // Tonight as P3 built it (S09, S33), measured on 17 Oct 2026: the greeting in two tones, the prompt on the paper
      // (three lines, the tallest a prompt runs at the default size; "Another thought" sits below a two- or a three-line
      // prompt), Speak and Type pinned, and the quiet line in text. Cards sit on their own surface and are not listed.
      text: [
        { what: 'dateline', token: 'textMuted', x: 20, y: 17, w: 116, h: 23 },
        // Both tones over the widest greeting of any daypart (P1's re-measure on #221: x 20 to 354), since where the
        // name starts depends on the greeting before it.
        { what: 'greeting', token: 'text', x: 20, y: 47, w: 334, h: 33 },
        { what: 'greeting name', token: 'textMuted', x: 20, y: 47, w: 334, h: 33 },
        { what: 'prompt', token: 'text', x: 20, y: 99, w: 362, h: 114 },
        { what: 'Another thought', token: 'accent', x: 46, y: 194, w: 116, h: 63 },
        { what: 'Not much today', token: 'accent', x: 139, y: 757, w: 124, h: 30 },
        { what: 'A quiet day, kept.', token: 'text', x: 116, y: 756, w: 121, h: 28 },
        { what: 'Undo', token: 'accent', x: 261, y: 756, w: 37, h: 27 },
      ],
    },
    {
      room: 'the age question',
      box: { width: 402, height: 874 },
      lights: [...shown('components/gate/age-gate-screen.tsx'), resolveLamp({ scene: 'gate' })!],
      // the age question (P2, measured on e652c4a)
      text: [
        { what: 'question', token: 'text', x: 42, y: 195, w: 318, h: 50 },
        { what: 'Yes', token: 'text', x: 92, y: 286, w: 27, h: 30 },
        { what: 'No', token: 'text', x: 285, y: 286, w: 23, h: 30 },
        { what: 'Continue (not yet chosen)', token: 'textMuted', x: 166, y: 807, w: 70, h: 30 },
      ],
    },
    {
      room: 'the welcome',
      box: { width: 402, height: 874 },
      lights: [...shown('app/onboarding.tsx'), resolveLamp({ scene: 'welcome' })!, resolveLamp({ scene: 'form' })!, resolveLamp({ scene: 'finish' })!],
      // the welcome (P2, measured on e652c4a): the lockup is a drawing, not text; Begin the book sits on its own fill
      text: [
        { what: 'title', token: 'text', x: 55, y: 216, w: 301, h: 216 },
        { what: 'promise', token: 'textMuted', x: 29, y: 437, w: 348, h: 54 },
        { what: 'free line', token: 'textMuted', x: 113, y: 498, w: 176, h: 23 },
      ],
    },
  ];

  it('each room is checked under the lamp its screen mounts today (first run: the gate, welcome, form and finish scenes, P2)', () => {
    // P2 (EXPERIENCE_PASS S01 to S08): the gate and onboarding moved from #99's anchor-only pool to their scenes.
    expect(shown('components/gate/age-gate-screen.tsx')).toEqual([resolveLamp({ scene: 'gate' })]);
    expect(shown('app/onboarding.tsx')).toEqual([resolveLamp({ scene: 'welcome' }), resolveLamp({ scene: 'finish' }), resolveLamp({ scene: 'form' })]);
    expect(shown('app/(tabs)/index.tsx')).toEqual([resolveLamp({ anchor: 'top' })]);
    // ROOMS spreads shown() into each room's lights, so the boxes are checked under exactly what the screens mount; the
    // exact pins above fail on any change to a screen's lamp (a "ROOMS contains" check here could not fail, review B2).
  });

  it('where text actually sits, each text keeps 4.5:1 in its own colour over its whole box (Tonight, the age question, the welcome)', () => {
    for (const scheme of ['light', 'dark'] as const) {
      const c = tokens[scheme];
      for (const { room, box, lights: ls, text } of ROOMS) {
        for (const light of ls) {
          for (const t of text) {
            for (let i = 0; i <= 8; i++) {
              for (let j = 0; j <= 4; j++) {
                const [x, y] = [t.x + (t.w * i) / 8, t.y + (t.h * j) / 4];
                const lit = litPaperAt(light, scheme, c.bg, box, x, y);
                expect(ratio(rgb(c[t.token]), lit), `${room}: ${t.what} (${t.token}) on ${scheme} ${geometryKey(light)} at ${light.intensity}`).toBeGreaterThanOrEqual(4.5);
              }
            }
          }
        }
      }
    }
  });

  /**
   * The measured boxes above are numbers from one build; this ties them to the screens. In every room the lamp may
   * light, and in every file such a room renders (followed through every import: the `@/` alias, relative paths,
   * re-exports and lazy `import()`; the ui, motion and platform primitives draw a status colour only when a caller asks, and the caller
   * is scanned), a status colour (onLitPaper.status, or a field's `error`, which TextField draws in `caution`) may be
   * used only where the list below says. Each entry either names a measured box in ROOMS, in that colour, below
   * STATUS_CLEAR_FROM, and the line in the room's source it must follow (so it cannot move up into the light), or names
   * the surface it sits on (a card or chip, not the lit paper). The gate and Read together allow none. Anything else
   * (Tonight's subtitle turned to `tone="success"`, a tone held in a constant here or in a module, the theme under
   * another name, a raw status colour, a caution line under the greeting, a form error on a lit step, a caution line
   * in a component two imports away or behind a lazy import) fails here.
   */
  type StatusUse = { use: string; box?: string; room?: string; after?: string; surface?: string };
  // Tonight allows none: since P3 (S33) "A quiet day, kept." is in `text` with the Moon in textMuted, so Tonight and
  // every file it renders (the draft cards, "A month ago", the quiet line) must use no status colour at all.
  const STATUS_ON_LIT_PAPER: Record<string, StatusUse[]> = {
    // "We'll tell you" on the Family tab: a check mark on its own chip.
    'components/family/coparent-soon.tsx': [{ use: 'c.success', surface: 'bg-secondary' }],
    // A sign-in or invite error on the Family tab: its warning mark on its own chip, beside the words.
    'lib/auth/ui.tsx': [{ use: 'c.caution', surface: 'bg-secondary' }],
    // First run's reason line once the waiting Continue is tapped (S05, P2): its warning mark on its own chip, beside the words.
    'app/onboarding.tsx': [{ use: 'c.caution', surface: 'bg-secondary' }],
  };
  const LIT_ROOMS = ['app/(tabs)/book.tsx', 'app/(tabs)/family.tsx', 'app/(tabs)/index.tsx', 'app/onboarding.tsx', 'app/read-together.tsx', 'app/write.tsx', 'components/gate/age-gate-screen.tsx'];
  const NO_STATUS_ROOMS = ['components/gate/age-gate-screen.tsx', 'app/read-together.tsx'];
  const PRIMITIVES = /^components\/(ui|motion|platform)\//;

  /** The status colours' own values, light and dark: a raw colour that equals one is that status colour by another name. */
  const STATUS_HEX = new Set(STATUS.flatMap((k) => [tokens.light[k], tokens.dark[k]]).map((h) => h.toLowerCase()));

  /** The parts of a `tone={...}` expression that give its value (the branches of a condition, or the whole), strings blanked. */
  const toneValues = (expr: string) => {
    const bare = expr.replace(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g, "''");
    const q = bare.indexOf('?');
    return (q < 0 ? [bare] : bare.slice(q + 1).split(':')).map((x) => x.trim());
  };

  /**
   * Every use of a status colour in a file's code, comments aside:
   * - a tone: plain, in an expression or in an object;
   * - a theme colour under any name the file gives its theme (`c`, or what it binds to useTheme().c, useColors(),
   *   useTheme()'s `c`, tokens.light, tokens.dark, tokens[scheme], or another theme name), or picked by a computed key;
   * - a class (also one built in a template), a destructive button, a field error, a raw colour equal to a status one.
   * In a file that renders (.tsx) also any other status member (`colors.caution`), any status name in quotes (a tone
   * held in a constant first), and a tone that comes from a name, a call or a module (`tone={T}`), which has to be
   * declared; a haptic's kind and a system alert button's style are not colours. A plain module (.ts) uses the status
   * names as states ('recording', a 'success' haptic), so only the colour forms count there; a tone it hands a screen
   * is caught at the screen, where it arrives as `tone={...}`.
   */
  const statusUses = (src: string, renders = true) => {
    let code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    const k = 'success|caution|recording|destructive';
    const found: string[] = [];
    const take = (re: RegExp, name: (m: string[]) => string | null) => {
      code = code.replace(re, (...m: string[]) => {
        const n = name(m);
        if (n === null) return m[0]!;
        found.push(n);
        return ' ';
      });
    };
    const themes = new Set<string>(renders ? ['c'] : []);
    for (const m of code.matchAll(/\b(?:const|let|var)\s+(\w+)\s*=\s*(?:useTheme\(\)\.c|useColors\(\)|tokens\.(?:light|dark)\b|tokens\[[^\]]+\])/g)) themes.add(m[1]!);
    for (const m of code.matchAll(/\{([^}]*)\}\s*=\s*useTheme\(\)/g)) for (const b of m[1]!.matchAll(/\bc\b(?:\s*:\s*(\w+))?/g)) themes.add(b[1] ?? 'c');
    for (let grew = true; grew; ) {
      grew = false;
      for (const m of code.matchAll(/\b(?:const|let|var)\s+(\w+)\s*=\s*(\w+)\s*(?:;|\n)/g)) {
        if (themes.has(m[2]!) && !themes.has(m[1]!)) {
          themes.add(m[1]!);
          grew = true;
        }
      }
    }
    const theme = [...themes].join('|');
    take(new RegExp(`\\btone(?:=|:\\s*)(?:["'\`](${k})["'\`]|\\{[^}]*?["'\`](${k})["'\`][^}]*\\})`, 'g'), (m) => `tone="${m[1] ?? m[2]}"`);
    take(new RegExp(`\\btokens\\.(?:light|dark)\\.(${k})\\b`, 'g'), (m) => `tokens.${m[1]}`);
    take(new RegExp(`\\btokens\\[[^\\]]+\\]\\.(${k})\\b`, 'g'), (m) => `tokens.${m[1]}`);
    if (theme) {
      take(new RegExp(`\\b(${theme})\\.(${k})\\b`, 'g'), (m) => `${m[1]}.${m[2]}`);
      take(new RegExp(`\\b(${theme})\\[(?!\\s*\\d)[^\\]]+\\]`, 'g'), (m) => `${m[1]}[...]`);
    }
    take(new RegExp(`\\b(text|bg|border)-(${k})\\b`, 'g'), (m) => `${m[1]}-${m[2]}`);
    take(/\b(text|bg|border)-\$\{/g, (m) => `${m[1]}-\${...}`);
    take(/\bvariant=["']destructive["']/g, (m) => m[0]!);
    take(/\berror=[{"']/g, () => 'error=');
    take(/["'`](#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?)["'`]/g, (m) => (STATUS_HEX.has(m[1]!.toLowerCase()) ? `'${m[1]!.toLowerCase()}'` : null));
    if (renders) {
      take(new RegExp(`\\b([A-Za-z_$][\\w$]*)\\.(${k})\\b`, 'g'), (m) => `${m[1]}.${m[2]}`);
      take(/\btone=\{([^}]*)\}/g, (m) => (toneValues(m[1]!).some((v) => /^[A-Za-z_$]/.test(v)) ? `tone={${m[1]!.trim()}}` : null));
      code = code.replace(/\bhaptic\(\s*["'`]\w+["'`]\s*\)/g, ' ').replace(/\bstyle:\s*["'`]destructive["'`]/g, ' ');
      take(new RegExp(`["'\`](${k})["'\`]`, 'g'), (m) => `'${m[1]}'`);
    }
    return found;
  };

  /** Where an import names a file under src: the `@/` alias, or a path relative to the importing file. */
  const resolveImport = (from: string, spec: string) => {
    let base: string;
    if (spec.startsWith('@/')) base = join(SRC, spec.slice(2));
    else if (spec.startsWith('.')) base = join(SRC, dirname(from), spec);
    else return null;
    for (const c of [base, `${base}.tsx`, `${base}.ts`, join(base, 'index.tsx'), join(base, 'index.ts')]) {
      try {
        if (/\.tsx?$/.test(c) && statSync(c).isFile()) return relative(SRC, c).split('\\').join('/');
      } catch {}
    }
    return null;
  };
  /** Every module a file names: imports, re-exports (`export ... from`), side-effect imports, and `import()` and `require()` (a lazy screen). */
  const importsOf = (src: string) =>
    [
      ...src.matchAll(
        /(?:^|[\n;])\s*(?:import|export)\s[^;'"]*?\bfrom\s*["']([^"']+)["']|(?:^|[\n;])\s*import\s*["']([^"']+)["']|\b(?:import|require)\(\s*["']([^"']+)["']\s*\)/g,
      ),
    ].map((m) => (m[1] ?? m[2] ?? m[3])!);

  /** A lit room and every file it renders, followed through every import (primitives excepted). */
  const renderedBy = (room: string) => {
    const seen = new Set<string>();
    const walk = (f: string) => {
      if (seen.has(f)) return;
      seen.add(f);
      for (const spec of importsOf(readFileSync(join(SRC, f), 'utf8'))) {
        const r = resolveImport(f, spec);
        if (r && !PRIMITIVES.test(r)) walk(r);
      }
    };
    walk(room);
    return [...seen];
  };
  const usesIn = (f: string) => statusUses(readFileSync(join(SRC, f), 'utf8'), f.endsWith('.tsx')).sort();

  it('the status-colour scan sees every way a screen sets one', () => {
    expect(statusUses('<Text tone="success">a</Text>')).toEqual(['tone="success"']);
    expect(statusUses("<Text tone={kept ? 'caution' : 'muted'}>a</Text>")).toEqual(['tone="caution"']);
    expect(statusUses('<Icon color={c.recording} /> <View className="text-destructive" />')).toEqual(['c.recording', 'text-destructive']);
    expect(statusUses('<Button variant="destructive" /> // tone="success" in a comment')).toEqual(['variant="destructive"']);
    expect(statusUses('<TextField label={l} error={problem} />')).toEqual(['error=']);
    // A tone held in a constant first, or set in an object, in a plain module too.
    expect(statusUses("const QUIET = 'success';\n<Text tone={QUIET}>a</Text>").sort()).toEqual(["'success'", 'tone={QUIET}']);
    expect(statusUses("export const line = { tone: 'caution' as const };", false)).toEqual(['tone="caution"']);
    // A tone that comes from a module, a call or a branch is declared, whatever the module holds (C's gap B).
    expect(statusUses("import { ZZ_TONE } from '@/lib/zz-tone';\n<Text tone={ZZ_TONE}>a</Text>")).toEqual(['tone={ZZ_TONE}']);
    expect(statusUses('<Text tone={toneFor(kind)}>a</Text>')).toEqual(['tone={toneFor(kind)}']);
    expect(statusUses("<Text tone={kept ? 'muted' : KEPT_TONE}>a</Text>")).toEqual(["tone={kept ? 'muted' : KEPT_TONE}"]);
    expect(statusUses("<Text tone={kept ? 'muted' : 'default'}>a</Text>")).toEqual([]);
    // The theme under another name (V's gap), in a module too, or picked by a computed key; a class built in a template.
    expect(statusUses('const colors = useTheme().c;\n<Icon color={colors.caution} />')).toEqual(['colors.caution']);
    expect(statusUses('const { c: palette } = useTheme();\nconst p2 = palette;\nexport const warn = p2.caution;', false)).toEqual(['p2.caution']);
    expect(statusUses('const t = tokens.dark;\nexport const warn = t.recording;', false)).toEqual(['t.recording']);
    expect(statusUses('<Icon color={c[kind]} />')).toEqual(['c[...]']);
    expect(statusUses('<Text className={`text-${tone}`}>a</Text>')).toEqual(['text-${...}']);
    // A raw colour equal to a status colour, in a module too; any other colour is not one.
    expect(statusUses(`export const WARN = '${tokens.light.caution}';`, false)).toEqual([`'${tokens.light.caution.toLowerCase()}'`]);
    expect(statusUses(`export const INK = '${tokens.light.text}';`, false)).toEqual([]);
    // Not colours: a haptic's kind and a system alert button's style; and a plain module's states.
    expect(statusUses("haptic('success'); Alert.alert(t, b, [{ text: x, style: 'destructive' }]);")).toEqual([]);
    expect(statusUses("if (mode === 'recording') return;", false)).toEqual([]);
    // Imports: the alias, relative paths (down and up), re-exports, and a lazy screen (C's gap A).
    expect(
      importsOf("import { A } from '@/lib/auth/ui';\nimport { B } from './chapters';\nexport { C } from '../c';\nimport './side';\nconst Z = lazy(() => import('@/components/family/zz-lazy'));\nconst m = require('./native');"),
    ).toEqual(['@/lib/auth/ui', './chapters', '../c', './side', '@/components/family/zz-lazy', './native']);
    expect(resolveImport('components/book/quiet-day-row.tsx', './chapters')).toBe('components/book/chapters.ts');
    expect(resolveImport('components/book/shelf.logic.ts', '../../lib/dates')).toBe('lib/dates.ts');
    // The scan follows a room into everything it renders, @/lib and relative imports included.
    expect(renderedBy('app/(tabs)/family.tsx')).toEqual(expect.arrayContaining(['components/family/coparent-soon.tsx', 'lib/auth/ui.tsx']));
    expect(renderedBy('app/(tabs)/book.tsx')).toEqual(expect.arrayContaining(['components/book/quiet-day-row.tsx', 'components/book/chapters.ts']));
  });

  it('in every room the lamp lights, status colours are used only where a measured box below the core says so (source scan)', () => {
    const files = new Set([...LIT_ROOMS, ...mounts(LAMP)].flatMap(renderedBy));
    for (const f of files) {
      const allowed = (STATUS_ON_LIT_PAPER[f] ?? []).map((a) => a.use).sort();
      expect(usesIn(f), `${f}: status colours on or near lit paper`).toEqual(allowed);
    }
    for (const room of NO_STATUS_ROOMS) {
      for (const f of renderedBy(room)) expect(usesIn(f), `${f} (inside ${room}) allows none`).toEqual([]);
    }
    for (const [f, entries] of Object.entries(STATUS_ON_LIT_PAPER)) {
      expect(files.has(f), `${f} is rendered by a lit room`).toBe(true);
      const src = readFileSync(join(SRC, f), 'utf8');
      for (const a of entries) {
        const at = src.indexOf(a.use);
        expect(at, `${f}: ${a.use} is in the source`).toBeGreaterThanOrEqual(0);
        if (a.surface) {
          // On its own surface: the element with the status colour sits in one with that surface, within a few lines.
          expect(src.slice(Math.max(0, at - 400), at), `${f}: ${a.use} sits on ${a.surface}`).toContain(a.surface);
          continue;
        }
        const room = ROOMS.find((r) => r.room === a.room)!;
        const box = room.text.find((t) => t.what === a.box)!;
        expect(box, `${f}: ${a.use} names a measured box`).toBeDefined();
        expect(STATUS as readonly string[], `${a.box} is in a status colour`).toContain(box.token);
        expect(box.y, `${a.box} sits below the core`).toBeGreaterThanOrEqual(STATUS_CLEAR_FROM * room.box.height);
        // And it stays there: it follows, in the room's source, the line that pushes it to the foot (reviewer V's note).
        const anchor = src.indexOf(a.after!);
        expect(anchor, `${f}: ${a.after} is in the source`).toBeGreaterThanOrEqual(0);
        expect(src.indexOf(a.after!, anchor + 1), `${f}: ${a.after} is there once`).toBe(-1);
        expect(at, `${f}: ${a.use} follows ${a.after}`).toBeGreaterThan(anchor);
      }
    }
  });

  it('light: the paper reads lit, not white: a warm core at the top that still warms the middle of the screen', () => {
    const box = { width: 402, height: 874 };
    const paper = rgb(tokens.light.bg);
    const evening = resolveLamp({ scene: 'tonight', daypart: 'evening' })!;
    const top = litPaperAt(evening, 'light', tokens.light.bg, box, box.width / 2, 0);
    const middle = litPaperAt(evening, 'light', tokens.light.bg, box, box.width / 2, box.height / 2);
    // Warmth on paper is blue taken away (red stays near full): at least 50 levels at the top, 12 at the middle.
    expect(paper[2] - top[2]).toBeGreaterThanOrEqual(50);
    expect(paper[2] - middle[2]).toBeGreaterThanOrEqual(12);
  });

  it('the grain is signed and faint, lies inside the light (it comes and goes with it), and is fainter on night paper', () => {
    const g = A.grain;
    expect(grainMean('light').black).toBeCloseTo((0.5 * g.blackMax) / 2 / 255);
    expect(grainMean('dark').white).toBeCloseTo(g.darkOpacity * grainMean('light').white);
    expect(g.darkOpacity).toBeGreaterThan(0);
    expect(g.darkOpacity).toBeLessThan(1);
    expect(g.blackMax / 255).toBeLessThanOrEqual(0.02); // a speck moves a pixel by a few levels at most
    expect(g.whiteMax / 255).toBeLessThanOrEqual(0.06);
    // On night paper the brightest speck lifts a pixel by under two levels: a dither, not a texture.
    expect(((g.whiteMax * g.darkOpacity) / 255) * (255 - rgbOf(tokens.dark.bg)[0])).toBeLessThan(2);
    const lampSrc = readFileSync(join(SRC, 'components', 'ui', 'lamp.tsx'), 'utf8');
    expect(lampSrc).toMatch(/grainTexture/);
    expect(lampSrc).toContain('const grain = grainOpacity(scheme);');
  });
});

describe('persistKey: one light across screens', () => {
  afterEach(() => lampMemory.clear());

  const L = tokens.motion.lamp;
  const top = { anchor: 'top', core: 'gold', tail: 'amber' } as const;

  it('the first lit room after a cold launch arrives slowly, once: from unlit to its level over arriveMs', () => {
    expect(lampMemory.firstOfSession()).toBe(true);
    const welcome = resolveLamp({ scene: 'welcome' })!;
    expect(planLampMount(undefined, welcome, false, { firstOfSession: lampMemory.firstOfSession() })).toEqual([{ light: top, from: 0, to: 1, ms: L.arriveMs }]);
    lampMemory.set(undefined, welcome);
    expect(lampMemory.firstOfSession()).toBe(false);
  });

  it('every later lamp in the session comes up as a return (Write over Tonight), unless it asks to arrive (Read together at night)', () => {
    lampMemory.set(undefined, resolveLamp({ scene: 'tonight', daypart: 'evening' }));
    const write = resolveLamp({ scene: 'write' })!;
    expect(planLampMount(undefined, write, false, { firstOfSession: lampMemory.firstOfSession() })).toEqual([{ light: top, from: 0, to: 0.5, ms: L.returnMs }]);
    const dusk = resolveLamp({ scene: 'readTogether', daypart: 'night' })!;
    expect(planLampMount(undefined, dusk, false, { firstOfSession: false, arrive: true })[0].ms).toBe(L.arriveMs);
  });

  it('firstRun: a lamp lit earlier mounts at its last level and rises or dims slowly, never arriving again', () => {
    lampMemory.set('firstRun', resolveLamp({ scene: 'welcome' }));
    const form = resolveLamp({ scene: 'form' })!;
    const plan = planLampMount(lampMemory.get('firstRun'), form, false, { key: 'firstRun', firstOfSession: false });
    expect(plan).toEqual([{ light: top, from: 1, to: 0.5, ms: L.arriveMs }]);
    expect(plan[0].from).toBeGreaterThan(0); // never a frame of unlit paper
  });

  it('the gate to the welcome moves the pool from the centre to the top as a cross-fade, never through unlit paper', () => {
    lampMemory.set('firstRun', resolveLamp({ scene: 'gate' }));
    const plan = planLampMount(lampMemory.get('firstRun'), resolveLamp({ scene: 'welcome' })!, false, { key: 'firstRun' });
    expect(plan).toEqual([
      { light: { anchor: 'center', core: 'gold', tail: 'amber' }, from: 0.6, to: 0, ms: L.arriveMs },
      { light: top, from: 0, to: 1, ms: L.arriveMs },
    ]);
  });

  it('tabs: the arriving tab starts at the light the last one left and settles to its own over returnMs', () => {
    expect(LAMP_KEYS).toEqual({ firstRun: { settle: 'arrive' }, tabs: { settle: 'return' } });
    // Tonight late at night (amber into dusk) to the Book (gold into amber, still 0.6): a cross-fade, quick.
    lampMemory.set('tabs', resolveLamp({ scene: 'tonight', daypart: 'lateNight' }));
    const book = planLampMount(lampMemory.get('tabs'), resolveLamp({ scene: 'book' })!, false, { key: 'tabs', firstOfSession: false });
    expect(book).toEqual([
      { light: { anchor: 'top', core: 'amber', tail: 'dusk' }, from: 0.8, to: 0, ms: L.returnMs },
      { light: top, from: 0, to: 0.6, ms: L.returnMs },
    ]);
    // The Book to the Family tab: the same gradient, so only the level eases, from 0.6 to 0.4.
    lampMemory.set('tabs', resolveLamp({ scene: 'book' }));
    expect(planLampMount(lampMemory.get('tabs'), resolveLamp({ scene: 'family' })!, false, { key: 'tabs' })).toEqual([{ light: top, from: 0.6, to: 0.4, ms: L.returnMs }]);
  });

  it('keys are separate, and a lamp without a key remembers nothing', () => {
    lampMemory.set('firstRun', resolveLamp({ scene: 'gate' }));
    expect(lampMemory.get('tabs')).toBeUndefined();
    expect(lampMemory.get(undefined)).toBeUndefined();
  });

  it('a scene that gives no light right now fades the remembered one out instead of cutting it', () => {
    lampMemory.set('tabs', resolveLamp({ scene: 'book' }));
    expect(planLampMount(lampMemory.get('tabs'), null, false, { key: 'tabs' })).toEqual([{ light: top, from: 0.6, to: 0, ms: L.returnMs }]);
    expect(planLampMount(undefined, null, false)).toEqual([]);
  });
});

describe('useUnlitRoom: the lamp never cuts between rooms (EXPERIENCE_PASS 5.8 rule 1)', () => {
  const L = tokens.motion.lamp;

  it('an unlit room over a lit one fades the light out over leaveMs and back over returnMs', () => {
    expect(coverTarget(true, false)).toEqual({ to: 0, ms: L.leaveMs });
    expect(coverTarget(false, false)).toEqual({ to: 1, ms: L.returnMs });
    expect(L.leaveMs).toBe(tokens.motion.exitMs);
    expect(L.returnMs).toBe(tokens.motion.enter.durationMs);
  });

  it('the store counts every unlit room and sheet, tells its lamps once per change, and a release is idempotent', () => {
    const rooms = createRoomsStore();
    let heard = 0;
    rooms.subscribe(() => heard++);
    expect(rooms.get()).toEqual({ covered: false, sheetUp: false });
    const listen = rooms.coverUnlit();
    const review = rooms.coverUnlit(); // Listen to Review: still covered, no flicker of light between them
    expect(rooms.get().covered).toBe(true);
    listen();
    listen();
    expect(rooms.get().covered).toBe(true);
    review();
    expect(rooms.get().covered).toBe(false);
    expect(heard).toBe(2);
    const sheet = rooms.openSheet();
    expect(rooms.get()).toEqual({ covered: false, sheetUp: true });
    sheet();
    expect(rooms.get().sheetUp).toBe(false);
  });

  it('Listen, Review, Read together and the letter page are the unlit rooms; Settings and sheets are not', () => {
    // The hook is the contract the screen packages call (P3, P4, P5); nothing in a sheet or Settings may call it.
    const callers = files(SRC).filter((f) => /\buseUnlitRoom\(\)/.test(readFileSync(f, 'utf8')) && !f.endsWith(join('ui', 'lamp.tsx')));
    for (const f of callers) expect(relative(SRC, f), f).toMatch(/^app\/(listen|review|read-together|letter\/\[id\])\.tsx$/);
  });

  it('two lights with the same anchor and tones are one gradient (a change only moves opacity)', () => {
    expect(geometryKey(resolveLamp({ scene: 'welcome' })!)).toBe(geometryKey(resolveLamp({ scene: 'form' })!));
    expect(geometryKey(resolveLamp({ scene: 'gate' })!)).not.toBe(geometryKey(resolveLamp({ scene: 'welcome' })!));
  });
});

/** Walk a folder for the .tsx files that mount <Lamp /> or <LampView />. */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : /\.tsx$/.test(n) ? [p] : [];
  });
}
const SRC = join(__dirname, '..', 'src');
const mounts = (tag: RegExp) =>
  files(SRC)
    .filter((f) => !f.endsWith(join('components', 'ui', 'lamp.tsx')) && tag.test(readFileSync(f, 'utf8')))
    .map((f) => relative(SRC, f).split('\\').join('/'))
    .sort();
const LAMP = /<Lamp(View)?[\s/>]/;

describe('where the lamp may shine (EXPERIENCE_PASS 5.2)', () => {
  /** The rooms with a scene: first run (gate, welcome, promise, naming, signing, the book opens), Tonight, Write, the Book, Read together at night. */
  const ALLOWED = ['app/(tabs)/book.tsx', 'app/(tabs)/family.tsx', 'app/(tabs)/index.tsx', 'app/onboarding.tsx', 'app/read-together.tsx', 'app/write.tsx', 'components/gate/age-gate-screen.tsx'];

  it('is mounted only in rooms that have a scene', () => {
    const used = mounts(LAMP);
    expect(used.length).toBeGreaterThan(0);
    for (const f of used) expect(ALLOWED, f).toContain(f);
  });

  it('never on Listen, Review, the letter page, Settings, Plus, the struggling page, sheets, or any error or state screen', () => {
    for (const f of mounts(LAMP)) {
      expect(f).not.toMatch(/^app\/(listen|review|letter|settings|plus|\+not-found)/);
      expect(f).not.toMatch(/^components\/(resilience|ui\/(sheet|state-screen|empty-state|toast)|child\/plus-gate)/);
    }
  });

  it('Read together uses only its night scene, and Write only its still one', () => {
    const scene = (f: string) => [...readFileSync(join(SRC, f), 'utf8').matchAll(/<Lamp(?:View)?\b([^>]*)\/?>/g)].map((m) => m[1]);
    for (const props of scene('app/read-together.tsx')) expect(props).toMatch(/scene="readTogether"/);
    for (const props of scene('app/write.tsx')) expect(props).toMatch(/scene="write"/);
  });

  it('the quotation pair sits only on the gate, first run and the empty states, never on a voice screen', () => {
    const pair = mounts(/<QuotePair[\s/>]/);
    expect(pair.length).toBeGreaterThan(0);
    for (const f of pair) expect(['app/onboarding.tsx', 'components/gate/age-gate-screen.tsx', 'components/ui/empty-state.tsx'], f).toContain(f);
    // The empty Book leads with it too, through the empty state's device.
    expect(readFileSync(join(SRC, 'app', '(tabs)', 'book.tsx'), 'utf8')).toMatch(/<EmptyState\s+device/);
  });
});
