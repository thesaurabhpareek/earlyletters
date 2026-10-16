/**
 * What backup reads from, and the one thing it writes to, the main on-device
 * database (S03's schema, unchanged here). Pure SQL over SqlDb, so Node tests
 * run it against the app's real migrations.
 *
 * Reads: my recordings on this phone (saved letters and drafts with a closed,
 * hashed take). Write: `attachRestoredAudio`, which gives a letter that has
 * no recording on this phone the file restore brought back. That write is a
 * request to S03 (PR "Requests to other owners"): it belongs in
 * `db/repos/entries.ts` next to `rebaseAudioUri`, with the same rule that a
 * hash already set is never changed. Until S03 adopts it, it lives here,
 * behind `capabilities.backup`.
 */
import type { SqlDb } from '../db/sql';
import type { BackupSource, BackupSourceItem } from './queue';
import type { LocalLetter, RestoreLocal } from './restore';

interface LetterRow {
  id: string;
  child_id: string | null;
  audio_uri: string;
  audio_sha256: string | null;
  audio_bytes: number | null;
  captured_at: string;
  server_version: string | null;
}

interface DraftRow {
  id: string;
  child_id: string;
  audio_uri: string;
  audio_sha256: string | null;
  audio_bytes: number | null;
  created_at: string;
}

export interface SourceOptions {
  db: () => SqlDb;
  /** The signed-in person. Letters with no author were written on this phone before sign-in: theirs. */
  profileId: string;
  /**
   * Whether the server has a `held_drafts` row for this draft id. Held drafts
   * travel through S03's held-draft op (WP-F14-22, local v8), not built yet.
   * Without it (the app today) held drafts are not listed at all: a draft that
   * could never upload must not sit in the queue as a recording "waiting"
   * (F08-U31). They join once S03's op exists and passes this in.
   */
  heldOnServer?: (draftId: string) => boolean;
}

/** Saved letters and held drafts of mine with a recording on this phone, oldest first. */
export function backupSource(o: SourceOptions): BackupSource {
  return {
    list(): BackupSourceItem[] {
      const db = o.db();
      const letters = db.all<LetterRow>(
        `SELECT id, child_id, audio_uri, audio_sha256, audio_bytes, captured_at, server_version FROM entries
         WHERE deleted_at IS NULL AND audio_uri IS NOT NULL AND child_id IS NOT NULL AND (author_id IS NULL OR author_id = ?)
         ORDER BY captured_at, id`,
        o.profileId,
      );
      const drafts = db.all<DraftRow>(
        `SELECT id, child_id, audio_uri, audio_sha256, audio_bytes, created_at FROM drafts
         WHERE state = 'ready' AND audio_uri IS NOT NULL ORDER BY created_at, id`,
      );
      const out: BackupSourceItem[] = letters.map((r) => ({
        entryId: r.id,
        childId: r.child_id!,
        source: 'letter',
        audioUri: r.audio_uri,
        audioSha256: r.audio_sha256,
        audioBytes: r.audio_bytes,
        capturedAt: r.captured_at,
        onServer: r.server_version !== null,
      }));
      const saved = new Set(out.map((i) => i.entryId));
      const heldOnServer = o.heldOnServer;
      if (!heldOnServer) return out;
      for (const r of drafts) {
        if (saved.has(r.id)) continue;
        out.push({
          entryId: r.id,
          childId: r.child_id,
          source: 'held',
          audioUri: r.audio_uri,
          audioSha256: r.audio_sha256,
          audioBytes: r.audio_bytes,
          capturedAt: r.created_at,
          onServer: heldOnServer(r.id),
        });
      }
      return out;
    },
  };
}

export interface RestoreLocalOptions {
  db: () => SqlDb;
  profileId: string;
  fileExists: (uri: string) => boolean;
  /** Re-render screens after a recording came back (store.notifyStoreChanged in the app). */
  changed?: () => void;
}

export function restoreLocal(o: RestoreLocalOptions): RestoreLocal {
  return {
    letter(entryId: string): LocalLetter | null {
      const r = o.db().get<{ id: string; author_id: string | null; deleted_at: string | null; audio_uri: string | null; audio_sha256: string | null }>(
        'SELECT id, author_id, deleted_at, audio_uri, audio_sha256 FROM entries WHERE id = ?',
        entryId,
      );
      return r ? { entryId: r.id, authorId: r.author_id, deleted: r.deleted_at !== null, audioUri: r.audio_uri, audioSha256: r.audio_sha256 } : null;
    },
    attachAudio(entryId, uri, sha256, bytes): boolean {
      const ok = attachRestoredAudio(o.db(), { entryId, uri, sha256, bytes, profileId: o.profileId, fileExists: o.fileExists });
      if (ok) o.changed?.();
      return ok;
    },
    clearRestoredHash(entryId, sha256): void {
      o.db().run('UPDATE entries SET audio_sha256 = NULL, audio_bytes = NULL WHERE id = ? AND audio_sha256 = ?', entryId, sha256);
    },
    anyMissing(): boolean {
      const rows = o.db().all<{ audio_uri: string | null }>(
        `SELECT audio_uri FROM entries WHERE deleted_at IS NULL AND kind = 'letter' AND capture_mode IN ('spoken', 'mixed')
         AND (author_id IS NULL OR author_id = ?)`,
        o.profileId,
      );
      return rows.some((r) => r.audio_uri === null || !o.fileExists(r.audio_uri));
    },
  };
}

/**
 * Points a live letter of mine at a restored recording. Refused when the
 * letter is someone else's or deleted, when it already has a file on this
 * phone, or when it carries a different hash. Sets the hash and size only
 * where they were empty (a letter that came by sync has neither).
 */
export function attachRestoredAudio(
  db: SqlDb,
  x: { entryId: string; uri: string; sha256: string; bytes: number; profileId: string; fileExists: (uri: string) => boolean },
): boolean {
  const r = db.get<{ audio_uri: string | null; audio_sha256: string | null; author_id: string | null; deleted_at: string | null }>(
    'SELECT audio_uri, audio_sha256, author_id, deleted_at FROM entries WHERE id = ?',
    x.entryId,
  );
  if (!r || r.deleted_at !== null) return false;
  if (r.author_id !== null && r.author_id !== x.profileId) return false;
  if (r.audio_sha256 !== null && r.audio_sha256 !== x.sha256) return false;
  if (r.audio_uri !== null && r.audio_uri !== x.uri && x.fileExists(r.audio_uri)) return false;
  db.run(
    `UPDATE entries SET audio_uri = ?, audio_sha256 = COALESCE(audio_sha256, ?), audio_bytes = COALESCE(audio_bytes, ?)
     WHERE id = ? AND deleted_at IS NULL AND (audio_sha256 IS NULL OR audio_sha256 = ?)`,
    x.uri,
    x.sha256,
    x.bytes,
    x.entryId,
    x.sha256,
  );
  return (db.get<{ n: number }>('SELECT changes() AS n')?.n ?? 0) > 0;
}
