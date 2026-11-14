/**
 * The phone's files for Photo with a letter (expo-file-system 57). Two folders:
 * - `Application Support/photos/<media_id>.jpg` on iOS (security review T5: not in Documents, which a Files-app setting
 *   could expose; NOT excluded from the iPhone backup, NX-39 F9). The name is an opaque id, never an original name;
 *   no entry id is in it. (ADR 0028 D1 proposed Documents/photos; the data architect is told it changes.) A file is written whole and the row is made after it, so a kill between the
 *   two leaves a file with no row, which the launch sweep deletes (`sweepPhotos`).
 * - `Caches/ImagePicker`: where the picker package leaves a copy of the ORIGINAL, location and all, and never deletes
 *   it (security review C7). The app reads it once and removes it; `sweep()` empties the folder at launch.
 * Pure parts (`withinFolder`) are tested in Node; the rest runs against the expo-file-system stand-in.
 */
import { Directory, File, Paths } from 'expo-file-system';
import type { PhotoFiles, PickedFiles } from './types';

export const PHOTOS_FOLDER = 'photos';
export const PICKER_CACHE_FOLDER = 'ImagePicker';
/** Where the native re-encode leaves its temporary JPEG (modules/scribe-photo). Read once, removed at once, swept at launch. */
export const BAKED_CACHE_FOLDER = 'ScribePhoto';

/**
 * iOS: `<container>/Library/Application Support/photos`, beside Documents. Elsewhere (Android, later): the app's files
 * folder. Detected from the Documents uri so this file imports no React Native.
 */
export function photosDirectory(): Directory {
  const doc = Paths.document.uri;
  if (/\/Documents\/?$/.test(doc)) return new Directory(doc.replace(/Documents\/?$/, ''), 'Library', 'Application Support', PHOTOS_FOLDER);
  return new Directory(Paths.document, PHOTOS_FOLDER);
}
const photosDir = photosDirectory;
const pickerDir = (): Directory => new Directory(Paths.cache, PICKER_CACHE_FOLDER);
const bakedDir = (): Directory => new Directory(Paths.cache, BAKED_CACHE_FOLDER);

/** True when `uri` is a file directly inside the folder `folderUri`. The picker's remover touches nothing else. */
export function withinFolder(uri: string, folderUri: string): boolean {
  const base = folderUri.endsWith('/') ? folderUri : `${folderUri}/`;
  if (!uri.startsWith(base)) return false;
  const rest = uri.slice(base.length);
  return rest.length > 0 && !rest.includes('/') && !rest.includes('..') && !rest.includes('%2F') && !rest.includes('%2f');
}

/** Folder names only; a path with a separator or a dot-dot is refused, so a bad id can never leave the folder. */
const safeName = (path: string): boolean => /^[A-Za-z0-9._-]+$/.test(path) && !path.includes('..');

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

/** The native step's temporary output: only files directly inside Caches/ScribePhoto can be read or removed. */
export function expoBakedFiles(): { read(uri: string): Promise<Uint8Array>; remove(uri: string): Promise<void> } {
  return {
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
