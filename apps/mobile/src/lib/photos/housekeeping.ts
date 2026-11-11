/**
 * Keeps the picture files and the entry_media rows in step (ADR 0028 D1, D5). Safe to repeat after any kill:
 * - the picker's temporary originals are removed (review C7, NX-39-R53);
 * - a file with no row is removed (a kill between the write and the row);
 * - a row whose letter is gone (purged) loses its file first, then the row;
 * - a row whose file is missing is removed, so the letter reads whole with no picture and no message (OQ-2).
 * It never reads the photos switch: the data rights work with the switch off (NS-01-R19). It never touches words.
 */
import type { SqlDb } from '../db/sql';
import { photoPath, type PhotoFiles, type PickedFiles } from './types';

export interface SweepCounts {
  orphanFiles: number;
  orphanRows: number;
  missingFileRows: number;
}

export async function sweepPhotos(db: SqlDb, files: PhotoFiles, picked: PickedFiles): Promise<SweepCounts> {
  const counts: SweepCounts = { orphanFiles: 0, orphanRows: 0, missingFileRows: 0 };
  await picked.sweep();
  let onDisk: string[];
  try {
    onDisk = await files.list();
  } catch {
    return counts; // an unreadable folder changes nothing this launch
  }
  const rows = db.all<{ id: string; ext: string; entry_id: string | null; draft_id: string | null; entry_exists: number; draft_exists: number }>(
    `SELECT m.id, m.ext, m.entry_id, m.draft_id,
            EXISTS (SELECT 1 FROM entries e WHERE e.id = m.entry_id) AS entry_exists,
            EXISTS (SELECT 1 FROM drafts d WHERE d.id = m.draft_id) AS draft_exists
       FROM entry_media m`,
  );
  const have = new Set(onDisk);
  const wanted = new Set<string>();
  for (const r of rows) {
    const name = photoPath({ mediaId: r.id, ext: 'jpg' });
    const ownerGone = r.entry_id !== null ? r.entry_exists === 0 : r.draft_exists === 0;
    if (ownerGone) {
      // purged letter or let-go draft: the file first, then the row
      try {
        await files.remove(name);
      } catch {
        continue; // keep the row so the next launch retries
      }
      db.run('DELETE FROM entry_media WHERE id = ?', r.id);
      have.delete(name);
      counts.orphanRows++;
    } else if (!have.has(name)) {
      db.run('DELETE FROM entry_media WHERE id = ?', r.id);
      counts.missingFileRows++;
    } else wanted.add(name);
  }
  for (const name of have) {
    if (wanted.has(name)) continue;
    try {
      await files.remove(name);
      counts.orphanFiles++;
    } catch {
      // retried at the next launch
    }
  }
  return counts;
}
