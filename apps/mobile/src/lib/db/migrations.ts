/**
 * Versioned schema for the local database (TDD 01 3.2.1, BL-M02).
 *
 * The version lives in `PRAGMA user_version`. Each migration runs in its own
 * transaction together with the version bump, so a failure leaves the
 * database exactly as it was before that step (TDD 01 F-09). Migrations are
 * append-only: never edit one that has shipped; add the next number.
 *
 * Installs created before this migrator have user_version 0 but may already
 * have every table and column (the old "add column if missing" code), so
 * steps 1 and 2 are written to be safe on those databases too.
 *
 * Pure: no React Native imports. Tested in Node (test/migrations.test.ts).
 * New columns need a row in docs/legal/DATA_CLASSIFICATION.md 4.5 (DATA-REQ-001).
 */
import type { SqlDb } from './sql';

export interface MigrationContext {
  /** ISO time, injected so tests are deterministic. */
  now: string;
  /** New row id (UUIDv7 in the app). */
  newId: () => string;
}

export interface Migration {
  version: number;
  name: string;
  up(db: SqlDb, ctx: MigrationContext): void;
}

function columns(db: SqlDb, table: string): Set<string> {
  return new Set(db.all<{ name: string }>(`PRAGMA table_info(${table})`).map((c) => c.name));
}

function addColumns(db: SqlDb, table: string, cols: [string, string][]): void {
  const have = columns(db, table);
  for (const [name, type] of cols) if (!have.has(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`);
}

/** Legacy single-child setting, before multi-child. Parsed defensively: a bad value must never brick launch. */
function parseLegacyFamily(value: string): { childName: string; childBirthday: string | null; childDueDate: string | null; signsAs: string } | null {
  try {
    const f = JSON.parse(value) as Record<string, unknown>;
    if (!f || typeof f !== 'object' || typeof f.childName !== 'string' || !f.childName.trim()) return null;
    return {
      childName: f.childName,
      childBirthday: typeof f.childBirthday === 'string' ? f.childBirthday : null,
      childDueDate: typeof f.childDueDate === 'string' ? f.childDueDate : null,
      signsAs: typeof f.signsAs === 'string' ? f.signsAs : '',
    };
  } catch {
    return null;
  }
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'baseline tables',
    up(db) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS entries (
          id TEXT PRIMARY KEY NOT NULL,
          kind TEXT NOT NULL,
          occurred_on TEXT NOT NULL,
          captured_at TEXT NOT NULL,
          capture_mode TEXT NOT NULL,
          edit_level TEXT NOT NULL,
          prompt_key TEXT,
          engine_version INTEGER NOT NULL,
          raw_transcript TEXT NOT NULL,
          machine_edits TEXT NOT NULL,
          final_text TEXT NOT NULL,
          in_book INTEGER NOT NULL DEFAULT 0,
          sounds_like_me INTEGER,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          synced_at TEXT
        );
        CREATE INDEX IF NOT EXISTS entries_occurred ON entries (occurred_on) WHERE deleted_at IS NULL;
        CREATE TABLE IF NOT EXISTS children (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          birthday TEXT,
          due_date TEXT,
          signs_as TEXT NOT NULL,
          reminders_on INTEGER NOT NULL DEFAULT 1,
          family_can_read INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          hidden_at TEXT
        );
        CREATE TABLE IF NOT EXISTS drafts (
          id TEXT PRIMARY KEY NOT NULL,
          child_id TEXT NOT NULL,
          capture_mode TEXT NOT NULL,
          prompt_key TEXT,
          created_at TEXT NOT NULL,
          audio_uri TEXT,
          audio_duration_ms INTEGER,
          raw_transcript TEXT,
          typed_text TEXT
        );
      `);
    },
  },
  {
    version: 2,
    name: 'multi-child and audio columns; legacy family becomes the first child',
    up(db, ctx) {
      addColumns(db, 'entries', [
        ['child_id', 'TEXT'],
        ['author_id', 'TEXT'],
        ['author_signs_as', 'TEXT'],
        ['audio_uri', 'TEXT'],
        ['audio_duration_ms', 'INTEGER'],
      ]);
      db.exec('CREATE INDEX IF NOT EXISTS entries_child ON entries (child_id, occurred_on) WHERE deleted_at IS NULL');

      const childCount = db.get<{ n: number }>('SELECT COUNT(*) AS n FROM children')?.n ?? 0;
      const legacy = db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', 'family');
      if (childCount > 0 || !legacy) return;
      const f = parseLegacyFamily(legacy.value);
      if (!f) return; // keep the unreadable value; never throw on launch, never drop data
      const id = ctx.newId();
      db.run(
        'INSERT INTO children (id, name, birthday, due_date, signs_as, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        id, f.childName, f.childBirthday, f.childDueDate, f.signsAs, ctx.now, ctx.now,
      );
      db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 'activeChildId', id);
      db.run('UPDATE entries SET child_id = ? WHERE child_id IS NULL', id);
      db.run('DELETE FROM settings WHERE key = ?', 'family');
    },
  },
  {
    version: 3,
    name: 'crash-safe capture, voice-only letters, orphan audio, age gate boolean',
    up(db) {
      // Drafts are created when recording starts (TDD 01 3.4): state tracks the take.
      // recording: mic was live; ready: audio closed (or typed); unrecoverable: file empty or unreadable, kept anyway.
      addColumns(db, 'drafts', [
        ['state', "TEXT NOT NULL DEFAULT 'ready'"],
        ['audio_sha256', 'TEXT'],
        ['audio_bytes', 'INTEGER'],
        ['recovered_at', 'TEXT'],
      ]);
      // transcript_status 'waiting': a spoken letter kept without words yet (TDD 03 #1, FM-9).
      addColumns(db, 'entries', [
        ['audio_sha256', 'TEXT'],
        ['audio_bytes', 'INTEGER'],
        ['transcript_status', 'TEXT'],
      ]);
      // Audio files found with no draft or letter row while no book exists to attach them to.
      // Reported in Settings, never deleted (TDD 01 3.2.4). Keyed by file name: iOS changes the
      // app container path across updates, so absolute URIs are not stable identifiers.
      db.exec(`
        CREATE TABLE IF NOT EXISTS orphan_audio (
          file_name TEXT PRIMARY KEY NOT NULL,
          bytes INTEGER,
          found_at TEXT NOT NULL
        );
      `);
      // 18+ gate: a boolean only (PRD-REQ-019, DECISIONS D-026). Older installs stored
      // ageAttested='yes' and ageAttestedAt; keep the Yes as ageGate.passed, drop the time.
      db.run("INSERT OR REPLACE INTO settings (key, value) SELECT 'ageGate.passed', '1' FROM settings WHERE key = 'ageAttested' AND value = 'yes'");
      db.run("DELETE FROM settings WHERE key IN ('ageAttested', 'ageAttestedAt')");
    },
  },
];

export const LATEST_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

export class MigrationError extends Error {
  constructor(public version: number, cause: unknown) {
    // Code and number only: SQLite messages can quote values (TDD 01 4.2 rule 2).
    super(`local_db_migration_failed:${version}`);
    this.cause = cause;
  }
}

export interface MigrationResult {
  from: number;
  to: number;
  /** The file was written by a newer build (for example after an update was rolled back). Left untouched. */
  newer: boolean;
}

export function userVersion(db: SqlDb): number {
  return db.get<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0;
}

/** Brings the database to LATEST_VERSION, one transaction per step. */
export function migrate(db: SqlDb, ctx: MigrationContext, migrations: Migration[] = MIGRATIONS): MigrationResult {
  const from = userVersion(db);
  const latest = migrations[migrations.length - 1]?.version ?? 0;
  if (from > latest) return { from, to: from, newer: true };
  let to = from;
  for (const m of migrations) {
    if (m.version <= from) continue;
    try {
      db.transaction(() => {
        m.up(db, ctx);
        db.exec(`PRAGMA user_version = ${m.version}`);
      });
    } catch (e) {
      throw new MigrationError(m.version, e);
    }
    to = m.version;
  }
  return { from, to, newer: false };
}
