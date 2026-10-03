/**
 * The smallest SQL surface the local store needs. Pure TypeScript, no React
 * Native: expo-sqlite implements it in the app (expo-adapter.ts) and
 * node:sqlite implements it in tests (test/helpers/node-db.ts), so the
 * migrator and the launch sweep run in vitest without a phone.
 */
export type SqlParam = string | number | null;

export interface SqlDb {
  /** Runs one or more statements with no parameters. */
  exec(sql: string): void;
  run(sql: string, ...params: SqlParam[]): void;
  get<T>(sql: string, ...params: SqlParam[]): T | null;
  all<T>(sql: string, ...params: SqlParam[]): T[];
  /** Runs `fn` in one transaction: all of it commits, or none of it does. */
  transaction(fn: () => void): void;
}
