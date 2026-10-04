/**
 * Opens the on-device database file with expo-sqlite and hands back a SqlDb.
 * The only module the store uses to reach expo-sqlite (with expo-adapter.ts,
 * which this wraps), so store.ts and the repositories stay engine-neutral and
 * run in Node tests (test/helpers/node-db.ts stands in for this module).
 */
import * as SQLite from 'expo-sqlite';
import { expoSqlDb, OPEN_PRAGMAS } from '../expo-adapter';
import type { SqlDb } from '../sql';

export interface OpenedDb {
  db: SqlDb;
  close: () => void;
}

export function openNativeDb(name: string): OpenedDb {
  const d = SQLite.openDatabaseSync(name);
  try {
    d.execSync(OPEN_PRAGMAS);
  } catch (e) {
    d.closeSync();
    throw e;
  }
  return { db: expoSqlDb(d), close: () => d.closeSync() };
}
