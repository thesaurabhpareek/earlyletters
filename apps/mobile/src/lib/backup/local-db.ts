/**
 * Backup's own state on the phone: the upload jobs, the restore items and a
 * few markers, in a separate SQLite file (`backup.db`). It is a cache of what
 * can always be rebuilt from the letters on this phone and the server's
 * `audio_blobs` rows (`reconcileWithServer`), so it needs no change to the
 * main database that S03 owns (08-delivery section 4). The PR asks S03 whether
 * to fold it into the main schema as v11 later.
 *
 * Durability: every state change is one statement or one transaction, so a
 * kill leaves a job in exactly one state, and every state can be resumed
 * (queue.ts). Pure: works on any SqlDb (expo-sqlite in the app, node:sqlite
 * in tests).
 */
import type { SqlDb } from '../db/sql';
import type { MetaStore } from './keys';

export const BACKUP_DB_FILE = 'backup.db';
export const BACKUP_DB_VERSION = 1;

export type JobState = 'queued' | 'sealed' | 'begun' | 'uploading' | 'uploaded' | 'confirmed' | 'blocked';
export type JobSource = 'letter' | 'held';

export interface UploadJob {
  entryId: string;
  childId: string;
  source: JobSource;
  audioUri: string;
  audioSha256: string;
  audioBytes: number;
  capturedAt: string;
  state: JobState;
  keyVersion: number | null;
  /** base64 of the 60-byte wrapped file key; with the nonce prefix it rebuilds the same ciphertext after a kill. */
  wrappedFileKey: string | null;
  noncePrefix: string | null;
  tmpUri: string | null;
  cipherBytes: number | null;
  cipherSha256: string | null;
  objectPath: string | null;
  uploadUrl: string | null;
  uploadToken: string | null;
  uploadOffset: number;
  attempts: number;
  nextAttemptAt: number | null;
  /** A code, never content (LEGAL-REQ-014). */
  lastError: string | null;
  confirmedAt: string | null;
  updatedAt: string;
}

export type RestoreItemState = 'pending' | 'done' | 'kept_local' | 'failed';

export interface RestoreItem {
  entryId: string;
  state: RestoreItemState;
  attempts: number;
  updatedAt: string;
}

const SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS backup_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS backup_jobs (
  entry_id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('letter', 'held')),
  audio_uri TEXT NOT NULL,
  audio_sha256 TEXT NOT NULL,
  audio_bytes INTEGER NOT NULL,
  captured_at TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('queued', 'sealed', 'begun', 'uploading', 'uploaded', 'confirmed', 'blocked')),
  key_version INTEGER,
  wrapped_file_key TEXT,
  nonce_prefix TEXT,
  tmp_uri TEXT,
  cipher_bytes INTEGER,
  cipher_sha256 TEXT,
  object_path TEXT,
  upload_url TEXT,
  upload_token TEXT,
  upload_offset INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER,
  last_error TEXT,
  confirmed_at TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS backup_jobs_order ON backup_jobs (state, captured_at);
CREATE TABLE IF NOT EXISTS backup_restores (
  entry_id TEXT PRIMARY KEY,
  state TEXT NOT NULL CHECK (state IN ('pending', 'done', 'kept_local', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
`;

interface JobRow {
  entry_id: string;
  child_id: string;
  source: JobSource;
  audio_uri: string;
  audio_sha256: string;
  audio_bytes: number;
  captured_at: string;
  state: JobState;
  key_version: number | null;
  wrapped_file_key: string | null;
  nonce_prefix: string | null;
  tmp_uri: string | null;
  cipher_bytes: number | null;
  cipher_sha256: string | null;
  object_path: string | null;
  upload_url: string | null;
  upload_token: string | null;
  upload_offset: number;
  attempts: number;
  next_attempt_at: number | null;
  last_error: string | null;
  confirmed_at: string | null;
  updated_at: string;
}

const fromRow = (r: JobRow): UploadJob => ({
  entryId: r.entry_id,
  childId: r.child_id,
  source: r.source,
  audioUri: r.audio_uri,
  audioSha256: r.audio_sha256,
  audioBytes: r.audio_bytes,
  capturedAt: r.captured_at,
  state: r.state,
  keyVersion: r.key_version,
  wrappedFileKey: r.wrapped_file_key,
  noncePrefix: r.nonce_prefix,
  tmpUri: r.tmp_uri,
  cipherBytes: r.cipher_bytes,
  cipherSha256: r.cipher_sha256,
  objectPath: r.object_path,
  uploadUrl: r.upload_url,
  uploadToken: r.upload_token,
  uploadOffset: r.upload_offset,
  attempts: r.attempts,
  nextAttemptAt: r.next_attempt_at,
  lastError: r.last_error,
  confirmedAt: r.confirmed_at,
  updatedAt: r.updated_at,
});

const COLUMN: Record<keyof UploadJob, string> = {
  entryId: 'entry_id',
  childId: 'child_id',
  source: 'source',
  audioUri: 'audio_uri',
  audioSha256: 'audio_sha256',
  audioBytes: 'audio_bytes',
  capturedAt: 'captured_at',
  state: 'state',
  keyVersion: 'key_version',
  wrappedFileKey: 'wrapped_file_key',
  noncePrefix: 'nonce_prefix',
  tmpUri: 'tmp_uri',
  cipherBytes: 'cipher_bytes',
  cipherSha256: 'cipher_sha256',
  objectPath: 'object_path',
  uploadUrl: 'upload_url',
  uploadToken: 'upload_token',
  uploadOffset: 'upload_offset',
  attempts: 'attempts',
  nextAttemptAt: 'next_attempt_at',
  lastError: 'last_error',
  confirmedAt: 'confirmed_at',
  updatedAt: 'updated_at',
};

export type NewJob = Pick<UploadJob, 'entryId' | 'childId' | 'source' | 'audioUri' | 'audioSha256' | 'audioBytes' | 'capturedAt'>;

export function openBackupDb(db: SqlDb, now: () => string) {
  const version = db.get<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0;
  if (version > BACKUP_DB_VERSION) throw new Error('backup_db_newer');
  if (version < BACKUP_DB_VERSION) {
    db.transaction(() => {
      db.exec(SCHEMA_V1);
      db.exec(`PRAGMA user_version = ${BACKUP_DB_VERSION}`);
    });
  }

  const meta: MetaStore = {
    getMeta: (key) => db.get<{ value: string }>('SELECT value FROM backup_meta WHERE key = ?', key)?.value ?? null,
    setMeta: (key, value) => db.run('INSERT INTO backup_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, value),
    deleteMeta: (key) => db.run('DELETE FROM backup_meta WHERE key = ?', key),
  };

  return {
    db,
    ...meta,

    job(entryId: string): UploadJob | null {
      const r = db.get<JobRow>('SELECT * FROM backup_jobs WHERE entry_id = ?', entryId);
      return r ? fromRow(r) : null;
    },

    jobs(): UploadJob[] {
      return db.all<JobRow>('SELECT * FROM backup_jobs ORDER BY captured_at, entry_id').map(fromRow);
    },

    insertJob(j: NewJob): void {
      db.run(
        `INSERT INTO backup_jobs (entry_id, child_id, source, audio_uri, audio_sha256, audio_bytes, captured_at, state, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'queued', ?) ON CONFLICT(entry_id) DO NOTHING`,
        j.entryId,
        j.childId,
        j.source,
        j.audioUri,
        j.audioSha256,
        j.audioBytes,
        j.capturedAt,
        now(),
      );
    },

    /** One statement: a kill leaves the old row or the new one, never half. */
    updateJob(entryId: string, patch: Partial<Omit<UploadJob, 'entryId' | 'updatedAt'>>): void {
      const keys = Object.keys(patch) as (keyof typeof patch)[];
      if (keys.length === 0) return;
      const sets = keys.map((k) => `${COLUMN[k]} = ?`).join(', ');
      const values = keys.map((k) => {
        const v = patch[k];
        return v === undefined ? null : (v as string | number | null);
      });
      db.run(`UPDATE backup_jobs SET ${sets}, updated_at = ? WHERE entry_id = ?`, ...values, now(), entryId);
    },

    deleteJob(entryId: string): void {
      db.run('DELETE FROM backup_jobs WHERE entry_id = ?', entryId);
    },

    restoreItem(entryId: string): RestoreItem | null {
      const r = db.get<{ entry_id: string; state: RestoreItemState; attempts: number; updated_at: string }>(
        'SELECT * FROM backup_restores WHERE entry_id = ?',
        entryId,
      );
      return r ? { entryId: r.entry_id, state: r.state, attempts: r.attempts, updatedAt: r.updated_at } : null;
    },

    setRestoreItem(entryId: string, state: RestoreItemState, attempts: number): void {
      db.run(
        `INSERT INTO backup_restores (entry_id, state, attempts, updated_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(entry_id) DO UPDATE SET state = excluded.state, attempts = excluded.attempts, updated_at = excluded.updated_at`,
        entryId,
        state,
        attempts,
        now(),
      );
    },

    restoreCounts(): Record<RestoreItemState, number> {
      const out: Record<RestoreItemState, number> = { pending: 0, done: 0, kept_local: 0, failed: 0 };
      for (const r of db.all<{ state: RestoreItemState; n: number }>('SELECT state, COUNT(*) AS n FROM backup_restores GROUP BY state')) out[r.state] = r.n;
      return out;
    },

    /** A different account signed in on this phone: nothing here belongs to it. */
    resetForProfile(profileId: string): void {
      if (meta.getMeta('profileId') === profileId) return;
      db.transaction(() => {
        db.exec('DELETE FROM backup_jobs; DELETE FROM backup_restores; DELETE FROM backup_meta;');
        meta.setMeta('profileId', profileId);
      });
    },
  };
}

export type BackupDb = ReturnType<typeof openBackupDb>;
