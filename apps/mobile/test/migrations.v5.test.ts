/// <reference types="node" />
/**
 * Migration 5 (D-084, quiet-day marks carry no sentence), the cases
 * test/migrations.test.ts does not pin: a mark without a book, many marks,
 * the step run twice, a failure half way (every row rolls back, TDD 01 F-09),
 * and marks the server already holds. Real SQLite. Fictional Asha family only.
 */
import { describe, expect, it } from 'vitest';
import { LATEST_VERSION, MIGRATIONS, MigrationError, migrate, userVersion } from '../src/lib/db/migrations';
import type { SqlDb } from '../src/lib/db/sql';
import { nodeDb } from './helpers/node-db';

const NOW = '2026-10-03T09:00:00.000Z';
const SENTENCE = 'Tuesday. Not much today. Just Asha, and us, and an ordinary day.';
let n = 0;
const ctx = { now: NOW, newId: () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}` };
const V5 = MIGRATIONS.find((m) => m.version === 5)!;

function atV4(): SqlDb {
  const { db } = nodeDb();
  migrate(db, ctx, MIGRATIONS.filter((m) => m.version <= 4));
  db.run("INSERT INTO children (id, name, birthday, signs_as, created_at, updated_at, server_state) VALUES ('c1', 'Asha', '2026-03-01', 'Mama', ?, ?, 'synced')", NOW, NOW);
  return db;
}

function mark(db: SqlDb, id: string, over: { child?: string | null; author?: string | null; text?: string; serverVersion?: string | null; syncState?: string } = {}) {
  db.run(
    `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits,
       final_text, in_book, updated_at, child_id, author_id, server_version, sync_state)
     VALUES (?, 'not_much', '2026-09-29', ?, 'typed', 'verbatim', 2, ?, '[]', ?, 0, '2026-10-01T00:00:00.000Z', ?, ?, ?, ?)`,
    id, NOW, SENTENCE, over.text ?? SENTENCE, over.child === undefined ? 'c1' : over.child, over.author ?? null, over.serverVersion ?? null, over.syncState ?? 'local',
  );
}

const row = (db: SqlDb, id: string) => db.get<{ final_text: string; updated_at: string; sync_state: string; raw_transcript: string }>('SELECT final_text, updated_at, sync_state, raw_transcript FROM entries WHERE id = ?', id)!;
const ops = (db: SqlDb) => db.all<{ type: string; entity_id: string; payload: string }>('SELECT type, entity_id, payload FROM sync_outbox ORDER BY seq');

describe('[D-084] migration 5 edges', () => {
  it('a mark with no book is blanked but never queued (a snapshot without a book cannot upload)', () => {
    const db = atV4();
    db.run("INSERT INTO settings (key, value) VALUES ('sync.ownerId', 'user-mama')");
    mark(db, 'q-nobook', { child: null, author: 'user-mama' });
    mark(db, 'q-book', { author: 'user-mama' });
    expect(migrate(db, ctx)).toMatchObject({ from: 4, to: LATEST_VERSION });
    expect(row(db, 'q-nobook')).toMatchObject({ final_text: '', sync_state: 'local' });
    expect(ops(db).map((o) => o.entity_id)).toEqual(['q-book']);
  });

  it('every old mark gets its own upload, and a mark that was already blank is left alone (no stamp, no op)', () => {
    const db = atV4();
    db.run("INSERT INTO settings (key, value) VALUES ('sync.ownerId', 'user-mama')");
    for (let i = 0; i < 40; i++) mark(db, `q${i}`, { author: 'user-mama' });
    mark(db, 'blank', { author: 'user-mama', text: '' });
    migrate(db, ctx);
    const queued = ops(db);
    expect(queued).toHaveLength(40);
    expect(new Set(queued.map((o) => o.entity_id)).size).toBe(40);
    expect(queued.every((o) => o.type === 'entry.upsert')).toBe(true);
    for (let i = 0; i < 40; i++) expect(row(db, `q${i}`)).toMatchObject({ final_text: '', raw_transcript: SENTENCE, updated_at: NOW });
    expect(row(db, 'blank')).toMatchObject({ final_text: '', updated_at: '2026-10-01T00:00:00.000Z', sync_state: 'local' });
  });

  it('the step is idempotent: run a second time it changes no row and queues nothing more', () => {
    const db = atV4();
    db.run("INSERT INTO settings (key, value) VALUES ('sync.ownerId', 'user-mama')");
    mark(db, 'q1', { author: 'user-mama' });
    migrate(db, ctx);
    const before = { rows: db.all('SELECT * FROM entries ORDER BY id'), ops: ops(db) };
    V5.up(db, { ...ctx, now: '2026-12-01T00:00:00.000Z' });
    expect(db.all('SELECT * FROM entries ORDER BY id')).toEqual(before.rows);
    expect(ops(db)).toEqual(before.ops);
  });

  it('[TDD-01 F-09] a failure half way rolls back every blanked row and every queued op, and reports only the number', () => {
    const db = atV4();
    db.run("INSERT INTO settings (key, value) VALUES ('sync.ownerId', 'user-mama')");
    for (let i = 0; i < 5; i++) mark(db, `q${i}`, { author: 'user-mama' });
    let calls = 0;
    const failing: SqlDb = {
      ...db,
      run: (sql, ...params) => {
        if (/INSERT INTO sync_outbox/.test(sql) && ++calls === 3) throw new Error('disk full: /private/var/.../q2');
        db.run(sql, ...params);
      },
    };
    let error: unknown;
    try {
      migrate(failing, ctx);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(MigrationError);
    expect((error as MigrationError).message).toBe('local_db_migration_failed:5');
    expect((error as MigrationError).message).not.toMatch(/disk|var/);
    expect(userVersion(db)).toBe(4);
    for (let i = 0; i < 5; i++) expect(row(db, `q${i}`).final_text).toBe(SENTENCE);
    expect(ops(db)).toEqual([]);
    // and the next launch finishes the job
    expect(migrate(db, ctx)).toMatchObject({ from: 4, to: LATEST_VERSION });
    expect(ops(db)).toHaveLength(5);
  });

  it('a mark the server already holds is sent as a text change against its server version', () => {
    const db = atV4();
    db.run("INSERT INTO settings (key, value) VALUES ('sync.ownerId', 'user-mama')");
    mark(db, 'q-synced', { author: 'user-mama', serverVersion: '41', syncState: 'synced' });
    migrate(db, ctx);
    const [op] = ops(db);
    expect(op).toMatchObject({ type: 'entry.upsert', entity_id: 'q-synced' });
    const p = JSON.parse(op.payload) as { base: string | null; changed: string[]; data: { final_text: string } };
    expect(p.base).toBe('41');
    expect(p.changed).toEqual(['text']);
    expect(p.data.final_text).toBe('');
    expect(row(db, 'q-synced').sync_state).toBe('pending');
  });
});
