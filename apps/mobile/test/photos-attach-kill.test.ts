/// <reference types="node" />
// [NX-39-R53] A kill at any step of attaching a picture leaves no temporary file once the app opens again (BL-1406,
// security gap G-1, device row D-4). The attach is run against the real files (expo-file-system stand-in), the real
// SQLite store and the real native-step adapter. "Killed" means the process stops at that step and no code after it
// runs: the step never settles, so no `finally`, no catch and no cleanup of the attach runs. The launch is then the real
// `runLaunchSweep` (capture/sweep.ts), which is what starts the photo sweep in the app.
//
// Steps of D-4 that exist on develop (the order of an attach): the original is copied into Caches/ImagePicker (the
// copy), the native step writes an upright JPEG into Caches/ScribePhoto (the re-encode, killed while writing and again
// after it wrote), the stored copy is written into the photos folder (the store, killed after the file and again half
// way through it), and the original is removed last (killed before that delete). The PICK step itself (the system
// picker's own copy, PR #837) is not covered here: the picker is not driven by this attach; a follow-up row adds it.
// Fictional family Asha.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { migrate } from '../src/lib/db/migrations';
import type { SqlDb } from '../src/lib/db/sql';
import { createOrientationBaker, type BakedFiles } from '../src/lib/photos/baker';
import { entryMediaStore } from '../src/lib/photos/entry-media';
import { expoBakedFiles, expoPhotoFiles, expoPickedFiles, pickerDestination, photosDirectory } from '../src/lib/photos/files';
import { PendingPhoto } from '../src/lib/photos/pending';
import type { PhotoDeps, PhotoFiles, PickedFiles } from '../src/lib/photos/types';
import { createDisk, iosContainer, put, type Disk } from './helpers/expo-fs-standin';
import { nodeDb } from './helpers/node-db';
import { makeJpeg } from './photos-helpers';

const h = vi.hoisted(() => ({ disk: null as unknown as Disk, db: null as unknown as SqlDb, ids: 0 }));
vi.mock('expo-file-system', async () => (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
// The launch sweep also touches recordings, listening copies and the backup folder; none of that is under test here.
vi.mock('expo-audio', () => ({ AudioQuality: { HIGH: 96 }, IOSOutputFormat: { MPEG4AAC: 'aac ' }, setAudioModeAsync: async () => {}, createAudioPlayer: () => ({ isLoaded: true, duration: 1.5, remove() {} }) }));
vi.mock('expo-sqlite', () => ({ defaultDatabaseDirectory: '/none' }));
vi.mock('../modules/scribe-files', () => ({ ScribeFiles: null }));
vi.mock('../src/lib/audio-enhance', () => ({ removeListeningCopy: () => {}, sweepListeningCopies: () => 0 }));
vi.mock('expo-crypto', async () => {
  const { createHash: hash } = await import('node:crypto');
  return {
    getRandomBytes: (n: number) => new Uint8Array(n).fill(7),
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digest: async (_algorithm: string, bytes: Uint8Array) => Uint8Array.from(hash('sha256').update(bytes).digest()).buffer,
  };
});
// The launch sweep reaches into the store for recordings and drafts, which this test does not exercise: every name
// the store does not need to answer here is a no-op that returns nothing (the sweep then ends in its own catch and
// still runs the photo sweep, as it does when the recordings listing fails).
vi.mock('../src/lib/store', () => {
  const real: Record<string, unknown> = { localSqlDb: () => h.db, notifyStoreChanged: () => {}, uuidv7: () => `m${++h.ids}` };
  return new Proxy(real, { has: () => true, get: (t, k) => (typeof k === 'string' && !(k in t) && k !== 'then' ? () => undefined : t[k as string]) });
});

const ctx = { now: '2026-11-11T00:00:00.000Z', newId: () => 'id' };
const WORDS = 'Asha and the rain boots.';
const never = <T>(): Promise<T> => new Promise<T>(() => {});

type Step = 'copied' | 'reencode-writing' | 'reencoded' | 'store-half-written' | 'stored-no-row' | 'stored-before-original-removed';

function phone(): void {
  const { db } = nodeDb();
  migrate(db, ctx);
  db.run(
    `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits, final_text, in_book, updated_at)
     VALUES ('e1', 'letter', '2026-06-12', '2026-06-12T09:00:00Z', 'typed', 'clean', 1, 'x', '[]', ?, 1, '2026-06-12T09:00:00Z')`,
    WORDS,
  );
  h.db = db;
  h.ids = 0;
  h.disk = createDisk(iosContainer('B81D7E44-NEW0-4A7F-8C21-ASHA00000406'));
}

const under = (folder: string): string[] => [...h.disk.files.keys()].filter((u) => u.startsWith(folder));
const pickerFiles = (): string[] => under(`${h.disk.caches}ImagePicker/`);
const bakedFiles = (): string[] => under(`${h.disk.caches}ScribePhoto/`);
const storedFiles = (): string[] => under(photosDirectory().uri);
const rowCount = (): number => h.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM entry_media')!.n;

/**
 * Starts an attach of a picture that needs the native re-encode (turned by Exif) and kills it at `step`. Resolves when
 * the step was reached, with the process "dead": the attach promise is abandoned and never settles.
 */
async function attachAndKillAt(step: Step): Promise<void> {
  const original = makeJpeg({ exif: true, orientation: 6 });
  const upright = makeJpeg({ seed: 3 });
  const uri = put(h.disk, pickerDestination('p1'), original); // the copy: the picker has put the original in Caches/ImagePicker
  const pending = new PendingPhoto(expoPickedFiles());
  await pending.set({ uri });
  if (step === 'copied') return; // killed right after the copy: nothing else ran

  let reached!: () => void;
  const reachedStep = new Promise<void>((resolve) => (reached = resolve));
  const die = async (): Promise<never> => {
    reached();
    return never();
  };

  const bakedReal = expoBakedFiles(() => 'b1');
  const baked: BakedFiles = {
    ...bakedReal,
    read: async (u) => (step === 'reencoded' ? die() : bakedReal.read(u)),
  };
  const native = {
    async reencodeUpright(_source: string, destination: string): Promise<string> {
      if (step === 'reencode-writing') {
        put(h.disk, destination, upright.slice(0, 9)); // the native side had started writing
        return die();
      }
      put(h.disk, destination, upright);
      return destination;
    },
  };
  const photoReal = expoPhotoFiles();
  const photoFiles: PhotoFiles = {
    ...photoReal,
    async write(path, bytes) {
      if (step === 'store-half-written') {
        await photoReal.write(path, bytes.slice(0, 7));
        return die();
      }
      await photoReal.write(path, bytes);
      if (step === 'stored-no-row') return die();
    },
  };
  const pickedReal = expoPickedFiles();
  const pickedPort: PickedFiles = {
    ...pickedReal,
    remove: async (u) => (step === 'stored-before-original-removed' ? die() : pickedReal.remove(u)),
  };
  // PendingPhoto holds its own port; build the one that dies at the last step in its place.
  const attach = step === 'stored-before-original-removed' ? new PendingPhoto(pickedPort) : pending;
  if (attach !== pending) await attach.set({ uri });
  const deps: PhotoDeps = {
    store: entryMediaStore(h.db),
    files: photoFiles,
    newId: () => `m${++h.ids}`,
    now: () => new Date('2026-11-11T00:00:00.000Z'),
    orientation: createOrientationBaker(native, baked),
    sha256: async () => 'ab',
  };
  void attach.commit(deps, { entryId: 'e1', finalText: WORDS }); // never awaited: the process is gone
  await reachedStep;
}

/** The app opens again. The photo sweep starts from the launch sweep and is not awaited by it, so wait for its effect. */
async function launchAgain(done: () => void): Promise<void> {
  vi.resetModules();
  const { runLaunchSweep } = await import('../src/lib/capture/sweep');
  await runLaunchSweep();
  await vi.waitFor(done, { timeout: 8000, interval: 20 });
}

vi.setConfig({ testTimeout: 20_000 }); // a loaded runner imports the launch sweep slowly

describe('[NX-39-R53][C7] a kill at any step of attaching a picture leaves no temporary file after the next launch', () => {
  beforeEach(phone);

  it('[NX-39-R53] killed right after the copy: the located original is in Caches/ImagePicker, then gone, and no row exists', async () => {
    await attachAndKillAt('copied');
    expect(pickerFiles().length).toBe(1);
    await launchAgain(() => expect(pickerFiles()).toEqual([]));
    expect([bakedFiles(), storedFiles(), rowCount()]).toEqual([[], [], 0]);
  });

  it('[NX-39-R53] killed while the native re-encode is writing: a half-written file in Caches/ScribePhoto and the original are both gone', async () => {
    await attachAndKillAt('reencode-writing');
    expect([pickerFiles().length, bakedFiles().length]).toEqual([1, 1]);
    await launchAgain(() => expect([pickerFiles(), bakedFiles()]).toEqual([[], []]));
    expect([storedFiles(), rowCount()]).toEqual([[], 0]);
  });

  it('[NX-39-R53] killed after the re-encode wrote, before it was read and removed: the upright copy and the original are both gone', async () => {
    await attachAndKillAt('reencoded');
    expect([pickerFiles().length, bakedFiles().length]).toEqual([1, 1]);
    await launchAgain(() => expect([pickerFiles(), bakedFiles()]).toEqual([[], []]));
    expect([storedFiles(), rowCount()]).toEqual([[], 0]);
  });

  it('[NX-39-R53] killed half way through the stored copy: the half-written file in the photos folder is removed and no row exists', async () => {
    await attachAndKillAt('store-half-written');
    expect(storedFiles().length).toBe(1);
    await launchAgain(() => expect([pickerFiles(), bakedFiles(), storedFiles()]).toEqual([[], [], []]));
    expect(rowCount()).toBe(0);
  });

  it('[NX-39-R53] killed after the stored copy was written, before its row: the file with no row is removed', async () => {
    await attachAndKillAt('stored-no-row');
    expect(storedFiles().length).toBe(1);
    expect(rowCount()).toBe(0);
    await launchAgain(() => expect([pickerFiles(), bakedFiles(), storedFiles()]).toEqual([[], [], []]));
    expect(rowCount()).toBe(0);
  });

  it('[NX-39-R53] killed after the picture was stored, before the original was removed: the original goes and the stored picture and its row stay', async () => {
    await attachAndKillAt('stored-before-original-removed');
    expect(pickerFiles().length).toBe(1);
    expect(storedFiles().length).toBe(1);
    await launchAgain(() => expect(pickerFiles()).toEqual([]));
    expect([bakedFiles(), storedFiles().length, rowCount()]).toEqual([[], 1, 1]);
  });
});
