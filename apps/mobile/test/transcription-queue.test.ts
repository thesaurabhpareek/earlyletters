import { describe, expect, it } from 'vitest';
import type { DictionaryTerm } from '@scribe/core';
import {
  DAY_MS,
  DOWNLOAD_RETRY_DELAYS_MS,
  DownloadRetries,
  MAX_FULL_RETRIES_PER_DAY,
  downloadRetryDelayMs,
  isRetryableDownloadFailure,
} from '../src/lib/transcription-queue/download-retry';
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

/** A fake clock and timer list for the retry scheduler: advance() fires due timers in time order. */
function retryHarness(opts: { allowed?: () => boolean } = {}) {
  let now = 1_000_000;
  let nextId = 1;
  const timers = new Map<number, { at: number; fn: () => void }>();
  const requests: Array<{ language: string; at: number }> = [];
  let allowed = opts.allowed ?? (() => true);
  const retries = new DownloadRetries<string>({
    now: () => now,
    setTimer: (fn, ms) => {
      const id = nextId++;
      timers.set(id, { at: now + ms, fn });
      return id;
    },
    clearTimer: (id) => void timers.delete(id as number),
    allowed: () => allowed(),
    request: (language) => requests.push({ language, at: now }),
  });
  const advance = (ms: number) => {
    const end = now + ms;
    for (;;) {
      const due = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      timers.delete(due[0]);
      now = due[1].at;
      due[1].fn();
    }
    now = end;
  };
  return {
    retries,
    requests,
    advance,
    timers,
    get now() {
      return now;
    },
    setAllowed: (f: () => boolean) => (allowed = f),
  };
}

describe('[F05-U29] speech downloads that fail try again by themselves (download-retry.ts)', () => {
  it('backs off from 1 minute to 6 hours, then stays at 6 hours', () => {
    expect(DOWNLOAD_RETRY_DELAYS_MS[0]).toBe(60_000);
    expect(DOWNLOAD_RETRY_DELAYS_MS[DOWNLOAD_RETRY_DELAYS_MS.length - 1]).toBe(6 * 60 * 60_000);
    const delays = [1, 2, 3, 4, 5, 6, 50].map(downloadRetryDelayMs);
    for (let i = 1; i < delays.length; i++) expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1]);
    expect(downloadRetryDelayMs(50)).toBe(6 * 60 * 60_000);
  });

  it('retries what can clear without the person, never a stop, a full phone, Wi-Fi waits or an app that is too old', () => {
    for (const r of ['no_manifest', 'not_in_manifest', 'download_failed', 'hash_mismatch', 'storage_error', 'downloads_paused', 'offline']) {
      expect(isRetryableDownloadFailure(r), r).toBe(true);
    }
    for (const r of ['cancelled', 'no_space', 'needs_app_update', 'waiting_for_wifi']) expect(isRetryableDownloadFailure(r), r).toBe(false);
    const h = retryHarness();
    expect(h.retries.failed('en', 'no_space')).toBeNull();
    h.advance(DAY_MS);
    expect(h.requests).toEqual([]);
  });

  it('a manifest that is not published yet is asked for again, further apart each time', () => {
    const h = retryHarness();
    const started = h.now;
    h.retries.failed('en', 'no_manifest');
    h.advance(60_000);
    expect(h.requests.map((r) => r.at - started)).toEqual([60_000]);
    h.retries.failed('en', 'no_manifest'); // the retry failed too
    h.advance(5 * 60_000);
    expect(h.requests.map((r) => r.at - started)).toEqual([60_000, 6 * 60_000]);
  });

  it('a success clears the chain: nothing fires afterwards', () => {
    const h = retryHarness();
    h.retries.failed('en', 'download_failed');
    h.retries.succeeded('en');
    h.advance(DAY_MS);
    expect(h.requests).toEqual([]);
    expect(h.retries.pending('en')).toBeNull();
  });

  it('removing the files in Settings stops the chain', () => {
    const h = retryHarness();
    h.retries.failed('hi', 'download_failed');
    h.retries.clear('hi');
    h.advance(DAY_MS);
    expect(h.requests).toEqual([]);
  });

  it('without a yes, or in the background, nothing runs; the retry waits for the next foreground, once', () => {
    let allowed = false;
    const h = retryHarness({ allowed: () => allowed });
    h.retries.failed('en', 'no_manifest');
    h.advance(10 * 60_000);
    expect(h.requests).toEqual([]);
    expect(h.retries.pending('en')).toMatchObject({ waiting: true });
    h.retries.foreground(); // still not allowed (no yes yet)
    expect(h.requests).toEqual([]);
    allowed = true;
    h.retries.foreground();
    h.retries.foreground(); // a second foreground before the request reported back asks nothing more
    expect(h.requests).toHaveLength(1);
  });

  it('a download that did not check out costs a full download each time: at most 3 in any 24 hours', () => {
    expect(MAX_FULL_RETRIES_PER_DAY).toBe(3);
    const h = retryHarness();
    // Every retry fails the hash check again (a host that keeps serving the wrong bytes).
    h.retries.failed('en', 'hash_mismatch');
    for (let i = 0; i < 40; i++) {
      const before = h.requests.length;
      h.advance(60 * 60_000);
      if (h.requests.length > before) h.retries.failed('en', 'hash_mismatch');
    }
    const times = h.requests.map((r) => r.at);
    expect(times.length).toBeGreaterThan(MAX_FULL_RETRIES_PER_DAY);
    for (const t of times) expect(times.filter((u) => u > t - DAY_MS && u <= t).length).toBeLessThanOrEqual(MAX_FULL_RETRIES_PER_DAY);
    expect(times[MAX_FULL_RETRIES_PER_DAY] - times[0]).toBeGreaterThanOrEqual(DAY_MS);
  });

  it('cheap failures keep their own backoff: a stopped download is not capped like a full re-download', () => {
    const h = retryHarness();
    h.retries.failed('en', 'download_failed');
    for (let i = 0; i < 8; i++) {
      h.advance(6 * 60 * 60_000);
      h.retries.failed('en', 'download_failed');
    }
    expect(h.requests.length).toBeGreaterThan(MAX_FULL_RETRIES_PER_DAY);
  });
});
