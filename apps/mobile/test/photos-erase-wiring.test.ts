// BL-1488: the Erase everything wiring of BL-1444 (#1340), run instead of read. eraseEverything() is called for real
// with the phone's other parts stood in; the pending picture is a real PendingPhoto over an in-memory picker.
// The picture and the picker's original must be gone before the files go, and a refused erase (signed in) changes nothing.
// The fictional family is Asha; no real picture is used.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PickedFiles } from '../src/lib/photos/types';

const h = vi.hoisted(() => ({ allowed: true, goneWhenFilesGo: null as null | boolean }));

vi.mock('react-native', () => ({ Platform: { OS: 'ios' }, AppState: { currentState: 'active', addEventListener: () => ({ remove: () => {} }) } }));
vi.mock('expo-file-system', () => ({ Directory: class {}, Paths: { cache: '' } }));
vi.mock('../src/lib/analytics', () => ({ stopAnalyticsForErase: async () => {} }));
vi.mock('../src/lib/audio-enhance', () => ({ sweepListeningCopies: () => {} }));
vi.mock('../src/lib/app-lock/controller', () => ({ reloadAppLock: () => {} }));
vi.mock('../src/lib/auth/apple', () => ({ APPLE_USER_KEY: 'a', PENDING_NAME_KEY: 'n' }));
vi.mock('../src/lib/auth/new-device/key', () => ({ DEVICE_ID_KEY: 'd' }));
vi.mock('../src/lib/auth/pending', () => ({ PENDING_REQUEST_KEY: 'r' }));
vi.mock('../src/lib/backup/files', () => ({ closeBackupHandles: () => {}, deleteBackupFiles: () => {} }));
vi.mock('../src/lib/backup/token-vault', () => ({ removeAllBackupTokens: async () => {} }));
vi.mock('../src/lib/billing/letter-ledger', () => ({ clearLedger: async () => {} }));
vi.mock('../src/lib/capture/adts-file', () => ({ removeWholeFrameCopies: () => {} }));
vi.mock('../src/lib/capture/erase', () => ({ eraseAudioFile: () => {} }));
vi.mock('../src/lib/capture/recordings', () => ({ listRecordingFiles: () => [] }));
vi.mock('../src/lib/photos/files', () => ({ BAKED_CACHE_FOLDER: 'b', PICKER_CACHE_FOLDER: 'p', photosDirectory: () => ({ exists: false }) }));
vi.mock('../src/lib/days', () => ({ eraseDaysFile: () => {} }));
vi.mock('../src/lib/moments', () => ({ eraseMomentsFile: () => {} }));
vi.mock('../src/lib/family/pending-invite', () => ({ clearPendingInvite: async () => {} }));
vi.mock('../src/lib/reminders/scheduler', () => ({ forgetReminders: async () => {} }));
vi.mock('../src/lib/supabase/secure-storage', () => ({ secureStorage: { removeItem: async () => {} } }));
vi.mock('../src/lib/store', () => ({
  eraseEverythingPending: () => false,
  finishEraseEverything: () => {},
  ledgerDb: () => ({}),
  localDeletionAllowed: () => h.allowed,
  // The store's own erase: refuses when signed in, otherwise runs the file step (the picture is read there).
  eraseEverythingLocal: (_audio: unknown, files: () => void) => {
    if (!h.allowed) return 'signed_in';
    h.goneWhenFilesGo = getPending()?.source === null; // read when the file step starts
    files();
    return 'erased';
  },
}));

import { eraseEverything } from '../src/lib/erase-everything';
import { dropQueuedAdopts } from '../src/lib/photos/adopt';
import { PendingPhoto } from '../src/lib/photos/pending';
import { getPending, registerPending } from '../src/lib/photos/registry';

const URI = 'file:///c/ImagePicker/asha-boots.jpg';

async function pendingPicture() {
  const files = new Map<string, Uint8Array>([[URI, new Uint8Array([1, 2, 3])]]);
  const picked: PickedFiles = {
    read: async (u) => files.get(u) as Uint8Array,
    remove: async (u) => void files.delete(u),
    sweep: async () => files.clear(),
  };
  const p = new PendingPhoto(picked);
  registerPending(p);
  await p.set({ uri: URI });
  return { p, left: () => [...files.keys()] };
}

beforeEach(() => {
  h.allowed = true;
  h.goneWhenFilesGo = null;
});
afterEach(() => {
  registerPending(null);
  dropQueuedAdopts();
});

describe('[BL-1488-3] Erase everything discards the pending picture', () => {
  it('[BL-1488-3] the picture and the picker original are gone when the erase is done', async () => {
    const pic = await pendingPicture();
    expect(pic.p.source).not.toBeNull();
    await expect(eraseEverything()).resolves.toBe('erased');
    expect(pic.p.source).toBeNull();
    expect(pic.left()).toEqual([]);
    expect(h.goneWhenFilesGo).toBe(true); // before the files go
  });
  it('[BL-1488-3] a refused erase (signed in) changes nothing: the picture stays', async () => {
    h.allowed = false;
    const pic = await pendingPicture();
    await expect(eraseEverything()).resolves.toBe('signed_in');
    expect(pic.p.source).not.toBeNull();
    expect(pic.left()).toEqual([URI]);
  });
});
