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
export const MASTER_BASE = 0.24;
export const MASTER_MAX = 0.35;

export type SoundTone = 'night' | 'paper' | 'dusk';

export const clamp01 = (v: number): number => (Number.isFinite(v) ? (v < 0 ? 0 : v > 1 ? 1 : v) : 0);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const midiToHz = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

/**
 * Four open, unhurried chords (MIDI notes, four voices each), no hard thirds: suspended and added-ninth shapes
 * that stay gentle whichever way they are joined. They sit about an octave above the first version (lowest note
 * around 260 Hz), where phone and laptop speakers can actually play them. The film moves through them as the
 * visitor moves down it, by a slow crossfade between two voice banks (ambient-engine.ts), never by a pitch slide.
 */
export const CHORDS: readonly (readonly [number, number, number, number])[] = [
  [62, 69, 76, 81], // D  A  E  A   (D sus2)
  [60, 67, 74, 79], // C  G  D  G   (C sus2)
  [65, 72, 76, 81], // F  C  E  A   (F major 7, open)
  [67, 74, 78, 83], // G  D  F# B   (G major 7)
];

/** Resting low-pass cutoff (Hz) per tone: the warm lid on the sound. Tone changes brightness, never pitch. */
export const TONE_CUTOFF: Record<SoundTone, number> = { night: 900, dusk: 1020, paper: 1200 };
/** The high "air" voice (an octave above the chord's second note) at rest, per tone: night quieter, paper a touch brighter. */
export const TONE_AIR: Record<SoundTone, number> = { night: 0.1, dusk: 0.14, paper: 0.18 };
/** Resting reverb per tone: night a little roomier and softer. */
export const TONE_REVERB: Record<SoundTone, number> = { night: 0.46, dusk: 0.42, paper: 0.36 };

/**
 * Level trim per chord, from measuring the live output: the same gain on every chord is not the same loudness (the
 * higher voicings sit nearer the low-pass and the voice leading changes how the partials add), so each chord is
 * trimmed to about the same RMS. Applied to the chord's voice bank, so it moves with the crossfade, not before it.
 */
export const CHORD_TRIM: readonly number[] = [1.8, 1.1, 1.6, 1.2];

/** Seconds a chord change takes: the old voice bank fades out as the new one fades in (equal power). */
export const CROSSFADE_SECONDS = 10;
/** The sparse single tone: one every 20 to 40 s, a chord tone only, about -30 dBFS, 3 s attack, 6 s decay. */
export const TONE_EVERY_SECONDS: readonly [number, number] = [20, 40];

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

/** Which chord a position in the film (0 at the top, 1 at the bottom) sits in. */
export function chordIndexAt(progress: number): number {
  return Math.min(CHORDS.length - 1, Math.floor(clamp01(progress) * CHORDS.length));
}

export type AmbientInput = { energy: number; progress: number; tone: SoundTone };

export type AmbientParams = {
  /** Low-pass cutoff in Hz. */
  cutoffHz: number;
  /** Level of the whole pad (the node after the mix, before the fade). Never above MASTER_MAX. */
  masterGain: number;
  /** How much of the soft reverb is let in, 0..1. */
  reverbWet: number;
  /** Frequencies of the four chord voices, Hz. */
  voicesHz: [number, number, number, number];
  /** The high "air" voice: an octave above the chord's second note, Hz, and how loud it is (0.1 to 0.25). */
  airHz: number;
  airGain: number;
  /** Which chord this is. The engine crossfades banks when it changes. */
  chord: number;
  /** The level trim of that chord's voice bank. */
  bankTrim: number;
};

export function ambientParams({ energy, progress, tone }: AmbientInput): AmbientParams {
  const e = clamp01(energy);
  const chord = chordIndexAt(progress);
  const base = TONE_CUTOFF[tone] ?? TONE_CUTOFF.night;
  const notes = CHORDS[chord].map((n) => midiToHz(n)) as AmbientParams['voicesHz'];
  return {
    cutoffHz: lerp(base, base + 1500, Math.pow(e, 0.8)),
    masterGain: lerp(MASTER_BASE, MASTER_MAX, e),
    reverbWet: lerp(TONE_REVERB[tone] ?? TONE_REVERB.night, 0.68, e),
    voicesHz: notes,
    airHz: midiToHz(CHORDS[chord][1] + 12),
    airGain: Math.min(0.25, lerp(TONE_AIR[tone] ?? TONE_AIR.night, 0.25, e)),
    chord,
    bankTrim: CHORD_TRIM[chord] ?? 1,
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
