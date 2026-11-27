/// <reference types="node" />
/**
 * No moments file survives account deletion or Erase everything (BL-1493; DATA-REQ-023, DATA-REQ-024; CDO-23 and its
 * Erratum; ADR 0032 amendment). The file under test is a signed-in account's: its owner is that account's key (the
 * first 16 hex of SHA-256 of the user id, auth/local-claim.ts ownerKey), written through the real store. Beside it sits
 * a `.tmp` left by a write that a kill cut short between the temp and the rename. After each wipe path neither
 * `MOMENTS_FILE` nor `MOMENTS_TMP` (lib/moments/store-file.ts) may remain in the moments folder.
 *
 * The wipe paths, driven through the real code on an in-memory disk (helpers/expo-fs-standin.ts):
 *  - DATA-REQ-024, Erase everything: `eraseEverything` and `eraseDeviceFiles` (erase-everything.ts, which calls the
 *    moments store's clear, `eraseMomentsFile`).
 *  - DATA-REQ-024, sign-out of the signed-in account: `settleReminderSession(user, null)`, the one hook
 *    session-provider.tsx runs on the signed-in user id (it calls `endMomentsSession`).
 *  - DATA-REQ-023, account deletion: on this phone a deletion ends the session (Sign out on the deletion screen, or the
 *    server ending the session), which settles through the same hook; and a launch after a kill finds the session mark
 *    with nobody signed in and clears the file then.
 * Not here: the pre-sign-in `local` file (BL-1559). The wipe-list wording is BL-1542 (docs/legal).
 * Mutants run for this file: drop `eraseMomentsFile()` from `eraseDeviceFiles`; drop both `endMomentsSession()` calls
 * from `settleReminderSession`; make `removeMoments` try only `MOMENTS_FILE` (no temp). Each turns a case red.
 * Fictional family "Asha" only.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDisk, iosContainer, put, type Disk } from './helpers/expo-fs-standin';

const h = vi.hoisted(() => ({ disk: null as unknown as Disk, settings: new Map<string, string>(), storeOpen: true }));
vi.mock('expo-file-system', async () => (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('../modules/scribe-files', () => ({
  ScribeFiles: { setExcludedFromBackup: () => {}, isExcludedFromBackup: () => true },
}));
// Everything else Erase everything reaches is a no-op stand-in: only the moments folder is under test here.
vi.mock('../src/lib/analytics', () => ({ stopAnalyticsForErase: async () => {} }));
vi.mock('../src/lib/audio-enhance', () => ({ sweepListeningCopies: () => 0 }));
vi.mock('../src/lib/app-lock/controller', () => ({ reloadAppLock: () => true }));
vi.mock('../src/lib/auth/apple', () => ({ APPLE_USER_KEY: 'a', PENDING_NAME_KEY: 'b' }));
vi.mock('../src/lib/auth/pending', () => ({ PENDING_REQUEST_KEY: 'c' }));
vi.mock('../src/lib/backup/files', () => ({ closeBackupHandles: () => {}, deleteBackupFiles: () => {} }));
vi.mock('../src/lib/backup/token-vault', () => ({ removeAllBackupTokens: async () => {} }));
vi.mock('../src/lib/billing/letter-ledger', () => ({ clearLedger: async () => {} }));
vi.mock('../src/lib/capture/adts-file', () => ({ removeWholeFrameCopies: () => {} }));
vi.mock('../src/lib/capture/erase', () => ({ eraseAudioFile: () => {} }));
vi.mock('../src/lib/capture/recordings', () => ({ listRecordingFiles: () => [] }));
vi.mock('../src/lib/family/pending-invite', () => ({ clearPendingInvite: async () => {} }));
vi.mock('../src/lib/photos/leaving', () => ({ discardPendingPhotoOnLeaving: async () => {} }));
vi.mock('../src/lib/reminders/scheduler', () => ({ forgetReminders: async () => {} }));
vi.mock('../src/lib/supabase/secure-storage', () => ({ secureStorage: { removeItem: async () => {} } }));
// The store's erase runs the device-files step it is handed, as store.ts eraseEverythingLocal does after the recordings.
vi.mock('../src/lib/store', () => ({
  eraseEverythingLocal: (_audio: unknown, deviceFiles: () => void) => (deviceFiles(), 'erased'),
  eraseEverythingPending: () => false,
  localDeletionAllowed: () => true,
  onBookErased: () => () => {},
  finishEraseEverything: () => {},
  ledgerDb: () => ({}),
  getSetting: (k: string) => {
    if (!h.storeOpen) throw new Error('no store open');
    return h.settings.get(k) ?? null;
  },
  setSetting: (k: string, v: string) => void h.settings.set(k, v),
  deleteSetting: (k: string) => void h.settings.delete(k),
}));

const { expoMomentsPort, MOMENTS_FILE, MOMENTS_FOLDER, MOMENTS_TMP } = await import('../src/lib/moments/store-file');
const { momentsStore } = await import('../src/lib/moments');
const { serializeMoments, emptyMoments } = await import('../src/lib/moments/store.logic');
const { eraseDeviceFiles, eraseEverything } = await import('../src/lib/erase-everything');
const { settleReminderSession } = await import('../src/lib/reminders/session');
const { REMINDER_SESSION_KEY } = await import('../src/lib/reminders/prefs');
const { sha256Hex } = await import('../src/lib/sha256');

const ASHA = '0199a5b0-0000-7000-8000-00000000a5a1'; // the signed-in account (fictional)
const ASHA_PARTNER = '0199a5b0-0000-7000-8000-00000000b0b1';
const KEY = sha256Hex(ASHA).slice(0, 16); // auth/local-claim.ts ownerKey(ASHA)
const PHONE = iosContainer('6F0C3A2E-ASHA-4C1B-9D55-MOMENTS1493');

const folder = () => `${h.disk.documents.replace(/Documents\/$/, '')}Library/Application%20Support/${MOMENTS_FOLDER}`;
const has = (name: string) => h.disk.files.has(`${folder()}/${name}`);
const left = () => [...h.disk.files.keys()].filter((u) => u.startsWith(`${folder()}/`));
const ownerOnDisk = () => JSON.parse(new TextDecoder().decode(h.disk.files.get(`${folder()}/${MOMENTS_FILE}`)!.data)).owner;

/** Neither the moments file nor its temp is left, and nothing else in the moments folder either. */
function expectNoMomentsFile(): void {
  expect(has(MOMENTS_FILE)).toBe(false);
  expect(has(MOMENTS_TMP)).toBe(false);
  expect(left()).toEqual([]);
}

beforeEach(async () => {
  h.disk = createDisk(PHONE);
  Object.assign(h, { settings: new Map(), storeOpen: true });
  expect(expoMomentsPort()).not.toBeNull(); // lays out the moments folder on this fresh disk
  // Asha is signed in: the store's owner is her account key (local-claim.ts sets it at sign-in), and she labels a day.
  momentsStore.setOwner(KEY);
  expect(await momentsStore.setLabel('2026-10-03', 'Asha at the lake')).toEqual({ ok: true });
  expect(await momentsStore.addDayKey('2026-10-04')).toEqual({ ok: true });
  // A later write was killed after its temp was written and before the rename.
  put(h.disk, `${folder()}/${MOMENTS_TMP}`, new TextEncoder().encode(serializeMoments({ ...emptyMoments(KEY), labels: { '2026-10-05': 'Asha in the garden' } })));
  // Positive control: both files are on the disk, and the final one is the account's, not a 'local' one (BL-1559).
  expect(has(MOMENTS_FILE)).toBe(true);
  expect(has(MOMENTS_TMP)).toBe(true);
  expect(ownerOnDisk()).toBe(KEY);
  expect(KEY).toMatch(/^[0-9a-f]{16}$/);
});

describe('[DATA-REQ-024] Erase everything leaves no moments file', () => {
  it('eraseDeviceFiles removes moments.v1.json and its .tmp', () => {
    eraseDeviceFiles();
    expectNoMomentsFile();
  });

  it('Erase everything, as Settings runs it after the confirm, removes both and reports erased', async () => {
    expect(await eraseEverything()).toBe('erased');
    expectNoMomentsFile();
  });
});

describe('[DATA-REQ-024] sign-out of the signed-in account leaves no moments file', () => {
  it('both go before the first await of the session hook, even with the store closed', () => {
    h.storeOpen = false;
    void settleReminderSession(ASHA, null);
    expectNoMomentsFile();
  });

  it('another account signing in on this phone takes them too', async () => {
    await settleReminderSession(ASHA, ASHA_PARTNER);
    expectNoMomentsFile();
  });

  it('the same account settling again keeps them (control: the wipe is the session ending, not any settle)', async () => {
    await settleReminderSession(ASHA, ASHA);
    expect(has(MOMENTS_FILE)).toBe(true);
  });
});

describe('[DATA-REQ-023] account deletion leaves no moments file', () => {
  it('the deleted account\'s session ending on this phone (Sign out on the deletion screen, or the server ending it) removes both', async () => {
    h.settings.set(REMINDER_SESSION_KEY, 'on'); // the mark a signed-in session keeps
    await settleReminderSession(ASHA, null);
    expectNoMomentsFile();
  });

  it('a launch after a kill, with the session mark and nobody signed in, removes both', async () => {
    h.settings.set(REMINDER_SESSION_KEY, 'on');
    await settleReminderSession(null, null);
    expectNoMomentsFile();
  });
});
