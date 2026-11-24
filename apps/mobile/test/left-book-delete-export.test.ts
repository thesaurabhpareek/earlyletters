/// <reference types="node" />
/**
 * BL-1960 (BL-444 slice 3a; F11-REQ-011, DATA-REQ-016): a left book's letters export, and the delete rule. Real store over
 * node:sqlite, a clock the test moves, a fake audio eraser. Each test names the failure it guards: an `entry.delete`,
 * `entry.restore` or `entry.erase` for a left book that is not queued (the server takes both from the author who left:
 * supabase/tests/sync_left_book_delete.test.mjs), a left book's letter that never leaves a sync build's shelf, and a
 * `children` row (name, birth date) that outlives its last letter or an op still queued for the book. BL-1959's
 * refusals stay.
 * Fictional Asha family only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';
import { letter } from './helpers/store-fixture';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({ openNativeDb: () => { throw new Error('native open must not be used in tests'); } }));

import type { AudioEraser } from '../src/lib/store';
import { applyPushResponse } from '../src/lib/sync/merge';
import { markSent, takeBatch } from '../src/lib/sync/outbox';
import type { PushResponse } from '../src/lib/sync/types';
const store = await import('../src/lib/store');
const { setServerFeaturesForTests } = await import('../src/lib/capabilities');
const { exportScope } = await import('../src/lib/export/scope.logic');

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.parse('2026-10-03T09:00:00.000Z');
let clock = T0;
let close: () => void = () => {};
let seq = 0;
let asha = '';
const id = (n: number) => `0199a5b0-0000-7000-8000-${String(n).padStart(12, '0')}`;
const eraser: AudioEraser = () => {};
const sql = () => store.localSqlDb();
const outbox = () => sql().all<{ type: string; entity_id: string }>('SELECT type, entity_id FROM sync_outbox ORDER BY seq');
const rejected = () => sql().get<{ n: number }>('SELECT COUNT(*) AS n FROM rejected_writes')!.n;
const bookRow = (bookId: string) => sql().get<{ id: string }>('SELECT id FROM children WHERE id = ?', bookId);
const leave = (bookId: string) => sql().run("UPDATE children SET server_state = 'left' WHERE id = ?", bookId);

beforeEach(() => {
  clock = T0;
  seq = 0;
  store.closeStore();
  const h = nodeDb();
  close = h.close;
  store.openStore({
    open: () => ({ db: h.db, close: () => {} }),
    now: () => new Date(clock).toISOString(),
    newId: () => `0199a5b0-0000-7000-8000-${String(900 + ++seq).padStart(12, '0')}`,
  });
  asha = store.addChild({ name: 'Asha', birthday: '2026-03-08', dueDate: null, signsAs: 'Mama' }).id;
  store.setSetting('sync.ownerId', 'user-asha-1');
});
afterEach(() => {
  setServerFeaturesForTests(null);
  store.closeStore();
  close();
});

/** A letter the server holds (it has a server version), as every letter of a book this person left has. */
function serverHeld(n: number, bookId = asha) {
  store.saveEntry(letter({ id: id(n), childId: bookId, finalText: `You laughed at the rain ${n}.`, authorId: 'user-asha-1' }));
  sql().run('UPDATE entries SET server_version = 3, synced_at = ? WHERE id = ?', '2026-10-02T00:00:00.000Z', id(n));
  sql().run('DELETE FROM sync_outbox');
}

describe('[BL-1960] export reads a left book, read only (DATA-REQ-016)', () => {
  const readers = () => ({
    listed: () => store.listChildren(),
    hidden: () => store.listHiddenChildren(),
    closedByServer: () => store.listClosedBooks(),
    live: (b: string) => store.listEntriesForChild(b),
    deleted: (b: string) => store.listDeletedEntriesForChild(b),
    left: () => store.listLeftBooks(),
    leftLive: (b: string) => store.listLeftBookEntries(b),
  });

  it('a left book and its own live letters are in the export, with no request open', () => {
    serverHeld(1);
    serverHeld(2);
    leave(asha);
    // Without the left readers (the old scope) nothing of it is exported: the failure this slice closes.
    expect(exportScope({ ...readers(), left: undefined, leftLive: undefined }, false)).toEqual([]);
    const s = exportScope(readers(), false);
    expect(s.map((b) => b.book.id)).toEqual([asha]);
    expect(s[0]!.hidden).toBe(false);
    expect(s[0]!.letters.map((e) => e.id).sort()).toEqual([id(1), id(2)]);
    expect(outbox()).toEqual([]);
    expect(store.getEntry(id(1))).toMatchObject({ finalText: 'You laughed at the rain 1.' }); // nothing was changed
  });

  it('a joined book is read once, and a letter on the shelf is not in a normal export', () => {
    serverHeld(1);
    const s = exportScope(readers(), false);
    expect(s.map((b) => b.book.id)).toEqual([asha]);
    leave(asha);
    store.deleteLeftBookLetter(id(1));
    expect(exportScope(readers(), false).flatMap((b) => b.letters)).toEqual([]);
  });

  it('with a second account signed in the left book is not exported (the display list rules)', async () => {
    serverHeld(1);
    leave(asha);
    const auth = await import('../src/lib/auth/auth-store');
    const before = auth.getAuthSnapshot();
    auth.publishAuth({ status: 'ready', userId: 'user-bea-2', sync: 'on' });
    try {
      expect(exportScope(readers(), false)).toEqual([]);
    } finally {
      auth.publishAuth(before);
    }
  });

  it('the app\'s export passes the left readers (device.ts)', () => {
    const src = readFileSync(join(__dirname, '../src/lib/export/device.ts'), 'utf8');
    expect(src).toMatch(/left: listLeftBooks, leftLive: listLeftBookEntries/);
  });
});

describe('[BL-1960] delete: its own door, a local tombstone and one entry.delete', () => {
  it('deletes a left book\'s letter to the shelf and queues one entry.delete; deleteEntry and undeleteEntry still refuse it (BL-1959)', () => {
    serverHeld(1);
    leave(asha);
    expect(store.deleteEntry(id(1))).toBe(false);
    expect(outbox()).toEqual([]);
    expect(store.deleteLeftBookLetter(id(1))).toBe(true);
    expect(outbox().map((o) => [o.type, o.entity_id])).toEqual([['entry.delete', id(1)]]);
    expect(store.listDeleted().map((e) => e.id)).toEqual([id(1)]);
    expect(store.undeleteEntry(id(1))).toBe(false);
    expect(outbox().map((o) => o.type)).toEqual(['entry.delete']);
    expect(store.deleteLeftBookLetter(id(1))).toBe(false); // already deleted
  });

  it('refuses a letter in a book that is still joined: the door is not a way around the queue', () => {
    serverHeld(1);
    expect(store.deleteLeftBookLetter(id(1))).toBe(false);
    expect(store.getEntry(id(1))).not.toBeNull();
    expect(store.deleteLeftBookLetter('no-such-letter')).toBe(false);
  });

  it('refuses a letter someone else wrote', () => {
    store.saveEntry(letter({ id: id(1), childId: asha, finalText: 'Bea wrote this.', authorId: 'user-bea-2' }));
    leave(asha);
    expect(store.deleteLeftBookLetter(id(1))).toBe(false);
  });
});

describe('[BL-1960] Erase now and the book row', () => {
  const deleted = (n: number) => {
    expect(store.deleteLeftBookLetter(id(n))).toBe(true);
  };

  it('Erase now removes the letter here and queues an entry.erase, as a joined book does (control)', () => {
    serverHeld(1);
    serverHeld(9);
    sql().run("UPDATE entries SET deleted_at = ? WHERE id = ?", '2026-10-03T00:00:00.000Z', id(9));
    expect(store.eraseEntry(id(9), eraser)).toBe(true);
    expect(outbox().map((o) => o.type)).toEqual(['entry.erase']); // control: a joined book
    sql().run('DELETE FROM sync_outbox');
    serverHeld(2);
    leave(asha);
    deleted(1);
    sql().run('DELETE FROM sync_outbox');
    expect(store.eraseEntry(id(1), eraser)).toBe(true);
    expect(sql().get('SELECT 1 FROM entries WHERE id = ?', id(1))).toBeNull();
    expect(outbox().map((o) => [o.type, o.entity_id])).toEqual([['entry.erase', id(1)]]);
    expect(rejected()).toBe(0);
  });

  it('the local erase never waits on the answer: a queued erase answered missing or deferred leaves the letter erased here, and the book row goes once the op is answered', () => {
    for (const answer of [{ missing: true }, { deferred: true }]) {
      const lid = id(Object.keys(answer)[0] === 'missing' ? 1 : 2);
      const book = store.addChild({ name: `Book ${lid}`, birthday: null, dueDate: null, signsAs: 'Mama' }).id;
      serverHeld(Object.keys(answer)[0] === 'missing' ? 1 : 2, book);
      leave(book);
      expect(store.deleteLeftBookLetter(lid)).toBe(true);
      sql().run('DELETE FROM sync_outbox');
      expect(store.eraseEntry(lid, eraser)).toBe(true);
      expect(sql().get('SELECT 1 FROM entries WHERE id = ?', lid)).toBeNull();
      expect(bookRow(book)).not.toBeNull(); // the erase is still queued for this book
      expect(store.purgeExpired(clock, eraser)).toBe(0);
      expect(bookRow(book)).not.toBeNull();
      const b = takeBatch(sql(), { now: new Date(clock).toISOString() });
      expect(b.ops.map((o) => o.type)).toEqual(['entry.erase']);
      sql().transaction(() => {
        markSent(sql(), b.rows, new Date(clock).toISOString());
        applyPushResponse(sql(), b.rows, { results: [{ op: b.ops[0].op, ok: true, ...answer }], paused: false, stopped: false } as unknown as PushResponse, {
          now: new Date(clock).toISOString(),
          newId: () => id(950),
        });
      });
      expect(outbox()).toEqual([]);
      expect(rejected()).toBe(0);
      expect(sql().get('SELECT 1 FROM entries WHERE id = ?', lid)).toBeNull(); // still erased here
      expect(store.purgeExpired(clock, eraser)).toBe(0);
      expect(bookRow(book)).toBeNull(); // the queue has drained: the book row goes at the next purge
    }
  });

  it('the book row goes with the last letter, not before, and a draft keeps it', () => {
    serverHeld(1);
    serverHeld(2);
    const d = store.createDraft({ childId: asha, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: 0 });
    leave(asha);
    deleted(1);
    expect(store.eraseEntry(id(1), eraser)).toBe(true);
    expect(bookRow(asha)).not.toBeNull(); // a letter is still filed in it
    deleted(2);
    expect(store.eraseEntry(id(2), eraser)).toBe(true);
    expect(bookRow(asha)).not.toBeNull(); // a draft is still aimed at it
    store.deleteDraft(d.id);
    expect(store.purgeExpired(clock, eraser)).toBe(0);
    expect(bookRow(asha)).not.toBeNull(); // the delete and erase ops for this book are still queued
    sql().run('DELETE FROM sync_outbox'); // the server has answered them
    expect(store.purgeExpired(clock, eraser)).toBe(0);
    expect(bookRow(asha)).toBeNull();
  });

  it('the book row goes when its last letter is erased, with its prefs and sync marks, and listLeftBooks is empty', () => {
    serverHeld(1);
    leave(asha);
    deleted(1);
    expect(store.listLeftBooks()).toEqual([]); // no live letter: not listed, yet the row is still there
    expect(bookRow(asha)).not.toBeNull();
    expect(store.eraseEntry(id(1), eraser)).toBe(true);
    expect(bookRow(asha)).not.toBeNull(); // ops for the book still wait in the outbox: the row stays until they are answered
    sql().run('DELETE FROM sync_outbox');
    store.purgeExpired(clock, eraser);
    expect(bookRow(asha)).toBeNull();
    expect(sql().get('SELECT 1 FROM child_member_prefs WHERE child_id = ?', asha)).toBeNull();
    expect(store.isBookLeft(asha)).toBe(false);
  });

  it('a book that is not left keeps its row after its last letter is erased', () => {
    serverHeld(1);
    sql().run('UPDATE entries SET deleted_at = ? WHERE id = ?', '2026-10-03T00:00:00.000Z', id(1));
    expect(store.eraseEntry(id(1), eraser)).toBe(true);
    expect(bookRow(asha)).not.toBeNull();
  });

  it('tells a device-file hook that the book is gone', () => {
    serverHeld(1);
    leave(asha);
    deleted(1);
    const seen: string[] = [];
    const off = store.onBookErased((b) => seen.push(b));
    store.eraseEntry(id(1), eraser);
    expect(seen).toEqual([]); // ops for the book are still queued
    sql().run('DELETE FROM sync_outbox');
    store.purgeExpired(clock, eraser);
    off();
    expect(seen).toEqual([asha]);
  });
});

describe('[BL-1960] the 30-day purge, on a sync build', () => {
  const launch = (ms: number) => {
    store.recordLaunch(ms);
    return store.purgeExpired(ms, eraser);
  };

  it('erases a left book\'s deleted letter after 30 days and queues its entry.erase, drops the book once that is answered, and still leaves a joined book\'s server-held letter to the server', () => {
    setServerFeaturesForTests(true);
    serverHeld(1);
    leave(asha);
    store.deleteLeftBookLetter(id(1));
    const other = store.addChild({ name: 'Bea', birthday: null, dueDate: null, signsAs: 'Mama' }).id;
    serverHeld(2, other);
    sql().run('UPDATE entries SET deleted_at = ? WHERE id = ?', new Date(T0).toISOString(), id(2));
    expect(launch(T0 + 29 * DAY)).toBe(0);
    expect(bookRow(asha)).not.toBeNull();
    expect(launch(T0 + 31 * DAY)).toBe(1);
    expect(sql().get('SELECT 1 FROM entries WHERE id = ?', id(1))).toBeNull();
    expect(outbox().map((o) => [o.type, o.entity_id])).toEqual([['entry.erase', id(1)]]); // the erase supersedes the unsent delete
    expect(bookRow(asha)).not.toBeNull(); // waits for the queue
    sql().run('DELETE FROM sync_outbox');
    launch(T0 + 32 * DAY);
    expect(bookRow(asha)).toBeNull();
    expect(sql().get('SELECT 1 FROM entries WHERE id = ?', id(2))).not.toBeNull(); // the server's purge owns it
    expect(rejected()).toBe(0);
  });

  it('removes a left book that holds nothing at all, whatever the clock, and keeps a joined empty one', () => {
    const other = store.addChild({ name: 'Bea', birthday: null, dueDate: null, signsAs: 'Mama' }).id;
    leave(asha);
    expect(store.purgeExpired(T0, eraser)).toBe(0); // no readable launch stamp: no letter is erased, the empty book still goes
    expect(bookRow(asha)).toBeNull();
    expect(bookRow(other)).not.toBeNull();
  });
});
