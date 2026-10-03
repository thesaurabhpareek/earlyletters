/**
 * Local-first store (PRD P0: nothing is ever lost).
 *
 * Every entry is written to SQLite on the phone before anything else
 * happens. After the first sign-in, every write here also queues its upload
 * in the same transaction (src/lib/sync: outbox push and cursor pull, D-023).
 * Column names mirror supabase/migrations so the sync layer is a straight
 * mapping.
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
import type { SweepDraft, SweepEntry } from './capture/sweep.logic';
import { expoSqlDb, OPEN_PRAGMAS } from './db/expo-adapter';
import { migrate } from './db/migrations';
import type { SqlDb } from './db/sql';
import {
  SYNC_SETTING,
  enqueueBookCreate,
  enqueueBookUpdate,
  enqueueEntryDelete,
  enqueueEntryRestore,
  enqueueEntryUpsert,
  enqueuePrefs,
  type EnqueueContext,
} from './sync/outbox';
import { signalOutbox } from './sync/signal';
import { ALL_GROUPS, type EntrySyncState, type FieldGroup } from './sync/types';

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
  /** SHA-256 (hex) of the audio file, computed when recording stopped (DATA-REQ-046). */
  audioSha256?: string | null;
  audioBytes?: number | null;
  /**
   * 'waiting': a spoken letter kept without words yet (transcriber not ready).
   * `rawTranscript` and `finalText` are '' until the words are set once
   * (setWordsForWaitingEntry). null: the letter has its words.
   */
  transcriptStatus?: TranscriptStatus;
  /** Upload state on this phone (sync/types.ts): local, pending ("Not sent yet"), synced, rejected, held, gone. */
  syncState?: EntrySyncState;
  /** Family review state from the server (not_needed, pending, added, set_aside); null before sync. */
  approval?: string | null;
}

export type TranscriptStatus = 'waiting' | null;

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
  /** From sync: true when this account started the book, false when it joined it. Absent for a book only on this phone. */
  createdByMe?: boolean;
  /** From sync: this account's role in the book. Absent for a book only on this phone. */
  role?: 'parent' | 'contributor';
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

/**
 * recording: the mic was live when this row was last written (created when
 * recording starts); ready: audio closed and hashed, or a typed draft;
 * unrecoverable: the file is empty, kept for the parent to decide.
 */
export type DraftState = 'recording' | 'ready' | 'unrecoverable';

/** An unfinished capture. Written when recording starts, so a crash or a closed sheet loses nothing. */
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
  state: DraftState;
  audioSha256: string | null;
  audioBytes: number | null;
  /** Set when the launch sweep recovered this take after a kill, or re-attached a stray file. */
  recoveredAt: string | null;
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

/**
 * Opens scribe.db, sets the durability pragmas and runs the versioned
 * migrator (src/lib/db/migrations.ts). A failed step rolls back and throws
 * `local_db_migration_failed:<n>`; the database is left as it was.
 */
function open(): SQLite.SQLiteDatabase {
  if (db) return db;
  const d = SQLite.openDatabaseSync('scribe.db');
  d.execSync(OPEN_PRAGMAS);
  migrate(expoSqlDb(d), { now: new Date().toISOString(), newId: () => uuidv7() });
  db = d;
  return d;
}

/** The schema version on this phone (`PRAGMA user_version`), for diagnostics. */
export function localSchemaVersion(): number {
  return open().getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0;
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

export function deleteSetting(key: string): void {
  open().runSync('DELETE FROM settings WHERE key = ?', key);
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
  role: string | null;
  created_by_me: number | null;
}

const childFromRow = (r: ChildRow): Child => {
  const c: Child = {
    id: r.id,
    name: r.name,
    birthday: r.birthday,
    dueDate: r.due_date,
    signsAs: r.signs_as,
    remindersOn: r.reminders_on === 1,
    familyCanRead: r.family_can_read === 1,
  };
  if (r.created_by_me !== null && r.created_by_me !== undefined) c.createdByMe = r.created_by_me === 1;
  if (r.role === 'parent' || r.role === 'contributor') c.role = r.role;
  return c;
};

/** Books this person left, or that were deleted on the server, are not listed (their own letters stay on the phone). */
const LISTED = "server_state NOT IN ('left', 'deleted')";

/** Visible children, oldest book first. */
export function listChildren(): Child[] {
  return open()
    .getAllSync<ChildRow>(`SELECT * FROM children WHERE hidden_at IS NULL AND ${LISTED} ORDER BY created_at ASC`)
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
  const d = open();
  d.withTransactionSync(() => {
    d.runSync(
      'INSERT INTO children (id, name, birthday, due_date, signs_as, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      id, input.name, input.birthday, input.dueDate, input.signsAs, now, now,
    );
    if (!getSetting('activeChildId')) d.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 'activeChildId', id);
    // After the first sign-in a new book is queued for the server (before it, ownership.ts sends every book at once).
    enqueueBookCreate(sqlOf(d), id, enqueueContext());
  });
  changed();
  signalOutbox();
  return getChild(id)!;
}

export function updateChild(id: string, patch: Partial<Omit<Child, 'id'>>): void {
  const c = getChild(id);
  if (!c) return;
  const n = { ...c, ...patch };
  const d = open();
  d.withTransactionSync(() => {
    d.runSync(
      `UPDATE children SET name = ?, birthday = ?, due_date = ?, signs_as = ?, reminders_on = ?, family_can_read = ?, updated_at = ?
       WHERE id = ?`,
      n.name, n.birthday, n.dueDate, n.signsAs, n.remindersOn ? 1 : 0, n.familyCanRead ? 1 : 0, new Date().toISOString(), id,
    );
    // Book settings (parents, per field) and my per-book preferences travel separately.
    const book: Record<string, unknown> = {};
    if (n.name !== c.name) book.name = n.name;
    if (n.birthday !== c.birthday) book.date_of_birth = n.birthday;
    if (n.dueDate !== c.dueDate) book.due_date = n.dueDate;
    if (n.familyCanRead !== c.familyCanRead) book.family_can_read = n.familyCanRead;
    const prefs: Record<string, unknown> = {};
    if (n.signsAs !== c.signsAs) prefs.signs_as = n.signsAs;
    if (n.remindersOn !== c.remindersOn) prefs.include_in_reminders = n.remindersOn;
    enqueueBookUpdate(sqlOf(d), id, book, enqueueContext());
    enqueuePrefs(sqlOf(d), id, prefs, enqueueContext());
  });
  changed();
  signalOutbox();
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
  return open()
    .getAllSync<ChildRow>(`SELECT * FROM children WHERE hidden_at IS NOT NULL AND ${LISTED} ORDER BY created_at ASC`)
    .map(childFromRow);
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
/**
 * The account that owns this phone's letters: set once, at the first sign-in,
 * when sync claims the local data (sync/ownership.ts). Null before that, when
 * every local entry is this phone's user's.
 */
export function currentUserId(): string | null {
  return getSetting(SYNC_SETTING.owner);
}

// Plus (hasPlus, isJoinedBook, newChildNeedsPlus) lives in lib/billing: StoreKit 2
// on this phone through the plan engine (ADR 0013). This file stays free of it.

/** The other members of a book, as the server last listed them (sync_books.members). Empty for a book only on this phone. */
export function listMembers(childId: string): Member[] {
  const r = open().getFirstSync<{ members: string | null }>('SELECT members FROM sync_books WHERE child_id = ?', childId);
  if (!r?.members) return [];
  try {
    const list = JSON.parse(r.members) as { profile_id: string; role: string; is_me: boolean; signs_as: string | null }[];
    return list
      .filter((m) => !m.is_me)
      .map((m): Member => ({ id: m.profile_id, signsAs: m.signs_as ?? '', role: m.role === 'contributor' ? 'contributor' : 'parent', status: 'active' }));
  } catch {
    return [];
  }
}

// ── Sync hooks (src/lib/sync) ─────────────────────────────────────────────
function sqlOf(d: SQLite.SQLiteDatabase): SqlDb {
  return expoSqlDb(d);
}

function enqueueContext(): EnqueueContext {
  return { now: new Date().toISOString(), newId: () => uuidv7() };
}

/** The local database for the sync engine (same connection as the store). */
export function localSqlDb(): SqlDb {
  return expoSqlDb(open());
}

/** Lets the sync engine re-render screens after it merged server changes. */
export function notifyStoreChanged(): void {
  changed();
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
  sync_state: string | null;
  approval: string | null;
  child_id: string | null;
  author_id: string | null;
  author_signs_as: string | null;
  audio_uri: string | null;
  audio_duration_ms: number | null;
  audio_sha256: string | null;
  audio_bytes: number | null;
  transcript_status: string | null;
}

function parseEdits(json: string): Edit[] {
  try {
    const v = JSON.parse(json) as unknown;
    return Array.isArray(v) ? (v as Edit[]) : [];
  } catch {
    return []; // a damaged edit list must never hide the letter itself
  }
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
  machineEdits: parseEdits(r.machine_edits),
  finalText: r.final_text,
  inBook: r.in_book === 1,
  soundsLikeMe: r.sounds_like_me === null ? null : r.sounds_like_me === 1,
  childId: r.child_id ?? undefined,
  authorId: r.author_id ?? undefined,
  authorSignsAs: r.author_signs_as ?? undefined,
  audioUri: r.audio_uri,
  audioDurationMs: r.audio_duration_ms,
  audioSha256: r.audio_sha256,
  audioBytes: r.audio_bytes,
  transcriptStatus: r.transcript_status === 'waiting' ? 'waiting' : null,
  syncState: (r.sync_state ?? 'local') as EntrySyncState,
  approval: r.approval,
});

/** The one INSERT for entries. Callers decide whether it runs alone or inside a transaction. */
function writeEntry(d: SQLite.SQLiteDatabase, e: Entry): void {
  const childId = e.childId ?? getActiveChildId();
  const signsAs = e.authorSignsAs ?? (childId ? (getChild(childId)?.signsAs ?? null) : null);
  d.runSync(
    `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, prompt_key,
       engine_version, raw_transcript, machine_edits, final_text, in_book, sounds_like_me, updated_at,
       child_id, author_id, author_signs_as, audio_uri, audio_duration_ms, audio_sha256, audio_bytes, transcript_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       final_text = excluded.final_text, machine_edits = excluded.machine_edits,
       edit_level = excluded.edit_level, in_book = excluded.in_book,
       sounds_like_me = excluded.sounds_like_me,
       child_id = CASE WHEN entries.synced_at IS NULL THEN excluded.child_id ELSE entries.child_id END,
       updated_at = excluded.updated_at`,
    e.id, e.kind, e.occurredOn, e.capturedAt, e.captureMode, e.editLevel, e.promptKey,
    e.engineVersion, e.rawTranscript, JSON.stringify(e.machineEdits), e.finalText,
    e.inBook ? 1 : 0, e.soundsLikeMe === null ? null : e.soundsLikeMe ? 1 : 0, new Date().toISOString(),
    childId, e.authorId ?? null, signsAs, e.audioUri ?? null, e.audioDurationMs ?? null,
    e.audioSha256 ?? null, e.audioBytes ?? null, e.transcriptStatus ?? null,
  );
}

/**
 * Insert or update an entry that has no draft (typed "not much" lines, dev
 * seed). raw_transcript, captured_at, the audio file and, once synced,
 * child_id are never changed after the first insert (DATA-REQ-040).
 * Capture screens use saveLetterFromDraft instead.
 */
export function saveEntry(e: Entry): void {
  const d = open();
  d.withTransactionSync(() => {
    writeEntry(d, e);
    enqueueEntryUpsert(sqlOf(d), e.id, ALL_GROUPS, enqueueContext());
  });
  changed();
  signalOutbox();
}

export class AudioMissingError extends Error {
  constructor() {
    super('audio_missing');
  }
}

/**
 * Review's save (DATA-REQ-048): the letter is inserted and its draft removed
 * in one transaction, so a kill leaves either the full letter or the intact
 * draft, never both and never neither. The audio must already be closed and
 * hashed (`e.audioSha256`, see capture/recorder.ts `ensureAudioHash`); a
 * spoken letter whose file is gone is refused rather than saved pointing at
 * nothing (`audioExists` is checked by the caller just before).
 */
export function saveLetterFromDraft(draftId: string, e: Entry, audioExists = true): void {
  if (e.audioUri && !audioExists) throw new AudioMissingError();
  const d = open();
  d.withTransactionSync(() => {
    writeEntry(d, { ...e, id: draftId });
    d.runSync('DELETE FROM drafts WHERE id = ?', draftId);
    // Held while waiting for its words (outbox.ts): the raw transcript is set once, later.
    enqueueEntryUpsert(sqlOf(d), draftId, ALL_GROUPS, enqueueContext());
  });
  changed();
  signalOutbox();
}

/**
 * Keep a spoken letter without words (TDD 03 FM-9, TDD 01 3.6): the
 * recording is the true original; words are set once later
 * (setWordsForWaitingEntry). Saved private unless the parent chose the book.
 */
export function saveVoiceOnlyFromDraft(
  draft: Draft,
  opts: { childId: string; authorSignsAs: string; inBook: boolean; engineVersion: number; audioExists?: boolean },
): Entry {
  if (!draft.audioUri || opts.audioExists === false) throw new AudioMissingError();
  const entry: Entry = {
    id: draft.id,
    kind: 'letter',
    occurredOn: todayISO(new Date(draft.createdAt)),
    capturedAt: draft.createdAt,
    captureMode: 'spoken',
    editLevel: 'verbatim',
    promptKey: draft.promptKey,
    engineVersion: opts.engineVersion,
    rawTranscript: '',
    machineEdits: [],
    finalText: '',
    inBook: opts.inBook,
    soundsLikeMe: null,
    childId: opts.childId,
    authorSignsAs: opts.authorSignsAs,
    audioUri: draft.audioUri,
    audioDurationMs: draft.audioDurationMs,
    audioSha256: draft.audioSha256,
    audioBytes: draft.audioBytes,
    transcriptStatus: 'waiting',
  };
  saveLetterFromDraft(draft.id, entry);
  return entry;
}

/** Spoken letters still waiting for their words, oldest first (the transcription queue reads this). */
export function listWaitingForWords(childId: string): Entry[] {
  return open()
    .getAllSync<Row>(
      "SELECT * FROM entries WHERE child_id = ? AND deleted_at IS NULL AND transcript_status = 'waiting' ORDER BY captured_at ASC",
      childId,
    )
    .map(fromRow);
}

/**
 * Sets the words of a voice-only letter, once. raw_transcript is written
 * only while it is still '' and the letter is waiting: the first transcript
 * that exists becomes the immutable raw (TDD 03 FM-9). Returns false if the
 * letter already had words.
 */
export function setWordsForWaitingEntry(
  id: string,
  w: { rawTranscript: string; machineEdits: Edit[]; finalText: string; editLevel: EditLevel; engineVersion: number },
): boolean {
  const d = open();
  let done = false;
  d.withTransactionSync(() => {
    const res = d.runSync(
      `UPDATE entries SET raw_transcript = ?, machine_edits = ?, final_text = ?, edit_level = ?, engine_version = ?,
         transcript_status = NULL, updated_at = ?
       WHERE id = ? AND transcript_status = 'waiting' AND raw_transcript = ''`,
      w.rawTranscript, JSON.stringify(w.machineEdits), w.finalText, w.editLevel, w.engineVersion, new Date().toISOString(), id,
    );
    done = res.changes === 1;
    // The words exist now: the letter's first upload (it was held while waiting).
    if (done) enqueueEntryUpsert(sqlOf(d), id, ALL_GROUPS, enqueueContext());
  });
  if (done) {
    changed();
    signalOutbox();
  }
  return done;
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

/** One local write plus its upload op, in one transaction (a kill leaves both or neither). */
function writeAndQueue(write: (d: SQLite.SQLiteDatabase) => void, queue: (db: SqlDb) => void): void {
  const d = open();
  d.withTransactionSync(() => {
    write(d);
    queue(sqlOf(d));
  });
  changed();
  signalOutbox();
}

const IN_BOOK: FieldGroup[] = ['in_book'];

export function setEntryInBook(id: string, inBook: boolean): void {
  writeAndQueue(
    (d) => d.runSync('UPDATE entries SET in_book = ?, updated_at = ? WHERE id = ?', inBook ? 1 : 0, new Date().toISOString(), id),
    (db) => enqueueEntryUpsert(db, id, IN_BOOK, enqueueContext()),
  );
}

/** Tombstone, never a hard delete (matches the server schema). The server clock sets the real deleted_at. */
export function deleteEntry(id: string): void {
  writeAndQueue(
    (d) => d.runSync('UPDATE entries SET deleted_at = ?, updated_at = ? WHERE id = ?', new Date().toISOString(), new Date().toISOString(), id),
    (db) => enqueueEntryDelete(db, id, enqueueContext()),
  );
}

/**
 * Restore from Recently deleted: live here at once; on the server through
 * restore_entry() (never by clearing deleted_at, which the server refuses).
 */
export function undeleteEntry(id: string): void {
  writeAndQueue(
    (d) => d.runSync('UPDATE entries SET deleted_at = NULL, updated_at = ? WHERE id = ?', new Date().toISOString(), id),
    (db) => enqueueEntryRestore(db, id, enqueueContext()),
  );
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
  state: string;
  audio_sha256: string | null;
  audio_bytes: number | null;
  recovered_at: string | null;
}

const draftState = (s: string): DraftState => (s === 'recording' || s === 'unrecoverable' ? s : 'ready');

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
  state: draftState(r.state),
  audioSha256: r.audio_sha256,
  audioBytes: r.audio_bytes,
  recoveredAt: r.recovered_at,
});

type NewDraft = Pick<Draft, 'childId' | 'captureMode' | 'promptKey' | 'audioUri' | 'audioDurationMs'> & {
  typedText?: string | null;
  state?: DraftState;
  audioSha256?: string | null;
  audioBytes?: number | null;
  recoveredAt?: string | null;
  /** Defaults to now. The launch sweep passes the file's own time. */
  createdAt?: string;
};

export function createDraft(input: NewDraft): Draft {
  const id = uuidv7();
  open().runSync(
    `INSERT INTO drafts (id, child_id, capture_mode, prompt_key, created_at, audio_uri, audio_duration_ms, typed_text,
       state, audio_sha256, audio_bytes, recovered_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, input.childId, input.captureMode, input.promptKey, input.createdAt ?? new Date().toISOString(),
    input.audioUri, input.audioDurationMs, input.typedText ?? null,
    input.state ?? 'ready', input.audioSha256 ?? null, input.audioBytes ?? null, input.recoveredAt ?? null,
  );
  changed();
  return getDraft(id)!;
}

/**
 * Draft-first recording (TDD 01 3.4 rule 1): the row exists, with the file
 * path, before the microphone goes live. A kill mid-take leaves a
 * `recording` row the launch sweep can recover.
 */
export function createRecordingDraft(input: { childId: string; promptKey: string | null; audioUri: string | null }): Draft {
  return createDraft({ ...input, captureMode: 'spoken', audioDurationMs: 0, state: 'recording' });
}

/** Elapsed time so far, written every few seconds so a recovered take shows a sensible length. */
export function setRecordingProgress(id: string, durationMs: number): void {
  open().runSync("UPDATE drafts SET audio_duration_ms = ? WHERE id = ? AND state = 'recording'", Math.round(durationMs), id);
}

/**
 * The take is closed: one statement records where the file is, its length,
 * size and SHA-256, and the new state. A null hash means hashing failed; the
 * audio is still kept and hashed again before save.
 */
export function finalizeDraftAudio(
  id: string,
  f: { audioUri?: string | null; durationMs?: number | null; sha256: string | null; bytes: number | null; state: DraftState; recovered?: boolean },
): void {
  open().runSync(
    `UPDATE drafts SET audio_uri = COALESCE(?, audio_uri), audio_duration_ms = COALESCE(?, audio_duration_ms),
       audio_sha256 = ?, audio_bytes = ?, state = ?, recovered_at = CASE WHEN ? THEN ? ELSE recovered_at END
     WHERE id = ?`,
    f.audioUri ?? null, f.durationMs == null ? null : Math.round(f.durationMs), f.sha256, f.bytes, f.state,
    f.recovered ? 1 : 0, new Date().toISOString(), id,
  );
  changed();
}

/** Stores the hash computed just before save, for drafts finalized without one. */
export function setDraftAudioHash(id: string, sha256: string, bytes: number): void {
  open().runSync('UPDATE drafts SET audio_sha256 = ?, audio_bytes = ? WHERE id = ?', sha256, bytes, id);
}

export function getDraft(id: string): Draft | null {
  const r = open().getFirstSync<DraftRow>('SELECT * FROM drafts WHERE id = ?', id);
  return r ? draftFromRow(r) : null;
}

/** Drafts waiting to be read back, newest first. A take still recording is not listed. */
export function listDrafts(childId: string): Draft[] {
  return open()
    .getAllSync<DraftRow>("SELECT * FROM drafts WHERE child_id = ? AND state != 'recording' ORDER BY created_at DESC", childId)
    .map(draftFromRow);
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

/** Removes the row only. Audio files are deleted by the explicit Discard in Listen, never here. */
export function deleteDraft(id: string): void {
  open().runSync('DELETE FROM drafts WHERE id = ?', id);
  changed();
}

// ── Launch sweep support (capture/sweep.ts) ──────────────────────────────
/** Every row that points at audio, tombstoned letters included. */
export function audioRows(): { drafts: SweepDraft[]; entries: SweepEntry[] } {
  const d = open();
  return {
    drafts: d
      .getAllSync<{ id: string; audio_uri: string | null; state: string }>('SELECT id, audio_uri, state FROM drafts')
      .map((r) => ({ id: r.id, audioUri: r.audio_uri, state: r.state })),
    entries: d
      .getAllSync<{ id: string; audio_uri: string }>('SELECT id, audio_uri FROM entries WHERE audio_uri IS NOT NULL')
      .map((r) => ({ id: r.id, audioUri: r.audio_uri })),
  };
}

/** The app container moved (iOS update): point the row at the same file's current path. */
export function rebaseAudioUri(table: 'drafts' | 'entries', id: string, uri: string): void {
  open().runSync(`UPDATE ${table === 'drafts' ? 'drafts' : 'entries'} SET audio_uri = ? WHERE id = ?`, uri, id);
}

export interface OrphanAudio {
  fileName: string;
  bytes: number | null;
  foundAt: string;
}

/** Recordings on this phone with no letter (Settings > Recordings). Never deleted automatically. */
export function listOrphanAudio(): OrphanAudio[] {
  return open()
    .getAllSync<{ file_name: string; bytes: number | null; found_at: string }>('SELECT * FROM orphan_audio ORDER BY found_at ASC')
    .map((r) => ({ fileName: r.file_name, bytes: r.bytes, foundAt: r.found_at }));
}

export function reportOrphanAudio(fileName: string, bytes: number | null): void {
  open().runSync('INSERT OR IGNORE INTO orphan_audio (file_name, bytes, found_at) VALUES (?, ?, ?)', fileName, bytes, new Date().toISOString());
  changed();
}

/** A stray recording becomes a draft on a book (it shows on Tonight), in one transaction with its report row. */
export function reattachOrphanAudio(
  fileName: string,
  input: { childId: string; audioUri: string; createdAt: string; sha256: string | null; bytes: number | null; state: DraftState },
): Draft {
  const d = open();
  const id = uuidv7(Date.parse(input.createdAt) || Date.now());
  d.withTransactionSync(() => {
    d.runSync(
      `INSERT INTO drafts (id, child_id, capture_mode, prompt_key, created_at, audio_uri, audio_duration_ms,
         state, audio_sha256, audio_bytes, recovered_at)
       VALUES (?, ?, 'spoken', NULL, ?, ?, NULL, ?, ?, ?, ?)`,
      id, input.childId, input.createdAt, input.audioUri, input.state, input.sha256, input.bytes, new Date().toISOString(),
    );
    d.runSync('DELETE FROM orphan_audio WHERE file_name = ?', fileName);
  });
  changed();
  return getDraft(id)!;
}
