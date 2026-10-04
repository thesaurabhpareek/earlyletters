/// <reference types="node" />
/**
 * A migrated in-memory store for repository tests: node:sqlite, a fixed
 * clock you can advance, and predictable UUIDv7 ids. Fictional Asha family only.
 */
import type { Entry, RepoContext } from '../../src/lib/db/repos';
import { migrate } from '../../src/lib/db/migrations';
import type { SqlDb, SqlParam } from '../../src/lib/db/sql';
import { nodeDb } from './node-db';

export const T0 = Date.parse('2026-10-03T09:00:00.000Z');

export interface Fixture {
  ctx: RepoContext;
  db: SqlDb;
  close: () => void;
  /** Moves the clock forward by `ms` (default one minute). */
  tick: (ms?: number) => void;
  /** Makes the next matching `run` throw, to test rollbacks. */
  failNextRun: (match: RegExp) => void;
}

export function fixture(): Fixture {
  const { db: raw, close } = nodeDb();
  let t = T0;
  let seq = 0;
  let fail: RegExp | null = null;
  const db: SqlDb = {
    ...raw,
    run: (sql: string, ...params: SqlParam[]) => {
      if (fail && fail.test(sql)) {
        fail = null;
        throw new Error('injected_failure');
      }
      raw.run(sql, ...params);
    },
  };
  const newId = (atMs?: number) => {
    const ms = (atMs ?? t).toString(16).padStart(12, '0');
    const n = (++seq).toString(16).padStart(12, '0');
    return `${ms.slice(0, 8)}-${ms.slice(8, 12)}-7000-8000-${n}`;
  };
  const ctx: RepoContext = { db, now: () => new Date(t).toISOString(), newId };
  migrate(db, { now: ctx.now(), newId: () => newId() });
  return {
    ctx,
    db,
    close,
    tick: (ms = 60_000) => {
      t += ms;
    },
    failNextRun: (match) => {
      fail = match;
    },
  };
}

/** Inserts the Asha book directly, so entry tests do not depend on the children repository. */
export function seedChild(db: SqlDb, id = 'child-asha', signsAs = 'Mama'): string {
  db.run(
    "INSERT INTO children (id, name, birthday, due_date, signs_as, created_at, updated_at) VALUES (?, 'Asha', '2026-03-01', NULL, ?, ?, ?)",
    id, signsAs, new Date(T0).toISOString(), new Date(T0).toISOString(),
  );
  return id;
}

export function letter(over: Partial<Entry> = {}): Entry {
  return {
    id: '0199a5b0-0000-7000-8000-000000000001',
    kind: 'letter',
    occurredOn: '2026-10-03',
    capturedAt: '2026-10-03T08:30:00.000Z',
    captureMode: 'spoken',
    editLevel: 'clean',
    promptKey: 'first-laugh',
    engineVersion: 3,
    rawTranscript: 'um Asha you laughed at the the rain today',
    machineEdits: [],
    finalText: 'Asha, you laughed at the rain today.',
    inBook: false,
    soundsLikeMe: null,
    childId: 'child-asha',
    authorSignsAs: 'Mama',
    audioUri: 'file:///Documents/recording-1.m4a',
    audioDurationMs: 31000,
    audioSha256: 'a'.repeat(64),
    audioBytes: 48000,
    transcriptStatus: null,
    ...over,
  };
}

/** The stored row, column names as in SQLite. */
export function rawRow(db: SqlDb, id: string): Record<string, unknown> | null {
  return db.get<Record<string, unknown>>('SELECT * FROM entries WHERE id = ?', id);
}
