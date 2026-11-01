/**
 * The calm ambient sound of the film: the pure part. No Web Audio, no DOM, no React, so it is unit-tested alone
 * (test/ambient-map.test.ts). It turns how fast the visitor is scrolling, how far down the film they are and the
 * tone of the scene under them into the numbers the synth (ambient-engine.ts) glides to. The music itself is a
 * licensed recording from tracks.ts, played by ambient-engine.ts (docs/web/ambient-sound.md).
 */

/**
 * The default for a visitor who has never pressed the sound button: true means the sound is "on" in state and starts
 * with a soft fade-in at their first real gesture (browsers refuse to make sound before one). Set it to false and
 * the sound stays off until a visitor presses the button. Reduced-motion visitors never start with sound on.
 */
export const AMBIENT_DEFAULT_ON = true;

/** Where the visitor's own choice is remembered (this browser only). */
export const STORAGE_KEY = 'el-ambient-sound';

export type SoundTone = 'night' | 'paper' | 'dusk';

export const clamp01 = (v: number): number => (Number.isFinite(v) ? (v < 0 ? 0 : v > 1 ? 1 : v) : 0);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const midiToHz = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

/**
 * Level of the whole mix as a multiplier on the track's own trim (tracks.ts gainDb), per tone: night softest, paper
 * fullest. Scrolling lifts it by at most 3.3 dB (MASTER_MAX / MASTER_BASE).
 */
export const MASTER_BASE = 1;
export const MASTER_MAX = 1.46;
export const TONE_GAIN: Record<SoundTone, number> = { night: 0.8, dusk: 0.9, paper: 1 };

/** Resting low-pass cutoff (Hz) per tone: a lid on a real recording. Night is rounder, paper is open. Scrolling opens it a little. */
export const TONE_CUTOFF: Record<SoundTone, number> = { night: 5500, dusk: 7500, paper: 10000 };
/** The most scrolling opens the lid by (Hz). */
export const CUTOFF_LIFT = 2500;

/** Scroll speed (px per second) to a 0..1 energy. Soft saturation, so a hard fling is not twice a firm scroll. */
export function energyFromSpeed(pxPerSec: number): number {
  const s = Math.abs(pxPerSec);
  return clamp01(1 - Math.exp(-s / 900));
}

/**
 * One step of the smoothing between scroll energy samples. It rises in a few tenths of a second and falls back over
 * a few seconds, so a flick opens the sound and stopping eases it back to calm. dtSec is the time since the last step.
 */
export function smoothEnergy(prev: number, target: number, dtSec: number): number {
  const dt = Math.max(0, Math.min(dtSec, 1));
  const tau = target > prev ? 0.45 : 2.6;
  const a = 1 - Math.exp(-dt / tau);
  return clamp01(prev + (target - prev) * a);
}

export type AmbientInput = { energy: number; progress: number; tone: SoundTone };

export type AmbientParams = {
  /** Low-pass cutoff in Hz. */
  cutoffHz: number;
  /** Multiplier on the track's level: tone-aware, lifted a little by scrolling. Never above TONE_GAIN x MASTER_MAX. */
  masterGain: number;
  tone: SoundTone;
  /** Which part of the film, 0..1. */
  progress: number;
  /** Scroll energy, 0..1. */
  energy: number;
};

export function ambientParams({ energy, progress, tone }: AmbientInput): AmbientParams {
  const e = clamp01(energy);
  const t: SoundTone = tone in TONE_CUTOFF ? tone : 'night';
  const base = TONE_CUTOFF[t];
  return {
    cutoffHz: lerp(base, base + CUTOFF_LIFT, Math.pow(e, 0.8)),
    masterGain: TONE_GAIN[t] * lerp(MASTER_BASE, MASTER_MAX, e),
    tone: t,
    progress: clamp01(progress),
    energy: e,
  };
}

/** Where the visitor is in the film, 0..1, from the three numbers the page already has. */
export function scrollProgress(scrollY: number, scrollHeight: number, viewportHeight: number): number {
  const range = scrollHeight - viewportHeight;
  return range > 0 ? clamp01(scrollY / range) : 0;
}

export function asTone(value: string | undefined | null): SoundTone {
  return value === 'paper' || value === 'dusk' || value === 'night' ? value : 'night';
}

/** The remembered choice: true (on), false (off) or null (never chosen). Storage may throw or be absent. */
export function readChoice(storage: Pick<Storage, 'getItem'> | null | undefined): boolean | null {
  try {
    const v = storage?.getItem(STORAGE_KEY);
    return v === 'on' ? true : v === 'off' ? false : null;
  } catch {
    return null;
  }
}

export function writeChoice(storage: Pick<Storage, 'setItem'> | null | undefined, on: boolean): void {
  try {
    storage?.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    // Private windows and blocked storage: the choice just lasts until the page closes.
  }
}

/**
 * Whether the sound should be on when the page opens: the visitor's own earlier choice wins; with none it is
 * AMBIENT_DEFAULT_ON. Reduced motion never starts on its own, whatever was stored: the visitor presses it each visit.
 */
export function initialWanted(stored: boolean | null, reducedMotion: boolean, defaultOn: boolean = AMBIENT_DEFAULT_ON): boolean {
  if (reducedMotion) return false;
  return stored ?? defaultOn;
}

export type ToggleView = 'on' | 'blocked' | 'off';

/** What the button shows, truthfully: "on" only while the sound is actually playing. */
export function toggleView(wanted: boolean, playing: boolean): ToggleView {
  if (playing) return 'on';
  return wanted ? 'blocked' : 'off';
}
