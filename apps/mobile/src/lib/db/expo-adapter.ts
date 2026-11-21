/**
 * expo-sqlite implementation of SqlDb (synchronous API, works in Expo Go).
 * The only file besides store.ts that touches expo-sqlite.
 */
import type * as SQLite from 'expo-sqlite';
import type { SqlDb, SqlParam } from './sql';

export function expoSqlDb(d: SQLite.SQLiteDatabase): SqlDb {
  return {
    exec: (sql) => d.execSync(sql),
    run: (sql, ...params: SqlParam[]) => {
      d.runSync(sql, ...params);
    },
    get: <T>(sql: string, ...params: SqlParam[]) => d.getFirstSync<T>(sql, ...params) ?? null,
    all: <T>(sql: string, ...params: SqlParam[]) => d.getAllSync<T>(sql, ...params),
    transaction: (fn) => d.withTransactionSync(fn),
  };
}

/**
 * Durability first (TDD 01 3.2.1): WAL with synchronous=FULL, so a commit
 * survives power loss (WAL with NORMAL can drop the last commits). Both are
 * per-connection settings, so they run on every open, outside any transaction.
 *
 * secure_delete (BL-387, privacy Review A on #520): SQLite overwrites deleted
 * content with zeros instead of leaving it in free pages, so an erased letter's
 * words or a child's name are not left readable in `scribe.db`, which an iPhone
 * backup copies. The erase paths then truncate the WAL (store.ts
 * compactAfterErase), where the old page images would otherwise wait.
 */
export const OPEN_PRAGMAS = 'PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL; PRAGMA secure_delete = ON;';
