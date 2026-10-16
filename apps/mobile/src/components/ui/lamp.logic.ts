/**
 * Pure values for Lamp (no React Native import, so they are unit tested in test/lamp.test.ts).
 * Colours, peaks, scenes and dayparts come from tokens.atmosphere; timing from tokens.motion.lamp.
 * Nothing is typed here except the gradient's shape and where each anchor sits.
 */
import { tokens, type ColorScheme, type Daypart, type LampScene, type LampTone } from '@scribe/design-tokens';

export type LampAnchor = 'top' | 'center' | 'bottom';

/** Where the light sits, as fractions of the screen. `r` is the gradient radius against the box (EXPERIENCE_PASS 5.2). */
export const ANCHORS: Record<LampAnchor, { cx: number; cy: number; r: number }> = {
  top: { cx: 0.5, cy: 0, r: 0.95 },
  center: { cx: 0.5, cy: 0.42, r: 0.8 },
  bottom: { cx: 0.5, cy: 1, r: 0.9 },
};

/**
 * Strong core, long soft tail (the website's closest-side radial lamp). One gradient, drawn once.
 * Offset 0 takes the core tone; the others take the tail tone.
 */
export const STOPS = [
  { offset: 0, opacity: 1 },
  { offset: 0.38, opacity: 0.45 },
  { offset: 0.66, opacity: 0.12 },
  { offset: 1, opacity: 0 },
] as const;

/** One light, resolved: where it sits, its two tones, how strong it is (0 to 1) and whether it breathes. */
export type LampLight = { anchor: LampAnchor; core: LampTone; tail: LampTone; intensity: number; breathe: boolean };

export type LampInput = {
  /** A room from tokens.atmosphere.scene. Without one, the lamp is #99's warm pool (gold into amber, breathing). */
  scene?: LampScene;
  /** Tonight's time of day (greetingKey()). Tonight takes its tones from it; Read together shows only at night. */
  daypart?: Daypart;
  /** Overrides the scene's anchor. */
  anchor?: LampAnchor;
  /** Multiplies the scene's intensity: tokens.motion.lamp.dimTo for "Not much today", 0.5 at the end of the book. */
  intensity?: number;
  /** Holds the light still even where the scene would breathe. */
  still?: boolean;
};

/** Greeting keys that count as night for Read together's dusk pool (S30: evening, night or late night). */
export const NIGHT: readonly Daypart[] = ['evening', 'night', 'lateNight'];

export const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/** The light a scene gives right now, or null when it gives none (Read together by day). */
export function resolveLamp({ scene, daypart, anchor, intensity = 1, still = false }: LampInput): LampLight | null {
  if (!scene) return { anchor: anchor ?? 'top', core: 'gold', tail: 'amber', intensity: clamp01(intensity), breathe: !still };
  const s = tokens.atmosphere.scene[scene] as {
    anchor: LampAnchor;
    breathe: boolean;
    core?: LampTone;
    tail?: LampTone;
    intensity?: number;
    daypart?: true;
    nightOnly?: true;
  };
  if (s.nightOnly && !(daypart && NIGHT.includes(daypart))) return null;
  const tones = s.daypart ? tokens.atmosphere.daypart[daypart ?? 'evening'] : { core: s.core!, tail: s.tail!, intensity: s.intensity! };
  return {
    anchor: anchor ?? s.anchor,
    core: tones.core,
    tail: tones.tail,
    intensity: clamp01(tones.intensity * intensity),
    breathe: s.breathe && !still,
  };
}

/** Increase Contrast and Reduce Transparency both ask for plain paper: no lamp at all. */
export function lampAllowed(a: { highContrast: boolean; reduceTransparency: boolean }): boolean {
  return !a.highContrast && !a.reduceTransparency;
}

/** The gradient's stops for a light: each stop's opacity is stop x peak[scheme][tone]. Intensity is the wrapper's opacity. */
export function lampStops(light: Pick<LampLight, 'core' | 'tail'>, scheme: ColorScheme) {
  return STOPS.map((s, i) => {
    const tone = i === 0 ? light.core : light.tail;
    return { offset: s.offset, color: tokens.atmosphere.tone[tone], opacity: s.opacity * tokens.atmosphere.peak[scheme][tone] };
  });
}

/** Two lights with the same key draw the same gradient, so a change between them only moves opacity. */
export function geometryKey(light: Pick<LampLight, 'anchor' | 'core' | 'tail'>): string {
  return `${light.anchor}:${light.core}:${light.tail}`;
}

/**
 * The breathing loop as a CSS-style keyframe rule for Reanimated's CSS animations. They run
 * natively on the UI thread (and as a real CSS animation on web), with no JS per frame.
 * Opacity only.
 */
export function breathKeyframes() {
  return { from: { opacity: 1 }, to: { opacity: tokens.motion.lamp.breathOpacityMin } };
}

/**
 * Whether the loop may run: only for a breathing scene, never while hidden, backgrounded, under Reduce Motion, or
 * while a sheet sits over the room (the room keeps its light and pauses its breath, EXPERIENCE_PASS 5.8 row 10).
 */
export function shouldBreathe(s: { reduced: boolean; appActive: boolean; focused: boolean; visible: boolean; breathe?: boolean; sheetUp?: boolean }): boolean {
  return (s.breathe ?? true) && s.visible && s.appActive && s.focused && !s.reduced && !s.sheetUp;
}

/* ------------------------------------------------------------------ */
/* persistKey: one light across screens                                */
/* ------------------------------------------------------------------ */

/**
 * The two sets of rooms that share one light (EXPERIENCE_PASS 5.2, 5.8):
 *   firstRun  the gate and onboarding: the light never goes out between them, and each step rises or dims to its
 *             scene slowly (arriveMs), as first run is one lit room.
 *   tabs      Tonight, the Book and the Family tab: the arriving tab starts at the tone and level the last one left
 *             and settles to its own over returnMs.
 */
export const LAMP_KEYS = { firstRun: { settle: 'arrive' }, tabs: { settle: 'return' } } as const;
export type LampKey = keyof typeof LAMP_KEYS;

/** What a lamp remembers between screens: the light it showed and the level it was at (or heading to). */
export type LampMemory = { light: Omit<LampLight, 'intensity' | 'breathe'>; level: number };

/** A layer of the lamp: one gradient whose opacity goes from `from` to `to` over `ms`. */
export type LampLayerPlan = { light: Omit<LampLight, 'intensity' | 'breathe'>; from: number; to: number; ms: number };

/** How long a lamp takes to come up: the slow arrival for the session's first lit room (or when asked), else a return. */
export function arrivalMs(o: { firstOfSession: boolean; arrive?: boolean }): number {
  const L = tokens.motion.lamp;
  return o.firstOfSession || o.arrive ? L.arriveMs : L.returnMs;
}

/**
 * How a lamp starts.
 * - No memory: it comes up from unlit. Slowly (arriveMs) if it is the first lit room since the app opened, or the
 *   screen asks (`arrive`: Read together's dusk pool, the second parent's first Book); otherwise it returns (returnMs).
 * - A memory of the same gradient: it mounts at the remembered level and only rises or dims to the new one, over the
 *   key's settle (LAMP_KEYS). It never arrives again, so there is no frame of unlit paper between the rooms.
 * - A memory of a different gradient (the gate's centred pool to the welcome's top pool, Tonight's night light to the
 *   Book's): the old light fades out while the new one comes up, over the same settle.
 * Under Reduce Motion every layer starts at its final state.
 */
export function planLampMount(
  memory: LampMemory | undefined,
  next: LampLight | null,
  reduced: boolean,
  o: { key?: LampKey; firstOfSession?: boolean; arrive?: boolean } = {},
): LampLayerPlan[] {
  const L = tokens.motion.lamp;
  const settle = o.key && LAMP_KEYS[o.key].settle === 'return' ? L.returnMs : L.arriveMs;
  const level = next ? next.intensity : 0;
  if (!next) return memory && !reduced ? [{ light: memory.light, from: memory.level, to: 0, ms: settle }] : [];
  const light = { anchor: next.anchor, core: next.core, tail: next.tail };
  if (reduced) return [{ light, from: level, to: level, ms: 0 }];
  if (!memory || memory.level === 0) return [{ light, from: 0, to: level, ms: arrivalMs({ firstOfSession: o.firstOfSession ?? !memory, arrive: o.arrive }) }];
  if (geometryKey(memory.light) === geometryKey(light)) return [{ light, from: memory.level, to: level, ms: settle }];
  return [
    { light: memory.light, from: memory.level, to: 0, ms: settle },
    { light, from: 0, to: level, ms: settle },
  ];
}

/** The session's memory of lit lamps, by persistKey. Lives as long as the JS runtime (one app session). */
const remembered = new Map<string, LampMemory>();
let litThisSession = false;

export const lampMemory = {
  get: (key: string | undefined): LampMemory | undefined => (key ? remembered.get(key) : undefined),
  set: (key: string | undefined, light: LampLight | null, fallback?: LampMemory): void => {
    if (light && light.intensity > 0) litThisSession = true;
    if (!key) return;
    if (light) remembered.set(key, { light: { anchor: light.anchor, core: light.core, tail: light.tail }, level: light.intensity });
    else if (fallback) remembered.set(key, { ...fallback, level: 0 });
  },
  /** True until some lamp has been lit since the app opened: that first room is the only slow arrival. */
  firstOfSession: (): boolean => !litThisSession,
  /** Tests only. */
  clear: (): void => {
    remembered.clear();
    litThisSession = false;
  },
};

/* ------------------------------------------------------------------ */
/* Rooms over the light: unlit rooms and sheets                        */
/* ------------------------------------------------------------------ */

/**
 * A screen with no lamp that covers a lit one (Listen, Review, Read together, the letter page) is an unlit room:
 * while one is up, every mounted lamp eases to 0 over leaveMs, and back over returnMs when it leaves. A sheet is not
 * an unlit room: under it the room keeps its light and only pauses its breath. A Settings push is neither: the lit
 * screen slides away with its light intact.
 */
export function createRoomsStore() {
  let unlit = 0;
  let sheets = 0;
  let snapshot = { covered: false, sheetUp: false };
  const listeners = new Set<() => void>();
  const emit = () => {
    const next = { covered: unlit > 0, sheetUp: sheets > 0 };
    if (next.covered === snapshot.covered && next.sheetUp === snapshot.sheetUp) return;
    snapshot = next;
    listeners.forEach((l) => l());
  };
  const hold = (kind: 'unlit' | 'sheet') => {
    if (kind === 'unlit') unlit++;
    else sheets++;
    emit();
    let released = false;
    return () => {
      if (released) return;
      released = true;
      if (kind === 'unlit') unlit--;
      else sheets--;
      emit();
    };
  };
  return {
    get: () => snapshot,
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    /** An unlit room is on screen until the returned release is called. */
    coverUnlit: () => hold('unlit'),
    /** A sheet is up until the returned release is called. */
    openSheet: () => hold('sheet'),
  };
}

/** The app's one store of rooms over the light. */
export const lampRooms = createRoomsStore();

/** Where the cover over every lamp is heading: out over leaveMs while an unlit room is up, back over returnMs. */
export function coverTarget(covered: boolean, reduced: boolean): { to: number; ms: number } {
  const L = tokens.motion.lamp;
  if (reduced) return { to: covered ? 0 : 1, ms: 0 };
  return covered ? { to: 0, ms: L.leaveMs } : { to: 1, ms: L.returnMs };
}
