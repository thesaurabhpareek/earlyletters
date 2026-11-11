/**
 * What an export carries for pictures (NS-01-R14, NX-39-R32): the stored stripped copy at `photos/<entry_id>/<media_id>.<ext>` (derived; the file on the phone is `<media_id>.jpg`)
 * and a count equal to the number of pictures. Never original bytes, and there is no "originals" option. Letters that
 * wait in Recently deleted are not in the export. This does not read the photos switch (NS-01-R19).
 *
 * Not done here: the export schema's `photo` field is typed `null` and `counts.photos` is 0 in lib/export; the bump
 * (ADR 0028 D2, data-architect) is a schema change and waits for its owner. See the PR.
 */
import { exportPhotoPath, type StoredPhoto } from './types';

export interface ExportedPhoto {
  entryId: string;
  /** Path inside the export. */
  path: string;
}

export function exportPhotos(stored: readonly StoredPhoto[], exportedEntryIds: ReadonlySet<string>): { files: ExportedPhoto[]; count: number } {
  const files = stored
    .filter((p) => !p.deletedAt && exportedEntryIds.has(p.entryId))
    .map((p) => ({ entryId: p.entryId, path: exportPhotoPath(p) }));
  return { files, count: files.length };
}
