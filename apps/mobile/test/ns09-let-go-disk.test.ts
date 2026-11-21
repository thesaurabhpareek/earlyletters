/// <reference types="node" />
/**
 * NS-09 Let it go on the phone's disk (BL-977, P-4b): the draft a let-go on another phone marked comes off
 * this phone, row and recording, at its next launch (R8), and a draft left discarding when the app is updated
 * (the data container moves) is finished by the first sweep after the update (R16). Same disk stand-in and
 * launch() as sweep.disk.test.ts. R8 proves the stand-in server's half; two real phones are a device row
 * (D13). Fictional Asha family only.
 *
 * Mutants these tests were written to catch (each one failed a test here when it was made):
 *  R8  the pull does not mark the draft discarding (merge.ts applyHeldRows, the `discarded` branch);
 *  R16 the sweep finds the recording only at its stored path, not by name in the new container.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyPullPage } from '../src/lib/sync/merge';
import { SYNC_SETTING, writeSetting } from '../src/lib/sync/outbox';
import type { SqlDb } from '../src/lib/db/sql';
import type { PullResponse } from '../src/lib/sync/types';
import {
  createDisk,
  iosContainer,
  layOutApp,
  moveContainer,
  put,
  recorderDir,
  type Disk,
} from './helpers/expo-fs-standin';
import { nodeDb } from './helpers/node-db';

const h = vi.hoisted(() => ({
  disk: null as unknown as Disk,
  shared: [] as { uri: string; data: Uint8Array }[],
}));

vi.mock('expo-file-system', async () => (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk));
vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return h.disk?.os ?? 'ios';
    },
  },
}));
vi.mock('expo-crypto', async () => {
  const { createHash: hash } = await import('node:crypto');
  return {
    getRandomBytes: (n: number) => new Uint8Array(n).fill(7),
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digest: async (_alg: string, data: Uint8Array) => new Uint8Array(hash('sha256').update(data).digest()).buffer,
  };
});
vi.mock('expo-audio', () => ({
  AudioQuality: { HIGH: 96 },
  IOSOutputFormat: { MPEG4AAC: 'aac ' },
  setAudioModeAsync: async () => {},
  // The probe's player: a take with bytes opens and has a length (the oracle in #203 checks this on a simulator).
  createAudioPlayer: ({ uri }: { uri: string }) => ({ isLoaded: true, duration: (h.disk.files.get(uri)?.data.length ?? 0) > 0 ? 1.5 : 0, remove() {} }),
}));
vi.mock('expo-sharing', () => ({
  isAvailableAsync: async () => true,
  shareAsync: async (uri: string) => {
    h.shared.push({ uri, data: h.disk.files.get(uri)!.data.slice() });
  },
}));
vi.mock('expo-sqlite', () => ({
  get defaultDatabaseDirectory() {
    return `${h.disk.documents.replace(/^file:\/\//, '')}SQLite`; // a plain path, as expo-sqlite gives it
  },
}));
// Listening copies live in Application Support (audio-enhance); not under test here.
vi.mock('../src/lib/audio-enhance', () => ({ removeListeningCopy: () => {} }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const T0 = Date.parse('2026-10-03T09:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;
const OLD = iosContainer('6F0C3A2E-OLD0-4C1B-9D55-ASHA00000001');
const NEW = iosContainer('B81D7E44-NEW0-4A7F-8C21-ASHA00000002');

let seq = 0;
let db: SqlDb;
let closeDb: () => void = () => {};

/** One app process: fresh modules over the same database file, as after a kill or an update. */
async function launch() {
  vi.resetModules();
  const store = await import('../src/lib/store');
  const opened = store.openStore({
    open: () => ({ db, close: () => {} }),
    now: () => new Date().toISOString(),
    newId: () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`,
  });
  expect(opened.ok).toBe(true);
  const sweep = await import('../src/lib/capture/sweep');
  const recorder = await import('../src/lib/capture/recorder');
  const erase = await import('../src/lib/capture/erase');
  return { store, sweep, recorder, erase };
}

type App = Awaited<ReturnType<typeof launch>>;
const addAsha = (app: App) => app.store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
  seq = 0;
  h.shared = [];
  h.disk = createDisk(NEW);
  layOutApp(h.disk);
  const n = nodeDb();
  db = n.db;
  closeDb = n.close;
});
afterEach(() => {
  vi.useRealTimers();
  closeDb();
});

const ME = '11111111-1111-1111-1111-111111111111';
const NAME = (n: string) => `recording-6A7B8C9D-0000-4000-8000-0000000D16${n}.m4a`;
const exists = (uri: string) => h.disk.files.has(uri);

describe('[NS-09-R8] let go on the other phone takes the draft and its recording off this one', () => {
  it('[NS-09-R8] let go follows to the other phone', async () => {
    let app = await launch();
    const asha = addAsha(app);
    const uri = put(h.disk, `${recorderDir(h.disk)}/${NAME('01')}`, 20_000);
    const d = app.store.createDraft({ childId: asha, captureMode: 'spoken', promptKey: null, audioUri: uri, audioDurationMs: 4000, state: 'ready' });
    expect(app.store.holdDraft(d.id, { inBookChoice: true })).toBeTruthy();
    writeSetting(db, SYNC_SETTING.owner, ME);
    expect(app.store.listDrafts(asha).map((x) => x.id)).toContain(d.id); // arrange: it is a draft here, with its file
    expect(exists(uri)).toBe(true);

    // The other phone let it go: this phone's next pull carries the marker.
    const at = new Date().toISOString();
    const page = {
      reset: false, epoch: 1, epoch_started_at: at, books: [], gone: [], more: false,
      held: { rows: [{ id: d.id, gone: 'discarded', updated_at: at, v: '860' }], cursor: '900:00000000-0000-0000-0000-000000000000', more: false },
    } as unknown as PullResponse;
    applyPullPage(db, page, at);
    expect(app.store.listDrafts(asha)).toEqual([]); // hidden at once

    app = await launch(); // the next launch
    expect(await app.sweep.runLaunchSweep()).toEqual({ 'finish-discard': 1 });
    expect(app.store.getDraft(d.id)).toBeNull();
    expect(exists(uri)).toBe(false);
  });
});

describe('[NS-09-R16] the sweep after an app update finishes a let-go', () => {
  it('[NS-09-R16] the sweep runs after an update', async () => {
    h.disk = createDisk(OLD);
    layOutApp(h.disk);
    let app = await launch();
    const asha = addAsha(app);
    const uri = put(h.disk, `${recorderDir(h.disk)}/${NAME('02')}`, 20_000);
    const d = app.store.createDraft({ childId: asha, captureMode: 'spoken', promptKey: null, audioUri: uri, audioDurationMs: 4000, state: 'ready' });
    expect(app.store.beginDiscard(d.id)).toBe(true); // marked, then the app stopped before the file went
    expect(app.store.getDraft(d.id)?.state).toBe('discarding');
    expect(exists(uri)).toBe(true);

    moveContainer(h.disk, NEW); // the update: same files, a new container path
    const now = `${recorderDir(h.disk)}/${NAME('02')}`;
    expect(exists(now)).toBe(true);
    expect(now).not.toBe(uri);
    app = await launch();
    await app.sweep.runLaunchSweep();
    expect(app.store.getDraft(d.id)).toBeNull();
    expect(exists(now)).toBe(false); // the recording went too, found by name in the new container
  });
});
