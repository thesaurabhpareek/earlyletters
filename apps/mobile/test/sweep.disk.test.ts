/// <reference types="node" />
/**
 * The launch sweep, erase and "Export what is readable" against a disk laid out exactly as the phone
 * has it (DEVICE_TEST_PLAN DL-01; TDD 01 3.2.4; DATA-REQ-048; D-085). expo-audio 57 writes each take
 * to `<Documents>/ExpoAudio/recording-<UUID>.m4a` (Android `<files>/Audio/`), next to the database
 * (`Documents/SQLite`) and the speech models (`Documents/models`). The planner tests (sweep.test.ts,
 * sweep.playable.test.ts) hand the planner a list, so they cannot see where the list comes from; these
 * drive the real sweep(), recorder, erase and recovery export over an expo-file-system stand-in
 * (helpers/expo-fs-standin.ts) and a real SQLite store.
 *
 * Each test is one launch after another: vi.resetModules() is the process dying (a kill, or an update),
 * so module state such as the live take is gone, and the same database file is opened again.
 * Fictional Asha family only.
 */
import { createHash } from 'node:crypto';
import { unzipSync } from 'fflate';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SqlDb } from '../src/lib/db/sql';
import {
  androidContainer,
  createDisk,
  iosContainer,
  layOutApp,
  moveContainer,
  namesIn,
  put,
  recorderDir,
  recorderFor,
  type Disk,
} from './helpers/expo-fs-standin';
import { nodeDb } from './helpers/node-db';
import { letter } from './helpers/store-fixture';

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

const sha256 = (data: Uint8Array) => createHash('sha256').update(data).digest('hex');
const bytesAt = (uri: string) => h.disk.files.get(uri)!.data;

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

describe('[DL-01] a take cut off by a kill, on a disk laid out as expo-audio writes it', () => {
  it('[LEGAL-REQ-011] is finalized from Documents/ExpoAudio and shows on Tonight, never dropped', async () => {
    let app = await launch();
    const asha = addAsha(app);
    const rec = recorderFor(h.disk);
    const take = await app.recorder.beginTake(rec as never, { childId: asha, promptKey: 'first-laugh' });
    expect(rec.uri).toMatch(/\/Documents\/ExpoAudio\/recording-[0-9A-F-]{36}\.m4a$/);
    expect(take).toMatchObject({ state: 'recording', audioUri: rec.uri });
    // Killed mid-take: finalizeTake never ran. The next launch:
    app = await launch();
    const report = await app.sweep.runLaunchSweep();
    expect(report).toEqual({ 'finalize-recording': 1 });
    const kept = app.store.getDraft(take.id);
    expect(kept).toMatchObject({ state: 'ready', audioUri: rec.uri, audioBytes: 48_000, audioSha256: sha256(bytesAt(rec.uri!)) });
    expect(kept?.recoveredAt).not.toBeNull();
    expect(app.store.listDrafts(asha).map((d) => d.id)).toEqual([take.id]);
    expect(app.store.listOrphanAudio()).toEqual([]);
    expect(h.disk.files.has(rec.uri!)).toBe(true);
  });

  it('[DATA-REQ-048] is finalized at its new path when an update moved the container before the relaunch', async () => {
    h.disk = createDisk(OLD);
    layOutApp(h.disk);
    let app = await launch();
    const asha = addAsha(app);
    const rec = recorderFor(h.disk);
    const take = await app.recorder.beginTake(rec as never, { childId: asha, promptKey: null });
    moveContainer(h.disk, NEW);
    const now = `${recorderDir(h.disk)}/${rec.uri!.slice(rec.uri!.lastIndexOf('/') + 1)}`;
    app = await launch();
    expect(await app.sweep.runLaunchSweep()).toEqual({ 'finalize-recording': 1 });
    expect(app.store.getDraft(take.id)).toMatchObject({ state: 'ready', audioUri: now, audioSha256: sha256(bytesAt(now)) });
    expect(now.startsWith(NEW.documents)).toBe(true);
  });

  it('on Android the take in <files>/Audio is finalized the same way', async () => {
    h.disk = createDisk(androidContainer());
    layOutApp(h.disk);
    let app = await launch();
    const asha = addAsha(app);
    const rec = recorderFor(h.disk);
    const take = await app.recorder.beginTake(rec as never, { childId: asha, promptKey: null });
    expect(rec.uri).toMatch(/\/files\/Audio\/recording-[0-9A-F-]{36}\.m4a$/);
    app = await launch();
    expect(await app.sweep.runLaunchSweep()).toEqual({ 'finalize-recording': 1 });
    expect(app.store.getDraft(take.id)).toMatchObject({ state: 'ready', audioUri: rec.uri });
  });

  it('when the recorder folder cannot be read the sweep changes nothing, and the next launch finalizes the take', async () => {
    let app = await launch();
    const asha = addAsha(app);
    expect(await app.sweep.runLaunchSweep()).toEqual({}); // a fresh install: no ExpoAudio folder yet is not an error
    const rec = recorderFor(h.disk);
    const take = await app.recorder.beginTake(rec as never, { childId: asha, promptKey: null });
    h.disk.unreadable.add(recorderDir(h.disk));
    app = await launch();
    expect(await app.sweep.runLaunchSweep()).toBeNull(); // no plan on half a snapshot
    expect(app.store.getDraft(take.id)).toMatchObject({ state: 'recording', audioUri: rec.uri });
    h.disk.unreadable.clear();
    app = await launch();
    expect(await app.sweep.runLaunchSweep()).toEqual({ 'finalize-recording': 1 });
    expect(app.store.getDraft(take.id)).toMatchObject({ state: 'ready', audioUri: rec.uri });
  });
});

describe('[DATA-REQ-048] saved letters after iOS gives the app a new container', () => {
  it("a letter and a read-back draft whose stored paths name the old container are rebased to this container's ExpoAudio", async () => {
    h.disk = createDisk(OLD);
    layOutApp(h.disk);
    let app = await launch();
    const asha = addAsha(app);
    const letterUri = put(h.disk, `${recorderDir(h.disk)}/recording-0A1B2C3D-0000-4000-8000-00000000A5A1.m4a`, 31_000);
    const draftUri = put(h.disk, `${recorderDir(h.disk)}/recording-0A1B2C3D-0000-4000-8000-00000000A5A2.m4a`, 9_000);
    const id = '0199a5b0-0000-7000-8000-00000000e001';
    app.store.saveEntry(letter({ id, childId: asha, audioUri: letterUri, audioSha256: sha256(bytesAt(letterUri)), audioBytes: 31_000 }));
    const draft = app.store.createDraft({ childId: asha, captureMode: 'spoken', promptKey: null, audioUri: draftUri, audioDurationMs: 4000, state: 'ready' });

    moveContainer(h.disk, NEW);
    app = await launch();
    expect(await app.sweep.runLaunchSweep()).toEqual({ 'rebase-draft': 1, 'rebase-entry': 1 });
    const saved = app.store.getEntry(id)!;
    expect(saved.audioUri).toBe(`${NEW.documents}ExpoAudio/recording-0A1B2C3D-0000-4000-8000-00000000A5A1.m4a`);
    expect(sha256(bytesAt(saved.audioUri!))).toBe(saved.audioSha256); // the same recording, playable at its new path
    expect(saved.finalText).toBe('Asha, you laughed at the rain today.'); // words untouched
    expect(app.store.getDraft(draft.id)?.audioUri).toBe(`${NEW.documents}ExpoAudio/recording-0A1B2C3D-0000-4000-8000-00000000A5A2.m4a`);
    // A second launch has nothing left to do.
    app = await launch();
    expect(await app.sweep.runLaunchSweep()).toEqual({});
  });
});

describe('[TDD-01 3.2.4] recordings with no row', () => {
  it('a stray take in ExpoAudio, and one at the top of Documents (older layout, restored backup), are re-attached to the active book', async () => {
    let app = await launch();
    const asha = addAsha(app);
    const stray = put(h.disk, `${recorderDir(h.disk)}/recording-5D2E0F11-0000-4000-8000-0000000057A1.m4a`, 12_000);
    const older = put(h.disk, `${h.disk.documents}recording-5D2E0F11-0000-4000-8000-0000000057A2.m4a`, 8_000);
    app = await launch();
    expect(await app.sweep.runLaunchSweep()).toEqual({ reattach: 2 });
    const drafts = app.store.listDrafts(asha);
    expect(drafts.map((d) => d.audioUri).sort()).toEqual([older, stray].sort());
    for (const d of drafts) expect(d).toMatchObject({ state: 'ready', audioSha256: sha256(bytesAt(d.audioUri!)) });
    expect(app.store.listOrphanAudio()).toEqual([]);
  });

  it('with no book yet, a stray take in ExpoAudio is listed in Settings > Recordings once, never deleted', async () => {
    put(h.disk, `${recorderDir(h.disk)}/recording-5D2E0F11-0000-4000-8000-0000000057A3.m4a`, 12_000);
    let app = await launch();
    expect(await app.sweep.runLaunchSweep()).toEqual({ report: 1 });
    expect(app.store.listOrphanAudio().map((o) => [o.fileName, o.bytes])).toEqual([['recording-5D2E0F11-0000-4000-8000-0000000057A3.m4a', 12_000]]);
    app = await launch();
    expect(await app.sweep.runLaunchSweep()).toEqual({});
    expect(namesIn(h.disk, recorderDir(h.disk))).toEqual(['recording-5D2E0F11-0000-4000-8000-0000000057A3.m4a']);
  });
});

describe('[D-085] erase removes the recording where it is now (privacy)', () => {
  it("the 30 day purge at launch erases a deleted letter's recording from ExpoAudio after the container moved", async () => {
    h.disk = createDisk(OLD);
    layOutApp(h.disk);
    let app = await launch();
    const asha = addAsha(app);
    const uri = put(h.disk, `${recorderDir(h.disk)}/recording-9C3F1A20-0000-4000-8000-0000000DE1E7.m4a`, 20_000);
    const id = '0199a5b0-0000-7000-8000-00000000e002';
    app.store.saveEntry(letter({ id, childId: asha, audioUri: uri }));
    app.store.deleteEntry(id);

    moveContainer(h.disk, NEW);
    vi.setSystemTime(T0 + 30 * DAY + 60_000);
    app = await launch();
    await app.sweep.runLaunchSweep();
    expect(app.store.listDeleted()).toEqual([]);
    expect(namesIn(h.disk, recorderDir(h.disk))).toEqual([]);
    // Nothing for a later sweep to bring back.
    app = await launch();
    expect(await app.sweep.runLaunchSweep()).toEqual({});
    expect(app.store.listDrafts(asha)).toEqual([]);
  });

  it("Erase now, with a stored path from the old container, removes the recording from this container's ExpoAudio", async () => {
    h.disk = createDisk(OLD);
    layOutApp(h.disk);
    let app = await launch();
    const asha = addAsha(app);
    const uri = put(h.disk, `${recorderDir(h.disk)}/recording-9C3F1A20-0000-4000-8000-0000000DE1E8.m4a`, 20_000);
    const id = '0199a5b0-0000-7000-8000-00000000e003';
    app.store.saveEntry(letter({ id, childId: asha, audioUri: uri }));
    app.store.deleteEntry(id);

    moveContainer(h.disk, NEW);
    app = await launch();
    // Before this launch's sweep has rebased anything (it runs after the first frame and can wait on probes).
    expect(app.erase.eraseDeletedLetter(id)).toBe(true);
    expect(app.store.listDeleted()).toEqual([]);
    expect(namesIn(h.disk, recorderDir(h.disk))).toEqual([]);
    expect(await app.sweep.runLaunchSweep()).toEqual({});
    expect(app.store.listDrafts(asha)).toEqual([]);
  });
});

describe('[J20] Export what is readable, when the book cannot be opened', () => {
  it('packs every recording in ExpoAudio and at the top of Documents, and the database; no models; nothing moved', async () => {
    const a = put(h.disk, `${recorderDir(h.disk)}/recording-1E2D3C4B-0000-4000-8000-00000000AAA1.m4a`, 300);
    const b = put(h.disk, `${recorderDir(h.disk)}/recording-1E2D3C4B-0000-4000-8000-00000000AAA2.m4a`, 200);
    const older = put(h.disk, `${h.disk.documents}recording-1E2D3C4B-0000-4000-8000-00000000AAA3.m4a`, 100);
    const before = new Map([...h.disk.files].map(([u, f]) => [u, sha256(f.data)]));
    vi.resetModules();
    const { runRecoveryExport } = await import('../src/lib/resilience/recovery-export');
    expect(await runRecoveryExport()).toBe('shared');
    expect(h.shared).toHaveLength(1);
    const zip = unzipSync(h.shared[0].data);
    expect(Object.keys(zip).sort()).toEqual([
      'README.txt',
      'database/scribe.db',
      'database/scribe.db-wal',
      'recordings/recording-1E2D3C4B-0000-4000-8000-00000000AAA1.m4a',
      'recordings/recording-1E2D3C4B-0000-4000-8000-00000000AAA2.m4a',
      'recordings/recording-1E2D3C4B-0000-4000-8000-00000000AAA3.m4a',
    ]);
    expect(sha256(zip['recordings/recording-1E2D3C4B-0000-4000-8000-00000000AAA1.m4a'])).toBe(sha256(bytesAt(a)));
    expect(sha256(zip['recordings/recording-1E2D3C4B-0000-4000-8000-00000000AAA2.m4a'])).toBe(sha256(bytesAt(b)));
    expect(sha256(zip['recordings/recording-1E2D3C4B-0000-4000-8000-00000000AAA3.m4a'])).toBe(sha256(bytesAt(older)));
    // The originals are exactly as they were, and the temporary ZIP is gone.
    expect(new Map([...h.disk.files].map(([u, f]) => [u, sha256(f.data)]))).toEqual(before);
  });
});
