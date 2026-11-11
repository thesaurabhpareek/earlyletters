/**
 * The phone's files for Photo with a letter (expo-file-system 57). Two folders:
 * - `Documents/photos/<media_id>.jpg`: the stripped copy that stays (ADR 0028 D1). The name is an opaque id, never an
 *   original name; no entry id is in it. A file is written whole and the row is made after it, so a kill between the
 *   two leaves a file with no row, which the launch sweep deletes (`sweepPhotos`).
 * - `Caches/ImagePicker`: where the picker package leaves a copy of the ORIGINAL, location and all, and never deletes
 *   it (security review C7). The app reads it once and removes it; `sweep()` empties the folder at launch.
 * Pure parts (`withinFolder`) are tested in Node; the rest runs against the expo-file-system stand-in.
 */
import { Directory, File, Paths } from 'expo-file-system';
import type { PhotoFiles, PickedFiles } from './types';

export const PHOTOS_FOLDER = 'photos';
export const PICKER_CACHE_FOLDER = 'ImagePicker';

const photosDir = (): Directory => new Directory(Paths.document, PHOTOS_FOLDER);
const pickerDir = (): Directory => new Directory(Paths.cache, PICKER_CACHE_FOLDER);

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
      try {
        const dir = pickerDir();
        if (!dir.exists) return;
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
    },
  };
}
