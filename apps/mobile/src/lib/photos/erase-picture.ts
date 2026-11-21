/**
 * Own file so the letter eraser (capture/erase.ts, reached from first run through sync) loads no picker, no native
 * module and no lock code: NS-39-R2 keeps first run's import graph free of anything that asks or authenticates.
 * `device.ts` re-exports it, so screens and tests still import it from there.
 */
import { localSqlDb } from '../store';
import { storedPhotoFile } from './files';

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
