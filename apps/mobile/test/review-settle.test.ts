/**
 * Review opens on a take Listen is still keeping (BL-563 follow-up, Review B at 06b9cd02). A draft still `recording`
 * must not reach the words queue or a saved letter with length 0. Fixtures: the fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { settleDraft } from '../src/components/capture/review-settle.logic';

const APP = join(__dirname, '..');
type Row = { id: string; state: string; audioDurationMs: number; audioSha256: string | null };
const recording = (): Row => ({ id: 'd1', state: 'recording', audioDurationMs: 0, audioSha256: null });

describe('settleDraft: a draft still being saved', () => {
  it('joins the running save and returns the finished row with the real length and hash', async () => {
    let row = recording();
    let finish!: () => void;
    const job = new Promise<void>((r) => (finish = () => { row = { id: 'd1', state: 'ready', audioDurationMs: 61000, audioSha256: 'abc' }; r(); }));
    const settling = settleDraft('d1', { getDraft: () => row as never, running: () => job });
    finish();
    const out = (await settling) as unknown as Row;
    expect(out.state).toBe('ready');
    expect(out.audioDurationMs).toBe(61000);
    expect(out.audioSha256).toBe('abc');
  });

  it('a hung save is waited for only up to waitMs, and the row is returned still recording (so words are not started)', async () => {
    vi.useFakeTimers();
    const row = recording();
    const p = settleDraft('d1', { getDraft: () => row as never, running: () => new Promise(() => {}), waitMs: 1000 });
    await vi.advanceTimersByTimeAsync(1000);
    expect(((await p) as unknown as Row).state).toBe('recording');
    vi.useRealTimers();
  });

  it('a save that failed never throws; the row is whatever the store holds', async () => {
    const row = recording();
    const out = await settleDraft('d1', { getDraft: () => row as never, running: () => Promise.reject(new Error('disk full')) });
    expect((out as unknown as Row).state).toBe('recording');
  });

  it('no save running for a recording row: returns it at once, without waiting', async () => {
    const running = vi.fn(() => null);
    const out = await settleDraft('d1', { getDraft: () => recording() as never, running });
    expect((out as unknown as Row).state).toBe('recording');
    expect(running).toHaveBeenCalledTimes(1);
  });

  it('a finished or missing row is returned untouched and the recorder is not asked', async () => {
    const running = vi.fn(() => null);
    const ready = { ...recording(), state: 'ready' };
    expect(await settleDraft('d1', { getDraft: () => ready as never, running })).toBe(ready);
    expect(await settleDraft('d1', { getDraft: () => null, running })).toBeNull();
    expect(running).not.toHaveBeenCalled();
  });
});

// Node cannot load React Native, so the screen wiring is read from source (as listen.test.ts does). The behaviour above
// is the proof; these lines only stop the wiring being removed.
describe('Review and the words queue use it', () => {
  const review = readFileSync(join(APP, 'src/app/review.tsx'), 'utf8');
  const queue = readFileSync(join(APP, 'src/lib/transcription-queue/index.ts'), 'utf8');
  it('Review settles before it asks for words, and Keep reads the live row for the length', () => {
    expect(review).toMatch(/settleDraft\(draft\.id, \{ getDraft, running: finishingTake \}\)/);
    expect(review).toMatch(/if \(settled\.state !== 'recording'\) requestWords/);
    expect(review).toMatch(/audioDurationMs: live\.audioDurationMs/);
  });
  it('the queue never takes a draft that is still recording', () => {
    expect(queue).toMatch(/d\.state !== 'recording' && d\.audioUri/);
  });
});
