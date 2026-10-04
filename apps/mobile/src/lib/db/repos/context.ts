/**
 * What every repository is given. Repositories are plain functions over a
 * SqlDb: no module state, no React Native, no reading of the active child or
 * the wall clock behind the caller's back (PMOB-02 "no hidden global
 * fallbacks"). The store facade (store.ts) builds one context per open and
 * resolves every default (active child, signature) before calling in.
 */
import type { SqlDb } from '../sql';

/** Local tables a write can touch. Subscriptions are scoped by these (MOB-05). */
export type Table = 'settings' | 'children' | 'entries' | 'drafts' | 'orphan_audio';

export interface RepoContext {
  db: SqlDb;
  /** ISO time for updated_at and similar stamps. Injected so tests are deterministic. */
  now: () => string;
  /** New row id (UUIDv7 in the app). `atMs` sets the time part, for rows dated by a file. */
  newId: (atMs?: number) => string;
}

/** Rows changed by the last statement on this connection (SQLite `changes()`). */
export function changes(db: SqlDb): number {
  return db.get<{ n: number }>('SELECT changes() AS n')?.n ?? 0;
}
