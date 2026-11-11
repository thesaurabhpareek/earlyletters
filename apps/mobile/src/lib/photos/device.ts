/**
 * The phone's wiring for Photo with a letter: the entry_media store, the picture files, the hash, and the launch sweep.
 * Screens use this and nothing deeper. Nothing here reads the photos switch except `registerPhotoDevice`: the data
 * rights (the sweep, Erase now, Erase everything) work with the switch off (NS-01-R19).
 */
import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { localSqlDb, notifyStoreChanged, uuidv7 } from '../store';
import { entryMediaStore } from './entry-media';
import { expoPhotoFiles, expoPickedFiles, PHOTOS_FOLDER } from './files';
import { photosBuildEnabled } from './flag';
import { sweepPhotos } from './housekeeping';
import { PendingPhoto } from './pending';
import { registerPending, registerPhotoPicker } from './registry';
import { photoPath, type PhotoDeps, type PickedFiles, type StoredPhoto } from './types';

const hex = (b: ArrayBuffer): string => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');

let cached: PhotoDeps | null = null;
let picked: PickedFiles | null = null;

export const pickedFilesPort = (): PickedFiles => (picked ??= expoPickedFiles());

/** The deps `commitPhoto`, `addPhotoToLetter` and the rest run against. No native re-encode is registered yet. */
export function photoDeps(): PhotoDeps {
  cached ??= {
    store: entryMediaStore(localSqlDb(), notifyStoreChanged),
    files: expoPhotoFiles(),
    newId: () => uuidv7(),
    now: () => new Date(),
    sha256: async (bytes) => hex(await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes as Uint8Array<ArrayBuffer>)),
  };
  return cached;
}

/** Where a stored picture can be drawn from. */
export const photoUri = (p: Pick<StoredPhoto, 'mediaId' | 'ext'>): string => new File(new Directory(Paths.document, PHOTOS_FOLDER), photoPath(p)).uri;

/**
 * Registers Apple's system picker, only when the photos switch is on in this build. The picker module is required here
 * and nowhere else, so a build with the switch off never evaluates it (it is still linked; see the PR).
 */
let registered = false;
export function registerPhotoDevice(): void {
  if (registered || !photosBuildEnabled()) return;
  registered = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createPhotoPicker } = require('./picker') as typeof import('./picker');
    registerPhotoPicker(createPhotoPicker());
    registerPending(new PendingPhoto(pickedFilesPort()));
  } catch {
    // The native picker is not in this build (Expo Go, web): Home draws no photo start.
  }
}

/** Launch: empties Caches/ImagePicker, removes strays, finishes interrupted purges. Never awaited by launch. */
export function sweepPhotosAtLaunch(): Promise<void> {
  return sweepPhotos(localSqlDb(), expoPhotoFiles(), pickedFilesPort()).then(
    () => undefined,
    () => undefined, // retried at the next launch
  );
}

/**
 * Erase now and the 30 day purge: the picture file first, then its row (called from the letter's audio eraser, which
 * the store runs before it removes the letter). Throws when a file exists and cannot be removed, so the letter stays
 * on the shelf for a retry, as a recording does. Synchronous, like the audio eraser.
 */
export function erasePictureOf(entryId: string): void {
  const db = localSqlDb();
  const rows = db.all<{ id: string }>('SELECT id FROM entry_media WHERE entry_id = ?', entryId);
  for (const r of rows) {
    const f = new File(new Directory(Paths.document, PHOTOS_FOLDER), photoPath({ mediaId: r.id, ext: 'jpg' }));
    if (f.exists) f.delete();
    db.run('DELETE FROM entry_media WHERE id = ?', r.id);
  }
}
