/// <reference types="node" />
/**
 * The launch purge's guards (D-085, DELETION_AND_EXPORT_SPEC 2.2 step 7): the
 * clock guard at its exact boundary, an unreadable launch stamp, the 30-day
 * cutoff to the millisecond, a recording that will not erase, and the queued
 * uploads an erased letter takes with it. Store facade over node:sqlite with a
 * clock the test moves; the eraser is a fake. Fictional Asha family only.
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

import type { AudioEraser } from '../src/lib/store';
const store = await import('../src/lib/store');
const { setServerFeaturesForTests } = await import('../src/lib/capabilities');
const { SYNC_SETTING } = await import('../src/lib/sync/outbox');

const DAY = 24 * 60 * 60 * 1000;
const SHELF_MS = store.SHELF_DAYS * DAY;
const T0 = Date.parse('2026-10-03T09:00:00.000Z');
let clock = T0;
let close: () => void = () => {};
let seq = 0;
let asha = '';
const id = (n: number) => `0199a5b0-0000-7000-8000-${String(n).padStart(12, '0')}`;
const uri = (n: number) => `file:///Documents/${id(n)}.m4a`;

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
});
afterEach(() => {
  setServerFeaturesForTests(null);
  store.closeStore();
  close();
});

/** A fake disk: which files exist, which were asked to go, and which refuse. */
function disk(files: string[], refuse: string[] = []) {
  const present = new Set(files);
  const asked: string[] = [];
  const eraser: AudioEraser = (u) => {
    if (!u) return;
    asked.push(u);
    if (refuse.includes(u)) throw new Error('EBUSY');
    present.delete(u);
  };
  return { present, asked, eraser };
}

const save = (n: number) => store.saveEntry(letter({ id: id(n), childId: asha, audioUri: uri(n), finalText: `Letter ${n}.` }));
const del = (n: number) => store.deleteEntry(id(n));
const onShelf = () => store.listDeleted().map((e) => e.id);
const rows = () => store.localSqlDb().get<{ n: number }>('SELECT COUNT(*) AS n FROM entries')!.n;

describe('the clock guard (a phone clock moved back never purges early)', () => {
  it('[D-085] a launch at exactly the recorded time still purges', () => {
    save(1);
    del(1);
    const d = disk([uri(1)]);
    const later = T0 + SHELF_MS;
    store.recordLaunch(later);
    expect(store.purgeExpired(later, d.eraser)).toBe(1);
    expect(onShelf()).toEqual([]);
    expect(d.present.has(uri(1))).toBe(false);
  });

  it('[D-085] one millisecond before the recorded launch purges nothing and touches no file', () => {
    save(1);
    del(1);
    const d = disk([uri(1)]);
    store.recordLaunch(T0 + SHELF_MS + 1);
    expect(store.purgeExpired(T0 + SHELF_MS, d.eraser)).toBe(0);
    expect(d.asked).toEqual([]);
    expect(onShelf()).toEqual([id(1)]);
  });

  it('[D-085] an unreadable launch stamp never blocks the purge (a damaged setting is not a clock moved back)', () => {
    save(1);
    del(1);
    store.setSetting(store.LAST_LAUNCH_SETTING, 'not a time');
    const d = disk([uri(1)]);
    expect(store.purgeExpired(T0 + SHELF_MS, d.eraser)).toBe(1);
    expect(onShelf()).toEqual([]);
  });

  it('recordLaunch: an equal time is a no-op, a later time moves it, an earlier one is ignored', () => {
    store.recordLaunch(T0);
    const stamp = store.getSetting(store.LAST_LAUNCH_SETTING);
    expect(stamp).toBe(new Date(T0).toISOString());
    store.recordLaunch(T0);
    expect(store.getSetting(store.LAST_LAUNCH_SETTING)).toBe(stamp);
    store.recordLaunch(T0 - DAY);
    expect(store.getSetting(store.LAST_LAUNCH_SETTING)).toBe(stamp);
    store.recordLaunch(T0 + 1);
    expect(store.getSetting(store.LAST_LAUNCH_SETTING)).toBe(new Date(T0 + 1).toISOString());
  });
});

describe('the cutoff', () => {
  it('[D-085] exactly SHELF_DAYS after the deletion erases; one millisecond less keeps', () => {
    save(1);
    del(1); // deleted at T0
    const d = disk([uri(1)]);
    expect(store.purgeExpired(T0 + SHELF_MS - 1, d.eraser)).toBe(0);
    expect(onShelf()).toEqual([id(1)]);
    expect(store.purgeExpired(T0 + SHELF_MS, d.eraser)).toBe(1);
    expect(onShelf()).toEqual([]);
    expect(rows()).toBe(0);
  });

  it('erasesAt is the deletion time plus the shelf days, and matches what the purge does', () => {
    save(1);
    clock = T0 + 5 * DAY + 1234;
    del(1);
    const [deleted] = store.listDeleted();
    expect(store.erasesAt(deleted.deletedAt)).toBe(new Date(clock + SHELF_MS).toISOString());
    const at = Date.parse(store.erasesAt(deleted.deletedAt));
    const d = disk([uri(1)]);
    expect(store.purgeExpired(at - 1, d.eraser)).toBe(0);
    expect(store.purgeExpired(at, d.eraser)).toBe(1);
  });

  it('with nothing expired the purge returns 0 and asks the disk for nothing', () => {
    save(1);
    save(2);
    del(1);
    const d = disk([uri(1), uri(2)]);
    expect(store.purgeExpired(T0 + DAY, d.eraser)).toBe(0);
    expect(d.asked).toEqual([]);
    expect(store.listEntriesForChild(asha).map((e) => e.id)).toEqual([id(2)]);
  });
});

describe('a recording that will not erase', () => {
  it('[D-085] one stuck file does not stop the others, and the stuck letter stays on the shelf for the next launch', () => {
    for (const n of [1, 2, 3]) {
      save(n);
      del(n);
    }
    const stuck = disk([uri(1), uri(2), uri(3)], [uri(2)]);
    expect(store.purgeExpired(T0 + SHELF_MS, stuck.eraser)).toBe(2);
    expect(stuck.asked).toEqual([uri(1), uri(2), uri(3)]);
    expect(onShelf()).toEqual([id(2)]);
    expect(stuck.present.has(uri(2))).toBe(true);
    // next launch, the disk cooperates
    const ok = disk([uri(2)]);
    expect(store.purgeExpired(T0 + SHELF_MS + DAY, ok.eraser)).toBe(1);
    expect(onShelf()).toEqual([]);
    expect(rows()).toBe(0);
  });

  it('eraseEntry is idempotent and never touches a live letter or its file', () => {
    save(1);
    const live = disk([uri(1)]);
    expect(store.eraseEntry(id(1), live.eraser)).toBe(false);
    expect(live.asked).toEqual([]);
    expect(store.getEntry(id(1))?.finalText).toBe('Letter 1.');
    del(1);
    expect(store.eraseEntry(id(1), live.eraser)).toBe(true);
    expect(store.eraseEntry(id(1), live.eraser)).toBe(false);
    expect(live.asked).toEqual([uri(1)]);
  });
});

describe('what an erased letter takes with it', () => {
  it('[D-085] its queued uploads go too, so nothing about an erased letter is ever sent later; only the erase itself, which carries the id alone (F16-REQ-024)', () => {
    // An account owns the phone (the outbox queues) while the build switch stays off (the purge runs here).
    store.setSetting(SYNC_SETTING.owner, 'mama-account');
    save(1);
    save(2);
    const db = store.localSqlDb();
    const ops = (entity: string) => db.get<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox WHERE entity_id = ?', entity)!.n;
    expect(ops(id(1))).toBe(1);
    // The upload left the phone (sent), so a later delete queues a tombstone instead of dropping the op.
    db.run('UPDATE sync_outbox SET sent_at = ? WHERE entity_id = ?', new Date(T0).toISOString(), id(1));
    del(1);
    expect(ops(id(1))).toBe(2);
    expect(ops(id(2))).toBe(1);
    const d = disk([uri(1), uri(2)]);
    expect(store.purgeExpired(T0 + SHELF_MS, d.eraser)).toBe(1);
    // The server may hold it (its upload left): one entry.erase, so the server's copy goes too (sync final review A-M2).
    const left = db.all<{ type: string; payload: string }>('SELECT type, payload FROM sync_outbox WHERE entity_id = ?', id(1));
    expect(left.map((o) => o.type)).toEqual(['entry.erase']);
    expect((JSON.parse(left[0].payload) as { data: unknown }).data).toEqual({});
    expect(ops(id(2))).toBe(1);
    expect(store.getEntry(id(2))).not.toBeNull();
  });

  it('[D-085] with the server switch on, a letter the server holds is never erased by the phone\'s clock; one it never held is (sync final review B5)', () => {
    save(1);
    save(2);
    del(1);
    del(2);
    store.localSqlDb().run("UPDATE entries SET server_version = '100' WHERE id = ?", id(1)); // the server holds it
    setServerFeaturesForTests(true);
    const d = disk([uri(1), uri(2)]);
    expect(store.purgeExpired(T0 + 2 * SHELF_MS, d.eraser)).toBe(1);
    expect(d.asked).toEqual([uri(2)]);
    expect(onShelf()).toEqual([id(1)]);
  });
});
