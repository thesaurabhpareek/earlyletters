/**
 * Local-first store (PRD P0: nothing is ever lost). The facade screens use.
 *
 * Every entry is written to SQLite on the phone before anything else
 * happens. After the first sign-in, every write here also queues its upload
 * in the same transaction (src/lib/sync: outbox push and cursor pull, D-023).
 * Sign-in and sync are off in v1.0 (lib/capabilities.ts), so the queue stays
 * empty there.
 *
 * Layout (MOB-04): this file owns the one connection, resolves defaults
 * (active child, the signature at save time) and emits change events. The
 * SQL and the write rules live in `db/repos/*`, which are engine-neutral
 * (`SqlDb`) and tested in Node against a real SQLite engine. This file never
 * imports expo-sqlite; `db/repos/open-native.ts` opens the file.
 *
 * Boot: call `openStore()` once and branch on its result (WS-07). Any other
 * call opens lazily and throws the open error, as before.
 *
 * Multi-child: `children` holds one row per book; the active child lives in
 * `settings` under `activeChildId`. Every entry and draft carries `child_id`.
 * API for other screens: src/lib/README.md.
 */
import * as Crypto from 'expo-crypto';
import type { DictionaryTerm, Edit, EditLevel } from '@scribe/core';
import type { SweepDraft, SweepEntry } from './capture/sweep.logic';
import { migrate, userVersion, type MigrationResult } from './db/migrations';
import type { SqlDb } from './db/sql';
import {
  children,
  createChangeBus,
  drafts,
  entries,
  letters,
  orphans,
  settings,
  uuidv7From,
  type Child,
  type Draft,
  type DraftState,
  type Entry,
  type Family,
  type Member,
  type NewChild,
  type OrphanAudio,
  type RepoContext,
  type Table,
} from './db/repos';
import type { NewDraft } from './db/repos/drafts';
import { openNativeDb, type OpenedDb } from './db/repos/open-native';
import { capabilities } from './capabilities';
import { SHELF_DAYS } from './shelf-days';
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
import { ALL_GROUPS, type FieldGroup } from './sync/types';

export type {
  CaptureMode,
  Child,
  Draft,
  DraftState,
  Entry,
  EntryKind,
  Family,
  Member,
  NewChild,
  OrphanAudio,
  TranscriptStatus,
} from './db/repos';
export type { Table as StoreTable } from './db/repos';
export { AudioMissingError } from './db/repos/letters';
export { EntryTombstonedError } from './db/repos/entries';
export type { DeletedEntry } from './db/repos/entries';

// ── Connection ───────────────────────────────────────────────────────────
export const DB_FILE_NAME = 'scribe.db';

/** Opening failed before or during migration. Code only: SQLite text can quote values. */
export class StoreOpenError extends Error {
  constructor(cause: unknown) {
    super('local_db_open_failed');
    this.cause = cause;
  }
}

/**
 * What `openStore()` reports to boot (WS-07):
 * - `{ ok: true, newer: false, error: null }`: migrated to the latest version; use the app.
 * - `{ ok: false, newer: true, error: null }`: the file was written by a newer build
 *   (an update rolled back). It is left untouched; show "update the app".
 * - `{ ok: false, newer: false, error }`: open or migration failed and rolled back.
 *   `error` is a MigrationError (`local_db_migration_failed:<n>`) or a
 *   StoreOpenError (`local_db_open_failed`). Show recovery; `openStore()` may be called again.
 */
export interface OpenStoreResult {
  ok: boolean;
  newer: boolean;
  error: Error | null;
  /** Versions before and after this open; null when the file could not be opened. */
  migration: MigrationResult | null;
}

export interface OpenStoreOptions {
  /** Opens the database. Defaults to expo-sqlite on `scribe.db`; tests pass a node:sqlite opener. */
  open?: () => OpenedDb;
  /** Clock for stamps. Defaults to the device clock. */
  now?: () => string;
  /** Row id maker. Defaults to `uuidv7`. */
  newId?: (atMs?: number) => string;
}

let conn: { opened: OpenedDb; ctx: RepoContext; result: OpenStoreResult } | null = null;
const bus = createChangeBus();

/**
 * Opens the database, sets the durability pragmas and runs the versioned
 * migrator. Idempotent once it has succeeded (later calls return the same
 * result, options ignored); after a failure the next call tries again.
 * Never throws.
 *
 * A newer file stays open, so the lazy calls below keep working as they did
 * before this facade (MOB-09 makes boot stop on `newer`; WS-07).
 */
export function openStore(options: OpenStoreOptions = {}): OpenStoreResult {
  if (conn) return conn.result;
  const now = options.now ?? (() => new Date().toISOString());
  const newId = options.newId ?? ((atMs?: number) => uuidv7(atMs));
  let opened: OpenedDb;
  try {
    opened = (options.open ?? (() => openNativeDb(DB_FILE_NAME)))();
  } catch (e) {
    return { ok: false, newer: false, error: new StoreOpenError(e), migration: null };
  }
  let migration: MigrationResult;
  try {
    migration = migrate(opened.db, { now: now(), newId: () => newId() });
  } catch (e) {
    try {
      opened.close();
    } catch {
      // already failing; the migration error is the one to report
    }
    return { ok: false, newer: false, error: e instanceof Error ? e : new StoreOpenError(e), migration: null };
  }
  const result: OpenStoreResult = { ok: !migration.newer, newer: migration.newer, error: null, migration };
  conn = { opened, ctx: { db: opened.db, now, newId }, result };
  return result;
}

/** Closes the connection; the next call opens again. For tests and a future "reset this phone". */
export function closeStore(): void {
  const c = conn;
  conn = null;
  c?.opened.close();
}

/** The repository context, opening on first use. Throws the open error, as before. */
function ctx(): RepoContext {
  if (conn) return conn.ctx;
  const r = openStore();
  const c = conn as { ctx: RepoContext } | null; // openStore sets it on success
  if (!c) throw r.error ?? new StoreOpenError(null);
  return c.ctx;
}

/** What the outbox needs to queue an upload in the same transaction as the write. */
function enqueueContext(c: RepoContext): EnqueueContext {
  return { now: c.now(), newId: () => c.newId() };
}

/** The local database for the sync engine (same connection as the store). */
export function localSqlDb(): SqlDb {
  return ctx().db;
}

/** Lets the sync engine re-render screens after it merged server changes. */
export function notifyStoreChanged(): void {
  bus.emit('settings', 'children', 'entries', 'drafts', 'orphan_audio');
}

// ── Change events (MOB-05) ───────────────────────────────────────────────
/** Subscribe to any store change (child switch, save, delete). Returns an unsubscribe. */
export function subscribe(listener: () => void): () => void {
  return bus.subscribe(listener);
}

/**
 * Subscribe to changes of some tables only, for example `subscribeTo('entries', read)`
 * on a screen that lists letters. The listener receives the tables that changed.
 */
export function subscribeTo(tables: Table | readonly Table[], listener: (changed: readonly Table[]) => void): () => void {
  return bus.subscribeTo(tables, listener);
}

/** The schema version on this phone (`PRAGMA user_version`), for diagnostics. */
export function localSchemaVersion(): number {
  return userVersion(ctx().db);
}

/** UUIDv7: time-ordered, generated on the device, so offline saves sync idempotently. */
export function uuidv7(now = Date.now()): string {
  return uuidv7From(Crypto.getRandomBytes(16), now);
}

export function todayISO(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Device settings ──────────────────────────────────────────────────────
export function getSetting(key: string): string | null {
  return settings.getSetting(ctx(), key);
}

export function setSetting(key: string, value: string): void {
  settings.setSetting(ctx(), key, value);
  bus.emit('settings');
}

export function deleteSetting(key: string): void {
  settings.deleteSetting(ctx(), key);
  bus.emit('settings');
}

// ── Children ─────────────────────────────────────────────────────────────
/** Visible children, oldest book first. */
export function listChildren(): Child[] {
  return children.listVisible(ctx());
}

export function getChild(id: string): Child | null {
  return children.get(ctx(), id);
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
  const c = ctx();
  const id = c.newId();
  const tables: Table[] = ['children'];
  c.db.transaction(() => {
    children.insert(c, id, input);
    if (!settings.getSetting(c, 'activeChildId')) {
      settings.setSetting(c, 'activeChildId', id);
      tables.push('settings');
    }
    // After the first sign-in a new book is queued for the server (before it, ownership.ts sends every book at once).
    enqueueBookCreate(c.db, id, enqueueContext(c));
  });
  bus.emit(...tables);
  signalOutbox();
  return children.get(c, id)!;
}

export function updateChild(id: string, patch: Partial<Omit<Child, 'id'>>): void {
  const c = ctx();
  const before = children.get(c, id);
  if (!before) return;
  const n = { ...before, ...patch };
  c.db.transaction(() => {
    children.update(c, id, patch);
    // Book settings (parents, per field) and my per-book preferences travel separately.
    const book: Record<string, unknown> = {};
    if (n.name !== before.name) book.name = n.name;
    if (n.birthday !== before.birthday) book.date_of_birth = n.birthday;
    if (n.dueDate !== before.dueDate) book.due_date = n.dueDate;
    if (n.familyCanRead !== before.familyCanRead) book.family_can_read = n.familyCanRead;
    const prefs: Record<string, unknown> = {};
    if (n.signsAs !== before.signsAs) prefs.signs_as = n.signsAs;
    if (n.remindersOn !== before.remindersOn) prefs.include_in_reminders = n.remindersOn;
    enqueueBookUpdate(c.db, id, book, enqueueContext(c));
    enqueuePrefs(c.db, id, prefs, enqueueContext(c));
  });
  bus.emit('children');
  signalOutbox();
}

/** "Hide this book" (PRD B F2.4): stops prompts for this child; restorable. */
export function hideChild(id: string): void {
  children.hide(ctx(), id);
  bus.emit('children');
}

export function unhideChild(id: string): void {
  children.unhide(ctx(), id);
  bus.emit('children');
}

export function listHiddenChildren(): Child[] {
  return children.listHidden(ctx());
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

// ── Accounts and family members (sync/ownership.ts, sync_books) ──────────
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
  const r = ctx().db.get<{ members: string | null }>('SELECT members FROM sync_books WHERE child_id = ?', childId);
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

// ── Entries ──────────────────────────────────────────────────────────────
/**
 * Defaults for a first insert, resolved here (not in the repository): the
 * book is the active child, the signature is what that child calls you now.
 * Ignored by the database when the row already exists.
 */
function insertDefaults(e: Entry): entries.InsertDefaults {
  const childId = e.childId ?? getActiveChildId();
  const authorSignsAs = e.authorSignsAs ?? (childId ? (getChild(childId)?.signsAs ?? null) : null);
  return { childId, authorSignsAs };
}

/**
 * Insert or update an entry that has no draft (typed "not much" lines, dev
 * seed). raw_transcript, captured_at, the audio file and, once synced,
 * child_id are never changed after the first insert (DATA-REQ-040). An
 * update without `childId` keeps the stored book. Throws
 * EntryTombstonedError for a deleted letter. Capture screens use
 * saveLetterFromDraft instead.
 */
export function saveEntry(e: Entry): void {
  const c = ctx();
  c.db.transaction(() => {
    entries.upsert(c, e, insertDefaults(e));
    enqueueEntryUpsert(c.db, e.id, ALL_GROUPS, enqueueContext(c));
  });
  bus.emit('entries');
  signalOutbox();
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
  const c = ctx();
  // Held while waiting for its words (outbox.ts): the raw transcript is set once, later.
  letters.saveFromDraft(c, draftId, e, insertDefaults(e), audioExists, () =>
    enqueueEntryUpsert(c.db, draftId, ALL_GROUPS, enqueueContext(c)),
  );
  bus.emit('entries', 'drafts');
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
  if (opts.audioExists === false) throw new letters.AudioMissingError();
  const entry = letters.voiceOnlyEntry(draft, { ...opts, occurredOn: todayISO(new Date(draft.createdAt)) });
  saveLetterFromDraft(draft.id, entry);
  return entry;
}

/** Spoken letters still waiting for their words, oldest first (the transcription queue reads this). */
export function listWaitingForWords(childId: string): Entry[] {
  return entries.listWaiting(ctx(), childId);
}

/**
 * Sets the words of a voice-only letter, once. raw_transcript is written
 * only while it is still '' and the letter is waiting: the first transcript
 * that exists becomes the immutable raw (TDD 03 FM-9). Returns false if the
 * letter already had words or was deleted.
 */
export function setWordsForWaitingEntry(
  id: string,
  w: { rawTranscript: string; machineEdits: Edit[]; finalText: string; editLevel: EditLevel; engineVersion: number },
): boolean {
  const c = ctx();
  let done = false;
  c.db.transaction(() => {
    done = entries.setWordsOnce(c, id, w);
    // The words exist now: the letter's first upload (it was held while waiting).
    if (done) enqueueEntryUpsert(c.db, id, ALL_GROUPS, enqueueContext(c));
  });
  if (done) {
    bus.emit('entries');
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
  return entries.listForChild(ctx(), childId);
}

export function getEntry(id: string): Entry | null {
  return entries.get(ctx(), id);
}

const IN_BOOK: FieldGroup[] = ['in_book'];

/** Add to book / make private. Never touches text. Returns false for a missing or deleted letter. */
export function setEntryInBook(id: string, inBook: boolean): boolean {
  const c = ctx();
  let done = false;
  c.db.transaction(() => {
    done = entries.setInBook(c, id, inBook);
    if (done) enqueueEntryUpsert(c.db, id, IN_BOOK, enqueueContext(c));
  });
  if (done) {
    bus.emit('entries');
    signalOutbox();
  }
  return done;
}

/** Tombstone, never a hard delete (matches the server schema). The server clock sets the real deleted_at. */
export function deleteEntry(id: string): void {
  const c = ctx();
  let done = false;
  c.db.transaction(() => {
    done = entries.tombstone(c, id);
    if (done) enqueueEntryDelete(c.db, id, enqueueContext(c));
  });
  if (done) {
    bus.emit('entries');
    signalOutbox();
  }
}

/**
 * Restore from Recently deleted: live here at once; on the server through
 * restore_entry() (never by clearing deleted_at, which the server refuses).
 */
export function undeleteEntry(id: string): void {
  const c = ctx();
  let done = false;
  c.db.transaction(() => {
    done = entries.undelete(c, id);
    if (done) enqueueEntryRestore(c.db, id, enqueueContext(c));
  });
  if (done) {
    bus.emit('entries');
    signalOutbox();
  }
}

// ── Recently deleted (D-085) ─────────────────────────────────────────────
const SHELF_MS = SHELF_DAYS * 24 * 60 * 60 * 1000;
/** Settings key: the latest launch time seen, so a phone clock moved back never purges early. */
export { SHELF_DAYS };
export const LAST_LAUNCH_SETTING = 'lastLaunchAt';

/**
 * Removes a letter's recording from the phone. Must return normally when the
 * file is already gone (erase is idempotent) and throw when the file exists
 * and could not be removed, so the row is kept and the erase can be retried.
 * The native one (lib/capture/erase.ts) also removes the listening copy and
 * its sidecar.
 */
export type AudioEraser = (uri: string | null, entryId: string) => void;

/** The shelf: deleted letters of every book, newest deletion first. Each has `deletedAt`. */
export function listDeleted(): entries.DeletedEntry[] {
  return entries.listDeleted(ctx());
}

/** The ISO time after which a letter deleted at `deletedAt` is erased by the launch purge. */
export function erasesAt(deletedAt: string): string {
  return new Date(Date.parse(deletedAt) + SHELF_MS).toISOString();
}

/**
 * Erase a deleted letter for good, from the shelf ("Erase now") or by the
 * launch purge. Order matters: the recording file first, then the row. If
 * the app is killed in between, the row stays on the shelf pointing at a file
 * that is gone, and the next erase or purge finishes the job; the other order
 * would leave a file with no row, which the sweep re-attaches as a draft.
 * Only a deleted letter can be erased (a live letter is refused). Returns true
 * when the letter is gone, false when it was not on the shelf, the build syncs
 * (the server owns deletion then), or the file could not be removed.
 */
export function eraseEntry(id: string, eraseAudio: AudioEraser): boolean {
  if (capabilities.sync) return false;
  const c = ctx();
  const uri = entries.deletedAudioUri(c, id);
  if (uri === undefined) return false;
  try {
    eraseAudio(uri, id);
  } catch {
    return false; // keep the row; the file may still be there
  }
  const done = entries.eraseRow(c, id);
  if (done) bus.emit('entries');
  return done;
}

/**
 * Launch purge: erases letters that have waited SHELF_DAYS or more. Does
 * nothing when the build syncs (the server owns the clock, spec 2.2 step 7)
 * or when `nowMs` is earlier than the latest recorded launch (a phone clock
 * moved back). Returns how many letters were erased.
 */
export function purgeExpired(nowMs: number, eraseAudio: AudioEraser): number {
  if (capabilities.sync) return 0;
  const last = Date.parse(getSetting(LAST_LAUNCH_SETTING) ?? '');
  if (Number.isFinite(last) && nowMs < last) return 0;
  const c = ctx();
  let erased = 0;
  for (const id of entries.expiredIds(c, new Date(nowMs - SHELF_MS).toISOString())) {
    if (eraseEntry(id, eraseAudio)) erased += 1;
  }
  return erased;
}

/** Writes the launch time for the purge's clock guard. Never moves backwards. */
export function recordLaunch(nowMs: number): void {
  const last = Date.parse(getSetting(LAST_LAUNCH_SETTING) ?? '');
  if (Number.isFinite(last) && last >= nowMs) return;
  setSetting(LAST_LAUNCH_SETTING, new Date(nowMs).toISOString());
}

// ── Drafts (capture in progress) ─────────────────────────────────────────
export function createDraft(input: NewDraft): Draft {
  const c = ctx();
  const id = c.newId();
  drafts.insert(c, id, input);
  bus.emit('drafts');
  return drafts.get(c, id)!;
}

/**
 * Draft-first recording (TDD 01 3.4 rule 1): the row exists, with the file
 * path, before the microphone goes live. A kill mid-take leaves a
 * `recording` row the launch sweep can recover.
 */
export function createRecordingDraft(input: { childId: string; promptKey: string | null; audioUri: string | null }): Draft {
  return createDraft({ ...input, captureMode: 'spoken', audioDurationMs: 0, state: 'recording' });
}

/** Elapsed time so far, written every few seconds so a recovered take shows a sensible length. No event. */
export function setRecordingProgress(id: string, durationMs: number): void {
  drafts.setRecordingProgress(ctx(), id, durationMs);
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
  drafts.finalizeAudio(ctx(), id, f);
  bus.emit('drafts');
}

/** Stores the hash computed just before save, for drafts finalized without one. */
export function setDraftAudioHash(id: string, sha256: string, bytes: number): void {
  drafts.setAudioHash(ctx(), id, sha256, bytes);
}

export function getDraft(id: string): Draft | null {
  return drafts.get(ctx(), id);
}

/** Drafts waiting to be read back, newest first. A take still recording is not listed. */
export function listDrafts(childId: string): Draft[] {
  return drafts.listForChild(ctx(), childId);
}

/** Sets the raw transcript once. Later calls are ignored: raw is immutable. */
export function setDraftTranscript(id: string, raw: string): void {
  drafts.setTranscriptOnce(ctx(), id, raw);
}

export function setDraftTyped(id: string, text: string): void {
  drafts.setTyped(ctx(), id, text);
}

export function setDraftChild(id: string, childId: string): void {
  drafts.setChild(ctx(), id, childId);
}

/** Removes the row only. Audio files are deleted by the explicit Discard in Listen, never here. */
export function deleteDraft(id: string): void {
  drafts.remove(ctx(), id);
  bus.emit('drafts');
}

// ── Launch sweep support (capture/sweep.ts) ──────────────────────────────
/** Every row that points at audio, tombstoned letters included. */
export function audioRows(): { drafts: SweepDraft[]; entries: SweepEntry[] } {
  const c = ctx();
  return { drafts: drafts.audioRows(c), entries: entries.audioRows(c) };
}

/** Takes the sweep kept but could not finish (empty, or would not play). Settings > Recordings lists them. */
export function countUnrecoverableTakes(): number {
  return drafts.countUnrecoverable(ctx());
}

/** The app container moved (iOS update): point the row at the same file's current path. */
export function rebaseAudioUri(table: 'drafts' | 'entries', id: string, uri: string): void {
  if (table === 'drafts') drafts.rebaseAudioUri(ctx(), id, uri);
  else entries.rebaseAudioUri(ctx(), id, uri);
}

/** Recordings on this phone with no letter (Settings > Recordings). Never deleted automatically. */
export function listOrphanAudio(): OrphanAudio[] {
  return orphans.list(ctx());
}

export function reportOrphanAudio(fileName: string, bytes: number | null): void {
  orphans.report(ctx(), fileName, bytes);
  bus.emit('orphan_audio');
}

/** A stray recording becomes a draft on a book (it shows on Tonight), in one transaction with its report row. */
export function reattachOrphanAudio(
  fileName: string,
  input: { childId: string; audioUri: string; createdAt: string; sha256: string | null; bytes: number | null; state: DraftState },
): Draft {
  const d = orphans.reattach(ctx(), fileName, input);
  bus.emit('drafts', 'orphan_audio');
  return d;
}
