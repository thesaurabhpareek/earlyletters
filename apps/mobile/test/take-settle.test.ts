/// <reference types="node" />
/**
 * BL-563: a slow save opens Review, but never on a half-saved recording. Pure parts run here; the wiring is read from
 * source because Node cannot load React Native. Fixtures: the fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { afterFinish, settleTake, wordsAfterSettle } from '../src/components/capture/take-settle.logic';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
type Row = { id: string; state: 'recording' | 'ready' | 'unrecoverable'; audioDurationMs: number; audioSha256: string | null };

describe('[BL-563] afterFinish: where Listen goes after the finishing wait', () => {
  it('a timeout opens Review on the known draft, not home', () => {
    expect(afterFinish({ ok: false, why: 'timeout' }, 'd1', 'user', true)).toEqual({ to: 'review', draftId: 'd1', reason: 'user' });
  });
  it('keeps the reason for a slow save after the app went to the background', () => {
    expect(afterFinish({ ok: false, why: 'timeout' }, 'd1', 'background', false)).toEqual({ to: 'review', draftId: 'd1', reason: 'background' });
  });
  it('a finished save opens Review', () => {
    expect(afterFinish({ ok: true, value: { id: 'd1' } }, 'd1', 'user', true).to).toBe('review');
  });
  it('a save that threw, or a take let go meanwhile, leaves without Review', () => {
    expect(afterFinish({ ok: false, why: 'failed' }, 'd1', 'user', true)).toEqual({ to: 'leave', canGoBack: true });
    expect(afterFinish({ ok: true, value: null }, 'd1', 'user', false)).toEqual({ to: 'leave', canGoBack: false });
  });
});

describe('[BL-563] settleTake: Review never uses a take that is still being saved', () => {
  const rowStore = () => {
    let row: Row | null = { id: 'd1', state: 'recording', audioDurationMs: 0, audioSha256: null };
    return { get: () => row, set: (r: Row | null) => { row = r; } };
  };

  it('waits for a slow save and returns the finished row with its real length and hash', async () => {
    const db = rowStore();
    let finish!: () => void;
    const running = new Promise<void>((resolve) => {
      finish = () => { db.set({ id: 'd1', state: 'ready', audioDurationMs: 31000, audioSha256: 'abc' }); resolve(); };
    });
    const out = settleTake({ running: () => running, read: db.get });
    finish();
    const done = await out;
    expect(done.kind).toBe('settled');
    if (done.kind === 'settled') expect(done.draft).toMatchObject({ state: 'ready', audioDurationMs: 31000, audioSha256: 'abc' });
  });

  it('never reports a recording-state row as settled when the save hangs', async () => {
    vi.useFakeTimers();
    try {
      const db = rowStore();
      const out = settleTake({ running: () => new Promise<void>(() => {}), read: db.get }, 50);
      await vi.advanceTimersByTimeAsync(60);
      const done = await out;
      expect(done.kind).toBe('pending');
    } finally {
      vi.useRealTimers();
    }
  });

  it('a save that threw leaves the row unsettled, not mistaken for ready', async () => {
    const db = rowStore();
    const done = await settleTake({ running: () => Promise.reject(new Error('disk full')), read: db.get });
    expect(done.kind).toBe('pending');
  });

  it('a take that is already finished returns at once, and a discarded one is gone', async () => {
    const run = vi.fn();
    const ready = await settleTake({ running: run, read: () => ({ id: 'd1', state: 'ready' }) });
    expect(ready.kind).toBe('settled');
    expect(run).not.toHaveBeenCalled();
    expect((await settleTake({ running: () => undefined, read: () => null })).kind).toBe('gone');
  });
});

describe('[BL-563] wordsAfterSettle: no words line that never resolves', () => {
  it('asks for words only for a finished take', () => {
    expect(wordsAfterSettle({ kind: 'settled', draft: { state: 'ready' } })).toBe('ask');
  });
  it('a save that never settled goes to the waiting state, as does a take with no sound', async () => {
    const hung = await settleTake({ running: () => Promise.reject(new Error('x')), read: () => ({ state: 'recording' }) });
    expect(wordsAfterSettle(hung)).toBe('waiting');
    expect(wordsAfterSettle({ kind: 'settled', draft: { state: 'unrecoverable' } })).toBe('waiting');
  });
});

describe('[BL-563] the screens and the queue use it', () => {
  const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  it('Listen routes the finishing outcome through afterFinish', () => {
    expect(strip(src('app/listen.tsx'))).toMatch(/afterFinish\(kept, id, reason, router\.canGoBack\(\)\)/);
  });
  it('Review waits for the save before asking for words or keeping the recording', () => {
    const review = strip(src('app/review.tsx'));
    expect(review).toMatch(/settleTake\(draft\.id\)\.then/);
    expect(review).toMatch(/await settleTake\(draft\.id\)/);
    expect(review.match(/await settleTake\(draft\.id\)/g)?.length).toBe(2);
    expect(review).toMatch(/if \(draft\.state === 'recording'\) \{\s*const settledNow = await settleTake/); // with-words Keep and recording-only Keep
    expect(review).toMatch(/wordsAfterSettle\(out\)/);
  });
  it('the words queue skips a draft that is still recording', () => {
    expect(strip(src('lib/transcription-queue/index.ts'))).toMatch(/d\.state !== 'recording'/);
  });
});
