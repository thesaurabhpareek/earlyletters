/// <reference types="node" />
/**
 * Review's own choices on the draft (SR-C-06, CR-39; RT-REV-02, RT-REV-07; BL-377, WP-F06-08b), through the store
 * facade over node:sqlite: written, read back, cleared at Keep and at Let it go, never queued for sync, never touching
 * raw_transcript or typed_text. Plus the writer's debounce (F04-REQ-011: at most 500 ms). Fictional family "Asha" only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Edit } from '@scribe/core';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const { SYNC_SETTING, writeSetting } = await import('../src/lib/sync/outbox');
const {
  TYPED_WRITE_DEBOUNCE_MS,
  parsePutBack,
  restorable,
  restoreApplied,
  reviewWriter,
  withoutPutBack,
  wordsBase,
} = await import('../src/lib/capture/review-persist.logic');

let close: () => void = () => {};
let seq = 0;
const now = () => '2026-10-03T09:00:00.000Z';
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
let raw: ReturnType<typeof nodeDb>['db'];

beforeEach(() => {
  store.closeStore();
  const h = nodeDb();
  raw = h.db;
  close = h.close;
  expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now, newId }).ok).toBe(true);
});
afterEach(() => {
  store.closeStore();
  close();
});

const SAID = 'um Asha, you you laughed at the rain today.';
const FILLER: Edit = { type: 'filler', start: 0, end: 3, original: 'um ', replacement: '', source: 'rule' };
const REPEAT: Edit = { type: 'repeat', start: 13, end: 17, original: 'you ', replacement: '', source: 'rule' };

function asha(): string {
  return store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
}
function spokenDraft(childId: string) {
  const d = store.createDraft({ childId, captureMode: 'spoken', promptKey: null, audioUri: 'file:///Documents/recording-1.m4a', audioDurationMs: 4000 });
  store.setDraftTranscript(d.id, SAID);
  return store.getDraft(d.id)!;
}
const row = (id: string) => raw.get<Record<string, unknown>>('SELECT * FROM drafts WHERE id = ?', id);
const outbox = () => raw.all<{ type: string; payload: string }>('SELECT type, payload FROM sync_outbox ORDER BY lane, seq');

describe('[SR-C-06] the store keeps Review\'s choices on the draft', () => {
  it('a put-back, the view and the person\'s words are read back as written', () => {
    const d = spokenDraft(asha());
    const base = wordsBase(SAID);
    expect(store.getDraftReview(d.id)).toEqual({ putBack: [], view: null, text: null, base: null });
    expect(store.setDraftReview(d.id, base, { putBack: [FILLER] })).toBe(true);
    expect(store.setDraftReview(d.id, base, { view: 'exact' })).toBe(true);
    expect(store.setDraftReview(d.id, base, { text: 'Asha, you laughed at the rain today, and so did I.' })).toBe(true);
    expect(store.getDraftReview(d.id)).toEqual({ putBack: [FILLER], view: 'exact', text: 'Asha, you laughed at the rain today, and so did I.', base });
    // Each write changes only its own part.
    expect(store.setDraftReview(d.id, base, { putBack: [] })).toBe(true);
    expect(store.getDraftReview(d.id)).toMatchObject({ putBack: [], view: 'exact', text: 'Asha, you laughed at the rain today, and so did I.' });
    expect(store.setDraftReview(d.id, base, { text: null })).toBe(true);
    expect(store.getDraftReview(d.id)?.text).toBeNull();
  });

  it('never changes raw_transcript, typed_text or anything the letter syncs', () => {
    const d = spokenDraft(asha());
    const before = row(d.id)!;
    store.setDraftReview(d.id, wordsBase(SAID), { putBack: [FILLER, REPEAT], view: 'exact', text: 'Asha laughed.' });
    const after = row(d.id)!;
    for (const [k, v] of Object.entries(before)) if (!k.startsWith('review_')) expect(after[k]).toEqual(v);
    expect(after.raw_transcript).toBe(SAID);
  });

  it('choices made on other words are cleared by the next write, never mixed with new ones', () => {
    const d = spokenDraft(asha());
    store.setDraftReview(d.id, wordsBase(SAID), { putBack: [FILLER], view: 'exact', text: 'old words' });
    expect(store.setDraftReview(d.id, wordsBase('Asha, new typed words.'), { text: 'new words' })).toBe(true);
    expect(store.getDraftReview(d.id)).toEqual({ putBack: [], view: null, text: 'new words', base: wordsBase('Asha, new typed words.') });
  });

  it('refuses a bad view, a missing base or a missing draft', () => {
    const d = spokenDraft(asha());
    expect(store.setDraftReview(d.id, wordsBase(SAID), { view: 'sideways' as never })).toBe(false);
    expect(store.setDraftReview(d.id, '', { view: 'exact' })).toBe(false);
    expect(store.setDraftReview('missing', wordsBase(SAID), { view: 'exact' })).toBe(false);
    expect(store.getDraftReview('missing')).toBeNull();
    expect(store.getDraftReview(d.id)?.view).toBeNull();
  });

  it('[F04-REQ-009] Let it go clears them at step 1, and a draft being let go takes no more', () => {
    const d = spokenDraft(asha());
    store.setDraftReview(d.id, wordsBase(SAID), { putBack: [FILLER], view: 'exact', text: 'Asha laughed.' });
    expect(store.beginDiscard(d.id)).toBe(true);
    expect(store.getDraftReview(d.id)).toEqual({ putBack: [], view: null, text: null, base: null });
    expect(store.setDraftReview(d.id, wordsBase(SAID), { text: 'late keystroke' })).toBe(false);
    expect(store.finishDiscard(d.id)).toBe(true);
    expect(store.getDraftReview(d.id)).toBeNull();
  });

  it('Keep clears them: the draft row goes with the save, and a late write finds nothing', () => {
    const c = asha();
    const d = spokenDraft(c);
    store.setDraftReview(d.id, wordsBase(SAID), { putBack: [FILLER], text: 'Asha, you laughed at the rain today.' });
    store.saveLetterFromDraft(d.id, {
      id: d.id, kind: 'letter', occurredOn: '2026-10-03', capturedAt: now(), captureMode: 'spoken', editLevel: 'clean',
      promptKey: null, engineVersion: 5, rawTranscript: SAID, machineEdits: [REPEAT], finalText: 'Asha, you laughed at the rain today.',
      inBook: true, soundsLikeMe: null, childId: c, authorSignsAs: 'Mama', audioUri: d.audioUri, audioSha256: 'a'.repeat(64), audioBytes: 48000,
    });
    expect(store.getDraftReview(d.id)).toBeNull();
    expect(store.setDraftReview(d.id, wordsBase(SAID), { text: 'late' })).toBe(false);
    // The letter's synced shape is what Review kept: only the fixes in force, raw untouched.
    expect(store.getEntry(d.id)).toMatchObject({ rawTranscript: SAID, machineEdits: [REPEAT] });
  });

  it('a held draft of a signed-in author keeps them, and writing them queues no sync op', () => {
    writeSetting(raw, SYNC_SETTING.owner, '11111111-1111-1111-1111-111111111111');
    const d = spokenDraft(asha());
    expect(store.holdDraft(d.id, { inBookChoice: true })).toBe(true);
    const queued = outbox();
    store.setDraftReview(d.id, wordsBase(SAID), { putBack: [FILLER], view: 'exact', text: 'Asha laughed.' });
    expect(outbox()).toEqual(queued);
    expect(store.getDraftReview(d.id)).toMatchObject({ putBack: [FILLER], view: 'exact', text: 'Asha laughed.' });
  });
});

describe('[SR-C-06] restoring: the machine adds nothing from storage', () => {
  it('only leaves out fixes the engine proposed again; an unknown stored fix adds nothing', () => {
    const stranger: Edit = { type: 'filler', start: 30, end: 33, original: 'xx ', replacement: '', source: 'rule' };
    const r = restoreApplied([FILLER, REPEAT], [REPEAT, stranger]);
    expect(r.applied).toEqual([FILLER]);
    expect(r.putBack).toEqual([REPEAT]);
    expect(restoreApplied([FILLER], []).applied).toEqual([FILLER]);
  });

  it('undo of a put-back removes one identical entry', () => {
    expect(withoutPutBack([FILLER, REPEAT, FILLER], FILLER)).toEqual([FILLER, REPEAT]);
  });

  it('restores only on the same words, and reads a bad stored value as nothing', () => {
    const saved = { putBack: [FILLER], view: 'exact' as const, text: null, base: wordsBase(SAID) };
    expect(restorable(saved, SAID)).toBe(saved);
    expect(restorable(saved, 'Asha, other words.')).toBeNull();
    expect(restorable({ putBack: [], view: null, text: null, base: wordsBase(SAID) }, SAID)).toBeNull();
    expect(parsePutBack('not json')).toEqual([]);
    expect(parsePutBack('[{"type":"filler"}]')).toEqual([]);
  });
});

describe('[F04-REQ-011] typed words are written within 500 ms', () => {
  it('the debounce is at most 500 ms', () => {
    expect(TYPED_WRITE_DEBOUNCE_MS).toBeLessThanOrEqual(500);
  });

  it('writes the last words after the quiet, put-backs and the view at once, and flush writes now', () => {
    vi.useFakeTimers();
    try {
      const writes: unknown[] = [];
      const w = reviewWriter((p) => writes.push(p));
      w.text('A');
      w.text('As');
      vi.advanceTimersByTime(TYPED_WRITE_DEBOUNCE_MS - 1);
      expect(writes).toEqual([]);
      w.putBack([FILLER]);
      w.view('exact');
      expect(writes).toEqual([{ putBack: [FILLER] }, { view: 'exact' }]);
      vi.advanceTimersByTime(1);
      expect(writes.at(-1)).toEqual({ text: 'As' });
      w.text('Ash');
      w.flush();
      expect(writes.at(-1)).toEqual({ text: 'Ash' });
      vi.advanceTimersByTime(1000);
      expect(writes).toHaveLength(4); // nothing written twice
      w.text('Asha');
      w.cancel();
      vi.advanceTimersByTime(1000);
      expect(writes).toHaveLength(4);
    } finally {
      vi.useRealTimers();
    }
  });

  it('a failed write never reaches the screen', () => {
    const w = reviewWriter(() => {
      throw new Error('disk full');
    });
    expect(() => w.putBack([FILLER])).not.toThrow();
    w.text('Asha');
    expect(() => w.flush()).not.toThrow();
  });
});
