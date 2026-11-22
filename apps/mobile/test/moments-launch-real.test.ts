/// <reference types="node" />
/**
 * BL-1541, real order (Review A on #1561): the real auth store, the real owner bind (local-claim.ts) and the real moments
 * store on the phone-shaped disk. A restored session whose account owns the file keeps it; another account signing in
 * over it loses it after the bind; a signed-out phone keeps a local file. Fictional family Asha only.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDisk, iosContainer, type Disk } from './helpers/expo-fs-standin';

const h = vi.hoisted(() => ({ disk: null as unknown as Disk, order: [] as string[] }));
vi.mock('expo-file-system', async () => (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk));
vi.mock('../modules/scribe-files', () => ({ ScribeFiles: { setExcludedFromBackup: () => true, isExcludedFromBackup: () => true } }));
vi.mock('../src/lib/days', () => ({ setDaysOwner: () => {}, daysStore: { adoptLocal: async () => 'none' } }));
vi.mock('../src/lib/store', () => ({ onBookErased: () => () => {}, listChildren: () => [], listClosedBooks: () => [], listDeletedBooks: () => [] }));

const auth = await import('../src/lib/auth/auth-store');
const { bindDeviceOnlyOwners, ownerKey } = await import('../src/lib/auth/local-claim');
const { startMomentsCleanup } = await import('../src/lib/moments/launch');
const { expoMomentsPort, MOMENTS_FILE } = await import('../src/lib/moments/store-file');
const { momentsStore } = await import('../src/lib/moments');
const { emptyMoments } = await import('../src/lib/moments/store.logic');

const ASHA = '0199a5b0-0000-7000-8000-00000000a5a1';
const PARTNER = '0199a5b0-0000-7000-8000-00000000b0b1';
const seed = (owner: string) => {
  const port = expoMomentsPort()!;
  port.createEmpty(MOMENTS_FILE);
  port.write(MOMENTS_FILE, JSON.stringify({ ...emptyMoments(owner), dayKeys: ['2026-10-03'] }));
};
const has = () => [...h.disk.files.keys()].some((u) => u.endsWith('/' + MOMENTS_FILE));
const ready = (id: string) => auth.publishAuth({ status: 'ready', userId: id, sync: 'on' } as never);
const settle = () => new Promise((r) => setTimeout(r, 10));

beforeEach(() => {
  h.disk = createDisk(iosContainer('6F0C3A2E-ASHA-4C1B-9D55-MOMENTS0001'));
  auth.resetAuthStoreForTests();
  momentsStore.setOwner('local');
  auth.setClaimReaders({ owner: () => null, hasLocalData: () => false });
});

describe('[BL-1541] the launch cleanup runs after the owner is bound (real auth store, real bind, real store)', () => {
  it('a restored session whose account owns the file keeps the file', async () => {
    seed(ownerKey(ASHA));
    const off = bindDeviceOnlyOwners();
    const stop = startMomentsCleanup(true);
    auth.setClaimReaders({ owner: () => ASHA, hasLocalData: () => false });
    ready(ASHA); // listeners run BEFORE announce: the cleanup must not run here
    await settle();
    expect(has()).toBe(true);
    stop();
    off();
  });

  it('another account signing in over the first account\'s file deletes it, after the bind', async () => {
    seed(ownerKey(ASHA));
    const off = bindDeviceOnlyOwners();
    const stop = startMomentsCleanup(true);
    auth.setClaimReaders({ owner: () => PARTNER, hasLocalData: () => false });
    ready(PARTNER);
    await settle();
    expect(has()).toBe(false);
    stop();
    off();
  });

  it('a signed-out phone with a local file keeps it', async () => {
    seed('local');
    const off = bindDeviceOnlyOwners();
    const stop = startMomentsCleanup(true);
    auth.publishAuth({ status: 'signedOut' } as never);
    await settle();
    expect(has()).toBe(true);
    stop();
    off();
  });

  it('a signed-in person with a local file nobody adopted: the file goes at the bind, never kept by the cleanup', async () => {
    seed('local');
    const off = bindDeviceOnlyOwners();
    const stop = startMomentsCleanup(true);
    auth.setClaimReaders({ owner: () => ASHA, hasLocalData: () => false });
    ready(ASHA);
    await settle();
    expect(has()).toBe(false);
    stop();
    off();
  });

  it('flag off: nothing runs, a foreign file stays until the bind removes it', async () => {
    seed(ownerKey(ASHA));
    const stop = startMomentsCleanup(false);
    auth.publishAuth({ status: 'signedOut' } as never);
    await settle();
    expect(has()).toBe(true);
    stop();
  });
});
