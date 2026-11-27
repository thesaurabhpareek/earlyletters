/// <reference types="node" />
/**
 * BL-559: a book deleted on this phone never leaves it at first sign-in. A book in Recently deleted (deleted before the
 * phone ever signed in, F17 6.2 D) is not claimed by `takeOwnership`: no book.first_run or book.create names it, no
 * prefs.upsert, no entry.upsert for its letters and no held.upsert for its held drafts. Recording backup does not list
 * or back up its recordings. If the person restores it after signing in, it is claimed then, like a book made after
 * sign-in (`claimRestoredBook`, through store.restoreBook).
 *
 * Mutants each test was checked against (each one turned a test here red when it was made):
 *  M1 ownership.ts: the Recently deleted clause taken out of the books query (the deleted book is claimed and queued);
 *  M2 ownership.ts: the clause taken out of the letters query (its letters are queued under a book the server never gets);
 *  M3 ownership.ts: the clause taken out of the held drafts query;
 *  M4 local-store.ts: the clause taken out of LETTER_WHERE (its recordings are listed and `has` says yes);
 *  M5 local-store.ts: the clause taken out of DRAFT_WHERE;
 *  M6 store.ts restoreBook: `claimRestoredBook` not called (a restored book stays 'local' and its letters never go).
 * Real store and repos over node:sqlite with the app's migrations; only natives are stubbed. Fictional family "Asha" only.
 */
import { randomBytes } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { backupSource } from '../src/lib/backup/local-store';
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
let store: Store;
let ownership: Ownership;
let db: SqlDb;
let n = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
const ctx = { now: NOW, newId: id7 };

interface Phone {
  asha: string;
  nova: string;
  ashaLetter: string;
  novaLetters: string[];
  ashaHeld: string;
  novaHeld: string;
}

/** A held draft with a closed recording, as backup and the outbox read it. */
function heldDraft(childId: string): string {
  const d = store.createDraft({ childId, captureMode: 'spoken', promptKey: null, audioUri: `file:///Documents/draft-${childId}.m4a`, audioDurationMs: 9000, typedText: null });
  expect(store.holdDraft(d.id, { inBookChoice: null })).toBe(true);
  db.run("UPDATE drafts SET state = 'ready', audio_sha256 = ?, audio_bytes = 4800 WHERE id = ?", 'b'.repeat(64), d.id);
  return d.id;
}

/**
 * Before any sign-in: Asha's book with one spoken letter and a held draft, and Nova's book with two spoken letters and
 * a held draft. Nova's book is then deleted on this phone (it waits in Recently deleted).
 */
function phoneWithADeletedBook(): Phone {
  const asha = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
  const nova = store.addChild({ name: 'Nova', birthday: '2026-05-01', dueDate: null, signsAs: 'Mama' }).id;
  const ashaLetter = id7();
  store.saveEntry(letter({ id: ashaLetter, childId: asha, capturedAt: '2026-11-01T08:00:00.000Z', audioUri: 'file:///Documents/asha-1.m4a' }));
  const novaLetters = [id7(), id7()];
  novaLetters.forEach((id, i) =>
    store.saveEntry(letter({ id, childId: nova, capturedAt: `2026-11-0${i + 2}T08:00:00.000Z`, audioUri: `file:///Documents/nova-${i}.m4a` })),
  );
  const ashaHeld = heldDraft(asha);
  const novaHeld = heldDraft(nova);
  expect(store.deleteBook(nova)).toBe(true);
  expect(store.listDeletedBooks().map((b) => b.id)).toEqual([nova]);
  expect(db.get<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox')!.n).toBe(0); // nothing queued before sign-in
  return { asha, nova, ashaLetter, novaLetters, ashaHeld, novaHeld };
}

const outbox = () =>
  db.all<{ type: string; entity_id: string; book_id: string | null; payload: string }>('SELECT type, entity_id, book_id, payload FROM sync_outbox ORDER BY seq');
/** Every id an op names: its entity, its book, and any book id inside its payload (book.first_run lists its books). */
const namedIn = (op: { entity_id: string; book_id: string | null; payload: string }) => [op.entity_id, op.book_id, op.payload];
const mentions = (id: string) => outbox().some((op) => namedIn(op).some((x) => x !== null && x.includes(id)));
const serverState = (id: string) => db.get<{ s: string }>('SELECT server_state AS s FROM children WHERE id = ?', id)!.s;

beforeEach(async () => {
  vi.resetModules();
  store = (await import('../src/lib/store')) as Store;
  ownership = (await import('../src/lib/sync/ownership')) as Ownership;
  const opened = nodeDb();
  db = opened.db;
  expect(store.openStore({ open: () => ({ db, close: () => {} }), now: () => NOW, newId: () => id7() }).ok).toBe(true);
});

describe('[BL-559] a book in Recently deleted is not claimed at first sign-in', () => {
  it('no op names the deleted book, its letters or its held draft; the live book goes as before', () => {
    const p = phoneWithADeletedBook();
    const r = ownership.takeOwnership(db, A, ctx);

    expect(r).toMatchObject({ outcome: 'claimed', books: 1, localOnlyBooks: 0 });
    for (const id of [p.nova, ...p.novaLetters, p.novaHeld]) expect(mentions(id), id).toBe(false);
    expect(serverState(p.nova)).toBe('local');

    // The live book is unchanged by the fix: first-run batch, prefs, its letter, its held draft.
    const ops = outbox();
    const firstRun = ops.filter((o) => o.type === 'book.first_run');
    expect(firstRun).toHaveLength(1);
    expect((JSON.parse(firstRun[0].payload) as { data: { children: { id: string }[] } }).data.children.map((c) => c.id)).toEqual([p.asha]);
    expect(ops.filter((o) => o.type === 'book.create')).toEqual([]);
    expect(ops.filter((o) => o.type === 'prefs.upsert').map((o) => o.entity_id)).toEqual([p.asha]);
    expect(ops.filter((o) => o.type === 'entry.upsert').map((o) => o.entity_id)).toEqual([p.ashaLetter]);
    expect(ops.filter((o) => o.type === 'held.upsert').map((o) => o.entity_id)).toEqual([p.ashaHeld]);
    expect(serverState(p.asha)).toBe('pending');
  });

  it('a deleted book that is the only book on the phone: nothing at all is queued', () => {
    const nova = store.addChild({ name: 'Nova', birthday: '2026-05-01', dueDate: null, signsAs: 'Mama' }).id;
    const l = id7();
    store.saveEntry(letter({ id: l, childId: nova }));
    const held = heldDraft(nova);
    expect(store.deleteBook(nova)).toBe(true);
    expect(ownership.takeOwnership(db, A, ctx)).toMatchObject({ outcome: 'claimed', books: 0, letters: 0 });
    expect(outbox()).toEqual([]);
    expect(serverState(nova)).toBe('local');
    expect(db.get('SELECT id FROM drafts WHERE id = ?', held)).not.toBeNull(); // nothing deleted: it still waits in Recently deleted
    expect(store.listDeletedBooks().map((b) => b.id)).toEqual([nova]);
  });
});

describe('[BL-559] recording backup leaves a book in Recently deleted on the phone', () => {
  it('list and has hold the live book\'s recordings only, for letters and held drafts', () => {
    const p = phoneWithADeletedBook();
    ownership.takeOwnership(db, A, ctx);
    const src = backupSource({ db: () => db, profileId: A, heldOnServer: () => true });

    expect(src.list().map((i) => i.entryId).sort()).toEqual([p.ashaLetter, p.ashaHeld].sort());
    for (const id of [...p.novaLetters, p.novaHeld]) expect(src.has(id), id).toBe(false);
    expect(src.has(p.ashaLetter)).toBe(true);
    expect(src.has(p.ashaHeld)).toBe(true);
  });
});

describe('[BL-559] restoring the book after sign-in claims it then', () => {
  it('store.restoreBook queues the book, its prefs, its live letters and its held draft, in that order', () => {
    const p = phoneWithADeletedBook();
    ownership.takeOwnership(db, A, ctx);
    const before = outbox().length;
    expect(store.restoreBook(p.nova)).toBe(true);

    const added = outbox().slice(before);
    expect(added.map((o) => [o.type, o.entity_id])).toEqual([
      ['book.create', p.nova],
      ['prefs.upsert', p.nova],
      ['entry.upsert', p.novaLetters[0]],
      ['entry.upsert', p.novaLetters[1]],
      ['held.upsert', p.novaHeld],
    ]);
    expect(serverState(p.nova)).toBe('pending');
    // Backup lists its recordings again.
    const src = backupSource({ db: () => db, profileId: A, heldOnServer: () => true });
    expect(src.has(p.novaLetters[0])).toBe(true);
  });

  it('a letter deleted inside the book stays on the phone when the book is restored', () => {
    const p = phoneWithADeletedBook();
    db.run('UPDATE entries SET deleted_at = ? WHERE id = ?', NOW, p.novaLetters[1]);
    ownership.takeOwnership(db, A, ctx);
    expect(store.restoreBook(p.nova)).toBe(true);
    expect(mentions(p.novaLetters[0])).toBe(true);
    expect(mentions(p.novaLetters[1])).toBe(false);
  });

  it('on a phone that never signed in, a restore queues nothing', () => {
    const p = phoneWithADeletedBook();
    expect(store.restoreBook(p.nova)).toBe(true);
    expect(outbox()).toEqual([]);
    expect(serverState(p.nova)).toBe('local');
  });

  it('a restored book the server would refuse is marked refused and nothing is queued for it', () => {
    const p = phoneWithADeletedBook();
    db.run('UPDATE children SET birthday = NULL, due_date = NULL WHERE id = ?', p.nova);
    ownership.takeOwnership(db, A, ctx);
    const before = outbox().length;
    expect(store.restoreBook(p.nova)).toBe(true);
    expect(outbox().length).toBe(before);
    expect(serverState(p.nova)).toBe('refused');
  });

  it('claimRestoredBook does nothing for a book still in Recently deleted', () => {
    const p = phoneWithADeletedBook();
    ownership.takeOwnership(db, A, ctx);
    const before = outbox().length;
    db.transaction(() => ownership.claimRestoredBook(db, p.nova, ctx));
    expect(outbox().length).toBe(before);
    expect(serverState(p.nova)).toBe('local');
  });
});
