/// <reference types="node" />
/** SqlDb over Node's built-in SQLite (node:sqlite), so migrations run against a real engine in CI. */
import { DatabaseSync } from 'node:sqlite';
import type { SqlDb, SqlParam } from '../../src/lib/db/sql';

export function nodeDb(path = ':memory:'): { db: SqlDb; close: () => void } {
  const d = new DatabaseSync(path);
  const db: SqlDb = {
    exec: (sql) => d.exec(sql),
    run: (sql, ...params: SqlParam[]) => {
      d.prepare(sql).run(...params);
    },
    get: <T>(sql: string, ...params: SqlParam[]) => (d.prepare(sql).get(...params) as T | undefined) ?? null,
    all: <T>(sql: string, ...params: SqlParam[]) => d.prepare(sql).all(...params) as T[],
    transaction: (fn) => {
      d.exec('BEGIN');
      try {
        fn();
        d.exec('COMMIT');
      } catch (e) {
        d.exec('ROLLBACK');
        throw e;
      }
    },
  };
  return { db, close: () => d.close() };
}
