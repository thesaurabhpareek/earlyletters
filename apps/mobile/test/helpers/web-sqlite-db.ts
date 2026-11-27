/**
 * BL-464. A synchronous SqlDb over the web build's engine (test/helpers/web-sqlite-worker.mjs): the shape of
 * expo-adapter.ts on web, where execSync, runSync, getFirstSync and getAllSync block on a worker answer and
 * withTransactionSync is BEGIN, the work, COMMIT, or ROLLBACK and the error (expo-sqlite src/SQLiteDatabase.ts).
 */
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import type { SqlDb, SqlParam } from '../../src/lib/db/sql';

export interface WebSqliteDb {
  db: SqlDb;
  /** Pool files page 1 left behind, and the pool page 2 opened scribe.db with. */
  filesLeft: number;
  poolFiles: number;
  close: () => Promise<number>;
  /** A test of this helper only: the worker ends in the middle of a call, as a wasm abort would. */
  crash: () => void;
}

/**
 * How long a call waits for the worker's answer before it throws. The wait blocks the thread, so vitest's own timeout
 * cannot end it: keep this under the test timeout of every file that uses the helper (test/web-sqlite-pool.test.ts).
 */
export const ANSWER_MS = 10_000;

export async function webSqliteDb(opts: {
  pool: 'upstream' | 'topped-up';
  cutAt: number | null;
  answerMs?: number;
}): Promise<WebSqliteDb> {
  const answerMs = opts.answerMs ?? ANSWER_MS;
  // web-preview/*.js is ESM in a package with no "type"; Node parses it as ESM and would warn on every start.
  const w = new Worker(join(__dirname, 'web-sqlite-worker.mjs'), { workerData: opts, execArgv: ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON'] });
  const info = await new Promise<{ filesLeft: number; poolFiles: number }>((resolve, reject) => {
    w.once('message', resolve);
    w.once('error', reject);
  });
  const lock = new SharedArrayBuffer(4);
  const buf = new SharedArrayBuffer(1024 * 1024);
  const call = <T>(op: 'exec' | 'rows' | 'crash', sql: string, params: SqlParam[] = []): T => {
    const l = new Int32Array(lock);
    Atomics.store(l, 0, 1);
    w.postMessage({ op, sql, params, lock, buf });
    const deadline = Date.now() + answerMs;
    while (Atomics.load(l, 0) === 1) {
      const left = deadline - Date.now();
      if (left <= 0) throw new Error(`web sqlite worker gave no answer to ${op} in ${answerMs} ms: it has likely died`);
      Atomics.wait(l, 0, 1, Math.min(left, 1000));
    }
    const n = new Uint32Array(buf, 0, 1)[0];
    const out = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, n).slice())) as { result: T; error?: string };
    if (out.error) throw new Error(out.error);
    return out.result;
  };
  const exec = (sql: string) => {
    call('exec', sql);
  };
  const db: SqlDb = {
    exec,
    run: (sql, ...params) => {
      call('rows', sql, params);
    },
    get: <T>(sql: string, ...params: SqlParam[]) => call<T[]>('rows', sql, params)[0] ?? null,
    all: <T>(sql: string, ...params: SqlParam[]) => call<T[]>('rows', sql, params),
    transaction: (fn) => {
      try {
        exec('BEGIN');
        fn();
        exec('COMMIT');
      } catch (e) {
        exec('ROLLBACK');
        throw e;
      }
    },
  };
  return {
    db,
    ...info,
    close: () => w.terminate(),
    crash: () => {
      call('crash', '');
    },
  };
}
