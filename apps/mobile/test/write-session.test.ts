/// <reference types="node" />
/**
 * Write's last keystrokes are never dropped (S19; PR #545 review B). The words typed inside the 500 ms autosave pause
 * are on this phone after Close, "Add to Asha's book", "Keep private" and a swipe down (the screen unmounting), run
 * with fake timers against the real store, through the same session and the same `persist` write.tsx uses
 * (writeWords over createDraft and setDraftTyped). Fictional Asha family only.
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
vi.mock('../src/lib/analytics/track', () => ({ track: () => {} }));

const store = await import('../src/lib/store');
const { writeWords } = await import('../src/components/capture/review-view.logic');
const { createWriteSession, WRITE_AUTOSAVE_MS } = await import('../src/components/capture/write-session.logic');
const { armKeep, consumeKeep, resetKeep } = await import('../src/lib/capture/keep-intent');

const now = () => '2026-10-03T09:00:00.000Z';
let seq = 0;
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
let closeDb: () => void = () => {};
let asha = '';

beforeEach(() => {
  vi.useFakeTimers();
  resetKeep();
  store.closeStore();
  const h = nodeDb();
  closeDb = h.close;
  expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now, newId }).ok).toBe(true);
  asha = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
});
afterEach(() => {
  vi.useRealTimers();
  store.closeStore();
  resetKeep();
  closeDb();
});

/** Write as write.tsx wires it: its `persist` (writeWords over the store) and the session, with a draft to reopen or none. */
function openWrite(reopen: string | null = null) {
  let draftId: string | null = reopen;
  const writes: string[] = [];
  const disk = { full: false };
  const update = (id: string, v: string) => {
    if (disk.full) throw new Error('disk full');
    store.setDraftTyped(id, v);
  };
  const persist = (value: string): boolean => {
    const create = (v: string) => store.createDraft({ childId: asha, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: v }).id;
    const r = writeWords({ create, update }, draftId, value);
    draftId = r.draftId;
    if (r.ok) writes.push(value);
    return r.ok;
  };
  const initial = reopen ? (store.getDraft(reopen)?.typedText ?? '') : '';
  const session = createWriteSession(
    { persist, draftId: () => draftId, hasRecording: (id) => !!store.getDraft(id)?.audioUri, deleteDraft: store.deleteDraft },
    { initial },
  );
  /** Type the words one keystroke at a time, `gapMs` apart (fast typing: well inside the pause). */
  const type = (from: string, to: string, gapMs = 40) => {
    for (let i = from.length + 1; i <= to.length; i++) {
      session.change(to.slice(0, i));
      vi.advanceTimersByTime(gapMs);
    }
  };
  return { session, type, writes, disk, draftId: () => draftId };
}

const FIRST = 'Asha, today you sang';
const LAST = 'Asha, today you sang to the moon.';
const typed = (id: string | null) => (id ? store.getDraft(id)?.typedText : undefined);

describe('the last keystrokes inside the autosave pause are kept on every way out', () => {
  it('a pause writes; keystrokes inside the pause are not on the phone yet (the case the exits must cover)', () => {
    const w = openWrite();
    w.type('', FIRST);
    vi.advanceTimersByTime(WRITE_AUTOSAVE_MS);
    expect(typed(w.draftId())).toBe(FIRST);
    w.type(FIRST, LAST, 20);
    expect(w.session.pending()).toBe(true);
    expect(typed(w.draftId())).toBe(FIRST); // the tail is only in the session
  });

  it('Close writes the newest words now, and nothing writes again after', () => {
    const w = openWrite();
    w.type('', FIRST);
    vi.advanceTimersByTime(WRITE_AUTOSAVE_MS);
    w.type(FIRST, LAST, 20);
    expect(w.session.close()).toBe(true);
    expect(typed(w.draftId())).toBe(LAST);
    const count = w.writes.length;
    vi.advanceTimersByTime(WRITE_AUTOSAVE_MS * 4);
    w.session.unmount();
    expect(w.writes.length).toBe(count);
    // Reopened from Tonight: every word is there.
    expect(openWrite(w.draftId()).session.latest()).toBe(LAST);
  });

  it('Close within the first pause, before any write, still keeps every word', () => {
    const w = openWrite();
    w.type('', LAST, 10);
    expect(w.draftId()).toBeNull();
    expect(w.session.close()).toBe(true);
    expect(typed(w.draftId())).toBe(LAST);
  });

  it.each([
    ['"Add to Asha\'s book"', true],
    ['"Keep private"', false],
  ])('%s writes the newest words, then hands that draft to Review with the destination', (_name, inBook) => {
    const w = openWrite();
    w.type('', FIRST);
    vi.advanceTimersByTime(WRITE_AUTOSAVE_MS);
    w.type(FIRST, LAST, 20);
    // write.tsx `keep(inBook)`: session.keep(), then armKeep for that draft.
    const id = w.session.keep();
    expect(id).not.toBeNull();
    armKeep(id!, inBook);
    expect(typed(id)).toBe(LAST);
    expect(consumeKeep(id!)).toEqual({ inBook });
    const count = w.writes.length;
    vi.advanceTimersByTime(WRITE_AUTOSAVE_MS * 4);
    w.session.unmount();
    expect(w.writes.length).toBe(count);
  });

  it('a swipe down (the screen unmounting) inside the pause writes the newest words once', () => {
    const w = openWrite();
    w.type('', FIRST);
    vi.advanceTimersByTime(WRITE_AUTOSAVE_MS);
    w.type(FIRST, LAST, 20);
    const before = w.writes.length;
    w.session.unmount();
    expect(typed(w.draftId())).toBe(LAST);
    expect(w.writes.length).toBe(before + 1);
    vi.advanceTimersByTime(WRITE_AUTOSAVE_MS * 4);
    expect(w.writes.length).toBe(before + 1); // the disarmed pause never writes again
    expect(openWrite(w.draftId()).session.latest()).toBe(LAST);
  });

  it('a swipe down after the pause has written writes nothing more', () => {
    const w = openWrite();
    w.type('', LAST);
    vi.advanceTimersByTime(WRITE_AUTOSAVE_MS);
    const before = w.writes.length;
    w.session.unmount();
    expect(w.writes.length).toBe(before);
    expect(typed(w.draftId())).toBe(LAST);
  });

  it('a reopened draft keeps its words and the new tail, typed inside the pause, on Close', () => {
    const first = openWrite();
    first.type('', FIRST);
    expect(first.session.close()).toBe(true);
    const again = openWrite(first.draftId());
    expect(again.session.latest()).toBe(FIRST);
    again.type(FIRST, LAST, 20);
    expect(again.session.close()).toBe(true);
    expect(typed(first.draftId())).toBe(LAST);
  });

  it('words cleared to nothing delete the typed draft on Close', () => {
    const w = openWrite();
    w.type('', 'Asha');
    vi.advanceTimersByTime(WRITE_AUTOSAVE_MS);
    const id = w.draftId()!;
    w.session.change('');
    expect(w.session.close()).toBe(true);
    expect(store.getDraft(id)).toBeNull();
  });

  it('words that cannot be written keep Write open on Close and on a destination, and nothing is lost', () => {
    const w = openWrite();
    w.type('', FIRST);
    vi.advanceTimersByTime(WRITE_AUTOSAVE_MS);
    w.type(FIRST, LAST, 20);
    w.disk.full = true;
    expect(w.session.close()).toBe(false);
    expect(w.session.keep()).toBeNull();
    expect(w.session.latest()).toBe(LAST);
    w.disk.full = false;
    expect(w.session.close()).toBe(true);
    expect(typed(w.draftId())).toBe(LAST);
  });
});

describe('write.tsx uses the session on every way out', () => {
  const code = readFileSync(join(__dirname, '..', 'src', 'app', 'write.tsx'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

  it('keystrokes, Close, both destinations and unmount all go through it', () => {
    expect(code).toMatch(/createWriteSession\(\s*\{\s*persist: \(value\) => persistRef\.current\(value\),\s*draftId: \(\) => draftId\.current,\s*hasRecording: \(id\) => !!getDraft\(id\)\?\.audioUri,\s*deleteDraft,\s*\},\s*\{ initial: initialText \},\s*\)/);
    expect(code).toMatch(/session\.change\(value\);/);
    expect(code).toMatch(/const close = \(\) => \{\s*if \(session\.close\(\)\) router\.back\(\);\s*\};/);
    expect(code).toMatch(/const keep = \(inBook: boolean\) => \{\s*const id = session\.keep\(\);\s*if \(!id\) return;\s*armKeep\(id, inBook\);\s*router\.replace\(\{ pathname: '\/review', params: \{ draftId: id \} \}\);\s*\};/);
    expect(code).toMatch(/useEffect\(\(\) => \(\) => session\.unmount\(\), \[session\]\);/);
    expect(code).toMatch(/onPress=\{\(\) => keep\(true\)\}/);
    expect(code).toMatch(/onPress=\{\(\) => keep\(false\)\}/);
    // One timer, in the session: the screen keeps none of its own.
    expect(code).not.toMatch(/setTimeout\(|clearTimeout\(/);
  });
});
