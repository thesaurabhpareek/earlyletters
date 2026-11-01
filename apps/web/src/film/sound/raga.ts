/**
 * The melody of the film's sound: an ORIGINAL short piece in raga Bhoopali, written for this site. Pure data and
 * pure functions, no Web Audio, so it is unit-tested and printed as a contour report (docs/web/ambient-sound.md).
 *
 * Provenance: a raga is a scale and a set of habits, not a composition, and scales are not protected. The six
 * phrases below were composed for this product from the five notes of the scale. None is transcribed from, or
 * modelled on, any bandish, film song, alap or recording; no existing piece was consulted while writing them.
 *
 * Why Bhoopali (Sa Re Ga Pa Dha, a major pentatonic): an evening raga, but above all a safe one. It has no Ma and
 * no Ni, so nothing in it forms a tritone, a flat second or an augmented second against the Sa and Pa of the drone.
 * Every step is a whole tone or a minor third, so a slow glide (meend) between neighbours is always consonant.
 * Yaman needs the raised Ma, which leans towards yearning and is easy to push into drama; Bhoopali stays tender.
 *
 * Pitch is written in semitones above the melody's Sa (D4, 293.66 Hz). The drone's Sa is the same D one octave down.
 */
import { lerp } from './ambient-map';

export const TONIC_HZ = 146.83; // D3: the drone's low Sa
export const MELODY_SA_HZ = TONIC_HZ * 2; // D4
export const BEAT_SECONDS = 60 / 54; // about 54 beats a minute; a beat is a quarter note
export const hzOf = (semis: number): number => MELODY_SA_HZ * Math.pow(2, semis / 12);

/** Scale degrees as semitones above Sa. Anything else is a bug. */
export const BHOOPALI = [0, 2, 4, 7, 9] as const;
const NAMES: Record<number, string> = { 0: 'Sa', 2: 'Re', 4: 'Ga', 7: 'Pa', 9: 'Dha' };

export function noteName(semis: number): string {
  const oct = Math.floor(semis / 12);
  const name = NAMES[((semis % 12) + 12) % 12] ?? `?${semis}`;
  return oct === 0 ? name : oct > 0 ? name + "'".repeat(oct) : name + ','.repeat(-oct);
}

export type PhraseNote = {
  /** Pitch in semitones above Sa. */
  p: number;
  /** Length in beats (quarter notes). Nothing is shorter than half a beat. */
  d: number;
  /** Meend: after the pluck, the string is pulled to this pitch (same scale) and stays there. */
  to?: number;
  /** Kan: a quick touch of this neighbouring note just before the main one. */
  kan?: number;
};

export type Stage = 'open' | 'answer' | 'reach' | 'high' | 'home';

export type Phrase = {
  id: string;
  /** Where it can sit in the larger arc: open, answer, reach, high (the warm peak), home. */
  stages: readonly Stage[];
  /** Centre of its register, 0 low to 1 high. */
  register: number;
  /** What it is meant to do, for the listening checklist. */
  intent: string;
  notes: PhraseNote[];
  /** A second telling with the same arc and a different path; used about four times in ten. */
  alt?: PhraseNote[];
};

/**
 * The six phrases. Each has its own arc: a rise, one stretched peak, a fall, a settling note. Steps are whole tones
 * or minor thirds; the largest leap is a fourth, and only twice. Nothing is shorter than half a beat.
 */
export const PHRASES: readonly Phrase[] = [
  {
    id: 'ask',
    stages: ['open'],
    register: 0.25,
    intent: 'A gentle question: climbs from Sa to Ga, reaches up to Pa on a meend, then leans back to Re and stays open.',
    notes: [
      { p: 0, d: 1.5 },
      { p: 2, d: 1 },
      { p: 4, d: 1.5 },
      { p: 2, d: 1 },
      { p: 4, to: 7, d: 3 },
      { p: 4, d: 1.5, kan: 7 },
      { p: 2, d: 3.5 },
    ],
    alt: [
      { p: 0, d: 1.5 },
      { p: 2, d: 1 },
      { p: 4, d: 1.5 },
      { p: 7, d: 2 },
      { p: 4, to: 2, d: 4 },
    ],
  },
  {
    id: 'sigh',
    stages: ['answer'],
    register: 0.3,
    intent: 'The answer: starts on Pa, sighs down by steps, hesitates once, and a meend carries it home to a long Sa.',
    notes: [
      { p: 7, d: 2 },
      { p: 4, d: 1.5, kan: 7 },
      { p: 2, d: 1 },
      { p: 4, d: 1 },
      { p: 2, to: 0, d: 2.5 },
      { p: -3, d: 1 },
      { p: 0, d: 4.5 },
    ],
    alt: [
      { p: 9, d: 2 },
      { p: 7, d: 1.5 },
      { p: 4, d: 1.5, kan: 7 },
      { p: 2, to: 0, d: 3 },
      { p: -3, d: 1 },
      { p: 0, d: 4.5 },
    ],
  },
  {
    id: 'reach',
    stages: ['reach'],
    register: 0.6,
    intent: 'Reaching: climbs to upper Sa, steps back once, then stretches to upper Re on a long meend before settling on Dha.',
    notes: [
      { p: 4, d: 1.5 },
      { p: 7, d: 1 },
      { p: 9, d: 1.5 },
      { p: 12, d: 1.5 },
      { p: 9, d: 0.75 },
      { p: 12, to: 14, d: 3.5 },
      { p: 12, d: 1, kan: 14 },
      { p: 9, d: 3 },
    ],
    alt: [
      { p: 2, d: 1.5 },
      { p: 4, d: 1 },
      { p: 7, d: 1.5 },
      { p: 9, d: 1 },
      { p: 12, d: 3.5, kan: 14 },
      { p: 9, to: 7, d: 4 },
    ],
  },
  {
    id: 'warmth',
    stages: ['high'],
    register: 0.85,
    intent: 'The warm moment: rises by steps to upper Ga, holds it longest, then comes back down and rests on Pa.',
    notes: [
      { p: 9, d: 1.5 },
      { p: 12, d: 1 },
      { p: 14, d: 1.5 },
      { p: 16, d: 4, kan: 14 },
      { p: 14, d: 1 },
      { p: 12, d: 1.5 },
      { p: 9, to: 7, d: 4 },
    ],
    alt: [
      { p: 7, d: 1.5 },
      { p: 9, d: 1 },
      { p: 12, d: 1.5 },
      { p: 14, d: 1 },
      { p: 16, d: 4 },
      { p: 14, to: 12, d: 4.5 },
    ],
  },
  {
    id: 'lull',
    stages: ['home', 'open'],
    register: 0.1,
    intent: 'Home, low and soft: falls from Ga to Sa, touches the low Dha, rises a step and glides back to Sa.',
    notes: [
      { p: 4, d: 2 },
      { p: 2, d: 1.5 },
      { p: 0, d: 1.5 },
      { p: -3, d: 2.5, kan: 0 },
      { p: 0, d: 1 },
      { p: 2, to: 0, d: 4.5 },
    ],
    alt: [
      { p: 2, d: 2 },
      { p: 0, d: 1.5 },
      { p: -3, d: 2.5, kan: 0 },
      { p: 0, d: 1 },
      { p: 2, to: 0, d: 4.5 },
    ],
  },
  {
    id: 'rest',
    stages: ['home'],
    register: 0.8,
    intent: 'The last word, bright: climbs to Dha, leaps a fourth to upper Re, slides down to upper Sa and rests there.',
    notes: [
      { p: 4, d: 1.5 },
      { p: 7, d: 1 },
      { p: 9, d: 1.5 },
      { p: 14, d: 4, to: 12 },
      { p: 9, d: 1.5 },
      { p: 12, d: 5 },
    ],
  },
];

export type Tone = 'night' | 'dusk' | 'paper';

/** Which stage may follow which, in the larger arc: open, answer, (reach, answer)*, high, home. Random inside the rules. */
export function nextStage(prev: Stage | null, tone: Tone, rand: () => number): Stage {
  switch (prev) {
    case null:
      return 'open';
    case 'open':
      return 'answer';
    case 'answer':
      return rand() < (tone === 'night' ? 0.45 : 0.7) ? 'reach' : rand() < 0.5 ? 'home' : 'open';
    case 'reach':
      return rand() < (tone === 'night' ? 0.15 : tone === 'dusk' ? 0.4 : 0.6) ? 'high' : 'answer';
    case 'high':
      return rand() < 0.65 ? 'home' : 'answer';
    case 'home':
      return rand() < 0.75 ? 'open' : 'answer';
  }
}

/**
 * The next phrase: pick the stage by the arc rules, then a phrase of that stage, leaning to the tone's register.
 * Never the phrase just played, never one of the last two if another will do. `rest` (the bright last word)
 * is only for paper, or the last stretch of the film.
 */
export function pickPhrase(history: readonly string[], prevStage: Stage | null, tone: Tone, progress: number, register: number, rand: () => number): { phrase: Phrase; stage: Stage } {
  const stage = nextStage(prevStage, tone, rand);
  const allowRest = tone === 'paper' || progress > 0.92;
  const eligible = (s: Stage) =>
    PHRASES.filter((p) => p.stages.includes(s) && (p.id !== 'rest' || allowRest) && p.id !== history[history.length - 1]);
  let pool = eligible(stage);
  if (pool.length === 0) pool = eligible('answer');
  if (pool.length === 0) pool = PHRASES.filter((p) => p.id !== history[history.length - 1]);
  const fresh = pool.filter((p) => !history.slice(-2).includes(p.id));
  if (fresh.length) pool = fresh;
  const weights = pool.map((p) => Math.exp(-Math.pow(p.register - register, 2) / 0.25) * (p.id === 'rest' && tone === 'paper' ? 2 : 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  let chosen = pool[0];
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      chosen = pool[i];
      break;
    }
  }
  return { phrase: chosen, stage };
}

/** One note placed in time, with the small human differences of this performance. */
export type TimedNote = {
  /** Seconds from the start of the phrase. */
  at: number;
  /** Seconds the note is meant to last (the string rings on past it). */
  dur: number;
  /** Pitch in semitones above Sa, with a few cents of drift added. */
  p: number;
  to?: number;
  kan?: number;
  /** Pluck strength, about 0.6 to 1.2 before the tone's velocity. */
  vel: number;
  /** Cents of constant detune for this one pluck. */
  cents: number;
};

/**
 * Turn a phrase into a performance: a tempo for this telling (rubato of a few percent), long notes leaned on, short
 * ones nudged, timing and strength never the same twice, the peak note a little louder. `rand` is -1..1 or 0..1: pass 0..1.
 */
export function perform(phrase: Phrase, rand: () => number): { notes: TimedNote[]; seconds: number; alt: boolean } {
  const alt = phrase.alt !== undefined && rand() < 0.4;
  const source = alt ? phrase.alt! : phrase.notes;
  const tempo = lerp(0.93, 1.08, rand());
  const peak = Math.max(...source.map((n) => Math.max(n.p, n.to ?? -99)));
  const notes: TimedNote[] = [];
  let t = 0;
  source.forEach((n, i) => {
    const long = n.d >= 2.5;
    // Rubato: the phrase leans back a little as it goes, short notes wander a few percent, long ones are leaned on.
    const x = i / Math.max(1, source.length - 1);
    const dur = n.d * BEAT_SECONDS * tempo * (1 + 0.05 * (x - 0.5)) * lerp(long ? 0.97 : 0.92, long ? 1.12 : 1.08, rand());
    const isPeak = Math.max(n.p, n.to ?? -99) === peak;
    notes.push({
      at: Math.max(0, t + (i === 0 ? 0 : (rand() - 0.5) * 0.07)),
      dur,
      p: n.p,
      to: n.to,
      kan: n.kan !== undefined && rand() < 0.8 ? n.kan : undefined,
      vel: lerp(0.8, 1.05, rand()) * (isPeak ? 1.1 : 1) * (i === 0 ? 0.92 : 1) * (i === source.length - 1 ? 0.88 : 1),
      cents: (rand() - 0.5) * 8,
    });
    t += dur;
  });
  return { notes, seconds: t, alt };
}

/** Human-readable contour of one phrase, for the docs and the tests. */
export function describe(phrase: Phrase, which: 'main' | 'alt' = 'main'): { names: string; beats: number; steps: string; peak: string; peakIndex: number; resolution: string; largestLeap: number } {
  const list = which === 'alt' && phrase.alt ? phrase.alt : phrase.notes;
  const pitches = list.flatMap((n) => (n.to !== undefined ? [n.p, n.to] : [n.p]));
  const steps = pitches.slice(1).map((p, i) => p - pitches[i]);
  const peak = Math.max(...pitches);
  const last = list[list.length - 1];
  return {
    names: list.map((n) => noteName(n.p) + (n.to !== undefined ? '~' + noteName(n.to) : '') + `(${n.d})`).join(' '),
    beats: list.reduce((a, n) => a + n.d, 0),
    steps: steps.map((s) => (s >= 0 ? '+' + s : String(s))).join(' '),
    peak: noteName(peak),
    peakIndex: pitches.indexOf(peak) + 1,
    resolution: noteName(last.to ?? last.p),
    largestLeap: Math.max(...steps.map(Math.abs)),
  };
}
