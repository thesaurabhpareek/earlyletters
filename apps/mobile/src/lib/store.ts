/**
 * Local-first store (PRD P0: nothing is ever lost).
 *
 * Every entry is written to SQLite on the phone before anything else
 * happens. Sync to Supabase comes later (PowerSync, ADR 0004) and will read
 * from these same rows. Column names mirror supabase/migrations so the
 * sync layer is a straight mapping.
 *
 * Multi-child: `children` holds one row per book; the active child lives in
 * `settings` under `activeChildId`. Every entry and draft carries `child_id`.
 * Per-child preferences are columns on `children`; device preferences are
 * `getSetting` / `setSetting`. API for other screens: src/lib/README.md.
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
  /** Book this entry belongs to. Defaults to the active child on save. */
  childId?: string;
  /** Author's account id; null until sign-in exists (all local entries are the phone owner's). */
  authorId?: string;
  /** Signature at save time ("Papa"), so a later rename never rewrites old letters. */
  authorSignsAs?: string;
  /** Local file URI of the AAC M4A recording (ADR 0005), kept in the app's document directory. */
  audioUri?: string | null;
  audioDurationMs?: number | null;
}

/** Single-child view of the active child (kept for existing callers). */
export interface Family {
  childName: string;
  childBirthday: string | null; // YYYY-MM-DD
  signsAs: string; // what the child calls this parent
  childDueDate?: string | null; // YYYY-MM-DD while expecting
}

export interface Child {
  id: string;
  name: string;
  birthday: string | null; // YYYY-MM-DD
  dueDate: string | null; // YYYY-MM-DD, set while expecting
  signsAs: string; // what this child calls the current user
  remindersOn: boolean;
  familyCanRead: boolean;
}

export interface NewChild {
  name: string;
  birthday: string | null;
  dueDate: string | null;
  signsAs: string;
}

export interface Member {
  id: string;
  signsAs: string;
  role: 'parent' | 'contributor';
  status: 'active' | 'invited';
}

/** An unfinished capture. Written before Review so a crash or a closed sheet loses nothing. */
export interface Draft {
  id: string;
  childId: string;
  captureMode: CaptureMode;
  promptKey: string | null;
  createdAt: string;
  audioUri: string | null;
  audioDurationMs: number | null;
  /** Immutable once set: the transcript exactly as heard (or typed). */
  rawTranscript: string | null;
  /** Typed text being written (Write screen autosave). */
  typedText: string | null;
}

let db: SQLite.SQLiteDatabase | null = null;
const listeners = new Set<() => void>();

/** Subscribe to any store change (child switch, save, delete). Returns an unsubscribe. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function changed(): void {
  listeners.forEach((l) => l());
}

function columns(d: SQLite.SQLiteDatabase, table: string): Set<string> {
  return new Set(d.getAllSync<{ name: string }>(`PRAGMA table_info(${table})`).map((c) => c.name));
}

function open(): SQLite.SQLiteDatabase {
  if (db) return db;
  const d = SQLite.openDatabaseSync('scribe.db');
  d.execSync(`
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

  // Additive migration for installs created before multi-child and audio.
  const have = columns(d, 'entries');
  const add: [string, string][] = [
    ['child_id', 'TEXT'],
    ['author_id', 'TEXT'],
    ['author_signs_as', 'TEXT'],
    ['audio_uri', 'TEXT'],
    ['audio_duration_ms', 'INTEGER'],
  ];
  for (const [name, type] of add) if (!have.has(name)) d.execSync(`ALTER TABLE entries ADD COLUMN ${name} ${type}`);
  d.execSync('CREATE INDEX IF NOT EXISTS entries_child ON entries (child_id, occurred_on) WHERE deleted_at IS NULL');

  // One-time: the single-child `family` setting becomes the first child.
  const childCount = d.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM children')?.n ?? 0;
  const legacy = d.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', 'family');
  if (childCount === 0 && legacy) {
    const f = JSON.parse(legacy.value) as Family;
    const id = uuidv7();
    const now = new Date().toISOString();
    d.withTransactionSync(() => {
      d.runSync(
        'INSERT INTO children (id, name, birthday, due_date, signs_as, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        id, f.childName, f.childBirthday, f.childDueDate ?? null, f.signsAs, now, now,
      );
      d.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 'activeChildId', id);
      d.runSync('UPDATE entries SET child_id = ? WHERE child_id IS NULL', id);
      d.runSync('DELETE FROM settings WHERE key = ?', 'family');
    });
  }
  db = d;
  return d;
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

// ── Device settings ──────────────────────────────────────────────────────
export function getSetting(key: string): string | null {
  return open().getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key)?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  open().runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, value);
  changed();
}

// ── Children ─────────────────────────────────────────────────────────────
interface ChildRow {
  id: string;
  name: string;
  birthday: string | null;
  due_date: string | null;
  signs_as: string;
  reminders_on: number;
  family_can_read: number;
}

const childFromRow = (r: ChildRow): Child => ({
  id: r.id,
  name: r.name,
  birthday: r.birthday,
  dueDate: r.due_date,
  signsAs: r.signs_as,
  remindersOn: r.reminders_on === 1,
  familyCanRead: r.family_can_read === 1,
});

/** Visible children, oldest book first. */
export function listChildren(): Child[] {
  return open()
    .getAllSync<ChildRow>('SELECT * FROM children WHERE hidden_at IS NULL ORDER BY created_at ASC')
    .map(childFromRow);
}

export function getChild(id: string): Child | null {
  const r = open().getFirstSync<ChildRow>('SELECT * FROM children WHERE id = ?', id);
  return r ? childFromRow(r) : null;
}

/** The active child's id, falling back to the first visible child. */
export function getActiveChildId(): string | null {
  const id = getSetting('activeChildId');
  const all = listChildren();
  return all.find((c) => c.id === id)?.id ?? all[0]?.id ?? null;
}

export function getActiveChild(): Child | null {
  const id = getActiveChildId();
  return id ? getChild(id) : null;
}

export function setActiveChildId(id: string): void {
  setSetting('activeChildId', id);
}

export function addChild(input: NewChild): Child {
  const id = uuidv7();
  const now = new Date().toISOString();
  open().runSync(
    'INSERT INTO children (id, name, birthday, due_date, signs_as, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    id, input.name, input.birthday, input.dueDate, input.signsAs, now, now,
  );
  if (!getSetting('activeChildId')) open().runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 'activeChildId', id);
  changed();
  return getChild(id)!;
}

export function updateChild(id: string, patch: Partial<Omit<Child, 'id'>>): void {
  const c = getChild(id);
  if (!c) return;
  const n = { ...c, ...patch };
  open().runSync(
    `UPDATE children SET name = ?, birthday = ?, due_date = ?, signs_as = ?, reminders_on = ?, family_can_read = ?, updated_at = ?
     WHERE id = ?`,
    n.name, n.birthday, n.dueDate, n.signsAs, n.remindersOn ? 1 : 0, n.familyCanRead ? 1 : 0, new Date().toISOString(), id,
  );
  changed();
}

/** "Hide this book" (PRD B F2.4): stops prompts for this child; restorable. */
export function hideChild(id: string): void {
  open().runSync('UPDATE children SET hidden_at = ?, updated_at = ? WHERE id = ?', new Date().toISOString(), new Date().toISOString(), id);
  changed();
}

export function unhideChild(id: string): void {
  open().runSync('UPDATE children SET hidden_at = NULL, updated_at = ? WHERE id = ?', new Date().toISOString(), id);
  changed();
}

export function listHiddenChildren(): Child[] {
  return open().getAllSync<ChildRow>('SELECT * FROM children WHERE hidden_at IS NOT NULL ORDER BY created_at ASC').map(childFromRow);
}

// ── Family view of the active child (stable, single-child API) ───────────
export function getFamily(): Family | null {
  const c = getActiveChild();
  return c ? { childName: c.name, childBirthday: c.birthday, signsAs: c.signsAs, childDueDate: c.dueDate } : null;
}

/** Updates the active child, or creates the first child. */
export function saveFamily(f: Family): void {
  const c = getActiveChild();
  const patch = { name: f.childName, birthday: f.childBirthday, dueDate: f.childDueDate ?? null, signsAs: f.signsAs };
  if (c) updateChild(c.id, patch);
  else setActiveChildId(addChild(patch).id);
}

/** The child's name and what they call you are always spelled your way. */
export function dictionaryFor(f: Family): DictionaryTerm[] {
  return [
    { term: f.childName, kind: 'child', heardAs: [] },
    { term: f.signsAs, kind: 'self', heardAs: [] },
  ].filter((d) => d.term.trim().length > 0) as DictionaryTerm[];
}

// ── Accounts and family members (not built yet: sign-in is PRD A) ────────
/** Null until sign-in exists. Every local entry belongs to this phone's user. */
export function currentUserId(): string | null {
  return null;
}

/** Plus entitlement (PRD C). False until purchases ship. */
export function hasPlus(): boolean {
  return false;
}

/** Invited family (needs accounts and sync). Empty until then. */
export function listMembers(_childId: string): Member[] {
  return [];
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
  child_id: string | null;
  author_id: string | null;
  author_signs_as: string | null;
  audio_uri: string | null;
  audio_duration_ms: number | null;
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
  childId: r.child_id ?? undefined,
  authorId: r.author_id ?? undefined,
  authorSignsAs: r.author_signs_as ?? undefined,
  audioUri: r.audio_uri,
  audioDurationMs: r.audio_duration_ms,
});

/**
 * Insert or update an entry. raw_transcript, captured_at and the audio file
 * are never changed after the first insert (raw_transcript is immutable).
 */
export function saveEntry(e: Entry): void {
  const childId = e.childId ?? getActiveChildId();
  const signsAs = e.authorSignsAs ?? (childId ? (getChild(childId)?.signsAs ?? null) : null);
  open().runSync(
    `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, prompt_key,
       engine_version, raw_transcript, machine_edits, final_text, in_book, sounds_like_me, updated_at,
       child_id, author_id, author_signs_as, audio_uri, audio_duration_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       final_text = excluded.final_text, machine_edits = excluded.machine_edits,
       edit_level = excluded.edit_level, in_book = excluded.in_book,
       sounds_like_me = excluded.sounds_like_me, child_id = excluded.child_id,
       updated_at = excluded.updated_at`,
    e.id, e.kind, e.occurredOn, e.capturedAt, e.captureMode, e.editLevel, e.promptKey,
    e.engineVersion, e.rawTranscript, JSON.stringify(e.machineEdits), e.finalText,
    e.inBook ? 1 : 0, e.soundsLikeMe === null ? null : e.soundsLikeMe ? 1 : 0, new Date().toISOString(),
    childId, e.authorId ?? null, signsAs, e.audioUri ?? null, e.audioDurationMs ?? null,
  );
  changed();
}

/** Entries for the active child (unchanged signature). */
export function listEntries(): Entry[] {
  const id = getActiveChildId();
  return id ? listEntriesForChild(id) : [];
}

export function listEntriesForChild(childId: string): Entry[] {
  return open()
    .getAllSync<Row>(
      'SELECT * FROM entries WHERE deleted_at IS NULL AND child_id = ? ORDER BY occurred_on DESC, captured_at DESC',
      childId,
    )
    .map(fromRow);
}

export function getEntry(id: string): Entry | null {
  const r = open().getFirstSync<Row>('SELECT * FROM entries WHERE id = ? AND deleted_at IS NULL', id);
  return r ? fromRow(r) : null;
}

export function setEntryInBook(id: string, inBook: boolean): void {
  open().runSync('UPDATE entries SET in_book = ?, updated_at = ? WHERE id = ?', inBook ? 1 : 0, new Date().toISOString(), id);
  changed();
}

/** Tombstone, never a hard delete (matches the server schema). */
export function deleteEntry(id: string): void {
  open().runSync('UPDATE entries SET deleted_at = ?, updated_at = ? WHERE id = ?', new Date().toISOString(), new Date().toISOString(), id);
  changed();
}

export function undeleteEntry(id: string): void {
  open().runSync('UPDATE entries SET deleted_at = NULL, updated_at = ? WHERE id = ?', new Date().toISOString(), id);
  changed();
}

// ── Drafts (capture in progress) ─────────────────────────────────────────
interface DraftRow {
  id: string;
  child_id: string;
  capture_mode: CaptureMode;
  prompt_key: string | null;
  created_at: string;
  audio_uri: string | null;
  audio_duration_ms: number | null;
  raw_transcript: string | null;
  typed_text: string | null;
}

const draftFromRow = (r: DraftRow): Draft => ({
  id: r.id,
  childId: r.child_id,
  captureMode: r.capture_mode,
  promptKey: r.prompt_key,
  createdAt: r.created_at,
  audioUri: r.audio_uri,
  audioDurationMs: r.audio_duration_ms,
  rawTranscript: r.raw_transcript,
  typedText: r.typed_text,
});

export function createDraft(input: Omit<Draft, 'id' | 'createdAt' | 'rawTranscript' | 'typedText'> & { typedText?: string | null }): Draft {
  const id = uuidv7();
  open().runSync(
    `INSERT INTO drafts (id, child_id, capture_mode, prompt_key, created_at, audio_uri, audio_duration_ms, typed_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id, input.childId, input.captureMode, input.promptKey, new Date().toISOString(),
    input.audioUri, input.audioDurationMs, input.typedText ?? null,
  );
  changed();
  return getDraft(id)!;
}

export function getDraft(id: string): Draft | null {
  const r = open().getFirstSync<DraftRow>('SELECT * FROM drafts WHERE id = ?', id);
  return r ? draftFromRow(r) : null;
}

export function listDrafts(childId: string): Draft[] {
  return open().getAllSync<DraftRow>('SELECT * FROM drafts WHERE child_id = ? ORDER BY created_at DESC', childId).map(draftFromRow);
}

/** Sets the raw transcript once. Later calls are ignored: raw is immutable. */
export function setDraftTranscript(id: string, raw: string): void {
  open().runSync('UPDATE drafts SET raw_transcript = ? WHERE id = ? AND raw_transcript IS NULL', raw, id);
}

export function setDraftTyped(id: string, text: string): void {
  open().runSync('UPDATE drafts SET typed_text = ? WHERE id = ?', text, id);
}

export function setDraftChild(id: string, childId: string): void {
  open().runSync('UPDATE drafts SET child_id = ? WHERE id = ?', childId, id);
}

export function deleteDraft(id: string): void {
  open().runSync('DELETE FROM drafts WHERE id = ?', id);
  changed();
}
