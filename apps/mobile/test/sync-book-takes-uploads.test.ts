/// <reference types="node" />
/**
 * FU-10c and FU-10d: a letter or a held draft is queued for upload only while its book still takes uploads from this
 * phone (sync/outbox.ts bookTakesUploads). A book waiting in Recently deleted (BL-559 keeps it 'local' after sign-in), a
 * book this person left ('left', BL-1959) and a book the server closed as deleted ('deleted') queue nothing through
 * `enqueueEntryUpsert` or `enqueueHeldDraft`, whoever calls them. Change words (BL-413) on a letter in a Recently
 * deleted book is the caller the review of #2116 found: it now behaves as the other edits there do (the local write
 * stands, nothing is queued) and the words travel when the book is restored.
 *
 * Mutants each test was checked against (each one turned tests here red when it was made):
 *  M1 outbox.ts enqueueEntryUpsert: the bookTakesUploads guard removed;
 *  M2 outbox.ts enqueueHeldDraft: the bookTakesUploads guard removed;
 *  M3 bookTakesUploads: the Recently deleted mark not read;
 *  M4 bookTakesUploads: 'left' not refused;
 *  M5 bookTakesUploads: 'deleted' not refused.
 * Real store and repos over node:sqlite with the app's migrations; only natives are stubbed. Fictional family "Asha" only.
 */
import { randomBytes } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SqlDb } from '../src/lib/db/sql';
import { nodeDb } from './helpers/node-db';
import { letter } from './helpers/store-fixture';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(randomBytes(n)) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const A = '0192f0aa-0000-7000-8000-0000000000a1';
const NOW = '2026-11-20T09:00:00.000Z';
type Store = typeof import('../src/lib/store');
type Ownership = typeof import('../src/lib/sync/ownership');
type Outbox = typeof import('../src/lib/sync/outbox');
let store: Store;
let ownership: Ownership;
let outboxMod: Outbox;
let db: SqlDb;
let n = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
const ctx = { now: NOW, newId: id7 };

const SAID = 'Asha, you laughed at the rain today.';
const CHANGED = 'Asha, you laughed in the rain today.';

const outbox = () => db.all<{ type: string; entity_id: string; payload: string }>('SELECT type, entity_id, payload FROM sync_outbox ORDER BY seq');
const opsOf = (id: string) => outbox().filter((o) => o.entity_id === id);

/** A held draft of a book, made through the store as the Keep gate does. */
function heldDraft(childId: string): string {
  const d = store.createDraft({ childId, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'Asha, the first snow.' });
  expect(store.holdDraft(d.id, { inBookChoice: null })).toBe(true);
  return d.id;
}

interface Book {
  book: string;
  saved: string;
  waiting: string;
  held: string;
}

/** A book with a saved letter, a voice-only letter waiting for its words, and a held draft. */
function bookOf(name: string, birthday: string): Book {
  const book = store.addChild({ name, birthday, dueDate: null, signsAs: 'Mama' }).id;
  const saved = id7();
  store.saveEntry(letter({ id: saved, childId: book, capturedAt: '2026-11-01T08:00:00.000Z', finalText: SAID, audioUri: null }));
  const waiting = id7();
  store.saveEntry(
    letter({ id: waiting, childId: book, capturedAt: '2026-11-02T08:00:00.000Z', rawTranscript: '', finalText: '', transcriptStatus: 'waiting', audioUri: `file:///Documents/${waiting}.m4a` }),
  );
  const held = heldDraft(book);
  return { book, saved, waiting, held };
}

/**
 * Asha's book stays live; Dev's (the second Asha-family book, helpers/asha-export.ts) is deleted on this phone before the
 * first sign-in (Recently deleted), and the phone then signs in, so the book stays 'local' (BL-559). The queue is emptied, so each test reads only what it caused.
 */
function signedInWithADeletedBook(): { live: Book; gone: Book } {
  const live = bookOf('Asha', '2026-03-01');
  const gone = bookOf('Dev', '2024-05-31');
  expect(store.deleteBook(gone.book)).toBe(true);
  ownership.takeOwnership(db, A, ctx);
  db.run('DELETE FROM sync_outbox');
  return { live, gone };
}

/** One signed-in book, then closed by the pull as `state` ('left' or 'deleted'), with the queue emptied. */
function signedInWithAClosedBook(state: 'left' | 'deleted'): { live: Book; closed: Book } {
  const live = bookOf('Asha', '2026-03-01');
  const closed = bookOf('Dev', '2024-05-31');
  ownership.takeOwnership(db, A, ctx);
  db.run('DELETE FROM sync_outbox');
  db.run('UPDATE children SET server_state = ? WHERE id = ?', state, closed.book);
  return { live, closed };
}

/** Every letter and the held draft of a book, sent to the two enqueue functions as any later caller would. */
function enqueueAll(b: Book): void {
  db.transaction(() => {
    outboxMod.enqueueEntryUpsert(db, b.saved, ['text'], ctx);
    outboxMod.enqueueEntryUpsert(db, b.waiting, ['text'], ctx);
    outboxMod.enqueueHeldDraft(db, b.held, ctx);
  });
}

beforeEach(async () => {
  vi.resetModules();
  store = (await import('../src/lib/store')) as Store;
  ownership = (await import('../src/lib/sync/ownership')) as Ownership;
  outboxMod = (await import('../src/lib/sync/outbox')) as Outbox;
  db = nodeDb().db;
  expect(store.openStore({ open: () => ({ db, close: () => {} }), now: () => NOW, newId: () => id7() }).ok).toBe(true);
});

describe('[FU-10c] enqueueEntryUpsert and enqueueHeldDraft queue nothing for a book that does not take uploads', () => {
  it('a book in Recently deleted: no entry.upsert, no held.upsert for its waiting letter, no held.upsert for its held draft', () => {
    const { live, gone } = signedInWithADeletedBook();
    enqueueAll(gone);
    expect(outbox()).toEqual([]);
    expect(outboxMod.bookTakesUploads(db, gone.book)).toBe(false);

    // The live book is decided as before: its letter, its waiting letter's held row and its held draft all go.
    enqueueAll(live);
    expect(outbox().map((o) => [o.type, o.entity_id])).toEqual([
      ['entry.upsert', live.saved],
      ['held.upsert', live.waiting],
      ['held.upsert', live.held],
    ]);
    expect(outboxMod.bookTakesUploads(db, live.book)).toBe(true);
  });

  it('a draft write through the store (store.ts writeDraft) queues nothing for a held draft of a book in Recently deleted', () => {
    const { live, gone } = signedInWithADeletedBook();
    expect(store.setDraftOccurred(gone.held, '2026-11-03', 'day')).toBe(true);
    expect(opsOf(gone.held)).toEqual([]);
    expect(store.setDraftOccurred(live.held, '2026-11-03', 'day')).toBe(true);
    expect(opsOf(live.held).map((o) => o.type)).toEqual(['held.upsert']);
  });

  it.each(['left', 'deleted'] as const)('a book with server_state %s: nothing of it is queued', (state) => {
    const { live, closed } = signedInWithAClosedBook(state);
    enqueueAll(closed);
    expect(outbox()).toEqual([]);
    expect(outboxMod.bookTakesUploads(db, closed.book)).toBe(false);
    enqueueAll(live);
    expect(outbox().map((o) => o.entity_id)).toEqual([live.saved, live.waiting, live.held]);
  });

  it('a book restored from Recently deleted takes uploads again: the mark is read at each call, not once', () => {
    const { gone } = signedInWithADeletedBook();
    enqueueAll(gone);
    expect(outbox()).toEqual([]);
    expect(store.restoreBook(gone.book)).toBe(true); // claimRestoredBook queues the book and everything in it
    expect(outboxMod.bookTakesUploads(db, gone.book)).toBe(true);
    for (const id of [gone.saved, gone.waiting, gone.held]) expect(opsOf(id).length, id).toBe(1);
  });
});

describe('[FU-10d, BL-413] Change words on a letter in a Recently deleted book queues nothing, as its other edits do', () => {
  it('the words change on the phone (raw_transcript untouched), every edit can be put back, and no op is queued', () => {
    const { gone } = signedInWithADeletedBook();
    const raw = () => db.get<{ raw_transcript: string }>('SELECT raw_transcript FROM entries WHERE id = ?', gone.saved)!.raw_transcript;
    const rawBefore = raw();

    // The other edits of a letter in that book, as the app already does them: the local write stands, nothing queued.
    expect(store.setEntryDate(gone.saved, '2026-10-30', 'day')).toBe(true);
    expect(store.setEntryInBook(gone.saved, true)).toBe(true);
    expect(opsOf(gone.saved)).toEqual([]);

    // Change words does the same.
    expect(store.canChangeLetterWords(gone.saved)).toBe(true);
    expect(store.changeLetterWords(gone.saved, CHANGED)).toBe(true);
    expect(store.getEntry(gone.saved)).toMatchObject({ finalText: CHANGED });
    expect(raw()).toBe(rawBefore);
    expect(opsOf(gone.saved)).toEqual([]);

    const layer = store.letterAuthorEdits(gone.saved)!;
    expect(layer.edits.length).toBeGreaterThan(0);
    for (const e of layer.edits) expect(store.putBackLetterEdit(gone.saved, e)).toBe(true);
    expect(store.getEntry(gone.saved)).toMatchObject({ finalText: SAID });
    expect(outbox()).toEqual([]);
  });

  it('when the book is restored, the letter goes up once, with the words the person changed', () => {
    const { gone } = signedInWithADeletedBook();
    expect(store.changeLetterWords(gone.saved, CHANGED)).toBe(true);
    expect(outbox()).toEqual([]);
    expect(store.restoreBook(gone.book)).toBe(true);
    const ups = opsOf(gone.saved);
    expect(ups.map((o) => o.type)).toEqual(['entry.upsert']);
    expect((JSON.parse(ups[0].payload) as { data: { final_text: string; raw_transcript: string } }).data).toMatchObject({
      final_text: CHANGED,
      raw_transcript: letter().rawTranscript,
    });
  });

  it('on a live book Change words still queues its one entry.upsert of the words group', () => {
    const { live } = signedInWithADeletedBook();
    expect(store.changeLetterWords(live.saved, CHANGED)).toBe(true);
    const ups = opsOf(live.saved);
    expect(ups.map((o) => o.type)).toEqual(['entry.upsert']);
    expect((JSON.parse(ups[0].payload) as { changed: string[] }).changed).toEqual(['text']);
  });
});
