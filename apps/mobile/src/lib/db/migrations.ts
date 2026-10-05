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
import { enqueueEntryUpsert } from '../sync/outbox';
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
  {
    version: 4,
    name: 'sync: outbox, rejected writes, per-book cursors, server versions on letters and books',
    up(db) {
      // Letters (own and, after sync, other people's). entries.synced_at (v1) is the
      // time this phone last confirmed the row with the server.
      //   server_version     L2  sync_xid of the server state this phone knows; null = never on the server
      //   server_updated_at  L2  the server's updated_at of that state (re-upload known_at after a restore)
      //   server_epoch       L2  restore epoch in which that state was seen
      //   sync_state         L2  local | pending | synced | rejected | held | gone
      //   approval           L2  family review state from the server (not_needed, pending, added, set_aside)
      addColumns(db, 'entries', [
        ['server_version', 'TEXT'],
        ['server_updated_at', 'TEXT'],
        ['server_epoch', 'INTEGER'],
        ['sync_state', "TEXT NOT NULL DEFAULT 'local'"],
        ['approval', 'TEXT'],
      ]);
      db.exec('CREATE INDEX IF NOT EXISTS entries_sync ON entries (child_id, sync_state)');
      // Books. role and created_by_me come from the server (L2); nickname is book-level (L4).
      //   server_state  L2  local | pending | synced | refused | left | deleted
      addColumns(db, 'children', [
        ['role', 'TEXT'],
        ['created_by_me', 'INTEGER'],
        ['nickname', 'TEXT'],
        ['server_state', "TEXT NOT NULL DEFAULT 'local'"],
      ]);
      db.exec(`
        -- Ordered upload queue (lane 0: restore re-uploads first). payload is the op
        -- exactly as sent (L4: it can hold letter text); never logged.
        CREATE TABLE IF NOT EXISTS sync_outbox (
          seq INTEGER PRIMARY KEY AUTOINCREMENT,
          op_id TEXT NOT NULL UNIQUE,
          lane INTEGER NOT NULL DEFAULT 1,
          type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          book_id TEXT,
          payload TEXT NOT NULL,
          created_at TEXT NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0,
          next_attempt_at TEXT,
          sent_at TEXT
        );
        CREATE INDEX IF NOT EXISTS sync_outbox_entity ON sync_outbox (entity_id);
        -- Ops the server refused for good (DATA-REQ-043): kept with their SQLSTATE,
        -- content stays on the phone and in export; the person is told once.
        CREATE TABLE IF NOT EXISTS rejected_writes (
          op_id TEXT PRIMARY KEY NOT NULL,
          type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          payload TEXT NOT NULL,
          code TEXT NOT NULL,
          rejected_at TEXT NOT NULL,
          seen_at TEXT
        );
        -- One row per book this phone pulls: cursor, access signature, settings hash
        -- and the members list from the server (L3: person ids and signatures).
        CREATE TABLE IF NOT EXISTS sync_books (
          child_id TEXT PRIMARY KEY NOT NULL,
          cursor TEXT,
          access TEXT,
          meta_hash TEXT,
          members TEXT,
          birthday_md TEXT,
          state TEXT NOT NULL DEFAULT 'live',
          want_ids INTEGER NOT NULL DEFAULT 0
        );
      `);
    },
  },
  {
    version: 5,
    name: 'quiet-day marks carry no sentence (D-084)',
    up(db, ctx) {
      // Older builds saved a template sentence as the words of "Not much today". The app never writes
      // a person's words, so those rows are blanked. raw_transcript is not touched (it never changes,
      // the server trigger enforces it too); every screen decides by `kind` and ignores the text.
      // Same path as any edit: the change goes through the sync outbox (enqueueEntryUpsert, field
      // group 'text'), in this transaction, so the server copy follows and the old text stays in the
      // server's entry_versions. enqueueEntryUpsert does nothing before the first sign-in claimed
      // this phone's data (the first upload then reads the blanked row), skips other people's
      // letters and tombstoned rows (a restore sends the current words again).
      const marks = db.all<{ id: string }>("SELECT id FROM entries WHERE kind = 'not_much' AND final_text <> ''");
      for (const { id } of marks) {
        db.run("UPDATE entries SET final_text = '', updated_at = ? WHERE id = ?", ctx.now, id);
        enqueueEntryUpsert(db, id, ['text'], ctx);
      }
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
