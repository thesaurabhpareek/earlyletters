import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
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

  it('dark: the core takes the core tone and the tail the tail tone, each at stop x its own peak', () => {
    const night = resolveLamp({ scene: 'tonight', daypart: 'night' })!;
    const stops = lampStops(night, 'dark');
    expect(stops[0]).toEqual({ offset: 0, color: A.tone.amber, opacity: A.peak.dark.amber });
    for (const [i, s] of stops.slice(1).entries()) {
      expect(s.color).toBe(A.tone.rose);
      expect(s.opacity).toBeCloseTo(STOPS[i + 1].opacity * A.peak.dark.rose);
    }
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

  it('dark: every text colour keeps 4.5:1 everywhere, in every scene and daypart', () => {
    const c = tokens.dark;
    for (const [name, light] of lights) {
      for (const box of BOXES) {
        for (const [x, y] of grid(box)) {
          const lit = litPaperAt(light, 'dark', c.bg, box, x, y);
          for (const k of [...READING, ...STATUS]) expect(ratio(rgb(c[k]), lit), `${k} on dark ${name} at ${x},${y}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it('light: every reading colour (text, textMuted, accent, focus) keeps 4.5:1 everywhere, even at the core', () => {
    const c = tokens.light;
    for (const [name, light] of lights) {
      for (const box of BOXES) {
        for (const [x, y] of grid(box)) {
          const lit = litPaperAt(light, 'light', c.bg, box, x, y);
          for (const k of READING) expect(ratio(rgb(c[k]), lit), `${k} on light ${name} at ${x},${y} of ${box.width}x${box.height}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it(`light: in a room lit from the top every status colour keeps 4.5:1 from ${STATUS_CLEAR_FROM * 100} percent of the height down`, () => {
    const c = tokens.light;
    for (const [name, light] of lights.filter(([, l]) => l.anchor === 'top')) {
      for (const box of BOXES) {
        for (const [x, y] of grid(box).filter(([, gy]) => gy >= STATUS_CLEAR_FROM * box.height)) {
          const lit = litPaperAt(light, 'light', c.bg, box, x, y);
          for (const k of STATUS) expect(ratio(rgb(c[k]), lit), `${k} on light ${name} at ${x},${y}`).toBeGreaterThanOrEqual(4.5);
        }
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
  const ROOMS: { room: string; box: LampBox; lights: LampLight[]; text: Box[] }[] = [
    {
      room: 'Tonight',
      box: { width: 402, height: 808 },
      lights: [
        resolveLamp({})!,
        ...DAYPARTS.map((d) => resolveLamp({ scene: 'tonight', daypart: d })!),
        resolveLamp({ scene: 'tonight', daypart: 'evening', intensity: tokens.motion.lamp.dimTo })!,
      ],
      text: [
        { what: 'dateline', token: 'textMuted', x: 20, y: 17, w: 115, h: 23 },
        { what: 'greeting', token: 'text', x: 20, y: 45, w: 354, h: 50 },
        { what: 'subtitle', token: 'textMuted', x: 20, y: 96, w: 346, h: 30 },
        { what: 'Not much today', token: 'accent', x: 139, y: 745, w: 123, h: 30 },
        { what: 'A quiet day, kept.', token: 'success', x: 116, y: 746, w: 121, h: 28 },
        { what: 'Undo', token: 'accent', x: 261, y: 746, w: 37, h: 27 },
      ],
    },
    {
      room: 'the age question',
      box: { width: 402, height: 874 },
      lights: [resolveLamp({ scene: 'gate' })!],
      text: [
        { what: 'question', token: 'text', x: 20, y: 59, w: 334, h: 53 },
        { what: 'body', token: 'textMuted', x: 20, y: 127, w: 274, h: 30 },
        { what: 'Continue (not yet chosen)', token: 'textMuted', x: 166, y: 807, w: 69, h: 30 },
      ],
    },
    {
      room: 'the welcome',
      box: { width: 402, height: 874 },
      lights: [resolveLamp({ scene: 'welcome' })!, resolveLamp({ scene: 'form' })!, resolveLamp({ scene: 'finish' })!],
      text: [
        { what: 'title', token: 'text', x: 24, y: 336, w: 266, h: 66 },
        { what: 'promise', token: 'textMuted', x: 24, y: 404, w: 328, h: 57 },
        { what: 'voice line', token: 'text', x: 24, y: 481, w: 347, h: 54 },
        { what: 'free line', token: 'textMuted', x: 24, y: 553, w: 208, h: 28 },
      ],
    },
  ];

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

  it('light: the grain is signed and faint, and lies inside the light (it comes and goes with it); dark has none', () => {
    const g = A.grain;
    expect(grainMean('dark')).toEqual({ black: 0, white: 0 });
    expect(grainMean('light').black).toBeCloseTo((0.5 * g.blackMax) / 2 / 255);
    expect(g.blackMax / 255).toBeLessThanOrEqual(0.02); // a speck moves a pixel by a few levels at most
    expect(g.whiteMax / 255).toBeLessThanOrEqual(0.06);
    const lampSrc = readFileSync(join(SRC, 'components', 'ui', 'lamp.tsx'), 'utf8');
    expect(lampSrc).toMatch(/grainTexture/);
    expect(lampSrc).toMatch(/const grain = scheme === 'light'/);
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
  });
});
