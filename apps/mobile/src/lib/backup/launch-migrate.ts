/**
 * Settled step (CR-71 B5, B5-9): an upload token that an older build left in the SIGNED-IN account's backup state file
 * (`upload_token` column) moves to the Keychain once, and the column is nulled for the rows that moved. A data right
 * like files.ts: it runs with `capabilities.backup` off, because an install that once ran a build with the flag on may
 * hold tokens. It does not use the backup runtime.
 *
 * Run from the settled sweep (session-provider), after `deleteBackupFilesExcept`, so a signed-out or orphan account's
 * file is never opened and its tokens are pruned (`pruneBackupTokensExcept`). It opens an EXISTING file only (never
 * creates one), skips an account that signed out since (the tombstone), and opens through the same exclusion check as
 * the store (`openSecureBackupFile`).
 *
 * Order is the safety: the Keychain write comes first and must succeed; only then, in one transaction, are the moved
 * rows nulled and the marker written. A failure leaves the rows and the next settled run retries (the upload queue reads
 * the Keychain first and falls back to the column, so a token is never lost in between). A second run finds the marker
 * and changes nothing. No schema change. Nothing is logged and no error carries a token.
 */
import * as SQLite from 'expo-sqlite';
import { existingBackupFileFor, openSecureBackupFile } from './files';
import { pruneBackupTokensExcept, putTokens } from './token-vault';

export const TOKENS_IN_KEYCHAIN = 'tokens_in_keychain';

export interface MigrateResult {
  moved: number;
  /** 1 when the Keychain or the database refused (a count only). */
  failed: number;
}

type Row = { entry_id: string; upload_token: string };

async function migrateOne(name: string, profileId: string): Promise<number> {
  let handle: { db: SQLite.SQLiteDatabase; close: () => void } | null = null;
  const rows = openSecureBackupFile(
    name,
    (n) => {
      const db = SQLite.openDatabaseSync(n);
      handle = { db, close: () => db.closeSync() };
      return handle;
    },
    (o) => {
      const hasTable = (t: string) => (o.db.getFirstSync<{ n: number }>(`SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name = ?`, [t])?.n ?? 0) > 0;
      if (!hasTable('backup_jobs') || !hasTable('backup_meta')) return null; // never set up by the app: nothing to move
      if (o.db.getFirstSync<{ value: string }>('SELECT value FROM backup_meta WHERE key = ?', [TOKENS_IN_KEYCHAIN])) return null;
      return o.db.getAllSync<Row>('SELECT entry_id, upload_token FROM backup_jobs WHERE upload_token IS NOT NULL');
    },
  );
  const h = handle as { db: SQLite.SQLiteDatabase; close: () => void } | null;
  try {
    if (rows === null || !h) return 0;
    if (rows.length > 0) await putTokens(profileId, rows.map((r) => ({ entryId: r.entry_id, token: r.upload_token })));
    h.db.withTransactionSync(() => {
      // Only the rows that were moved: a token an upload wrote meanwhile is not touched.
      for (const r of rows) h.db.runSync('UPDATE backup_jobs SET upload_token = NULL WHERE entry_id = ? AND upload_token = ?', [r.entry_id, r.upload_token]);
      h.db.runSync('INSERT INTO backup_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [TOKENS_IN_KEYCHAIN, '1']);
    });
    return rows.length;
  } finally {
    try {
      h?.close();
    } catch {
      // Closed already.
    }
  }
}

/**
 * The settled step for the account signed in NOW (null: signed out). Tokens of every other account leave the Keychain;
 * the kept account's file, if it exists, is moved. After the first frame, never awaited. Never throws.
 */
export async function settleBackupTokens(keep: string | null): Promise<MigrateResult> {
  await pruneBackupTokensExcept(keep);
  if (!keep) return { moved: 0, failed: 0 };
  const name = existingBackupFileFor(keep);
  if (!name) return { moved: 0, failed: 0 };
  try {
    return { moved: await migrateOne(name, keep), failed: 0 };
  } catch {
    return { moved: 0, failed: 1 };
  }
}
