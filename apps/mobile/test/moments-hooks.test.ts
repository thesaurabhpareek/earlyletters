/// <reference types="node" />
/**
 * The moments file is cleared on Erase everything and on sign-out, and a book's rows go when the book is erased
 * (CDO-23; ADR 0032 amendment), driven through the real `eraseDeviceFiles`, `settleReminderSession` and the store's
 * book-erased hook on an in-memory disk. Fictional data only. Mutants: drop eraseMomentsFile, endMomentsSession or the hook.
 */
import { File } from 'expo-file-system';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDisk, iosContainer, put as put_, type Disk } from './helpers/expo-fs-standin';

const h = vi.hoisted(() => ({ hooks: [] as ((id: string) => void)[], disk: null as unknown as Disk, calls: [] as string[], settings: new Map<string, string>(), storeOpen: true }));
vi.mock('expo-file-system', async () => (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('../modules/scribe-files', () => ({
  ScribeFiles: { setExcludedFromBackup: () => {}, isExcludedFromBackup: () => true },
}));
// Everything else erase-everything reaches is a recorder of calls.
vi.mock('../src/lib/analytics', () => ({ stopAnalyticsForErase: async () => {} }));
vi.mock('../src/lib/audio-enhance', () => ({ sweepListeningCopies: () => h.calls.push('listening') }));
vi.mock('../src/lib/app-lock/controller', () => ({ reloadAppLock: () => true }));
vi.mock('../src/lib/auth/apple', () => ({ APPLE_USER_KEY: 'a', PENDING_NAME_KEY: 'b' }));
vi.mock('../src/lib/auth/pending', () => ({ PENDING_REQUEST_KEY: 'c' }));
vi.mock('../src/lib/backup/files', () => ({ closeBackupHandles: () => {}, deleteBackupFiles: () => {} })); // B5-4: not under test here
vi.mock('../src/lib/billing/letter-ledger', () => ({ clearLedger: async () => {} }));
vi.mock('../src/lib/capture/adts-file', () => ({ removeWholeFrameCopies: () => h.calls.push('copies') }));
vi.mock('../src/lib/capture/erase', () => ({ eraseAudioFile: () => {} }));
vi.mock('../src/lib/capture/recordings', () => ({
  listRecordingFiles: () => (h.calls.push('recordings'), [new File(`${h.disk.documents}ExpoAudio/recording-0A1B2C3D.m4a`)]),
}));
vi.mock('../src/lib/family/pending-invite', () => ({ clearPendingInvite: async () => {} }));
vi.mock('../src/lib/reminders/scheduler', () => ({ forgetReminders: async () => void h.calls.push('forget') }));
vi.mock('../src/lib/supabase/secure-storage', () => ({ secureStorage: { removeItem: async () => {} } }));
vi.mock('../src/lib/store', () => ({
  eraseEverythingLocal: () => 'erased',
  eraseEverythingPending: () => false,
  onBookErased: (fn: (id: string) => void) => (h.hooks.push(fn), () => {}),
  finishEraseEverything: () => {},
  ledgerDb: () => ({}),
  getSetting: (k: string) => {
    if (!h.storeOpen) throw new Error('no store open');
    return h.settings.get(k) ?? null;
  },
  setSetting: (k: string, v: string) => void h.settings.set(k, v),
  deleteSetting: (k: string) => void h.settings.delete(k),
}));

const { expoMomentsPort, writeMoments, MOMENTS_FILE } = await import('../src/lib/moments/store-file');
const { MomentsStoreError, momentsStore } = await import('../src/lib/moments');
const { emptyMoments } = await import('../src/lib/moments/store.logic');
const { eraseDeviceFiles } = await import('../src/lib/erase-everything');
const { settleReminderSession } = await import('../src/lib/reminders/session');
const { REMINDER_SESSION_KEY } = await import('../src/lib/reminders/prefs');

const OWNER = '1a2b3c4d5e6f7a8b';
const BOOK = '0199a5b0-0000-7000-8000-00000000a5a1';
const BOOK2 = '0199a5b0-0000-7000-8000-00000000b0b1';
const dir = () => `${h.disk.documents.replace(/Documents\/$/, '')}Library/Application%20Support/moments`;
const left = () => [...h.disk.files.keys()].filter((u) => u.startsWith(`${dir()}/`));
const rec = () => h.disk.files.has(`${h.disk.documents}ExpoAudio/recording-0A1B2C3D.m4a`);
const put = () => writeMoments(expoMomentsPort()!, { ...emptyMoments(OWNER), labels: { '2026-10-03': 'Asha at the lake' }, homePlace: { [BOOK]: 'ext:place-2', [BOOK2]: 'ext:place-3' } });

beforeEach(async () => {
  h.disk = createDisk(iosContainer('6F0C3A2E-ASHA-4C1B-9D55-MOMENTS0002'));
  Object.assign(h, { calls: [], settings: new Map(), storeOpen: true });
  expect(await put()).toBe('ok');
  put_(h.disk, `${h.disk.documents}ExpoAudio/recording-0A1B2C3D.m4a`, 100);
  expect(left()).toHaveLength(1); // positive control: the file is there
});

describe('[CDO-23] Erase everything takes the moments file', () => {
  it('eraseDeviceFiles leaves no file in the moments folder', () => {
    eraseDeviceFiles();
    expect(left()).toEqual([]);
    expect(rec()).toBe(false);
  });

  it('a file that will not go throws a typed error (the mark stays), and the recording and copy steps still ran', () => {
    h.disk.undeletable.add(`${dir()}/${MOMENTS_FILE}`);
    let caught: unknown;
    try {
      eraseDeviceFiles();
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(MomentsStoreError);
    expect(h.calls).toEqual(expect.arrayContaining(['recordings', 'copies', 'listening']));
    expect(left()).toHaveLength(1);
    expect(rec()).toBe(false);
    h.disk.undeletable.clear();
    eraseDeviceFiles();
    expect(left()).toEqual([]);
  });
});

describe('[CDO-23] sign-out takes the moments file', () => {
  it('the file is gone before the first await, even when the store is not open', () => {
    h.storeOpen = false;
    void settleReminderSession('user-a', null);
    expect(left()).toEqual([]);
  });

  it('another account signing in clears it too; the same user settling again does not', async () => {
    await settleReminderSession('user-a', 'user-a');
    expect(left()).toHaveLength(1);
    await settleReminderSession('user-a', 'user-b');
    expect(left()).toEqual([]);
  });

  it('a launch that finds the session mark with nobody signed in clears it', async () => {
    h.settings.set(REMINDER_SESSION_KEY, 'on');
    await settleReminderSession(null, null);
    expect(left()).toEqual([]);
  });
});

describe('[CDO-23] a book erased for good takes its rows', () => {
  it('the hook the store runs after eraseBook removes that book\'s home place and no other', async () => {
    expect(h.hooks).toHaveLength(1);
    momentsStore.setOwner(OWNER);
    h.hooks[0]!(BOOK);
    await momentsStore.load(); // reads are synchronous; the queued write is awaited by the next change
    await momentsStore.removeBook('0199a5b0-0000-7000-8000-0000000000ff'); // drains the queue
    expect(JSON.parse(new TextDecoder().decode(h.disk.files.get(`${dir()}/${MOMENTS_FILE}`)!.data)).homePlace).toEqual({ [BOOK2]: 'ext:place-3' });
  });
});
