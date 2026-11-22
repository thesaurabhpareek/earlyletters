/// <reference types="node" />
/**
 * The days store is cleared on Erase and on sign-out (NS-47-R15, R16; ADR 0032 item 3), driven through the real
 * `eraseDeviceFiles` and `settleReminderSession` on an in-memory disk. Fictional data only.
 */
import { File } from 'expo-file-system';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDisk, iosContainer, put as put_, type Disk } from './helpers/expo-fs-standin';

const h = vi.hoisted(() => ({ disk: null as unknown as Disk, calls: [] as string[], settings: new Map<string, string>(), storeOpen: true }));
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

const { expoDaysPort, writeDays, DAYS_FILE } = await import('../src/lib/days/store-file');
const { DaysStoreError } = await import('../src/lib/days');
const { eraseDeviceFiles } = await import('../src/lib/erase-everything');
const { settleReminderSession } = await import('../src/lib/reminders/session');
const { REMINDER_SESSION_KEY } = await import('../src/lib/reminders/prefs');

const OWNER = '1a2b3c4d5e6f7a8b';
const dir = () => `${h.disk.documents.replace(/Documents\/$/, '')}Library/Application%20Support/days`;
const left = () => [...h.disk.files.keys()].filter((u) => u.startsWith(`${dir()}/`));
const rec = () => h.disk.files.has(`${h.disk.documents}ExpoAudio/recording-0A1B2C3D.m4a`);
const put = () => writeDays(expoDaysPort()!, { v: 1, owner: OWNER, ticked: { 'seasonal.synthetic-day': {} } });

beforeEach(async () => {
  h.disk = createDisk(iosContainer('6F0C3A2E-ASHA-4C1B-9D55-DAYS00000002'));
  Object.assign(h, { calls: [], settings: new Map(), storeOpen: true });
  expect(await put()).toBe('ok');
  put_(h.disk, `${h.disk.documents}ExpoAudio/recording-0A1B2C3D.m4a`, 100);
  expect(left()).toHaveLength(1); // positive control: the file is there
});

describe('[NS-47-R16] Erase everything takes the days file', () => {
  it('eraseDeviceFiles leaves no file in the days folder', () => {
    eraseDeviceFiles();
    expect(left()).toEqual([]);
    expect(rec()).toBe(false);
  });

  it('a file that will not go throws a typed error (the mark stays), and the recording and copy steps still ran', () => {
    h.disk.undeletable.add(`${dir()}/${DAYS_FILE}`);
    let caught: unknown;
    try {
      eraseDeviceFiles();
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(DaysStoreError);
    expect((caught as { code: string }).code).toBe('days_file_not_removed');
    expect(h.calls).toEqual(expect.arrayContaining(['recordings', 'copies', 'listening']));
    expect(left()).toHaveLength(1);
    expect(rec()).toBe(false); // the recording is deleted although the days file stayed
    h.disk.undeletable.clear();
    eraseDeviceFiles(); // the next attempt finishes it
    expect(left()).toEqual([]);
  });
});

describe('[NS-47-R15] sign-out takes the days file', () => {
  it('the file is gone before the first await, even when the store is not open', () => {
    h.storeOpen = false;
    void settleReminderSession('user-a', null); // not awaited: only what runs before its first await counts
    expect(left()).toEqual([]);
  });

  it('another account signing in clears it too; the same user settling again does not', async () => {
    await settleReminderSession('user-a', 'user-a');
    expect(left()).toHaveLength(1);
    await settleReminderSession('user-a', 'user-b');
    expect(left()).toEqual([]);
  });

  it('a launch that finds the session mark with nobody signed in clears it (a kill between sign-out and here)', async () => {
    h.settings.set(REMINDER_SESSION_KEY, 'on');
    await settleReminderSession(null, null);
    expect(left()).toEqual([]);
  });
});
