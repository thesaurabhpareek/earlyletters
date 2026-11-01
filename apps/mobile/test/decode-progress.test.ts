/// <reference types="node" />
/**
 * TestFlight build 1 (1 Nov 2026): Review read "Writing down what you said. Part 1 of 3." with a bar that had no fill
 * for minutes. The bar was done / total, which is 0 for the whole first part, and whisper.rn's own per-call progress
 * (0 to 100, `transcribeData({ onProgress })`, whisper.rn 0.7.4 src/index.ts) was never asked for. These tests pin
 * the states Review can show and the values behind the bar.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { wordsCard, type WordsInput } from '../src/components/capture/words-state.logic';
import { initialQueue, reduce, type Job, type QueueEvent, type QueueState } from '../src/lib/transcription-queue/machine';
import { runFraction } from '../src/lib/transcribe-run';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');

const base: WordsInput = {
  emptyFile: false,
  job: null,
  download: { ask: false, progress: null, hold: null, lowSpace: false, size: '575 MB', mb: 575, neededSize: '1.6 GB' },
  hints: { long: false, later: false },
  playing: false,
};
const running = (progress: Job['progress']): WordsInput => ({ ...base, job: { phase: 'running', progress } });

function runningQueue(): QueueState {
  const events: QueueEvent[] = [
    { type: 'packs', ready: ['en'] },
    { type: 'enqueue', id: 'asha-1', kind: 'draft', language: 'en', capturedAt: '2026-11-01T09:00:00.000Z' },
    { type: 'start', id: 'asha-1' },
  ];
  return events.reduce(reduce, initialQueue());
}

describe('the run share from parts and the recogniser', () => {
  it('counts parts done plus the share of the part being written', () => {
    expect(runFraction(0, 3, 0)).toBe(0);
    expect(runFraction(0, 3, 60)).toBeCloseTo(0.2, 6);
    expect(runFraction(1, 3, 50)).toBeCloseTo(0.5, 6);
    expect(runFraction(3, 3, 0)).toBe(1);
  });

  it('stays in 0..1 whatever the inputs', () => {
    expect(runFraction(0, 0, 50)).toBe(0);
    expect(runFraction(0, 3, 250)).toBeCloseTo(1 / 3, 6);
    expect(runFraction(0, 3, Number.NaN)).toBe(0);
    expect(runFraction(5, 3, 50)).toBe(1);
  });
});

describe('the queue keeps the share, and it only rises', () => {
  it('stores the fraction a progress event carries (the old reducer dropped it)', () => {
    const s = reduce(runningQueue(), { type: 'progress', id: 'asha-1', done: 0, total: 3, fraction: 0.2 });
    expect(s.jobs['asha-1'].progress).toEqual({ done: 0, total: 3, fraction: 0.2 });
  });

  it('a part decoded again never moves the bar back', () => {
    let s = reduce(runningQueue(), { type: 'progress', id: 'asha-1', done: 1, total: 3, fraction: 0.6 });
    s = reduce(s, { type: 'progress', id: 'asha-1', done: 1, total: 3, fraction: 1 / 3 });
    expect(s.jobs['asha-1'].progress?.fraction).toBeCloseTo(0.6, 6);
  });

  it('a new part starting (no fraction) keeps the share reached so far', () => {
    let s = reduce(runningQueue(), { type: 'progress', id: 'asha-1', done: 0, total: 3, fraction: 1 / 3 });
    s = reduce(s, { type: 'progress', id: 'asha-1', done: 1, total: 3 });
    expect(s.jobs['asha-1'].progress).toEqual({ done: 1, total: 3, fraction: 1 / 3 });
  });

  it('without a fraction it is parts only, as before', () => {
    const s = reduce(runningQueue(), { type: 'progress', id: 'asha-1', done: 1, total: 3 });
    expect(s.jobs['asha-1'].progress).toEqual({ done: 1, total: 3 });
  });
});

describe('the Review states while the words are written down', () => {
  it('preparing (reading, finding speech, opening the model): the title and no bar, never an empty bar', () => {
    const c = wordsCard(running({ done: 0, total: 0 }));
    expect(c.state).toBe('writing');
    expect(c.bar).toBeUndefined();
  });

  it('part 1 of 3 with the recogniser at 60%: the bar shows 0.2, not 0', () => {
    const c = wordsCard(running({ done: 0, total: 3, fraction: 0.2 }));
    expect(c.title).toBe('Writing down what you said. Part 1 of 3.');
    expect(c.bar).toBeCloseTo(0.2, 6);
  });

  it('a single part gets a bar too once the recogniser reports', () => {
    expect(wordsCard(running({ done: 0, total: 1, fraction: 0.5 })).bar).toBe(0.5);
    expect(wordsCard(running({ done: 0, total: 1 })).bar).toBeUndefined();
  });

  it('if whisper.rn never calls back: "Part 1 of 3" in words and no bar (never an empty bar that looks stuck)', () => {
    const c = wordsCard(running({ done: 0, total: 3 }));
    expect(c.title).toBe('Writing down what you said. Part 1 of 3.');
    expect(c.bar).toBeUndefined();
  });

  it('without the recogniser progress it steps per part, as before', () => {
    expect(wordsCard(running({ done: 1, total: 3 })).bar).toBeCloseTo(1 / 3, 6);
  });

  it('waiting for the download, failed and done are their own states', () => {
    expect(wordsCard({ ...base, job: { phase: 'waiting_for_pack', progress: null } }).state).toBe('downloading');
    expect(wordsCard({ ...base, job: { phase: 'failed', progress: null, failure: 'transcribe_failed' } })).toMatchObject({ state: 'failed', primary: 'retry' });
  });
});

describe('wiring', () => {
  it('the whisper run asks whisper.rn for its per-call progress and passes the share on', () => {
    const w = src('lib/transcribe-whisper.ts');
    expect(w).toMatch(/transcribeData\(pcm, \{[^}]*onProgress: within/);
    expect(w).toMatch(/fraction: runFraction\(/);
    expect(src('lib/transcription-queue/index.ts')).toMatch(/fraction: p\.fraction/);
    // A part's start sends no fraction, so a recogniser that never calls back leaves no stuck bar.
    expect(w).toMatch(/onProgress\?\.\(\{ stage: 'listening', done, total \}\)/);
    // One update per whole percent, for the part fixed at the call's start.
    expect(w).toMatch(/const at = part;/);
    expect(w).toMatch(/if \(!\(whole > lastPct\)\) return;/);
  });

  it('the Review bar track is controlBorder (bg-input), and a moving percent resets the no-progress clock', () => {
    const r = src('app/review.tsx');
    expect(r).toMatch(/h-1 w-full overflow-hidden rounded-full bg-input/);
    expect(r).toMatch(/progressKey = `[^`]*fraction/);
  });
});
