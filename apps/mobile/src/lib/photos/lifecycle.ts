/**
 * Delete, restore, purge and erase treat a letter and its picture as one (NS-01-R16, NX-39-R31). None of these reads
 * the photos switch: the data rights work with the switch off (NS-01-R19).
 */
import { photoPath, type PhotoDeps } from './types';

// There is no hold or restore step for a picture: its row is hidden while its letter's `deleted_at` is set, by join
// (ADR 0028 D1), so a delete and a restore of the letter are a delete and a restore of the picture with no write here.

/** The letter is purged (or a draft is let go): the file and the row go in the same step. */
export async function purgePhotoWithLetter(deps: PhotoDeps, entryId: string): Promise<void> {
  const p = deps.store.get(entryId);
  if (!p) return;
  await deps.files.remove(photoPath(p));
  deps.store.remove(entryId);
}

/** Erase everything: every picture file and row, and anything left in the folder. Safe to repeat after a kill. */
export async function wipeAllPhotos(deps: PhotoDeps): Promise<void> {
  for (const path of await deps.files.list()) await deps.files.remove(path);
  for (const p of deps.store.all()) deps.store.remove(p.entryId);
}
