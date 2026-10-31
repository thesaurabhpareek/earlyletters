/**
 * The calm ambient sound of the film: the pure part. No Web Audio, no DOM, no React, so it is unit-tested alone
 * (test/ambient-map.test.ts). It turns how fast the visitor is scrolling, how far down the film they are and the
 * tone of the scene under them into the numbers the synth (ambient-engine.ts) glides to.
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

/** The quiet resting level of the master gain, and the most scrolling can lift it to. Both stay well under 0.12. */
export const MASTER_BASE = 0.08;
export const MASTER_MAX = 0.11;

export type SoundTone = 'night' | 'paper' | 'dusk';

export const clamp01 = (v: number): number => (Number.isFinite(v) ? (v < 0 ? 0 : v > 1 ? 1 : v) : 0);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const midiToHz = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

/**
 * Four open, unhurried chords (MIDI notes, four voices each), no hard thirds: suspended and added-ninth shapes
 * that stay gentle whichever way they are joined. The film moves through them as the visitor moves down it.
 */
export const CHORDS: readonly (readonly [number, number, number, number])[] = [
  [50, 57, 64, 69], // D  A  E  A   (D sus2)
  [48, 55, 62, 67], // C  G  D  G   (C sus2)
  [53, 60, 64, 69], // F  C  E  A   (F major 7, open)
  [55, 62, 66, 71], // G  D  F# B   (G major 7)
];

/** Semitones the whole chord leans by for the scene under the visitor: night lower and warmer, paper a touch brighter. */
export const TONE_TRANSPOSE: Record<SoundTone, number> = { night: -2, dusk: 0, paper: 2 };
/** Resting low-pass cutoff (Hz) per tone: the warm lid on the sound. */
export const TONE_CUTOFF: Record<SoundTone, number> = { night: 380, dusk: 480, paper: 640 };
/** How much of the high "air" voice (an octave above the top note) is let in per tone. */
export const TONE_AIR: Record<SoundTone, number> = { night: 0, dusk: 0.2, paper: 0.4 };

/** Scroll speed (px per second) to a 0..1 energy. Soft saturation, so a hard fling is not twice a firm scroll. */
export function energyFromSpeed(pxPerSec: number): number {
  const s = Math.abs(pxPerSec);
  return clamp01(1 - Math.exp(-s / 1500));
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

/** Which chord a position in the film (0 at the top, 1 at the bottom) sits in. */
export function chordIndexAt(progress: number): number {
  return Math.min(CHORDS.length - 1, Math.floor(clamp01(progress) * CHORDS.length));
}

export type AmbientInput = { energy: number; progress: number; tone: SoundTone };

export type AmbientParams = {
  /** Low-pass cutoff in Hz. */
  cutoffHz: number;
  /** Level of the whole pad (the node after the mix, before the fade). */
  masterGain: number;
  /** How much of the soft reverb is let in, 0..1. */
  reverbWet: number;
  /** Frequencies of the four chord voices, Hz. */
  voicesHz: [number, number, number, number];
  /** The high "air" voice: an octave above the top note, Hz, and how loud it is (0..0.5). */
  airHz: number;
  airGain: number;
  /** Which chord this is, for tests. */
  chord: number;
};

export function ambientParams({ energy, progress, tone }: AmbientInput): AmbientParams {
  const e = clamp01(energy);
  const chord = chordIndexAt(progress);
  const shift = TONE_TRANSPOSE[tone] ?? 0;
  const base = TONE_CUTOFF[tone] ?? TONE_CUTOFF.night;
  const notes = CHORDS[chord].map((n) => midiToHz(n + shift)) as AmbientParams['voicesHz'];
  return {
    cutoffHz: lerp(base, base + 1400, Math.pow(e, 0.8)),
    masterGain: lerp(MASTER_BASE, MASTER_MAX, e),
    reverbWet: lerp(0.4, 0.58, e),
    voicesHz: notes,
    airHz: midiToHz(CHORDS[chord][3] + shift + 12),
    airGain: (TONE_AIR[tone] ?? 0) * 0.5 + e * 0.1,
    chord,
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
