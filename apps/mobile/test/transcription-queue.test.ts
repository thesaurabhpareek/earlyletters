import { describe, expect, it } from 'vitest';
import type { DictionaryTerm } from '@scribe/core';
import {
  MAX_AUTO_ATTEMPTS,
  RETRY_DELAYS_MS,
  initialQueue,
  languagesWaiting,
  nextJob,
  nextRetryAt,
  reduce,
  type QueueEvent,
  type QueueState,
} from '../src/lib/transcription-queue/machine';
import { cleanSpoken, spokenEditLevel } from '../src/lib/transcription-queue/clean';

const T0 = 1_000_000;

function run(events: QueueEvent[], from: QueueState = initialQueue()): QueueState {
  return events.reduce(reduce, from);
}

const enqueue = (id: string, kind: 'draft' | 'entry', language: 'en' | 'hi' | 'zh', capturedAt: string): QueueEvent => ({
  type: 'enqueue',
  id,
  kind,
  language,
  capturedAt,
});

describe('transcription queue: order and readiness', () => {
  it('waits for the language pack, then runs (FM-9: the recording is already safe)', () => {
    let s = run([enqueue('a', 'entry', 'hi', '2026-10-01T10:00:00Z')]);
    expect(s.jobs.a.phase).toBe('waiting_for_pack');
    expect(nextJob(s, T0)).toBeNull();
    expect(languagesWaiting(s)).toEqual(['hi']);
    s = reduce(s, { type: 'packs', ready: ['hi'] });
    expect(s.jobs.a.phase).toBe('queued');
    expect(nextJob(s, T0)).toBe('a');
    // The pack removed again: back to waiting.
    s = reduce(s, { type: 'packs', ready: [] });
    expect(s.jobs.a.phase).toBe('waiting_for_pack');
  });

  it('runs a draft open in Review before waiting letters, then letters oldest first', () => {
    const s = run([
      { type: 'packs', ready: ['en'] },
      enqueue('late', 'entry', 'en', '2026-10-02T10:00:00Z'),
      enqueue('early', 'entry', 'en', '2026-10-01T10:00:00Z'),
      enqueue('review', 'draft', 'en', '2026-10-03T10:00:00Z'),
    ]);
    expect(nextJob(s, T0)).toBe('review');
    const s2 = run([{ type: 'start', id: 'review' }, { type: 'finish', id: 'review', outcome: 'ok' }], s);
    expect(nextJob(s2, T0)).toBe('early');
  });

  it('skips letters whose language is not ready and runs the ones that are', () => {
    const s = run([
      { type: 'packs', ready: ['en'] },
      enqueue('hindi', 'entry', 'hi', '2026-10-01T10:00:00Z'),
      enqueue('english', 'entry', 'en', '2026-10-02T10:00:00Z'),
    ]);
    expect(nextJob(s, T0)).toBe('english');
  });

  it('[FM-18] never queues the same recording twice, and runs one job at a time', () => {
    let s = run([{ type: 'packs', ready: ['en'] }, enqueue('a', 'draft', 'en', 'x'), enqueue('a', 'draft', 'en', 'x'), enqueue('b', 'entry', 'en', 'y')]);
    expect(Object.keys(s.jobs)).toEqual(['a', 'b']);
    s = reduce(s, { type: 'start', id: 'a' });
    expect(s.running).toBe('a');
    expect(nextJob(s, T0)).toBeNull();
    expect(reduce(s, { type: 'start', id: 'b' })).toBe(s); // a second start is refused while one runs
  });

  it('[PRD 7.7] runs nothing in the background', () => {
    const s = run([{ type: 'packs', ready: ['en'] }, enqueue('a', 'entry', 'en', 'x'), { type: 'foreground', value: false }]);
    expect(nextJob(s, T0)).toBeNull();
    expect(nextJob(reduce(s, { type: 'foreground', value: true }), T0)).toBe('a');
  });
});

describe('transcription queue: lifecycle', () => {
  const ready = run([{ type: 'packs', ready: ['en'] }, enqueue('a', 'draft', 'en', 'x')]);

  it('reports honest progress and clears it when done', () => {
    let s = run([{ type: 'start', id: 'a' }, { type: 'progress', id: 'a', done: 1, total: 4 }], ready);
    expect(s.jobs.a.progress).toEqual({ done: 1, total: 4 });
    s = reduce(s, { type: 'finish', id: 'a', outcome: 'no_speech' });
    expect(s.jobs.a).toMatchObject({ phase: 'done', outcome: 'no_speech', progress: null });
    expect(s.running).toBeNull();
    expect(nextJob(s, T0)).toBeNull(); // words are set once: never transcribed again
  });

  it('[D-086] Try again after "No talking in this one" listens once more; a job that found words never re-runs', () => {
    let s = run([{ type: 'start', id: 'a' }, { type: 'finish', id: 'a', outcome: 'no_speech' }], ready);
    s = reduce(s, { type: 'retry', id: 'a' });
    expect(s.jobs.a).toMatchObject({ phase: 'queued', attempts: 0 });
    expect(s.jobs.a.outcome).toBeUndefined();
    expect(nextJob(s, T0)).toBe('a');

    let ok = run([{ type: 'start', id: 'a' }, { type: 'finish', id: 'a', outcome: 'ok' }], ready);
    ok = reduce(ok, { type: 'retry', id: 'a' });
    expect(ok.jobs.a).toMatchObject({ phase: 'done', outcome: 'ok' });
  });

  it('[FM-6] an interruption (app backgrounded) puts the job back without counting a failure', () => {
    const s = run([{ type: 'start', id: 'a' }, { type: 'progress', id: 'a', done: 2, total: 5 }, { type: 'interrupt', id: 'a' }], ready);
    expect(s.jobs.a).toMatchObject({ phase: 'queued', attempts: 0, progress: null });
    expect(s.running).toBeNull();
    expect(nextJob(s, T0)).toBe('a');
  });

  it('retries a failure after 30 s, then 5 min, then waits for "Try again" (never loops)', () => {
    let s = run([{ type: 'start', id: 'a' }, { type: 'fail', id: 'a', failure: 'decode_failed', now: T0 }], ready);
    expect(s.jobs.a).toMatchObject({ phase: 'failed', attempts: 1, retryAt: T0 + RETRY_DELAYS_MS[0], failure: 'decode_failed' });
    expect(nextJob(s, T0 + 1000)).toBeNull();
    expect(nextRetryAt(s)).toBe(T0 + RETRY_DELAYS_MS[0]);
    expect(nextJob(s, T0 + RETRY_DELAYS_MS[0])).toBe('a');

    s = run([{ type: 'start', id: 'a' }, { type: 'fail', id: 'a', failure: 'decode_failed', now: T0 }], s);
    expect(s.jobs.a.retryAt).toBe(T0 + RETRY_DELAYS_MS[1]);
    s = run([{ type: 'start', id: 'a' }, { type: 'fail', id: 'a', failure: 'decode_failed', now: T0 }], s);
    expect(s.jobs.a.attempts).toBe(MAX_AUTO_ATTEMPTS);
    expect(s.jobs.a.retryAt).toBeNull();
    expect(nextJob(s, T0 + 10 * 60 * 60_000)).toBeNull();
    expect(nextRetryAt(s)).toBeNull();

    s = reduce(s, { type: 'retry', id: 'a' });
    expect(s.jobs.a).toMatchObject({ phase: 'queued', attempts: 0, retryAt: null });
    expect(s.jobs.a.failure).toBeUndefined();
    expect(nextJob(s, T0)).toBe('a');
  });

  it('a draft kept as a letter waiting for its words keeps its job (no second transcription)', () => {
    let s = run([{ type: 'start', id: 'a' }], ready);
    s = reduce(s, enqueue('a', 'entry', 'en', 'x'));
    expect(s.jobs.a).toMatchObject({ kind: 'entry', phase: 'running' });
    expect(s.running).toBe('a');
  });

  it('a draft that finished with nobody speaking runs again once it is a waiting letter (so the letter gets its result)', () => {
    let s = run([{ type: 'start', id: 'a' }, { type: 'finish', id: 'a', outcome: 'no_speech' }], ready);
    s = reduce(s, enqueue('a', 'entry', 'en', 'x'));
    expect(s.jobs.a).toMatchObject({ kind: 'entry', phase: 'queued' });
    expect(s.jobs.a.outcome).toBeUndefined();
  });

  it('removing a recording (saved with words, discarded) drops its job, even a running one', () => {
    const s = run([{ type: 'start', id: 'a' }, { type: 'remove', id: 'a' }], ready);
    expect(s.jobs.a).toBeUndefined();
    expect(s.running).toBeNull();
  });

  it('ignores events for unknown jobs', () => {
    const s = initialQueue();
    for (const e of [
      { type: 'start', id: 'z' },
      { type: 'progress', id: 'z', done: 1, total: 2 },
      { type: 'finish', id: 'z', outcome: 'ok' },
      { type: 'fail', id: 'z', failure: 'transcribe_failed', now: T0 },
      { type: 'interrupt', id: 'z' },
      { type: 'retry', id: 'z' },
      { type: 'remove', id: 'z' },
    ] as QueueEvent[]) {
      expect(reduce(s, e)).toBe(s);
    }
  });
});

describe('cleaning spoken words in their language (constitution)', () => {
  const DICT: DictionaryTerm[] = [
    { term: 'Asha', kind: 'child', heardAs: ['Aasha'] },
    { term: 'Papa', kind: 'self', heardAs: [] },
  ];

  it('tidies English with the English rules, through the verifier', () => {
    expect(spokenEditLevel('en')).toBe('clean');
    const out = cleanSpoken('Um, Aasha found the the rain on the window.', DICT, 'en');
    expect(out.text).toBe('Asha found the rain on the window.');
    expect(out.applied.map((e) => e.type).sort()).toEqual(['filler', 'repeat', 'stt_fix']);
  });

  it('never runs English filler or repeat rules on another language until its pack has them', () => {
    expect(spokenEditLevel('hi')).toBe('verbatim');
    expect(spokenEditLevel('zh')).toBe('verbatim');
    const raw = 'um Aasha ने आज बारिश देखी देखी।';
    const out = cleanSpoken(raw, DICT, 'hi');
    expect(out.applied.map((e) => e.type)).toEqual(['stt_fix']); // the family spelling only
    expect(out.text).toBe('um Asha ने आज बारिश देखी देखी।');
  });

  it('an empty transcript stays empty: silence never becomes words', () => {
    const out = cleanSpoken('', DICT, 'en');
    expect(out.text).toBe('');
    expect(out.applied).toEqual([]);
  });
});
