/**
 * The phone table behind the photo store (ADR 0028 D1, local migration 11). One row per kept picture. `deletedAt` is
 * DERIVED from the letter's own `entries.deleted_at` by a join and is never written, so a restored letter needs no
 * picture write. Nothing here is queued for sync, and pull never touches this table (NS-01-R15).
 */
import type { SqlDb } from '../db/sql';
import type { PhotoStore, StoredPhoto } from './types';

interface Row {
  id: string;
  entry_id: string;
  bytes: number;
  sha256: string;
  width: number | null;
  height: number | null;
  photo_text: string | null;
  place: string | null;
  added_at: string;
  deleted_at: string | null;
}

const SELECT = `SELECT m.id, m.entry_id, m.bytes, m.sha256, m.width, m.height, m.photo_text, m.place, m.added_at, e.deleted_at
                  FROM entry_media m LEFT JOIN entries e ON e.id = m.entry_id`;

const fromRow = (r: Row): StoredPhoto => ({
  entryId: r.entry_id,
  mediaId: r.id,
  ext: 'jpg',
  bytes: r.bytes,
  sha256: r.sha256,
  width: r.width,
  height: r.height,
  text: r.photo_text,
  place: r.place,
  addedAt: r.added_at,
  deletedAt: r.deleted_at,
});

export function entryMediaStore(db: SqlDb, onChange: () => void = () => {}): PhotoStore {
  return {
    get: (entryId) => {
      const r = db.get<Row>(`${SELECT} WHERE m.entry_id = ?`, entryId);
      return r ? fromRow(r) : null;
    },
    put: (p) => {
      // One picture per letter: the new row replaces the old one in one transaction.
      db.transaction(() => {
        db.run('DELETE FROM entry_media WHERE entry_id = ?', p.entryId);
        db.run(
          `INSERT INTO entry_media (id, entry_id, draft_id, kind, ext, bytes, sha256, width, height, photo_text, place, added_at)
           VALUES (?, ?, NULL, 'photo', 'jpg', ?, ?, ?, ?, ?, ?, ?)`,
          p.mediaId, p.entryId, p.bytes, p.sha256, p.width, p.height, p.text, p.place, p.addedAt,
        );
      });
      onChange();
    },
    remove: (entryId) => {
      db.run('DELETE FROM entry_media WHERE entry_id = ?', entryId);
      onChange();
    },
    all: () => db.all<Row>(SELECT).map(fromRow),
  };
}
