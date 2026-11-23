/**
 * The phone's files for Photo with a letter (expo-file-system 57). Three folders:
 * - `Library/Application Support/photos/<media_id>.jpg` on iOS (security review T5: not in Documents, which a Files-app
 *   setting could expose; NOT excluded from the iPhone backup, NX-39 F9; ADR 0028 D1 as accepted in CR-62). The name
 *   is an opaque id, never an original name; no entry id is in it, and only that shape is ever written or removed. A
 *   file is written whole and the row is made after it, so a kill between the two leaves a file with no row, which the
 *   launch sweep deletes (`sweepPhotos`).
 * - `Caches/ImagePicker`: where scribe-photo's picker copies the ORIGINAL the parent picked, location and all (security
 *   review C7). The app reads it once and removes it; `sweep()` empties the folder at launch.
 * - `Caches/ScribePhoto`: the native re-encode's temporary JPEG, read once and removed at once, swept at launch.
 * Both temporary files get a name built here, so the file JavaScript reads is the one the native side wrote.
 * Pure parts (`withinFolder`) are tested in Node; the rest runs against the expo-file-system stand-in.
 */
import { Directory, File, Paths } from 'expo-file-system';
import type { BakedFiles } from './baker';
import { isStoredName, photoPath, type PhotoFiles, type PickedFiles } from './types';

export const PHOTOS_FOLDER = 'photos';
export const PICKER_CACHE_FOLDER = 'ImagePicker';
/** Where the native re-encode leaves its temporary JPEG (modules/scribe-photo). Read once, removed at once, swept at launch. */
export const BAKED_CACHE_FOLDER = 'ScribePhoto';

/**
 * iOS: `<container>/Library/Application Support/photos`, beside Documents. Android (later): `<files>/photos`. Detected
 * from the Documents uri so this file imports no React Native. Any other layout fails closed: no picture is ever put in
 * Documents or anywhere else unknown (review N10).
 */
export function photosDirectory(): Directory {
  const doc = Paths.document.uri;
  if (/\/Documents\/?$/.test(doc)) return new Directory(doc.replace(/Documents\/?$/, ''), 'Library', 'Application Support', PHOTOS_FOLDER);
  if (/\/files\/?$/.test(doc)) return new Directory(Paths.document, PHOTOS_FOLDER);
  throw new Error('photos_folder_unknown');
}
const photosDir = photosDirectory;
const pickerDir = (): Directory => new Directory(Paths.cache, PICKER_CACHE_FOLDER);
const bakedDir = (): Directory => new Directory(Paths.cache, BAKED_CACHE_FOLDER);

/** A plain file name: letters, digits and dashes, one dot, a short extension. No separator, no `.` or `..`. */
const PLAIN_NAME = /^[0-9A-Za-z-]{1,64}\.[0-9A-Za-z]{1,8}$/;

/**
 * True when `uri` is a plain file directly inside the folder `folderUri`, judged on the decoded name, so `%2E%2E`,
 * `.%2E` or an encoded separator cannot reach the parent (review N5). The temporary-file readers and removers touch
 * nothing else.
 */
export function withinFolder(uri: string, folderUri: string): boolean {
  const base = folderUri.endsWith('/') ? folderUri : `${folderUri}/`;
  if (!uri.startsWith(base)) return false;
  let rest: string;
  try {
    rest = decodeURIComponent(uri.slice(base.length));
  } catch {
    return false;
  }
  return PLAIN_NAME.test(rest);
}

/** Only the stored shape; `.`, `..`, `.jpg`, a separator or another extension is refused, so no name reaches the folder itself (review M1). */
const safeName = isStoredName;

/**
 * The file of the stored picture `mediaId`, through the same guard as write and remove; null when the id cannot make a
 * stored name, so no such file can exist. Every caller outside this port that touches a stored picture uses this
 * (review N3 on #841).
 */
export function storedPhotoFile(mediaId: string): File | null {
  const name = photoPath({ mediaId, ext: 'jpg' });
  return safeName(name) ? new File(photosDir(), name) : null;
}

/** A new name for a temporary file; the id is the caller's (a UUIDv7 on the phone). */
function freshName(id: string, ext: string): string {
  const name = `${id}.${ext}`;
  if (!PLAIN_NAME.test(name)) throw new Error('photo_temp_name_refused');
  return name;
}

/** Where scribe-photo's picker copies the next picked original: a new file in Caches/ImagePicker. */
export const pickerDestination = (id: string): string => new File(pickerDir(), freshName(id, 'img')).uri;

export function expoPhotoFiles(): PhotoFiles {
  return {
    async write(path, bytes) {
      if (!safeName(path)) throw new Error('photo_path_refused');
      const dir = photosDir();
      dir.create({ intermediates: true, idempotent: true });
      const file = new File(dir, path);
      file.create({ overwrite: true });
      file.write(bytes);
    },
    async remove(path) {
      if (!safeName(path)) return;
      const file = new File(photosDir(), path);
      if (file.exists) file.delete();
    },
    async list() {
      const dir = photosDir();
      if (!dir.exists) return [];
      return dir.list().flatMap((f) => (f instanceof File ? [f.name] : []));
    },
    async freeBytes() {
      return Paths.availableDiskSpace;
    },
  };
}

export function expoPickedFiles(): PickedFiles {
  return {
    async read(uri) {
      if (!withinFolder(uri, pickerDir().uri)) throw new Error('picked_file_outside_picker_folder');
      return await new File(uri).bytes();
    },
    async remove(uri) {
      try {
        if (!withinFolder(uri, pickerDir().uri)) return;
        const file = new File(uri);
        if (file.exists) file.delete();
      } catch {
        // Already gone, or not removable now: the launch sweep tries again.
      }
    },
    async sweep() {
      for (const dir of [pickerDir(), bakedDir()]) {
        try {
          if (!dir.exists) continue;
          for (const f of dir.list()) {
            try {
              f.delete();
            } catch {
              // one stubborn file does not stop the rest
            }
          }
        } catch {
          // an unreadable folder is retried at the next launch
        }
      }
    },
  };
}

/** The native step's files: it reads only a picked original, and writes only a new name in Caches/ScribePhoto. */
export function expoBakedFiles(newId: () => string): BakedFiles {
  return {
    isPicked: (uri) => withinFolder(uri, pickerDir().uri),
    destination: () => new File(bakedDir(), freshName(newId(), 'jpg')).uri,
    async read(uri) {
      if (!withinFolder(uri, bakedDir().uri)) throw new Error('baked_file_outside_folder');
      return await new File(uri).bytes();
    },
    async remove(uri) {
      try {
        if (!withinFolder(uri, bakedDir().uri)) return;
        const file = new File(uri);
        if (file.exists) file.delete();
      } catch {
        // the launch sweep removes it
      }
    },
  };
}
