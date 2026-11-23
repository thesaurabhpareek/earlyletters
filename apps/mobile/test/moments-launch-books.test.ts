/// <reference types="node" />
/**
 * BL-1541, the book list (Review on #1561): the real store's lists return [] while another account is signed in over
 * this owner's book (`shown()`, [X4-R1]). The launch cleanup must read that as "cannot tell" (null), never as "no book
 * is live", or every home-place row would be pruned. Real store, real auth store, real moments store. Asha only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';
import { createDisk, iosContainer, type Disk } from './helpers/expo-fs-standin';
import { SYNC_SETTING, writeSetting } from '../src/lib/sync/outbox';
import { insertBook } from './helpers/store-fixture';

const h = vi.hoisted(() => ({ disk: null as unknown as Disk }));
vi.mock('expo-file-system', async () => (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk));
vi.mock('../modules/scribe-files', () => ({ ScribeFiles: { setExcludedFromBackup: () => true, isExcludedFromBackup: () => true } }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const auth = await import('../src/lib/auth/auth-store');
const { startMomentsCleanup, liveBookIds, momentsCleanupFailure } = await import('../src/lib/moments/launch');
const { expoMomentsPort, MOMENTS_FILE } = await import('../src/lib/moments/store-file');
const { momentsStore } = await import('../src/lib/moments');
const { emptyMoments } = await import('../src/lib/moments/store.logic');

const A = '0192f0aa-0000-7000-8000-0000000000a1'; // owns the book on this phone
const B = '0192f0aa-0000-7000-8000-0000000000b2'; // signs in on the same phone
const OWNER_B = '9f8e7d6c5b4a3921';
const BOOK = 'child-asha';
const NOW = '2026-11-20T09:00:00.000Z';
let n = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
let close: () => void = () => {};

const onDisk = () => {
  const k = [...h.disk.files.keys()].find((u) => u.endsWith('/' + MOMENTS_FILE))!;
  return JSON.parse(new TextDecoder().decode(h.disk.files.get(k)!.data));
};

beforeEach(() => {
  h.disk = createDisk(iosContainer('6F0C3A2E-ASHA-4C1B-9D55-MOMENTS0002'));
  store.closeStore();
  const d = nodeDb();
  close = d.close;
  expect(store.openStore({ open: () => ({ db: d.db, close: () => {} }), now: () => NOW, newId: id7 }).ok).toBe(true);
  const db = store.localSqlDb();
  insertBook(db, { id: BOOK, name: 'Asha', birthday: '2026-03-01', at: NOW });
  writeSetting(db, SYNC_SETTING.owner, A);
  const port = expoMomentsPort()!;
  port.createEmpty(MOMENTS_FILE);
  port.write(MOMENTS_FILE, JSON.stringify({ ...emptyMoments(OWNER_B), homePlace: { [BOOK]: 'ext:place-2' } }));
  momentsStore.setOwner(OWNER_B);
});

afterEach(() => {
  auth.setClaimReaders({ owner: () => null, hasLocalData: () => false });
  auth.resetAuthStoreForTests();
  store.closeStore();
  close();
});

describe('[BL-1541] liveBookIds with the real book lists', () => {
  it('the owner signed in: the book is listed (control)', () => {
    auth.publishAuth({ status: 'ready', userId: A, sync: 'on' });
    expect(liveBookIds()).toEqual([BOOK]);
  });

  it('another account signed in over the owner\'s book: the old lists give [] (the trap), the answer is null', () => {
    auth.publishAuth({ status: 'ready', userId: B, sync: 'on' });
    expect(store.listChildren()).toEqual([]); // positive control: the store really hides the book as an empty list
    expect(liveBookIds()).toBeNull();
  });
});

describe('[BL-1541] the cleanup does not prune a signed-in account\'s rows while the phone hides the owner\'s book', () => {
  it('B signed in over A\'s book: the home-place row stays (fails on a liveBooks that maps the hidden lists)', async () => {
    const stop = startMomentsCleanup(true, () => {}); // at launch, before the session is released (as _layout does)
    auth.setClaimReaders({ owner: () => A, hasLocalData: () => false });
    auth.publishAuth({ status: 'ready', userId: B, sync: 'on' });
    await new Promise((r) => setTimeout(r, 20));
    expect(onDisk().homePlace).toEqual({ [BOOK]: 'ext:place-2' });
    stop();
  });

  it('control: the same file with a book that is really gone from the phone is pruned', async () => {
    expoMomentsPort()!.write(MOMENTS_FILE, JSON.stringify({ ...emptyMoments(OWNER_B), homePlace: { [BOOK]: 'ext:place-2', 'book-gone': 'ext:place-3' } }));
    const stop = startMomentsCleanup(true, () => {});
    auth.setClaimReaders({ owner: () => A, hasLocalData: () => false });
    auth.publishAuth({ status: 'ready', userId: A, sync: 'on' });
    await new Promise((r) => setTimeout(r, 20));
    expect(onDisk().homePlace).toEqual({ [BOOK]: 'ext:place-2' });
    stop();
  });
});

describe('[BL-1541] a file the cleanup cannot remove is reported by code, through the real wiring', () => {
  it('another owner\'s file that is undeletable: the default report holds the typed code, no data, and the file stays', async () => {
    const key = [...h.disk.files.keys()].find((u) => u.endsWith('/' + MOMENTS_FILE))!;
    h.disk.undeletable.add(key);
    momentsStore.setOwner('0000000000000001'); // the file is B's: foreign to this owner (setOwner's own removal fails silently)
    expect(momentsCleanupFailure()).toBeNull();
    const stop = startMomentsCleanup(true);
    auth.publishAuth({ status: 'signedOut' } as never);
    await new Promise((r) => setTimeout(r, 20));
    expect(momentsCleanupFailure()).toBe('moments_file_not_removed');
    expect(h.disk.files.has(key)).toBe(true);
    stop();
  });
});
