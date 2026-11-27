/// <reference types="node" />
/**
 * [BL-388] LEGAL-REQ-034: which recordings in no letter or draft (the sweep's `orphan_audio`) a phone puts in its
 * export, and for whom (export/device.ts over the real store, node:sqlite, and an in-memory expo-file-system). Each
 * name is looked up in the folders the sweep lists, the recorder's folder winning; one whose file is gone is listed
 * with no file. Only when this phone's book may be shown (store `bookVisibleNow`): such a recording has no author, so
 * another signed-in account never gets it. Fictional Asha only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDisk, iosContainer, put, recorderDir, type Disk } from './helpers/expo-fs-standin';
import { nodeDb } from './helpers/node-db';

const h = vi.hoisted(() => ({ disk: null as unknown as Disk, session: null as string | null }));
vi.mock('expo-file-system', async () => (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk));
vi.mock('expo-crypto', () => ({ CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digest: async () => new ArrayBuffer(32), getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '1.0.0' } } }));
vi.mock('expo-print', () => ({ printToFileAsync: async () => ({ uri: '' }) }));
vi.mock('expo-sharing', () => ({ isAvailableAsync: async () => false, shareAsync: async () => {} }));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('../src/lib/auth/auth-store', () => ({
  currentAuthUserId: () => h.session,
  getAuthSnapshot: () => (h.session ? { status: 'ready', userId: h.session } : { status: 'signedOut' }),
}));
vi.mock('../src/lib/billing', () => ({ hasPlus: () => false }));
vi.mock('../src/lib/supabase/client', () => ({ getSupabaseOrNull: () => null }));
vi.mock('../src/lib/db/repos/open-native', () => ({ openNativeDb: () => { throw new Error('native open must not be used in tests'); } }));

const store = await import('../src/lib/store');
const { exportSnapshot } = await import('../src/lib/export/device');

describe('[BL-388] LEGAL-REQ-034: device.ts, which recordings and for whom', () => {
  let close: () => void = () => {};
  const NAME = 'recording-5a1e0000-0000-4000-8000-000000000390.m4a';
  beforeEach(() => {
    h.disk = createDisk(iosContainer('A5A1A5A1-0000-4000-8000-000000000388'));
    h.session = null;
    store.closeStore();
    const n = nodeDb();
    close = n.close;
    store.openStore({ open: () => ({ db: n.db, close: () => {} }), now: () => '2027-02-01T08:00:00.000Z', newId: () => 'id-1' });
    store.addChild({ name: 'Asha', birthday: '2026-03-08', dueDate: null, signsAs: 'Mama' });
    put(h.disk, `${h.disk.documents}${NAME}`, 700); // a same-name copy at the top of Documents: the recorder's wins
    put(h.disk, `${recorderDir(h.disk)}/${NAME}`, 900);
    store.reportOrphanAudio(NAME, 900);
    store.reportOrphanAudio('recording-gone.aac', 64);
    store.setSetting('sync.ownerId', 'acct-asha');
  });
  afterEach(() => {
    store.closeStore();
    close();
  });

  it('signed out, or signed in as the owner: each in the folder the sweep lists, the gone one with no file', () => {
    for (const session of [null, 'acct-asha']) {
      h.session = session;
      expect(exportSnapshot().orphans, String(session)).toEqual([
        { fileName: NAME, bytes: 900, foundAt: '2027-02-01T08:00:00.000Z', uri: `${recorderDir(h.disk)}/${NAME}`, onPhone: true },
        { fileName: 'recording-gone.aac', bytes: 64, foundAt: '2027-02-01T08:00:00.000Z', uri: null, onPhone: false },
      ]);
    }
  });

  it('only a file the sweep\'s listing holds, under its own name: a name with a folder in it, or a folder that cannot be listed, gives no file', () => {
    put(h.disk, `${recorderDir(h.disk)}/x.m4a`, 10);
    store.reportOrphanAudio('ExpoAudio/x.m4a', 10);
    expect(exportSnapshot().orphans!.find((o) => o.fileName === 'ExpoAudio/x.m4a')).toMatchObject({ uri: null, onPhone: false });
    h.disk.unreadable.add(recorderDir(h.disk));
    expect(exportSnapshot().orphans!.map((o) => o.uri)).toEqual([null, null, null]);
  });

  it('another account signed in: none, so a recording with no author never goes to someone else', () => {
    h.session = 'acct-other';
    expect(exportSnapshot().orphans).toEqual([]);
  });
});
