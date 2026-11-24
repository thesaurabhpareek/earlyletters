/// <reference types="node" />
/**
 * BL-444 slice 2 (D-113, F11-REQ-011, DATA-REQ-016): what the "Letters to {child}" screen reads, through the store door
 * only (listLeftBooks, listLeftBookEntries) over the real merge. Covers the slice 1 review notes: a left book that is
 * joined again leaves the left list (data-steward note 1), a second signed-in account sees nothing (security note), a
 * support-hidden book stays hidden, and a letter with no author is this phone's own and is listed (data-steward note 5).
 * Fictional family "Asha" only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';
import { letter } from './helpers/store-fixture';
import { publishAuth, resetAuthStoreForTests } from '../src/lib/auth/auth-store';
import { leftBookPage, leftBookRows } from '../src/components/settings/left-books.logic';
import { applyPullPage } from '../src/lib/sync/merge';
import type { PullResponse, PulledRow } from '../src/lib/sync/types';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');

const NOW = '2026-10-30T09:00:00.000Z';
const ME = '11111111-1111-1111-1111-111111111111';
const PAPA = '22222222-2222-2222-2222-222222222222';
const OTHER = '33333333-3333-3333-3333-333333333333';
const ASHA = '0199a5b0-0000-7000-8000-0000000000a1';
const MINE = '0199a5b0-0000-7000-8000-0000000000b1';
const HIS = '0199a5b0-0000-7000-8000-0000000000b2';

const row = (id: string, author: string): PulledRow => ({
  id, child_id: ASHA, author_id: author, author_signs_as: author === ME ? 'Mama' : 'Papa', kind: 'letter', occurred_on: '2026-10-20',
  captured_at: '2026-10-20T08:00:00.000Z', capture_mode: 'typed', edit_level: 'verbatim', prompt_key: null, engine_version: 5,
  raw_transcript: `You laughed at the rain ${id.slice(-2)}.`, machine_edits: [], final_text: `You laughed at the rain ${id.slice(-2)}.`,
  in_book: true, sounds_like_me: null, approval: 'approved', audio_kept_on_device: false, language: 'en',
  created_at: '2026-10-20T08:00:00.000Z', updated_at: '2026-10-20T08:00:00.000Z', deleted_at: null, own: author === ME, v: '100',
});
const bookPage = (rows: PulledRow[]): PullResponse => ({
  reset: false, epoch: 1, epoch_started_at: NOW,
  books: [{
    id: ASHA, access: 'parent', repull: false, meta_hash: 'h1', cursor: '100:00000000-0000-0000-0000-000000000000', more: false, rows,
    meta: {
      role: 'parent', name: 'Asha', nickname: null, date_of_birth: '2026-03-01', birthday_md: '03-01', due_date: null, family_can_read: false,
      created_by_me: false, my_signs_as: 'Mama', include_in_reminders: true,
      members: [
        { profile_id: ME, role: 'parent', is_me: true, joined_at: NOW, signs_as: null },
        { profile_id: PAPA, role: 'parent', is_me: false, joined_at: NOW, signs_as: null },
      ],
    },
  }],
  gone: [],
});
const gonePage = (): PullResponse => ({
  reset: false, epoch: 1, epoch_started_at: NOW, books: [],
  gone: [{ id: ASHA, reason: 'not_member', rows: [], cursor: '200:00000000-0000-0000-0000-000000000000', more: false }],
});

let close: () => void = () => {};
function phone() {
  const h = nodeDb();
  close = h.close;
  let seq = 0;
  store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => NOW, newId: () => `0199a5b0-0000-7000-8000-${String(++seq + 900).padStart(12, '0')}` });
  const db = store.localSqlDb();
  db.run("INSERT INTO settings (key, value) VALUES ('sync.ownerId', ?)", ME);
  db.transaction(() => applyPullPage(db, bookPage([row(MINE, ME), row(HIS, PAPA)]), NOW));
  return db;
}
const leave = (db: ReturnType<typeof phone>) => db.transaction(() => applyPullPage(db, gonePage(), NOW));
/** What the screen draws: the rows on Settings and the page of the first left book. */
const screen = (id: string = ASHA) => ({
  rows: leftBookRows(store.listLeftBooks()),
  page: leftBookPage(store.listLeftBooks(), id, store.listLeftBookEntries),
});

beforeEach(() => {
  store.closeStore();
  resetAuthStoreForTests();
});
afterEach(() => {
  store.closeStore();
  close();
  close = () => {};
  resetAuthStoreForTests();
});

describe('[BL-444] the screen reads a left book through the store door', () => {
  it('before leaving there is no row and the page is empty', () => {
    phone();
    const s = screen();
    expect(s.rows).toEqual([]);
    expect(s.page.empty).not.toBeNull();
    expect(s.page.entries).toEqual([]);
  });

  it('after leaving, one row for the book and a page with only the person\'s own letter', () => {
    const db = phone();
    leave(db);
    const s = screen();
    expect(s.rows.map((r) => r.title)).toEqual(['Letters to Asha']);
    expect(s.page.title).toBe('Letters to Asha');
    expect(s.page.entries.map((e) => e.id)).toEqual([MINE]);
    expect(s.page.empty).toBeNull();
  });

  it('[slice 1 review, data-steward 1] a left book that is joined again leaves the left list, and the page goes empty', () => {
    const db = phone();
    leave(db);
    expect(screen().rows).toHaveLength(1);
    db.transaction(() => applyPullPage(db, bookPage([row(MINE, ME)]), NOW));
    const s = screen();
    expect(s.rows).toEqual([]);
    expect(s.page.empty).not.toBeNull();
    expect(s.page.entries).toEqual([]);
    expect(store.listChildren().map((c) => c.id)).toEqual([ASHA]); // back in the usual list
  });

  it('[slice 1 review, security] a second signed-in account sees no row and no letters', () => {
    const db = phone();
    leave(db);
    publishAuth({ status: 'ready', userId: OTHER, sync: 'off' });
    const s = screen();
    expect(s.rows).toEqual([]);
    expect(s.page.entries).toEqual([]);
    expect(s.page.empty).not.toBeNull();
    expect(s.page.title).toBe('Letters'); // the child's name is not in the title either
    // The owner signing in again sees the book.
    publishAuth({ status: 'ready', userId: ME, sync: 'off' });
    expect(screen().page.entries.map((e) => e.id)).toEqual([MINE]);
  });

  it('[slice 1 review, data-steward 5] a letter with no author is this phone\'s own and is listed', () => {
    const db = phone();
    // Written on this phone before it had signed in: no author, never synced.
    const local = letter({ id: '0199a5b0-0000-7000-8000-0000000000c1', childId: ASHA, finalText: 'You waved at the dog.' });
    store.saveEntry(local);
    expect(db.get<{ a: string | null }>('SELECT author_id AS a FROM entries WHERE id = ?', local.id)?.a ?? null).toBeNull();
    leave(db);
    expect(screen().page.entries.map((e) => e.id).sort()).toEqual([MINE, local.id].sort());
  });

  it('[slice 1 review, security] a book the support path hid for everyone stays hidden after leaving', () => {
    const db = phone();
    leave(db);
    db.run("UPDATE children SET hidden_at = '2026-10-31T00:00:00.000Z' WHERE id = ?", ASHA);
    expect(screen().rows).toEqual([]);
    expect(screen().page.entries).toEqual([]);
  });

  it('a left book whose last letter was deleted on this phone is not listed (nothing to read)', () => {
    const db = phone();
    leave(db);
    db.run("UPDATE entries SET deleted_at = ? WHERE id = ?", NOW, MINE);
    expect(screen().rows).toEqual([]);
  });
});
