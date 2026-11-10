/// <reference types="node" />
/**
 * [F06-REQ-036] [F04-REQ-011] [RT-REV-02] [RT-REV-07] The person's own words in Review (Change words) reach the draft
 * at least every 300 ms while they edit, so a kill, a crash or a flat battery in the middle of a long burst loses at
 * most the last 300 ms of editing. The writer used to be a pure debounce (every change moved the 300 ms timer), so
 * nothing was written until a pause and a kill lost the whole burst. Now: one timer armed by the first change after a
 * write, not moved by later ones, writing the newest words when it fires; nothing about the screen changes (the
 * callback only stores them). Second defect: a write that threw was dropped by `flush` before it was written, so Done,
 * Close and unmount never retried it; now it stays waiting, with no timer, and is written at the next change or flush.
 * A false return from setDraftReview (the draft is being recorded or let go, or is gone) is a refusal and is not retried.
 *
 * Run with fake timers against the real writer and the real store, through the same call review.tsx makes
 * (setDraftReview). The "kill" is stopping: nothing is called after it, and what the store holds is all that is left.
 * Fictional Asha family only. The seeded kill model with put-backs and views is test/review-persist.replay.test.ts.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const { TYPED_WRITE_DEBOUNCE_MS, mountReview, reviewWriter, wordsBase } = await import('../src/lib/capture/review-persist.logic');

const now = () => '2026-10-03T09:00:00.000Z';
let seq = 0;
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
let closeDb: () => void = () => {};

beforeEach(() => {
  vi.useFakeTimers();
  store.closeStore();
  const h = nodeDb();
  closeDb = h.close;
  expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now, newId }).ok).toBe(true);
});
afterEach(() => {
  vi.useRealTimers();
  store.closeStore();
  closeDb();
});

const SAID = 'um Asha, you you laughed at the rain today.';
const BASE = wordsBase(SAID);
const MORE = ' We stood at the window and Papa said the rain was singing to you, softly, all afternoon long.';

/** One call to the callback review.tsx gives the writer: when, what, and what the store said. */
type Call = { at: number; text: string | null | undefined; result: boolean | 'threw' };

/**
 * Review as review.tsx wires the writer: the same callback (setDraftReview on the open draft), over a spoken draft of
 * Asha's. `disk.full` makes the store throw; `keepReturn` returns the store's answer to the writer (review.tsx's own
 * callback returns nothing, so the writer must not need it).
 */
function openReview(opts: { keepReturn?: boolean } = {}) {
  const child = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
  const d = store.createDraft({ childId: child, captureMode: 'spoken', promptKey: null, audioUri: 'file:///Documents/recording-1.m4a', audioDurationMs: 4000 });
  store.setDraftTranscript(d.id, SAID);
  const t0 = Date.now();
  const at = () => Date.now() - t0;
  const disk = { full: false };
  const calls: Call[] = [];
  const writer = reviewWriter((patch) => {
    if (disk.full) {
      calls.push({ at: at(), text: patch.text, result: 'threw' });
      throw new Error('disk full');
    }
    const ok = store.setDraftReview(d.id, BASE, patch);
    calls.push({ at: at(), text: patch.text, result: ok });
    if (opts.keepReturn) return ok;
  });
  /** One change of the person's words, as the Change words field sends it. */
  const edit = (text: string) => writer.text(text);
  /** What a kill leaves, read the way Review's mount reads it: the person's words on reopen, or null for the fixes. */
  const reopened = (): string | null => mountReview({ saved: store.getDraftReview(d.id), words: SAID, defaultView: 'fixes' }).userText;
  const written = () => calls.filter((c) => c.result === true);
  return { draftId: d.id, writer, edit, reopened, calls, written, disk, at };
}

describe('[F06-REQ-036] [F04-REQ-011] [RT-REV-02] [RT-REV-07] a long burst of editing is written at least every 300 ms', () => {
  it('a character every 100 ms for 3 seconds with no pause: written at least every 300 ms', () => {
    const r = openReview();
    for (let i = 1; i <= 30; i++) {
      r.edit(SAID + MORE.slice(0, i));
      vi.advanceTimersByTime(100);
    }
    const writes = r.written();
    expect(writes.length).toBeGreaterThanOrEqual(10);
    // The first write comes within 300 ms of the first change, and no two are further apart than 300 ms.
    expect(writes[0].at).toBeLessThanOrEqual(TYPED_WRITE_DEBOUNCE_MS);
    for (let i = 1; i < writes.length; i++) expect(writes[i].at - writes[i - 1].at, `gap before write ${i}`).toBeLessThanOrEqual(TYPED_WRITE_DEBOUNCE_MS);
    // And the last write is within 300 ms of the end of the burst.
    expect(r.at() - writes[writes.length - 1].at).toBeLessThanOrEqual(TYPED_WRITE_DEBOUNCE_MS);
  });

  it('a kill at any moment of the burst leaves at most the last 300 ms of editing (10 ms resolution)', () => {
    const r = openReview();
    const perWindow = TYPED_WRITE_DEBOUNCE_MS / 100; // characters edited in 300 ms at one every 100 ms
    let typedSoFar = SAID;
    for (let t = 0; t < 3000; t += 10) {
      if (t % 100 === 0) {
        typedSoFar = SAID + MORE.slice(0, t / 100 + 1);
        r.edit(typedSoFar);
      }
      // A kill here: the reopened Review holds a leading part of the words, short by no more than 300 ms of editing.
      const left = r.reopened() ?? SAID;
      expect(typedSoFar.startsWith(left), `at ${t} ms`).toBe(true);
      expect(typedSoFar.length - left.length, `at ${t} ms`).toBeLessThanOrEqual(perWindow);
      vi.advanceTimersByTime(10);
    }
  });

  it('what a reopened Review shows after the kill is what the draft held', () => {
    const r = openReview();
    for (let i = 1; i <= 17; i++) {
      r.edit(SAID + MORE.slice(0, i));
      vi.advanceTimersByTime(100);
    }
    // Killed at 1.7 s: the draft holds all but the last 300 ms, and the recording and the original words are untouched.
    expect(r.reopened()).toBe(SAID + MORE.slice(0, 15));
    expect(store.getDraft(r.draftId)).toMatchObject({ rawTranscript: SAID, audioUri: 'file:///Documents/recording-1.m4a' });
  });

  it('each write holds the newest words at that moment, not the words that armed the timer', () => {
    const r = openReview();
    for (let i = 1; i <= 30; i++) {
      r.edit(SAID + MORE.slice(0, i));
      vi.advanceTimersByTime(100);
    }
    const writes = r.written();
    // The first change armed the timer with one character; the write 300 ms later holds the third character's words.
    expect(writes[0].text).toBe(SAID + MORE.slice(0, 3));
    for (const w of writes) {
      // Whatever each write holds was the newest words at its own time: one more character per 100 ms.
      expect(w.text).toBe(SAID + MORE.slice(0, Math.ceil(w.at / 100)));
    }
    expect(new Set(writes.map((w) => w.text)).size).toBe(writes.length); // no write repeated an older one
  });

  it('a very long burst keeps writing: 30 seconds with no pause', () => {
    const r = openReview();
    for (let i = 1; i <= 300; i++) {
      r.edit(`${SAID} ${'x'.repeat(i)}`);
      vi.advanceTimersByTime(100);
      expect(r.at() - (r.written().at(-1)?.at ?? 0), `at ${r.at()} ms`).toBeLessThanOrEqual(TYPED_WRITE_DEBOUNCE_MS);
    }
    expect(r.written().length).toBeGreaterThanOrEqual(99);
    expect(r.reopened()).toBe(`${SAID} ${'x'.repeat(300)}`);
  });

  it('the cost of the burst: one write per 300 ms at most, never one per change', () => {
    const r = openReview();
    for (let i = 1; i <= 100; i++) {
      r.edit(SAID + 'x'.repeat(i));
      vi.advanceTimersByTime(10); // a fast burst: 100 changes in 1 s
    }
    vi.advanceTimersByTime(1000);
    expect(r.calls.length).toBeLessThanOrEqual(Math.ceil(1000 / TYPED_WRITE_DEBOUNCE_MS) + 1);
  });
});

describe('[F04-REQ-011] one change and a pause still write once after 300 ms', () => {
  it('writes nothing at 299 ms, the change at 300 ms, and nothing more afterwards', () => {
    const r = openReview();
    r.edit('Asha');
    vi.advanceTimersByTime(TYPED_WRITE_DEBOUNCE_MS - 1);
    expect(r.calls).toHaveLength(0);
    vi.advanceTimersByTime(1);
    expect(r.calls.map((c) => c.text)).toEqual(['Asha']);
    vi.advanceTimersByTime(10_000);
    expect(r.calls).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('a burst and then a pause: the newest words are written once, 300 ms after the first change', () => {
    const r = openReview();
    for (const w of ['A', 'As', 'Ash', 'Asha']) {
      r.edit(w);
      vi.advanceTimersByTime(50);
    }
    vi.advanceTimersByTime(10_000);
    expect(r.calls).toEqual([{ at: TYPED_WRITE_DEBOUNCE_MS, text: 'Asha', result: true }]);
  });

  it('a change after a write arms the next write, 300 ms after that change', () => {
    const r = openReview();
    r.edit('A');
    vi.advanceTimersByTime(TYPED_WRITE_DEBOUNCE_MS); // written
    vi.advanceTimersByTime(700); // a pause
    r.edit('As');
    vi.advanceTimersByTime(TYPED_WRITE_DEBOUNCE_MS - 1);
    expect(r.calls).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(r.calls.map((c) => c.text)).toEqual(['A', 'As']);
    expect(r.calls[1].at).toBe(TYPED_WRITE_DEBOUNCE_MS + 700 + TYPED_WRITE_DEBOUNCE_MS);
  });

  it('words a timer already wrote are not written twice by flush', () => {
    const r = openReview();
    r.edit('A');
    r.edit('As');
    vi.advanceTimersByTime(TYPED_WRITE_DEBOUNCE_MS);
    r.writer.flush(); // Done, Close or the app leaving the foreground right after
    expect(r.calls.map((c) => c.text)).toEqual(['As']);
  });
});

describe('[F04-REQ-011] flush and cancel leave no timer', () => {
  it('flush (Done, Close, unmount, leaving the foreground, Keep) writes the newest words once and leaves no timer', () => {
    const r = openReview();
    for (let i = 1; i <= 8; i++) {
      r.edit(SAID + MORE.slice(0, i));
      vi.advanceTimersByTime(30); // inside the first 300 ms: nothing written yet
    }
    expect(r.calls).toHaveLength(0);
    r.writer.flush();
    expect(r.calls.map((c) => c.text)).toEqual([SAID + MORE.slice(0, 8)]);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10_000);
    expect(r.calls).toHaveLength(1);
    expect(r.reopened()).toBe(SAID + MORE.slice(0, 8));
  });

  it('flush mid-burst writes now, and the next change starts a fresh window', () => {
    const r = openReview();
    r.edit('A');
    vi.advanceTimersByTime(100);
    r.writer.flush();
    expect(r.calls).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    r.edit('As');
    vi.advanceTimersByTime(TYPED_WRITE_DEBOUNCE_MS);
    expect(r.calls.map((c) => c.text)).toEqual(['A', 'As']);
  });

  it('flush with nothing waiting writes nothing and leaves no timer', () => {
    const r = openReview();
    r.writer.flush();
    expect(r.calls).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancel in a burst: nothing is written afterwards, and no timer is left', () => {
    const r = openReview();
    for (let i = 1; i <= 5; i++) {
      r.edit(SAID + MORE.slice(0, i));
      vi.advanceTimersByTime(40);
    }
    r.writer.cancel();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10_000);
    r.writer.flush();
    expect(r.calls).toHaveLength(0);
    expect(r.reopened()).toBeNull();
  });

  it('put-backs and the view are still written at once, in the middle of a burst', () => {
    const r = openReview();
    r.edit('A');
    r.writer.view('exact');
    r.writer.putBack([]);
    expect(store.getDraftReview(r.draftId)).toMatchObject({ view: 'exact', putBack: [], text: null });
    vi.advanceTimersByTime(TYPED_WRITE_DEBOUNCE_MS);
    expect(store.getDraftReview(r.draftId)).toMatchObject({ view: 'exact', text: 'A' });
  });
});

describe('[F06-REQ-036] a write that throws is tried again at the next change, Done, Close or unmount, and never on a timer', () => {
  it('the words stay waiting, no timer is left, and nothing is retried by waiting', () => {
    const r = openReview();
    r.disk.full = true;
    r.edit('Asha');
    expect(() => vi.advanceTimersByTime(TYPED_WRITE_DEBOUNCE_MS)).not.toThrow(); // nothing reaches the screen
    expect(r.calls).toEqual([{ at: TYPED_WRITE_DEBOUNCE_MS, text: 'Asha', result: 'threw' }]);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(60_000);
    expect(r.calls).toHaveLength(1); // a gone draft or a full disk cannot loop
    expect(r.reopened()).toBeNull();
  });

  it('Done, Close, unmount and leaving the foreground (flush) write them again, with the newest words', () => {
    const r = openReview();
    r.disk.full = true;
    r.edit('Asha');
    vi.advanceTimersByTime(TYPED_WRITE_DEBOUNCE_MS); // threw
    r.disk.full = false;
    r.writer.flush();
    expect(r.calls.map((c) => c.result)).toEqual(['threw', true]);
    expect(r.reopened()).toBe('Asha');
    expect(vi.getTimerCount()).toBe(0);
    r.writer.flush();
    expect(r.calls).toHaveLength(2); // written once
  });

  it('a flush that itself throws keeps the words waiting for the next flush', () => {
    const r = openReview();
    r.edit('Asha');
    r.disk.full = true;
    expect(() => r.writer.flush()).not.toThrow(); // Done while the disk is full
    expect(vi.getTimerCount()).toBe(0);
    r.disk.full = false;
    r.writer.flush(); // Close
    expect(r.calls.map((c) => c.result)).toEqual(['threw', true]);
    expect(r.reopened()).toBe('Asha');
  });

  it('the next change writes them again, with the newest words, within 300 ms', () => {
    const r = openReview();
    r.disk.full = true;
    for (let i = 1; i <= 4; i++) {
      r.edit(SAID + MORE.slice(0, i));
      vi.advanceTimersByTime(100);
    }
    expect(r.calls.map((c) => c.result)).toEqual(['threw']); // the 300 ms write threw; nothing after it
    r.disk.full = false;
    r.edit(SAID + MORE.slice(0, 5));
    vi.advanceTimersByTime(TYPED_WRITE_DEBOUNCE_MS);
    expect(r.calls.map((c) => c.result)).toEqual(['threw', true]);
    expect(r.reopened()).toBe(SAID + MORE.slice(0, 5));
  });

  it('a disk that stays full through a long burst is tried once per 300 ms at most, and goes quiet after it', () => {
    const r = openReview();
    r.disk.full = true;
    for (let i = 1; i <= 100; i++) {
      r.edit(SAID + 'x'.repeat(i));
      vi.advanceTimersByTime(100);
    }
    vi.advanceTimersByTime(1000); // the last change's own timer fires and throws, once
    const tries = r.calls.length;
    expect(tries).toBeLessThanOrEqual(Math.ceil(11_000 / TYPED_WRITE_DEBOUNCE_MS));
    vi.advanceTimersByTime(60_000);
    expect(r.calls).toHaveLength(tries);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('[F06-REQ-036] a refusal is not a failure: it is not retried', () => {
  it('a draft being let go refuses the write (false): not retried at the next flush, not on a timer', () => {
    const r = openReview({ keepReturn: true });
    expect(store.beginDiscard(r.draftId)).toBe(true);
    r.edit('Asha');
    vi.advanceTimersByTime(TYPED_WRITE_DEBOUNCE_MS);
    expect(r.calls).toEqual([{ at: TYPED_WRITE_DEBOUNCE_MS, text: 'Asha', result: false }]);
    r.writer.flush();
    vi.advanceTimersByTime(10_000);
    expect(r.calls).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(store.getDraftReview(r.draftId)).toEqual({ putBack: [], view: null, text: null, base: null });
  });

  it('a draft that is gone (kept as a letter, or deleted) refuses the write: not retried', () => {
    const r = openReview({ keepReturn: true });
    store.deleteDraft(r.draftId);
    r.edit('Asha');
    r.writer.flush();
    r.writer.flush();
    vi.advanceTimersByTime(10_000);
    expect(r.calls.map((c) => c.result)).toEqual([false]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('a refused write does not hold back the next change', () => {
    const r = openReview({ keepReturn: true });
    store.beginDiscard(r.draftId);
    r.edit('A');
    vi.advanceTimersByTime(TYPED_WRITE_DEBOUNCE_MS);
    r.edit('As');
    vi.advanceTimersByTime(TYPED_WRITE_DEBOUNCE_MS);
    expect(r.calls.map((c) => [c.text, c.result])).toEqual([['A', false], ['As', false]]);
  });
});

describe('[F06-REQ-036] nothing reaches the screen', () => {
  const review = readFileSync(join(__dirname, '..', 'src', 'app', 'review.tsx'), 'utf8');

  it('review.tsx\'s writer callback only calls setDraftReview: no state, no announcement, no render', () => {
    const start = review.indexOf('reviewWriter((patch) => {');
    expect(start).toBeGreaterThan(0);
    const body = review.slice(start, review.indexOf('}),', start));
    expect(body).toMatch(/setDraftReview\(draftId, persist\.current\.base, patch\);/);
    expect(body).not.toMatch(/\bset(?!DraftReview)[A-Z]\w*\(/); // no setState of any kind
    expect(body).not.toMatch(/announce|AccessibilityInfo|accessibility/i);
    expect(body).not.toMatch(/\bsetTimeout\b|\bsetInterval\b/);
  });
});
