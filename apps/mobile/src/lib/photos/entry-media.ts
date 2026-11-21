/**
 * The phone table behind the photo store (ADR 0028 D1, local migration 11). One row per picture, owned by a kept letter
 * (`entry_id`) or by a draft until Keep (`draft_id`); a draft keeps its id when it becomes the letter, so Keep only
 * moves the row to the other column (store.saveLetterFromDraft, same transaction). `deletedAt` is DERIVED from the
 * letter's own `entries.deleted_at` by a join and is never written. Nothing here is queued for sync, and pull never
 * touches this table (NS-01-R15).
 */
import type { SqlDb } from '../db/sql';
import type { PhotoStore, StoredPhoto } from './types';

interface Row {
  id: string;
  owner: string;
  bytes: number;
  sha256: string;
  width: number | null;
  height: number | null;
  photo_text: string | null;
  place: string | null;
  added_at: string;
  deleted_at: string | null;
}

const SELECT = `SELECT m.id, COALESCE(m.entry_id, m.draft_id) AS owner, m.bytes, m.sha256, m.width, m.height, m.photo_text, m.place, m.added_at, e.deleted_at
                  FROM entry_media m LEFT JOIN entries e ON e.id = m.entry_id`;

const fromRow = (r: Row): StoredPhoto => ({
  entryId: r.owner,
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
    get: (ownerId) => {
      const r = db.get<Row>(`${SELECT} WHERE COALESCE(m.entry_id, m.draft_id) = ?`, ownerId);
      return r ? fromRow(r) : null;
    },
    put: (p) => {
      // One picture per owner: the new row replaces the old one in one transaction.
      db.transaction(() => {
        const isLetter = db.get<{ n: number }>('SELECT 1 AS n FROM entries WHERE id = ?', p.entryId) !== null;
        db.run('DELETE FROM entry_media WHERE COALESCE(entry_id, draft_id) = ?', p.entryId);
        db.run(
          `INSERT INTO entry_media (id, entry_id, draft_id, kind, ext, bytes, sha256, width, height, photo_text, place, added_at)
           VALUES (?, ?, ?, 'photo', 'jpg', ?, ?, ?, ?, ?, ?, ?)`,
          p.mediaId, isLetter ? p.entryId : null, isLetter ? null : p.entryId, p.bytes, p.sha256, p.width, p.height, p.text, p.place, p.addedAt,
        );
      });
      onChange();
    },
    remove: (ownerId) => {
      db.run('DELETE FROM entry_media WHERE COALESCE(entry_id, draft_id) = ?', ownerId);
      onChange();
    },
    all: () => db.all<Row>(`${SELECT} WHERE m.entry_id IS NOT NULL`).map(fromRow),
  };
}
