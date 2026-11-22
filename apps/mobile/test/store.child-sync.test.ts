/// <reference types="node" />
/**
 * Editing a child through the store facade (PR #94, D-023): what an edit may
 * change (the child's own row), what it may never touch (letters, the sync
 * columns the server owns, created_at, hidden_at) and what it queues for the
 * server (book settings per field for parents, per-person preferences for
 * everyone, nothing for a book that never left the phone). Real SQLite,
 * fictional Asha family only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';
import { letter } from './helpers/store-fixture';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const { SYNC_SETTING } = await import('../src/lib/sync/outbox');

const T0 = Date.parse('2026-10-03T09:00:00.000Z');
let clock = T0;
let close: () => void = () => {};
let seq = 0;

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
});
afterEach(() => {
  store.closeStore();
  close();
});

const db = () => store.localSqlDb();
const childRow = (id: string) => db().get<Record<string, unknown>>('SELECT * FROM children WHERE id = ?', id)!;
const ops = () => db().all<{ type: string; entity_id: string; payload: string }>('SELECT type, entity_id, payload FROM sync_outbox ORDER BY seq').map((o) => ({ type: o.type, entity: o.entity_id, data: (JSON.parse(o.payload) as { data: Record<string, unknown> }).data }));

/** The book as sync leaves it after the server accepted it. */
function syncedBook(id: string, role: 'parent' | 'contributor' = 'parent') {
  db().run("UPDATE children SET server_state = 'synced', role = ?, created_by_me = ?, nickname = 'Ashu' WHERE id = ?", role, role === 'parent' ? 1 : 0, id);
}

describe('what an edit never touches', () => {
  it('[DATA-REQ-040] every letter column stays byte for byte the same across name, date and signature edits', () => {
    const asha = store.addChild({ name: 'Asha', birthday: '2026-03-08', dueDate: null, signsAs: 'Mama' }).id;
    store.saveEntry(letter({ id: 'l1', childId: asha, audioUri: 'file:///Documents/l1.m4a' }));
    store.saveEntry(letter({ id: 'l2', childId: asha, captureMode: 'typed', audioUri: null, finalText: 'Typed.' }));
    const before = db().all('SELECT * FROM entries ORDER BY id');
    clock += 60_000;
    store.updateChild(asha, { name: 'Asha Devi', birthday: '2026-03-09', signsAs: 'Mumma' });
    store.updateChild(asha, { familyCanRead: true, remindersOn: false });
    expect(db().all('SELECT * FROM entries ORDER BY id')).toEqual(before);
    expect(store.getEntry('l1')?.authorSignsAs).toBe('Mama');
  });

  it('the server-owned columns, created_at and hidden_at survive an edit; only updated_at moves', () => {
    const asha = store.addChild({ name: 'Asha', birthday: null, dueDate: '2027-01-15', signsAs: 'Mama' }).id;
    syncedBook(asha);
    store.hideChild(asha);
    const before = childRow(asha);
    clock += 1000;
    store.updateChild(asha, { name: 'Asha', birthday: '2027-01-10', dueDate: null, signsAs: 'Mama' });
    const after = childRow(asha);
    for (const col of ['id', 'created_at', 'hidden_at', 'server_state', 'role', 'created_by_me', 'nickname', 'reminders_on', 'family_can_read']) expect(after[col], col).toEqual(before[col]);
    expect(after.updated_at).toBe(new Date(T0 + 1000).toISOString());
    expect(after).toMatchObject({ birthday: '2027-01-10', due_date: null });
  });

  it('an edit to one child never reaches another, and an unknown id changes nothing and queues nothing', () => {
    const asha = store.addChild({ name: 'Asha', birthday: '2026-03-08', dueDate: null, signsAs: 'Mama' }).id;
    const avi = store.addChild({ name: 'Avi', birthday: '2026-03-08', dueDate: null, signsAs: 'Mama' }).id;
    const aviBefore = childRow(avi);
    store.updateChild(asha, { signsAs: 'Mumma' });
    store.updateChild('no-such-child', { name: 'Nobody' });
    expect(childRow(avi)).toEqual(aviBefore);
    expect(store.getChild(asha)?.signsAs).toBe('Mumma');
    expect(ops()).toEqual([]);
  });
});

describe('what an edit queues for the server (D-023)', () => {
  it('nothing before the first sign-in, and nothing for a book the server never saw', () => {
    const asha = store.addChild({ name: 'Asha', birthday: '2026-03-08', dueDate: null, signsAs: 'Mama' }).id;
    store.updateChild(asha, { name: 'Asha Devi', signsAs: 'Mumma', remindersOn: false });
    expect(ops()).toEqual([]);
    store.setSetting(SYNC_SETTING.owner, 'mama-account'); // signed in, but this book is still local
    store.updateChild(asha, { name: 'Asha D' });
    expect(ops()).toEqual([]);
  });

  it('a parent: book settings travel per changed field, preferences separately, and a no-change edit sends nothing', () => {
    store.setSetting(SYNC_SETTING.owner, 'mama-account');
    const asha = store.addChild({ name: 'Asha', birthday: '2026-03-08', dueDate: null, signsAs: 'Mama' }).id;
    db().run('DELETE FROM sync_outbox'); // the create itself
    syncedBook(asha);
    store.updateChild(asha, { name: 'Asha Devi' });
    expect(ops()).toEqual([{ type: 'book.update', entity: asha, data: { name: 'Asha Devi' } }]);
    store.updateChild(asha, { signsAs: 'Mumma', remindersOn: false });
    expect(ops()).toEqual([
      { type: 'book.update', entity: asha, data: { name: 'Asha Devi' } },
      { type: 'prefs.upsert', entity: asha, data: { signs_as: 'Mumma', include_in_reminders: false } },
    ]);
    const n = ops().length;
    store.updateChild(asha, { name: 'Asha Devi', signsAs: 'Mumma' });
    expect(ops()).toHaveLength(n);
  });

  it('consecutive unsent edits coalesce into one op holding the latest values', () => {
    store.setSetting(SYNC_SETTING.owner, 'mama-account');
    const asha = store.addChild({ name: 'Asha', birthday: '2026-03-08', dueDate: null, signsAs: 'Mama' }).id;
    db().run('DELETE FROM sync_outbox');
    syncedBook(asha);
    store.updateChild(asha, { name: 'A' });
    store.updateChild(asha, { name: 'Asha Devi', birthday: '2026-03-09' });
    store.updateChild(asha, { familyCanRead: true });
    expect(ops()).toEqual([{ type: 'book.update', entity: asha, data: { name: 'Asha Devi', date_of_birth: '2026-03-09', family_can_read: true } }]);
  });

  it('[B-REQ-002] a contributor may change only their own signature and reminder switch: book settings are never queued', () => {
    store.setSetting(SYNC_SETTING.owner, 'nani-account');
    const asha = store.addChild({ name: 'Asha', birthday: '2026-03-08', dueDate: null, signsAs: 'Nani' }).id;
    db().run('DELETE FROM sync_outbox');
    syncedBook(asha, 'contributor');
    store.updateChild(asha, { name: 'Renamed', birthday: '2026-01-01', familyCanRead: true, signsAs: 'Naani', remindersOn: false });
    expect(ops()).toEqual([{ type: 'prefs.upsert', entity: asha, data: { signs_as: 'Naani', include_in_reminders: false } }]);
    // locally the row did change (the server will say no to the book fields and sync will reconcile)
    expect(store.getChild(asha)?.signsAs).toBe('Naani');
  });

  it('a due date becoming a birthday (D-094 flow) sends both fields in one book update', () => {
    store.setSetting(SYNC_SETTING.owner, 'mama-account');
    const asha = store.addChild({ name: 'Asha', birthday: null, dueDate: '2026-09-20', signsAs: 'Mama' }).id;
    db().run('DELETE FROM sync_outbox');
    syncedBook(asha);
    store.updateChild(asha, { birthday: '2026-09-22', dueDate: null });
    expect(ops()).toEqual([{ type: 'book.update', entity: asha, data: { date_of_birth: '2026-09-22', due_date: null } }]);
    expect(store.getChild(asha)).toMatchObject({ birthday: '2026-09-22', dueDate: null });
  });
});
