/**
 * Delete, restore, purge and erase treat a letter and its picture as one (NS-01-R16, NX-39-R31). None of these reads
 * the photos switch: the data rights work with the switch off (NS-01-R19).
 */
import { photoPath, type PhotoDeps } from './types';

/** The letter went to Recently deleted: its picture is hidden with it, and the file waits for the restore window. */
export function holdPhotoWithLetter(deps: PhotoDeps, entryId: string): void {
  const p = deps.store.get(entryId);
  if (p && !p.deletedAt) deps.store.put({ ...p, deletedAt: deps.now().toISOString() });
}

/** Restore from Recently deleted, inside the window: the letter and its picture come back together. */
export function restorePhotoWithLetter(deps: PhotoDeps, entryId: string): void {
  const p = deps.store.get(entryId);
  if (p?.deletedAt) deps.store.put({ ...p, deletedAt: null });
}

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
