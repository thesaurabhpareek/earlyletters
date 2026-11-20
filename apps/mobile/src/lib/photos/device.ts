/**
 * The phone's wiring for Photo with a letter: the entry_media store, the picture files, the hash, and the launch sweep.
 * Screens use this and nothing deeper. Nothing here reads the photos switch except `registerPhotoDevice`: the data
 * rights (the sweep, Erase now, Erase everything) work with the switch off (NS-01-R19).
 */
import * as Crypto from 'expo-crypto';
import type { ScribePhotoNative } from '../../../modules/scribe-photo';
import { localSqlDb, notifyStoreChanged, uuidv7 } from '../store';
import { createOrientationBaker } from './baker';
import { entryMediaStore } from './entry-media';
import { expoBakedFiles, expoPhotoFiles, expoPickedFiles, pickerDestination, storedPhotoFile } from './files';
import { photosBuildEnabled } from './flag';
import { sweepPhotos } from './housekeeping';
import { PendingPhoto } from './pending';
import { createPhotoPicker } from './picker';
import { registerPending, registerPhotoPicker } from './registry';
import type { PhotoDeps, PickedFiles } from './types';

const hex = (b: ArrayBuffer): string => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');

let cached: PhotoDeps | null = null;
let picked: PickedFiles | null = null;

export const pickedFilesPort = (): PickedFiles => (picked ??= expoPickedFiles());

/**
 * The native module (the picker and ImageIO), when this build has it. Loaded on first use, so a build or a test without
 * it is unaffected.
 */
function nativePhoto(): ScribePhotoNative | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require('../../../modules/scribe-photo') as typeof import('../../../modules/scribe-photo')).ScribePhoto;
  } catch {
    return null;
  }
}

/** The deps `commitPhoto`, `addPhotoToLetter` and the rest run against. The re-encode is absent without the native module. */
export function photoDeps(): PhotoDeps {
  cached ??= {
    store: entryMediaStore(localSqlDb(), notifyStoreChanged),
    files: expoPhotoFiles(),
    newId: () => uuidv7(),
    now: () => new Date(),
    orientation: createOrientationBaker(nativePhoto(), expoBakedFiles(() => uuidv7())),
    sha256: async (bytes) => hex(await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes as Uint8Array<ArrayBuffer>)),
  };
  return cached;
}

/**
 * Registers Apple's system picker (scribe-photo's pickOne) and the pending picture, only when the photos switch is on
 * in this build and the native module is in it. Otherwise (switch off, Expo Go, web, Android) nothing registers, so
 * Home draws no photo start.
 */
let registered = false;
export function registerPhotoDevice(): void {
  if (registered || !photosBuildEnabled()) return;
  registered = true;
  const native = nativePhoto();
  if (!native) return;
  registerPhotoPicker(createPhotoPicker(native, () => pickerDestination(uuidv7())));
  registerPending(new PendingPhoto(pickedFilesPort()));
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
  const rows = db.all<{ id: string }>('SELECT id FROM entry_media WHERE COALESCE(entry_id, draft_id) = ?', entryId);
  for (const r of rows) {
    const f = storedPhotoFile(r.id); // null: no stored picture can have that name
    if (f?.exists) f.delete();
    db.run('DELETE FROM entry_media WHERE id = ?', r.id);
  }
}
