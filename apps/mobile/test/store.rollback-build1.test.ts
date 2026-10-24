/// <reference types="node" />
/**
 * The kill path (docs/release/AUTOMATION.md 2.10, "Server features in a build"): build 2, then a
 * rollback to build 1, then the next build (review of #166, comment 6367551256). Build 1 is a v6
 * build: it finds this file newer, leaves the schema alone, and reads and writes a book's kept
 * columns (children.signs_as, children.reminders_on, children.hidden_at) directly, never
 * child_member_prefs. The next build reconciles those columns with the prefs row when it opens the
 * file, so nothing a person set on build 1 is lost or stuck. Letters are not touched.
 * Fictional Asha family only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SqlDb } from '../src/lib/db/sql';
import { nodeDb } from './helpers/node-db';
import { letter } from './helpers/store-fixture';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const { MIGRATIONS, LATEST_VERSION, migrate } = await import('../src/lib/db/migrations');
const { children } = await import('../src/lib/db/repos');
const { applyPullPage } = await import('../src/lib/sync/merge');
const { enqueuePrefs } = await import('../src/lib/sync/outbox');
type PullResponse = import('../src/lib/sync/types').PullResponse;

let clock = Date.parse('2026-10-20T09:00:00.000Z');
const now = () => new Date(clock).toISOString();
/** Moves the clock on (default one hour) and returns the new time. */
const later = (ms = 3_600_000) => {
  clock += ms;
  return now();
};
let seq = 0;
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;

let h: { db: SqlDb; close: () => void };
beforeEach(() => {
  store.closeStore();
  h = nodeDb();
});
afterEach(() => {
  store.closeStore();
  h.close();
});

/**
 * Build 1 (a v6 build), word for word from PR #146 db/repos/children.ts (the file before #166):
 * its books read and its insert, update, hide and unhide statements.
 */
const V6_COLS = 'id, name, birthday, due_date, signs_as, reminders_on, family_can_read, role, created_by_me';
const V6_LISTED = "server_state NOT IN ('left', 'deleted')";
type V6Row = { id: string; name: string; birthday: string | null; due_date: string | null; signs_as: string; reminders_on: number; family_can_read: number };
const build1 = {
  /** Its migrator: the file is newer than v6, so it is left untouched. */
  open: (db: SqlDb) => migrate(db, { now: now(), newId }, MIGRATIONS.filter((m) => m.version <= 6)),
  books: (db: SqlDb) =>
    db.all<V6Row>(`SELECT ${V6_COLS} FROM children WHERE hidden_at IS NULL AND ${V6_LISTED} ORDER BY created_at ASC, id ASC`)
      .map((r) => [r.id, r.signs_as, r.reminders_on]),
  hidden: (db: SqlDb) =>
    db.all<V6Row>(`SELECT ${V6_COLS} FROM children WHERE hidden_at IS NOT NULL AND ${V6_LISTED} ORDER BY created_at ASC, id ASC`).map((r) => r.id),
  insert(db: SqlDb, id: string, input: { name: string; birthday: string | null; dueDate: string | null; signsAs: string }, at: string) {
    db.run(
      'INSERT INTO children (id, name, birthday, due_date, signs_as, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      id, input.name, input.birthday, input.dueDate, input.signsAs, at, at,
    );
  },
  update(db: SqlDb, id: string, patch: { signsAs?: string; remindersOn?: boolean; name?: string }, at: string) {
    const c = db.get<V6Row>(`SELECT ${V6_COLS} FROM children WHERE id = ?`, id)!;
    const n = { name: patch.name ?? c.name, signsAs: patch.signsAs ?? c.signs_as, remindersOn: patch.remindersOn ?? c.reminders_on === 1 };
    db.run(
      `UPDATE children SET name = ?, birthday = ?, due_date = ?, signs_as = ?, reminders_on = ?, family_can_read = ?, updated_at = ?
     WHERE id = ?`,
      n.name, c.birthday, c.due_date, n.signsAs, n.remindersOn ? 1 : 0, c.family_can_read, at, id,
    );
  },
  hide: (db: SqlDb, id: string, at: string) => db.run('UPDATE children SET hidden_at = ?, updated_at = ? WHERE id = ?', at, at, id),
  unhide: (db: SqlDb, id: string, at: string) => db.run('UPDATE children SET hidden_at = NULL, updated_at = ? WHERE id = ?', at, id),
};

/** The current build (build 2 or the next build) opening the same file. */
function openCurrent() {
  store.closeStore();
  return store.openStore({ open: () => ({ db: h.db, close: () => {} }), now, newId });
}

const ids = (list: { id: string }[]) => list.map((c) => c.id);
const dump = (db: SqlDb, table: string, key: string) => db.all(`SELECT * FROM ${table} ORDER BY ${key}`);

/**
 * Testers start on build 1 (a v6 file with three books), move to build 2 (which migrates the file to
 * the current schema and saves a letter), then the kill path puts them back on build 1.
 */
function onBuild1AfterBuild2() {
  migrate(h.db, { now: now(), newId }, MIGRATIONS.filter((m) => m.version <= 6));
  build1.insert(h.db, 'c1', { name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }, now());
  build1.insert(h.db, 'c2', { name: 'Ravi', birthday: null, dueDate: '2027-01-10', signsAs: 'Amma' }, later());
  build1.insert(h.db, 'c3', { name: 'Nila', birthday: '2025-01-01', dueDate: null, signsAs: 'Papa' }, later());
  later();
  expect(openCurrent()).toMatchObject({ ok: true, migration: { from: 6, to: LATEST_VERSION } });
  store.saveEntry(letter({ id: '0199a5b0-0000-7000-8000-00000000aaaa', childId: 'c1' }));
  store.updateChild('c3', { signsAs: 'Dada' });
  store.closeStore();
  later();
  expect(build1.open(h.db)).toMatchObject({ newer: true });
}

describe('[review of #166] the next build after a rollback to build 1', () => {
  it('(a) a book hidden on build 1 can be shown again on the next build', () => {
    onBuild1AfterBuild2();
    build1.hide(h.db, 'c2', later());
    expect(build1.hidden(h.db)).toEqual(['c2']);
    later();

    expect(openCurrent().ok).toBe(true);
    expect(ids(store.listHiddenChildren())).toEqual(['c2']);
    store.unhideChild('c2');
    expect(ids(store.listChildren())).toEqual(['c1', 'c2', 'c3']);
    expect(store.listHiddenChildren()).toEqual([]);
    // And it stays shown at the next open.
    expect(openCurrent().ok).toBe(true);
    expect(ids(store.listChildren())).toEqual(['c1', 'c2', 'c3']);
  });

  it('(b) a book added on build 1 shows its signature, and its first edit keeps the kept column', () => {
    onBuild1AfterBuild2();
    build1.insert(h.db, 'c4', { name: 'Tara', birthday: '2026-08-01', dueDate: null, signsAs: 'Mum' }, later());
    later();

    expect(openCurrent().ok).toBe(true);
    expect(store.getChild('c4')).toMatchObject({ name: 'Tara', signsAs: 'Mum', remindersOn: true });
    store.updateChild('c4', { name: 'Tara Rose' });
    expect(store.getChild('c4')).toMatchObject({ name: 'Tara Rose', signsAs: 'Mum', remindersOn: true });
    expect(h.db.get('SELECT signs_as, reminders_on FROM children WHERE id = ?', 'c4')).toEqual({ signs_as: 'Mum', reminders_on: 1 });
    expect(build1.books(h.db)).toContainEqual(['c4', 'Mum', 1]);
  });

  it('(c) signature and reminder changes made on build 1 are seen on the next build', () => {
    onBuild1AfterBuild2();
    build1.update(h.db, 'c1', { signsAs: 'Amma', remindersOn: false }, later());
    build1.update(h.db, 'c3', { signsAs: 'Appa' }, later());
    later();

    expect(openCurrent().ok).toBe(true);
    expect(store.getChild('c1')).toMatchObject({ signsAs: 'Amma', remindersOn: false });
    expect(store.getChild('c3')).toMatchObject({ signsAs: 'Appa', remindersOn: true });
    expect(children.prefsRow(h.db, 'c1')).toMatchObject({ signsAs: 'Amma', remindersOn: false });
  });

  it('(c) build 1\'s change wins by write order even when the phone clock was set back on build 1', () => {
    onBuild1AfterBuild2();
    // Build 2 changed c3's signature at the current time; build 1 writes with a time two days earlier.
    build1.update(h.db, 'c3', { signsAs: 'Appa' }, new Date(clock - 2 * 86_400_000).toISOString());
    later();

    expect(openCurrent().ok).toBe(true);
    expect(store.getChild('c3')?.signsAs).toBe('Appa');
  });

  it('letters are untouched and nothing is queued for the server', () => {
    onBuild1AfterBuild2();
    build1.hide(h.db, 'c2', later());
    build1.insert(h.db, 'c4', { name: 'Tara', birthday: '2026-08-01', dueDate: null, signsAs: 'Mum' }, later());
    build1.update(h.db, 'c1', { signsAs: 'Amma' }, later());
    const entriesBefore = dump(h.db, 'entries', 'id');
    const outboxBefore = dump(h.db, 'sync_outbox', 'seq');
    expect(entriesBefore).toHaveLength(1);
    later();

    expect(openCurrent().ok).toBe(true);
    expect(dump(h.db, 'entries', 'id')).toEqual(entriesBefore);
    expect(dump(h.db, 'sync_outbox', 'seq')).toEqual(outboxBefore);
  });

  it('signed in on build 2: build 1\'s own queued signature op is left as it is, and a pull of the older server value does not undo it', () => {
    onBuild1AfterBuild2();
    // Build 2 signed in and synced its books (the state, not the protocol, matters here).
    h.db.run("INSERT INTO settings (key, value) VALUES ('sync.ownerId', '11111111-1111-1111-1111-111111111111')");
    h.db.run("UPDATE children SET server_state = 'synced', role = 'parent', created_by_me = 1");
    h.db.run('DELETE FROM sync_outbox');
    // Build 1's updateChild: the v6 statement, then enqueuePrefs (the same code in PR #146 sync/outbox.ts).
    build1.update(h.db, 'c1', { signsAs: 'Amma' }, later());
    enqueuePrefs(h.db, 'c1', { signs_as: 'Amma' }, { now: now(), newId });
    const outbox = dump(h.db, 'sync_outbox', 'seq');
    expect(outbox.map((o) => (o as { type: string }).type)).toEqual(['prefs.upsert']);
    later();

    expect(openCurrent().ok).toBe(true);
    expect(store.getChild('c1')?.signsAs).toBe('Amma');
    expect(dump(h.db, 'sync_outbox', 'seq')).toEqual(outbox);
    const page: PullResponse = {
      reset: false, epoch: 1, epoch_started_at: now(), more: false, gone: [],
      books: [{
        id: 'c1', access: 'parent', repull: false, meta_hash: 'h1', rows: [], cursor: '9:00000000-0000-0000-0000-000000000000', more: false,
        meta: { role: 'parent', name: 'Asha', nickname: null, date_of_birth: '2026-03-01', birthday_md: '03-01', due_date: null, family_can_read: false,
          created_by_me: true, my_signs_as: 'Mama', include_in_reminders: true, members: [] },
      }],
    };
    h.db.transaction(() => applyPullPage(h.db, page, now()));
    expect(store.getChild('c1')?.signsAs).toBe('Amma');
  });

  it('an empty signature left by a hide on an older current build never replaces the one set on build 1', () => {
    onBuild1AfterBuild2();
    build1.insert(h.db, 'c4', { name: 'Tara', birthday: '2026-08-01', dueDate: null, signsAs: 'Mum' }, later());
    // Before this fix, "Hide this book" on a book with no prefs row made one with the default empty signature
    // (db/repos/children.ts setPrefTime, word for word); a file can carry such a row if that build ran again.
    h.db.run(
      `INSERT INTO child_member_prefs (child_id, hidden_at, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(child_id) DO UPDATE SET hidden_at = excluded.hidden_at, updated_at = excluded.updated_at`,
      'c4', later(), now(),
    );
    later();

    expect(openCurrent().ok).toBe(true);
    expect(store.listHiddenChildren().map((c) => [c.id, c.signsAs])).toEqual([['c4', 'Mum']]);
  });

  it('a reconcile that fails never blocks launch: it rolls back, the book still reads its own signature, the next open finishes it', () => {
    onBuild1AfterBuild2();
    build1.insert(h.db, 'c4', { name: 'Tara', birthday: '2026-08-01', dueDate: null, signsAs: 'Mum' }, later());
    build1.hide(h.db, 'c2', later());
    later();
    let failed = false;
    const failing: SqlDb = {
      ...h.db,
      run: (sql, ...params) => {
        if (!failed && sql.startsWith('UPDATE children SET hidden_at = NULL')) {
          failed = true;
          throw new Error('injected_failure');
        }
        h.db.run(sql, ...params);
      },
    };
    store.closeStore();
    expect(store.openStore({ open: () => ({ db: failing, close: () => {} }), now, newId }).ok).toBe(true);
    expect(failed).toBe(true);
    expect(h.db.get('SELECT COUNT(*) AS n FROM child_member_prefs WHERE child_id = ?', 'c4')).toEqual({ n: 0 });
    expect(store.getChild('c4')).toMatchObject({ signsAs: 'Mum', remindersOn: true });
    expect(ids(store.listHiddenChildren())).toEqual(['c2']);

    expect(openCurrent().ok).toBe(true);
    store.unhideChild('c2');
    expect(ids(store.listChildren())).toEqual(['c1', 'c2', 'c3', 'c4']);
  });
});

describe('without a rollback nothing changes', () => {
  it('a file only the current build wrote reopens with every row and every list exactly as it was', () => {
    expect(openCurrent().ok).toBe(true);
    const asha = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
    later();
    const ravi = store.addChild({ name: 'Ravi', birthday: null, dueDate: '2027-01-10', signsAs: 'Amma' }).id;
    later();
    const nila = store.addChild({ name: 'Nila', birthday: '2025-01-01', dueDate: null, signsAs: 'Papa' }).id;
    store.saveEntry(letter({ id: '0199a5b0-0000-7000-8000-00000000aaaa', childId: asha }));
    later();
    store.hideChild(ravi);
    later();
    store.updateChild(ravi, { name: 'Ravi K' }); // a book edit after the hide moves children.updated_at past the prefs row
    store.updateChild(asha, { signsAs: 'Mummy', remindersOn: false });
    store.setChildQuiet(nila, true);
    later();
    store.hideChild(nila);
    store.unhideChild(nila);

    const tables = () => ({
      children: dump(h.db, 'children', 'id'),
      prefs: dump(h.db, 'child_member_prefs', 'child_id'),
      entries: dump(h.db, 'entries', 'id'),
      outbox: dump(h.db, 'sync_outbox', 'seq'),
    });
    const lists = () => ({ visible: store.listChildren(), hidden: store.listHiddenChildren() });
    const before = { tables: tables(), lists: lists() };
    expect(before.lists.visible.map((c) => [c.id, c.signsAs, c.remindersOn, c.quiet ?? false])).toEqual([
      [asha, 'Mummy', false, false], [nila, 'Papa', true, true],
    ]);
    expect(ids(before.lists.hidden)).toEqual([ravi]);
    later();

    expect(openCurrent().ok).toBe(true);
    expect({ tables: tables(), lists: lists() }).toEqual(before);
  });
});

describe('a double rollback', () => {
  it('build 2, build 1, next build, build 1 again, next build again: every choice made on either build holds', () => {
    onBuild1AfterBuild2();
    // Round 1 on build 1.
    build1.hide(h.db, 'c2', later());
    build1.insert(h.db, 'c4', { name: 'Tara', birthday: '2026-08-01', dueDate: null, signsAs: 'Mum' }, later());
    build1.update(h.db, 'c1', { signsAs: 'Amma' }, later());
    later();

    // The next build: build 1's choices are there; the person shows c2 again, changes c1, hides c3.
    expect(openCurrent().ok).toBe(true);
    expect(ids(store.listHiddenChildren())).toEqual(['c2']);
    expect(store.getChild('c1')?.signsAs).toBe('Amma');
    expect(store.getChild('c4')?.signsAs).toBe('Mum');
    store.unhideChild('c2');
    store.updateChild('c1', { signsAs: 'Mummy' });
    store.hideChild('c3');
    store.closeStore();
    later();

    // Round 2 on build 1: it sees the next build's signature (mirrored into the kept column). A hide made
    // on the next build is per person and build 1 cannot see it (as since #166); it is not lost.
    expect(build1.open(h.db)).toMatchObject({ newer: true });
    expect(build1.books(h.db)).toEqual([['c1', 'Mummy', 1], ['c2', 'Amma', 1], ['c3', 'Dada', 1], ['c4', 'Mum', 1]]);
    expect(build1.hidden(h.db)).toEqual([]);
    build1.update(h.db, 'c4', { signsAs: 'Mumma', remindersOn: false }, later());
    build1.hide(h.db, 'c4', later());
    later();

    // The next build again: round 2's choices are there, the next build's own hide of c3 held, and c4 can be shown again.
    expect(openCurrent().ok).toBe(true);
    expect(store.listHiddenChildren().map((c) => [c.id, c.signsAs, c.remindersOn])).toEqual([['c3', 'Dada', true], ['c4', 'Mumma', false]]);
    expect(store.listChildren().map((c) => [c.id, c.signsAs])).toEqual([['c1', 'Mummy'], ['c2', 'Amma']]);
    store.unhideChild('c4');
    expect(store.listChildren().map((c) => [c.id, c.signsAs])).toEqual([['c1', 'Mummy'], ['c2', 'Amma'], ['c4', 'Mumma']]);
    expect(dump(h.db, 'entries', 'id')).toHaveLength(1);
  });
});
