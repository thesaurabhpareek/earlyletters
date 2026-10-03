/// <reference types="node" />
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { LATEST_VERSION, MIGRATIONS, MigrationError, migrate, userVersion, type Migration } from '../src/lib/db/migrations';
import type { SqlDb } from '../src/lib/db/sql';
import { nodeDb } from './helpers/node-db';

const NOW = '2026-10-03T09:00:00.000Z';
let n = 0;
const ctx = { now: NOW, newId: () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}` };

const cols = (db: SqlDb, table: string) => db.all<{ name: string }>(`PRAGMA table_info(${table})`).map((c) => c.name);
const setting = (db: SqlDb, key: string) => db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', key)?.value ?? null;
const sha = (s: string) => createHash('sha256').update(s).digest('hex');

/** The schema an install had before multi-child (Sept 2026): no child_id, a single `family` setting. */
function legacySingleChild(db: SqlDb, family: string) {
  db.exec(`
    CREATE TABLE settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
    CREATE TABLE entries (
      id TEXT PRIMARY KEY NOT NULL, kind TEXT NOT NULL, occurred_on TEXT NOT NULL, captured_at TEXT NOT NULL,
      capture_mode TEXT NOT NULL, edit_level TEXT NOT NULL, prompt_key TEXT, engine_version INTEGER NOT NULL,
      raw_transcript TEXT NOT NULL, machine_edits TEXT NOT NULL, final_text TEXT NOT NULL,
      in_book INTEGER NOT NULL DEFAULT 0, sounds_like_me INTEGER, updated_at TEXT NOT NULL, deleted_at TEXT, synced_at TEXT
    );
  `);
  db.run('INSERT INTO settings (key, value) VALUES (?, ?)', 'family', family);
  db.run(
    `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, prompt_key, engine_version,
       raw_transcript, machine_edits, final_text, in_book, updated_at) VALUES (?, 'letter', '2026-09-01', ?, 'typed', 'verbatim', NULL, 2, ?, '[]', ?, 1, ?)`,
    'e1', NOW, 'Asha, you laughed at the rain today.', 'Asha, you laughed at the rain today.', NOW,
  );
}

/** The schema the ad hoc "add column if missing" code produced (multi-child, audio), user_version 0. */
function preMigratorMultiChild(db: SqlDb) {
  MIGRATIONS[0].up(db, ctx);
  MIGRATIONS[1].up(db, ctx); // columns only; no legacy family
  db.run("INSERT INTO children (id, name, birthday, due_date, signs_as, created_at, updated_at) VALUES ('c1', 'Asha', '2026-03-01', NULL, 'Mama', ?, ?)", NOW, NOW);
  db.run("INSERT INTO settings (key, value) VALUES ('ageAttested', 'yes'), ('ageAttestedAt', ?)", NOW);
  db.run(
    "INSERT INTO drafts (id, child_id, capture_mode, prompt_key, created_at, audio_uri, audio_duration_ms) VALUES ('d1', 'c1', 'spoken', NULL, ?, 'file:///Documents/recording-1.m4a', 31000)",
    NOW,
  );
  expect(userVersion(db)).toBe(0);
}

describe('local database migrator', () => {
  it('[DATA-REQ-048] a fresh install reaches the latest version with every capture column', () => {
    const { db } = nodeDb();
    const r = migrate(db, ctx);
    expect(r).toEqual({ from: 0, to: LATEST_VERSION, newer: false });
    expect(userVersion(db)).toBe(LATEST_VERSION);
    expect(cols(db, 'drafts')).toEqual(expect.arrayContaining(['state', 'audio_sha256', 'audio_bytes', 'recovered_at']));
    expect(cols(db, 'entries')).toEqual(expect.arrayContaining(['child_id', 'audio_sha256', 'audio_bytes', 'transcript_status']));
    expect(cols(db, 'orphan_audio')).toEqual(['file_name', 'bytes', 'found_at']);
  });

  it('[DATA-REQ-040] a pre-multi-child install keeps every letter word for word and gains its first book', () => {
    const { db } = nodeDb();
    legacySingleChild(db, JSON.stringify({ childName: 'Asha', childBirthday: '2026-03-01', signsAs: 'Mama' }));
    const before = db.all<{ id: string; raw_transcript: string; final_text: string }>('SELECT id, raw_transcript, final_text FROM entries');
    migrate(db, ctx);
    const after = db.all<{ id: string; raw_transcript: string; final_text: string; child_id: string }>(
      'SELECT id, raw_transcript, final_text, child_id FROM entries',
    );
    expect(after.map((e) => sha(e.raw_transcript))).toEqual(before.map((e) => sha(e.raw_transcript)));
    expect(after.map((e) => e.final_text)).toEqual(before.map((e) => e.final_text));
    const kids = db.all<{ id: string; name: string; signs_as: string }>('SELECT id, name, signs_as FROM children');
    expect(kids).toHaveLength(1);
    expect(kids[0]).toMatchObject({ name: 'Asha', signs_as: 'Mama' });
    expect(after[0].child_id).toBe(kids[0].id);
    expect(setting(db, 'activeChildId')).toBe(kids[0].id);
    expect(setting(db, 'family')).toBeNull();
  });

  it('[TDD-01 C-08] an unreadable legacy family value never blocks launch and is kept', () => {
    const { db } = nodeDb();
    legacySingleChild(db, '{not json');
    expect(() => migrate(db, ctx)).not.toThrow();
    expect(userVersion(db)).toBe(LATEST_VERSION);
    expect(setting(db, 'family')).toBe('{not json');
    expect(db.get<{ n: number }>('SELECT COUNT(*) AS n FROM entries')?.n).toBe(1);
  });

  it('[PRD-REQ-019] an install made before the migrator is upgraded in place: gate answer becomes a boolean, its time is dropped', () => {
    const { db } = nodeDb();
    preMigratorMultiChild(db);
    migrate(db, ctx);
    expect(userVersion(db)).toBe(LATEST_VERSION);
    expect(db.get<{ n: number }>('SELECT COUNT(*) AS n FROM children')?.n).toBe(1);
    expect(setting(db, 'ageGate.passed')).toBe('1');
    expect(setting(db, 'ageAttested')).toBeNull();
    expect(setting(db, 'ageAttestedAt')).toBeNull();
    // Existing drafts are finished takes: they become `ready`, never `recording`.
    expect(db.get<{ state: string; audio_uri: string }>("SELECT state, audio_uri FROM drafts WHERE id = 'd1'")).toEqual({
      state: 'ready',
      audio_uri: 'file:///Documents/recording-1.m4a',
    });
  });

  it('is a no-op once at the latest version', () => {
    const { db } = nodeDb();
    migrate(db, ctx);
    expect(migrate(db, ctx)).toEqual({ from: LATEST_VERSION, to: LATEST_VERSION, newer: false });
  });

  it('[TDD-01 F-09] a failing step rolls back completely and reports only its number', () => {
    const { db } = nodeDb();
    migrate(db, ctx);
    const broken: Migration = {
      version: LATEST_VERSION + 1,
      name: 'test: fails half way',
      up(d) {
        d.exec('ALTER TABLE entries ADD COLUMN half_done TEXT');
        d.run("UPDATE settings SET value = 'changed' WHERE key = 'x'");
        throw new Error('secret letter text that must not leak');
      },
    };
    db.run("INSERT INTO settings (key, value) VALUES ('x', 'kept')");
    let err: unknown;
    try {
      migrate(db, ctx, [...MIGRATIONS, broken]);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(MigrationError);
    expect((err as MigrationError).message).toBe(`local_db_migration_failed:${LATEST_VERSION + 1}`);
    expect(userVersion(db)).toBe(LATEST_VERSION);
    expect(cols(db, 'entries')).not.toContain('half_done');
    expect(setting(db, 'x')).toBe('kept');
  });

  it('leaves a database from a newer build untouched', () => {
    const { db } = nodeDb();
    db.exec('PRAGMA user_version = 99');
    expect(migrate(db, ctx)).toEqual({ from: 99, to: 99, newer: true });
    expect(db.all("SELECT name FROM sqlite_master WHERE type = 'table'")).toEqual([]);
  });

  it('migrations are numbered 1..n with no gaps (append-only)', () => {
    expect(MIGRATIONS.map((m) => m.version)).toEqual(MIGRATIONS.map((_, i) => i + 1));
  });
});
