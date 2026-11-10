/**
 * Review opens on a take Listen is still keeping (BL-563 follow-up, Review B at 06b9cd02). A draft still `recording`
 * must not reach the words queue or a saved letter with length 0. Fixtures: the fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { settleDraft, settleForKeep } from '../src/components/capture/review-settle.logic';
import { createFinishing } from '../src/lib/capture/finishing';

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

describe('a save that ends after the 15 s wait (Review B at 4ae1b1e0, finding 2)', () => {
  it('with no wait limit, words may start whenever the save ends: the row is ready at 16 s and 5 minutes', async () => {
    vi.useFakeTimers();
    let row: Row = recording();
    let end!: () => void;
    const job = new Promise<void>((r) => (end = () => { row = { id: 'd1', state: 'ready', audioDurationMs: 90000, audioSha256: 'abc' }; r(); }));
    const p = settleDraft('d1', { getDraft: () => row as never, running: () => job, waitMs: null });
    await vi.advanceTimersByTimeAsync(300000);
    end();
    const out = (await p) as unknown as Row;
    expect(out.state).toBe('ready');
    expect(out.audioDurationMs).toBe(90000);
    vi.useRealTimers();
  });
});

describe('Keep the recording never keeps a take that is still being saved (finding 1)', () => {
  it('a hung save: nothing to keep (null), so no half-written file is hashed and no length-0 letter is made', async () => {
    vi.useFakeTimers();
    const p = settleForKeep('d1', { getDraft: () => recording() as never, running: () => new Promise(() => {}), waitMs: 1000 });
    await vi.advanceTimersByTimeAsync(1000);
    expect(await p).toBeNull();
    vi.useRealTimers();
  });
  it('a failed save with the row still recording: nothing to keep', async () => {
    expect(await settleForKeep('d1', { getDraft: () => recording() as never, running: () => Promise.reject(new Error('x')) })).toBeNull();
  });
  it('a save that ends while Keep waits: the finished row with the real length and hash is what gets kept', async () => {
    let row: Row = recording();
    const job = Promise.resolve().then(() => { row = { id: 'd1', state: 'ready', audioDurationMs: 61000, audioSha256: 'abc' }; });
    const out = (await settleForKeep('d1', { getDraft: () => row as never, running: () => job })) as unknown as Row;
    expect(out.audioDurationMs).toBe(61000);
    expect(out.audioSha256).toBe('abc');
  });
  it('a take that was never in the recording state is kept as it is', async () => {
    const ready = { ...recording(), state: 'ready', audioDurationMs: 5000 };
    expect(await settleForKeep('d1', { getDraft: () => ready as never, running: () => null })).toBe(ready);
  });
});

/**
 * The Keep line "still being saved" (#744, Review B): said only while a save is really running. Each case runs the
 * Keep decision the way review.tsx does (settleForKeep, then the pending signal) against the tracker the recorder uses.
 */
describe('the Keep line is said only while waiting can help', () => {
  type J = Row | null;
  const decide = async (f: ReturnType<typeof createFinishing<J>>, row: () => Row | null, waitMs = 50) => {
    const settled = await settleForKeep('d1', { getDraft: row as never, running: f.get, waitMs });
    return { kept: settled as unknown as Row | null, toast: !settled && f.isPending('d1') };
  };

  it('a save still running when the wait ends: nothing kept, and the line is said', async () => {
    const f = createFinishing<J>();
    f.track('d1', new Promise(() => {}));
    expect(await decide(f, recording)).toEqual({ kept: null, toast: true });
  });

  it('a save that failed and left the row recording: nothing kept, and no line (waiting never helps)', async () => {
    const f = createFinishing<J>();
    f.track('d1', Promise.reject(new Error('disk full')));
    expect(await decide(f, recording)).toEqual({ kept: null, toast: false });
    expect(f.get('d1')).not.toBeNull(); // still joinable: finalizeTake stays idempotent
  });

  it('a save that ended without finalizing the row (settled, row still recording): no line', async () => {
    const f = createFinishing<J>();
    await f.track('d1', Promise.resolve(null));
    expect(await decide(f, recording)).toEqual({ kept: null, toast: false });
  });

  it('a take that was let go: no line', async () => {
    const f = createFinishing<J>();
    f.settled('d1', Promise.resolve(null));
    expect(f.isPending('d1')).toBe(false);
    expect(await decide(f, recording)).toEqual({ kept: null, toast: false });
  });

  it('the save finishing during the wait: the finished row is kept and no line is said', async () => {
    const f = createFinishing<J>();
    let row: Row = recording();
    f.track('d1', new Promise<J>((r) => setTimeout(() => { row = { id: 'd1', state: 'ready', audioDurationMs: 42000, audioSha256: 'abc' }; r(row); }, 10)));
    const out = await decide(f, () => row, 1000);
    expect(out.toast).toBe(false);
    expect(out.kept?.audioDurationMs).toBe(42000);
    expect(f.isPending('d1')).toBe(false);
  });

  it('pending ends for a failed save and a good one, and a second tracked save is pending again', async () => {
    const f = createFinishing<J>();
    f.track('d1', Promise.reject(new Error('x'))).catch(() => {});
    await Promise.resolve(); await Promise.resolve();
    expect(f.isPending('d1')).toBe(false);
    let end!: () => void;
    f.track('d1', new Promise<J>((r) => (end = () => r(null))));
    expect(f.isPending('d1')).toBe(true);
    end(); await Promise.resolve(); await Promise.resolve();
    expect(f.isPending('d1')).toBe(false);
  });
});

// Node cannot load React Native, so the screen wiring is read from source (as listen.test.ts does). The behaviour above
// is the proof; these lines only stop the wiring being removed.
describe('Review and the words queue use it', () => {
  const review = readFileSync(join(APP, 'src/app/review.tsx'), 'utf8');
  const queue = readFileSync(join(APP, 'src/lib/transcription-queue/index.ts'), 'utf8');
  it('Review settles before it asks for words, and Keep reads the live row for the length', () => {
    expect(review).toMatch(/settleDraft\(draft\.id, \{ getDraft, running: finishingTake, waitMs: null \}\)/);
    expect(review).toMatch(/if \(settled\.state !== 'recording'\) requestWords/);
    expect(review).toMatch(/audioDurationMs: live\.audioDurationMs/);
    expect(review).toMatch(/waitMs: null/);
    expect(review).toMatch(/settleForKeep\(draft\.id, { getDraft, running: finishingTake }\);\s*if \(!settled\) \{\s*saving\.current = false;[^\n]*\s*(?:\/\/[^\n]*\s*)*if \(isFinishing\(draft\.id\)\) toast\.show\(\{ message: copy\.review\.keepStillSaving \}\);\s*return;/);
  });
  it('the queue never takes a draft that is still recording', () => {
    expect(queue).toMatch(/d\.state !== 'recording' && d\.audioUri/);
  });
});
