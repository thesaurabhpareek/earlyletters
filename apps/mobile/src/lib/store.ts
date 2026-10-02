/**
 * Local-first store (PRD P0: nothing is ever lost).
 *
 * Every entry is written to SQLite on the phone before anything else
 * happens. Sync to Supabase comes later (PowerSync, ADR 0004) and will read
 * from these same rows. Column names mirror supabase/migrations so the
 * sync layer is a straight mapping.
 *
 * Runs in Expo Go (expo-sqlite) on iOS and Android.
 */
import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';
import type { DictionaryTerm, Edit, EditLevel } from '@scribe/core';

export type EntryKind = 'note' | 'letter' | 'not_much';
export type CaptureMode = 'spoken' | 'typed' | 'mixed';

export interface Entry {
  id: string;
  kind: EntryKind;
  occurredOn: string; // YYYY-MM-DD, local
  capturedAt: string; // ISO timestamp
  captureMode: CaptureMode;
  editLevel: EditLevel;
  promptKey: string | null;
  engineVersion: number;
  rawTranscript: string;
  machineEdits: Edit[];
  finalText: string;
  inBook: boolean;
  soundsLikeMe: boolean | null;
}

export interface Family {
  childName: string;
  childBirthday: string | null; // YYYY-MM-DD
  signsAs: string; // what the child calls this parent
}

let db: SQLite.SQLiteDatabase | null = null;

function open(): SQLite.SQLiteDatabase {
  if (db) return db;
  db = SQLite.openDatabaseSync('scribe.db');
  db.execSync(`
    PRAGMA journal_mode = WAL;
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
  `);
  return db;
}

/** UUIDv7: time-ordered, generated on the device, so offline saves sync idempotently. */
export function uuidv7(now = Date.now()): string {
  const b = Crypto.getRandomBytes(16);
  const ts = BigInt(now);
  for (let i = 0; i < 6; i++) b[i] = Number((ts >> BigInt(8 * (5 - i))) & 0xffn);
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function todayISO(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Family settings ──────────────────────────────────────────────────────
export function getFamily(): Family | null {
  const row = open().getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', 'family');
  return row ? (JSON.parse(row.value) as Family) : null;
}

export function saveFamily(f: Family): void {
  open().runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 'family', JSON.stringify(f));
}

/** The child's name and what they call you are always spelled your way. */
export function dictionaryFor(f: Family): DictionaryTerm[] {
  return [
    { term: f.childName, kind: 'child', heardAs: [] },
    { term: f.signsAs, kind: 'self', heardAs: [] },
  ].filter((d) => d.term.trim().length > 0) as DictionaryTerm[];
}

// ── Entries ──────────────────────────────────────────────────────────────
interface Row {
  id: string;
  kind: EntryKind;
  occurred_on: string;
  captured_at: string;
  capture_mode: CaptureMode;
  edit_level: EditLevel;
  prompt_key: string | null;
  engine_version: number;
  raw_transcript: string;
  machine_edits: string;
  final_text: string;
  in_book: number;
  sounds_like_me: number | null;
}

const fromRow = (r: Row): Entry => ({
  id: r.id,
  kind: r.kind,
  occurredOn: r.occurred_on,
  capturedAt: r.captured_at,
  captureMode: r.capture_mode,
  editLevel: r.edit_level,
  promptKey: r.prompt_key,
  engineVersion: r.engine_version,
  rawTranscript: r.raw_transcript,
  machineEdits: JSON.parse(r.machine_edits) as Edit[],
  finalText: r.final_text,
  inBook: r.in_book === 1,
  soundsLikeMe: r.sounds_like_me === null ? null : r.sounds_like_me === 1,
});

export function saveEntry(e: Entry): void {
  open().runSync(
    `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, prompt_key,
       engine_version, raw_transcript, machine_edits, final_text, in_book, sounds_like_me, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       final_text = excluded.final_text, machine_edits = excluded.machine_edits,
       edit_level = excluded.edit_level, in_book = excluded.in_book,
       sounds_like_me = excluded.sounds_like_me, updated_at = excluded.updated_at`,
    e.id, e.kind, e.occurredOn, e.capturedAt, e.captureMode, e.editLevel, e.promptKey,
    e.engineVersion, e.rawTranscript, JSON.stringify(e.machineEdits), e.finalText,
    e.inBook ? 1 : 0, e.soundsLikeMe === null ? null : e.soundsLikeMe ? 1 : 0, new Date().toISOString(),
  );
}

export function listEntries(): Entry[] {
  return open()
    .getAllSync<Row>('SELECT * FROM entries WHERE deleted_at IS NULL ORDER BY occurred_on DESC, captured_at DESC')
    .map(fromRow);
}

export function getEntry(id: string): Entry | null {
  const r = open().getFirstSync<Row>('SELECT * FROM entries WHERE id = ? AND deleted_at IS NULL', id);
  return r ? fromRow(r) : null;
}

/** Tombstone, never a hard delete (matches the server schema). */
export function deleteEntry(id: string): void {
  open().runSync('UPDATE entries SET deleted_at = ?, updated_at = ? WHERE id = ?', new Date().toISOString(), new Date().toISOString(), id);
}

export function undeleteEntry(id: string): void {
  open().runSync('UPDATE entries SET deleted_at = NULL, updated_at = ? WHERE id = ?', new Date().toISOString(), id);
}
