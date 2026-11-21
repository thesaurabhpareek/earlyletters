/**
 * Launch step (CR-71 B5, B5-9): an upload token that an older build left in a backup state file's `upload_token`
 * column moves to the Keychain once, and the column is nulled. A data right like files.ts: it runs with
 * `capabilities.backup` off, because an install that once ran a build with the flag on may hold tokens. It does not
 * use the backup runtime; it opens each file with expo-sqlite, for one short read and one write.
 *
 * Order is the safety: the Keychain write comes first and must succeed; only then are the column and the marker
 * written, in one transaction. A failure anywhere leaves the rows as they were, and the next launch tries again (the
 * upload queue reads the Keychain first and falls back to the column, so a token is never lost in between). A second
 * run finds the marker and changes nothing. No schema change: the column stays, nullable.
 */
import * as SQLite from 'expo-sqlite';
import { listBackupFiles } from './files';
import { putTokens } from './token-vault';

export const TOKENS_IN_KEYCHAIN = 'tokens_in_keychain';
const OWNER = /^backup-([0-9a-f-]{36})\.db$/i;

export interface MigrateResult {
  moved: number;
  /** Files left for the next launch (Keychain or database refused). A count only. */
  failed: number;
}

async function migrateOne(name: string, profileId: string): Promise<number> {
  const db = SQLite.openDatabaseSync(name);
  try {
    const hasTable = (t: string) => (db.getFirstSync<{ n: number }>(`SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name = ?`, [t])?.n ?? 0) > 0;
    if (!hasTable('backup_jobs') || !hasTable('backup_meta')) return 0; // never opened by the app: nothing to move
    if (db.getFirstSync<{ value: string }>('SELECT value FROM backup_meta WHERE key = ?', [TOKENS_IN_KEYCHAIN])) return 0;
    const rows = db.getAllSync<{ entry_id: string; upload_token: string }>('SELECT entry_id, upload_token FROM backup_jobs WHERE upload_token IS NOT NULL');
    if (rows.length > 0) await putTokens(profileId, rows.map((r) => ({ entryId: r.entry_id, token: r.upload_token })));
    db.withTransactionSync(() => {
      db.runSync('UPDATE backup_jobs SET upload_token = NULL WHERE upload_token IS NOT NULL');
      db.runSync('INSERT INTO backup_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [TOKENS_IN_KEYCHAIN, '1']);
    });
    return rows.length;
  } finally {
    try {
      db.closeSync();
    } catch {
      // Closed already.
    }
  }
}

/** After the first frame, never awaited. Never throws. */
export async function moveBackupTokensToKeychain(): Promise<MigrateResult> {
  const out: MigrateResult = { moved: 0, failed: 0 };
  let names: string[];
  try {
    names = listBackupFiles().map((f) => f.name);
  } catch {
    return { moved: 0, failed: 1 };
  }
  for (const name of names) {
    const id = OWNER.exec(name)?.[1];
    if (!id) continue; // a sidecar
    try {
      out.moved += await migrateOne(name, id);
    } catch {
      out.failed += 1;
    }
  }
  return out;
}
