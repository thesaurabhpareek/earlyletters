/**
 * Find's idle work (NS-02-R35, R30; ADR 0028 D4). #798 caught the whole index up in one transaction 3 s after the store
 * opened: at 1,000 letters, one long frame. Here the index is rebuilt in batches of 200 letters per transaction
 * (PROPOSED), with a yield between batches and a wait while a take is being recorded (lib/capture/busy.ts). The scan
 * answers until the last batch (lifecycle.ts `startRebuild`); a letter written or removed meanwhile is caught by a later
 * batch, because each one re-reads what differs. The caller starts it off the first frame (the store, BL-952 slice 7).
 * At the end, a waiting removal is merged out of the file (R30).
 */
import { captureBusy, onCaptureBusy } from '../capture/busy';
import type { SqlDb } from '../db/sql';
import {
  abandonRebuild, FIND_DIRTY_SETTING, finishRebuild, rebuildStep, SEARCH_TABLE, searchIndexExists, startRebuild, type EnsureResult,
} from './lifecycle';

/** Letters per transaction while rebuilding (R35, PROPOSED). */
export const REBUILD_BATCH = 200;

export interface RebuildOptions {
  batch?: number;
  /** Whether a take is being recorded now. */
  busy?: () => boolean;
  /** Resolves once no take is being recorded. */
  untilIdle?: () => Promise<void>;
  /** The yield between batches, so no single frame carries the rebuild. */
  pause?: () => Promise<void>;
}

const nextTask = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const captureIdle = () =>
  new Promise<void>((resolve) => {
    const off = onCaptureBusy((busy) => {
      if (busy) return;
      off();
      resolve();
    });
    if (captureBusy()) return;
    off();
    resolve();
  });

const running = new WeakMap<SqlDb, Promise<EnsureResult>>();

/** Rebuilds or catches up the index in batches. One run per connection at a time; a second call shares it. Never throws. */
export function rebuildSearchIndex(db: SqlDb, opts: RebuildOptions = {}): Promise<EnsureResult> {
  const current = running.get(db);
  if (current) return current;
  const run = rebuild(db, opts).finally(() => running.delete(db));
  running.set(db, run);
  return run;
}

async function rebuild(db: SqlDb, opts: RebuildOptions): Promise<EnsureResult> {
  const { batch = REBUILD_BATCH, busy = captureBusy, untilIdle = captureIdle, pause = nextTask } = opts;
  if (busy()) await untilIdle(); // never while a take is recording, not even the table check
  if (!startRebuild(db)) return 'unavailable';
  try {
    for (;;) {
      while (busy()) await untilIdle();
      if (rebuildStep(db, batch) === 0) break;
      await pause();
    }
    finishRebuild(db);
  } catch {
    abandonRebuild(db);
    return 'unavailable';
  }
  optimizeIfDue(db);
  return 'ready';
}

/** Merges the index's segments so the bytes of removed words are gone from the file. Never throws. */
export function optimizeSearchIndex(db: SqlDb): boolean {
  if (!searchIndexExists(db)) return false;
  try {
    db.exec(`INSERT INTO ${SEARCH_TABLE} (${SEARCH_TABLE}) VALUES ('optimize')`);
    db.run('DELETE FROM settings WHERE key = ?', FIND_DIRTY_SETTING);
    return true;
  } catch {
    return false;
  }
}

/** True when a removal is waiting for its merge. */
export function optimizeDue(db: SqlDb): boolean {
  return db.get<{ n: number }>('SELECT 1 AS n FROM settings WHERE key = ?', FIND_DIRTY_SETTING) !== null;
}

/** At idle: merges when a removal is waiting. Returns whether a merge ran. */
export function optimizeIfDue(db: SqlDb): boolean {
  return searchIndexExists(db) && optimizeDue(db) ? optimizeSearchIndex(db) : false;
}
