import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { en } from '@scribe/content';
import { tokens, type Daypart, type LampScene } from '@scribe/design-tokens';
import {
  ANCHORS,
  LAMP_KEYS,
  NIGHT,
  STOPS,
  breathKeyframes,
  coverTarget,
  createRoomsStore,
  geometryKey,
  lampAllowed,
  lampMemory,
  lampStops,
  planLampMount,
  resolveLamp,
  shouldBreathe,
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
  it('fades to nothing at its edge, so no hard edge ever shows', () => {
    expect(STOPS[0].opacity).toBe(1);
    expect(STOPS[STOPS.length - 1].opacity).toBe(0);
    for (let i = 1; i < STOPS.length; i++) expect(STOPS[i].opacity).toBeLessThan(STOPS[i - 1].opacity);
  });

  it('the core takes the core tone and the tail the tail tone, each at stop x its own peak', () => {
    const night = resolveLamp({ scene: 'tonight', daypart: 'night' })!;
    const stops = lampStops(night, 'dark');
    expect(stops[0]).toEqual({ offset: 0, color: A.tone.amber, opacity: A.peak.dark.amber });
    for (const [i, s] of stops.slice(1).entries()) {
      expect(s.color).toBe(A.tone.rose);
      expect(s.opacity).toBeCloseTo(STOPS[i + 1].opacity * A.peak.dark.rose);
    }
  });

  /** WCAG 2.x, sRGB. SVG interpolates stop colour and stop opacity separately (non-premultiplied), so sample that. */
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
  const TEXT = ['text', 'textMuted', 'accent', 'success', 'caution', 'recording', 'destructive', 'focus'] as const;

  it('every text colour keeps 4.5:1 everywhere in every scene and daypart, light and dark, at full strength', () => {
    const lights: [string, LampLight][] = [
      ...SCENES.filter((s) => s !== 'tonight' && s !== 'readTogether').map((s) => [s, resolveLamp({ scene: s })!] as [string, LampLight]),
      ...DAYPARTS.map((d) => [`tonight ${d}`, resolveLamp({ scene: 'tonight', daypart: d })!] as [string, LampLight]),
      ['readTogether', resolveLamp({ scene: 'readTogether', daypart: 'night' })!],
    ];
    for (const scheme of ['light', 'dark'] as const) {
      const c = tokens[scheme];
      const bg = rgb(c.bg);
      for (const [name, light] of lights) {
        // Full intensity (1) and the top of the breath (1), whatever the scene asks: the brightest the pool can ever be.
        const stops = lampStops(light, scheme).map((s) => ({ ...s, rgb: rgb(s.color) }));
        for (let i = 0; i <= 100; i++) {
          const t = i / 100;
          const j = Math.max(0, stops.findIndex((s, k) => k > 0 && s.offset >= t) - 1);
          const [s0, s1] = [stops[j], stops[j + 1]];
          const f = (t - s0.offset) / (s1.offset - s0.offset);
          const col = s0.rgb.map((v, k) => v + (s1.rgb[k] - v) * f);
          const alpha = s0.opacity + (s1.opacity - s0.opacity) * f;
          const lit = col.map((v, k) => v * alpha + bg[k] * (1 - alpha));
          for (const k of TEXT) expect(ratio(rgb(c[k]), lit), `${k} on ${scheme} ${name} at ${t}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
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
