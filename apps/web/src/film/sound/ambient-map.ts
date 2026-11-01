/**
 * The calm ambient sound of the film: the pure part. No Web Audio, no DOM, no React, so it is unit-tested alone
 * (test/ambient-map.test.ts). It turns how fast the visitor is scrolling, how far down the film they are and the
 * tone of the scene under them into the numbers the synth (ambient-engine.ts) glides to. The melody itself (an
 * original short piece in raga Bhoopali) lives in raga.ts, the plucked-string model in pluck.ts.
 *
 * The sound is made by our own code in the browser: no audio files, no samples, no AI model, no third-party
 * music (docs/web/ambient-sound.md). Every number here is ours.
 */

/**
 * The default for a visitor who has never pressed the sound button: true means the sound is "on" in state and starts
 * with a soft fade-in at their first real gesture (browsers refuse to make sound before one). Set it to false and
 * the sound stays off until a visitor presses the button. Reduced-motion visitors never start with sound on.
 */
export const AMBIENT_DEFAULT_ON = true;

/** Where the visitor's own choice is remembered (this browser only). */
export const STORAGE_KEY = 'el-ambient-sound';

/** The quiet resting level of the master gain, and the most scrolling can lift it to. Both are the master gain after the mix; the melody and drone levels are set inside the engine so the output sits near -23 LUFS at rest. */
export const MASTER_BASE = 0.24;
export const MASTER_MAX = 0.35;

export type SoundTone = 'night' | 'paper' | 'dusk';

export const clamp01 = (v: number): number => (Number.isFinite(v) ? (v < 0 ? 0 : v > 1 ? 1 : v) : 0);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const midiToHz = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

/** Resting low-pass cutoff (Hz) per tone: the lid on the whole mix. Night is rounder, paper is brighter. Tone changes brightness, never the raga. */
export const TONE_CUTOFF: Record<SoundTone, number> = { night: 2600, dusk: 3200, paper: 4000 };
/** Where in the melody's range each tone prefers to sit, 0 (low phrases) to 1 (high phrases). Used by the phrase picker (raga.ts). */
export const TONE_REGISTER: Record<SoundTone, number> = { night: 0.2, dusk: 0.5, paper: 0.85 };
/** Resting reverb per tone: night a little roomier. */
export const TONE_REVERB: Record<SoundTone, number> = { night: 0.4, dusk: 0.36, paper: 0.3 };
/** How hard the strings are plucked at rest, per tone: night softer, paper a touch fuller. 1 is the reference. */
export const TONE_VELOCITY: Record<SoundTone, number> = { night: 0.8, dusk: 0.88, paper: 0.9 };

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
  /** Level of the whole mix (the node after the mix, before the fade). Never above MASTER_MAX. */
  masterGain: number;
  /** How much of the soft reverb is let in, 0..1. */
  reverbWet: number;
  tone: SoundTone;
  /** Which part of the film, 0..1. The phrase picker leans on it a little. */
  progress: number;
  /** Preferred register of the next phrase, 0 (low) to 1 (high). */
  register: number;
  /** Pluck strength, about 0.8 to 1.15. Scrolling lifts it a little: slightly more present, never faster. */
  velocity: number;
  /** Scroll energy, 0..1. */
  energy: number;
  /** Multiplier on the silence between phrases: 1 at rest, down to 0.75 while scrolling. Never a faster tempo. */
  gapScale: number;
  /** How much of the melody feeds the sympathetic strings, 0..1. */
  shimmer: number;
};

export function ambientParams({ energy, progress, tone }: AmbientInput): AmbientParams {
  const e = clamp01(energy);
  const t: SoundTone = tone in TONE_CUTOFF ? tone : 'night';
  const base = TONE_CUTOFF[t];
  return {
    cutoffHz: lerp(base, base + 1500, Math.pow(e, 0.8)),
    masterGain: lerp(MASTER_BASE, MASTER_MAX, e),
    reverbWet: lerp(TONE_REVERB[t], 0.55, e),
    tone: t,
    progress: clamp01(progress),
    register: TONE_REGISTER[t],
    velocity: lerp(TONE_VELOCITY[t], TONE_VELOCITY[t] * 1.12, e),
    energy: e,
    gapScale: lerp(1, 0.75, e),
    shimmer: lerp(0.7, 1, e),
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
