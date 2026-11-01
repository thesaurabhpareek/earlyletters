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
import { keychainFloor, type LedgerDb } from './billing/letter-ledger';
import type { SweepDraft, SweepEntry } from './capture/sweep.logic';
import { migrate, userVersion, type MigrationResult } from './db/migrations';
import type { SqlDb } from './db/sql';
import {
  children,
  createChangeBus,
  drafts,
  entries,
  ledger,
  letters,
  orphans,
  settings,
  uuidv7From,
  wipe,
  type BaseDirection,
  type Child,
  type Draft,
  type DraftKind,
  type DraftState,
  type Entry,
  type Family,
  type Member,
  type NewChild,
  type OccurredPrecision,
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
  enqueueEntryErase,
  enqueueEntryRestore,
  everSent,
  heldEverSent,
  getDraftRow,
  getEntryRow,
  syncOwner,
  enqueueEntryUpsert,
  enqueuePrefs,
  dropHeldConflictCopies,
  dropQueuedHeldUpsert,
  enqueueHeldDiscard,
  enqueueHeldDraft,
  listConflictCopies,
  removeConflictCopy,
  type ConflictCopy,
  type EnqueueContext,
} from './sync/outbox';
import { signalOutbox } from './sync/signal';
import { ALL_GROUPS, type FieldGroup } from './sync/types';

export type {
  BaseDirection,
  CaptureMode,
  Child,
  Draft,
  DraftKind,
  DraftState,
  Entry,
  EntryKind,
  Family,
  Member,
  NewChild,
  OccurredPrecision,
  OrphanAudio,
  TranscriptStatus,
} from './db/repos';
export type { ConflictCopy } from './sync/outbox';
export type { Table as StoreTable } from './db/repos';
export { AudioMissingError } from './db/repos/letters';
export { EntryTombstonedError } from './db/repos/entries';
export type { DeletedEntry } from './db/repos/entries';
export type { DeletedBook } from './db/repos/wipe';

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

/**
 * "Hide this book" for the person on this phone (PRD B F2.4; F12-REQ-005 Rev, per person since
 * local schema v7): stops prompts for this child; restorable. The other parent sees no change.
 * Stays on this phone until the server holds the per-person flag (S02, WP-F12-09).
 */
export function hideChild(id: string): void {
  children.hide(ctx(), id);
  bus.emit('children');
}

/**
 * "Quiet this book" for the person on this phone (F12-REQ-011): no prompts, reminders, month or
 * birthday notes for this child; letters untouched; reversible. The planner reads `Child.quiet`.
 */
export function setChildQuiet(id: string, quiet: boolean): void {
  children.setQuiet(ctx(), id, quiet);
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

/** This phone user's role in a book, as the server last listed it (sync_books.members). A book only on this phone is theirs: parent. */
export function myRoleIn(childId: string): 'parent' | 'contributor' {
  const r = ctx().db.get<{ members: string | null }>('SELECT members FROM sync_books WHERE child_id = ?', childId);
  if (!r?.members) return 'parent';
  try {
    const list = JSON.parse(r.members) as { role: string; is_me: boolean }[];
    return list.find((m) => m.is_me)?.role === 'contributor' ? 'contributor' : 'parent';
  } catch {
    return 'parent';
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
  // A held draft (v8): its Keep names the held row's last version this phone knew ('0' when none came back),
  // so the server compares the Keep with held words this phone never saw (review K blocking 1).
  const held = drafts.isHeld(c, draftId) ? (getDraftRow(c.db, draftId)?.held_v ?? '0') : null;
  // Held while waiting for its words (outbox.ts): the raw transcript is set once, later.
  letters.saveFromDraft(c, draftId, e, insertDefaults(e), audioExists, () => {
    if (held !== null) c.db.run('UPDATE entries SET held_v = ? WHERE id = ?', held, draftId);
    // The letter ledger counts a kept letter in the same transaction (D-082, D-083): the letter and its
    // count are written together or not at all. M17 (D-103): only this person's own letter, only with its
    // words; a voice-only letter, a quiet-day mark or another author's row never counts (ledger.recordKept).
    if (e.kind === 'letter') ledger.recordKept(c, draftId, keychainFloor());
    // A held draft kept at last (Keep after Plus): the letter replaces its held row on the server (same id).
    dropQueuedHeldUpsert(c.db, draftId);
    enqueueEntryUpsert(c.db, draftId, ALL_GROUPS, enqueueContext(c));
  });
  bus.emit('entries', 'drafts');
  signalOutbox();
}

/**
 * The database side of the letter ledger for lib/billing/letter-ledger.ts
 * (lettersKept, syncLedger, clearLedger). Opens the store on first use.
 */
export function ledgerDb(): LedgerDb {
  return {
    counts: () => {
      const c = ctx();
      return { recorded: ledger.readState(c).n, present: ledger.countPresent(c) };
    },
    raiseTo: (n) => ledger.raiseTo(ctx(), n),
    clear: () => ledger.clear(ctx()),
  };
}

/**
 * Keep a spoken letter without words (TDD 03 FM-9, TDD 01 3.6): the
 * recording is the true original; words are set once later
 * (setWordsForWaitingEntry). Saved private unless the parent chose the book.
 * It never counts toward the free letters (M17, F14-REQ-037): it counts when
 * its words are kept from Review (keepReviewedWords).
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
 * letter already had words or was deleted. The words wait for the author's
 * review (Entry.wordsUnreviewed): the letter counts toward the free letters
 * only when the author keeps them (keepReviewedWords, M17).
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

/**
 * "Write the words" on a letter still waiting for its words (D-086), or on a spoken letter whose words came
 * back empty and that the server does not have yet (S28): the parent's typing becomes the words, once, kept
 * and sent at once so they are never lost. It never counts (M17, F14-REQ-037): the words wait for the author's
 * review, and the letter page hands the keep to Review, whose Keep step asks the gate and counts them
 * (keepReviewedWords; F14 6.1 :129). False when the letter already had words, was deleted, is on the server,
 * or the text is empty.
 */
export function setTypedWordsForWaitingEntry(id: string, text: string): boolean {
  const c = ctx();
  let done = false;
  c.db.transaction(() => {
    done = entries.setTypedWordsOnce(c, id, text);
    if (done) enqueueEntryUpsert(c.db, id, ALL_GROUPS, enqueueContext(c));
  });
  if (done) {
    bus.emit('entries');
    signalOutbox();
  }
  return done;
}

/**
 * Whether "Write the words" can take words for this letter now: a letter still waiting, or a recording whose words
 * came back empty and that the server does not have yet. Read only; the same rows `setTypedWordsForWaitingEntry` writes.
 */
export function canTypeWordsFor(id: string): boolean {
  return entries.canTypeWords(ctx(), id);
}

/**
 * The author kept words that arrived later (the machine's, or typed on the letter page), with them on screen in
 * Review (M17: the counting moment, F14 6.2 B2). The review mark, the count and, when given, the place the
 * author chose (`inBook`) are written in one transaction. The words are not changed here (an edit is a
 * separate save). False when the letter has no words waiting for review. The Keep gate decision comes first,
 * in Review (keepNeedsPlus, lib/billing/keep-step.ts keepSheetFor).
 */
export function keepReviewedWords(id: string, inBook?: boolean): boolean {
  const c = ctx();
  let done = false;
  let moved = false;
  c.db.transaction(() => {
    done = entries.markWordsReviewed(c, id);
    if (!done) return;
    ledger.recordKept(c, id, keychainFloor());
    if (inBook !== undefined) moved = entries.setInBook(c, id, inBook);
    if (moved) enqueueEntryUpsert(c.db, id, IN_BOOK, enqueueContext(c));
  });
  if (done) bus.emit('entries');
  if (moved) signalOutbox();
  return done;
}

/** Letters whose machine-written words wait for the author's review, oldest first. */
export function listWordsToReview(childId: string): Entry[] {
  return entries.listWordsToReview(ctx(), childId);
}

/** A quiet-day mark already exists for this book on this day (one per day, D-084). */
export function hasNotMuchOn(childId: string, isoDate: string): boolean {
  return entries.hasNotMuchOn(ctx(), childId, isoDate);
}

// ── Word conflicts (F16 6.2 E; WP-F16-15) ────────────────────────────────
/**
 * Letters whose words changed on the author's other phone while this phone had
 * its own: the letter follows the other phone's words and this phone's version
 * is kept here, never uploaded, until the author picks (F16-REQ-010). Newest
 * first; for one letter when `entryId` is given. Empty in a build without sync.
 */
export function listConflicts(entryId?: string): ConflictCopy[] {
  return listConflictCopies(ctx().db, entryId);
}

/**
 * The author's choice on the conflict note: 'mine' ("Use this phone's version")
 * makes this phone's words the letter's words again and sends them (the server
 * keeps the other words in entry_versions); 'theirs' ("Keep the other one")
 * lets this phone's copy go. One transaction each. False when the copy is gone,
 * or for 'mine' when the letter is deleted (restore it first). A held draft's copy
 * (v8, `copy.draft`) works the same way on the draft's typed words.
 */
export function resolveConflict(opId: string, choice: 'mine' | 'theirs'): boolean {
  const c = ctx();
  let done = false;
  c.db.transaction(() => {
    const copy = listConflictCopies(c.db).find((x) => x.opId === opId);
    if (!copy) return;
    if (choice === 'mine' && copy.draft && drafts.isHeld(c, copy.entryId)) {
      // A held draft's typed words (v8): they become the draft's again and its held row goes up.
      drafts.setTyped(c, copy.entryId, copy.words.final_text);
      enqueueHeldDraft(c.db, copy.entryId, enqueueContext(c));
    } else if (choice === 'mine') {
      if (!entries.replaceWords(c, copy.entryId, copy.words)) return;
      enqueueEntryUpsert(c.db, copy.entryId, ['text'], enqueueContext(c));
    }
    done = removeConflictCopy(c.db, opId);
  });
  if (done) {
    bus.emit('entries', 'drafts');
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
  const c = ctx();
  // A deleted book's letters wait inside it (Restore the book brings them all back), not one by one.
  const gone = new Set(wipe.deletedIds(c));
  return entries.listDeleted(c).filter((e) => !e.childId || !gone.has(e.childId));
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
 * when the letter is gone, false when it was not on the shelf, it is another
 * person's letter, or the file could not be removed.
 *
 * With sync on (WP-F16-13, F16-REQ-024): when the server may hold the letter,
 * the row's removal and one `entry.erase` are one transaction; the server then
 * erases its copy for good, and the author's other phones drop theirs after their
 * next pull. The erase never carries words.
 */
export function eraseEntry(id: string, eraseAudio: AudioEraser): boolean {
  const c = ctx();
  const uri = entries.deletedAudioUri(c, id);
  if (uri === undefined) return false;
  let serverMayHold = false;
  let heldOnServer = false;
  let bookId: string | null = null;
  // Queueing is local, as every other upload is: a phone that signed in under a server-on build keeps
  // its queue in an off build, so the erase goes when sync returns (final review A-M2).
  const owner = syncOwner(c.db);
  if (owner) {
    const row = getEntryRow(c.db, id);
    if (!row) return false;
    if (row.author_id !== null && row.author_id !== owner) return false; // only the author erases
    bookId = row.child_id;
    serverMayHold = row.sync_state !== 'gone' && row.sync_state !== 'erased'
      && (row.server_version !== null || everSent(c.db, id));
    // A voice-only letter waiting for its words lives on the server as a held row (v8): that row goes too.
    // Once let go there, only its marker is left, which this phone no longer tracks: a waiting letter always
    // sends the erase (idempotent: the server answers missing when it holds nothing), so every phone erases it.
    heldOnServer = row.held_v != null || heldEverSent(c.db, id) || row.transcript_status === 'waiting';
  }
  try {
    eraseAudio(uri, id);
  } catch {
    return false; // keep the row; the file may still be there
  }
  let done = false;
  c.db.transaction(() => {
    // D-103: a deleted letter still counts. Raise the mirror to every letter that counts before this one's row goes.
    ledger.raiseTo(c, ledger.countPresent(c));
    done = entries.eraseRow(c, id);
    // One erase for the letter and for a waiting letter's held row alike: the server erases whichever it
    // holds, and the author's other phones erase their copy (never restorable there).
    if (done && (serverMayHold || heldOnServer)) enqueueEntryErase(c.db, id, bookId, enqueueContext(c));
  });
  if (done) compactAfterErase(c);
  if (done) bus.emit('entries');
  if (done && (serverMayHold || heldOnServer)) signalOutbox();
  return done;
}

/**
 * Letters the server erased for good while they waited in Recently deleted here
 * (Erase now on another phone of this author, or the purge; `sync_state` 'erased'):
 * the file first, then the row, with nothing sent. Runs after every pull and at
 * launch. Returns how many were erased.
 */
export function finishServerErased(eraseAudio: AudioEraser): number {
  const c = ctx();
  let n = 0;
  ledger.raiseTo(c, ledger.countPresent(c)); // D-103: the rows below still counted; the count stays
  for (const r of c.db.all<{ id: string; audio_uri: string | null }>(
    "SELECT id, audio_uri FROM entries WHERE sync_state = 'erased' AND deleted_at IS NOT NULL ORDER BY id",
  )) {
    try {
      eraseAudio(r.audio_uri, r.id);
    } catch {
      continue; // the next run tries again
    }
    if (entries.eraseRow(c, r.id)) n++;
  }
  if (n > 0) compactAfterErase(c);
  if (n > 0) bus.emit('entries');
  return n;
}

/**
 * Launch purge: erases letters that have waited SHELF_DAYS or more. Does
 * nothing when `nowMs` is earlier than the latest recorded launch (a phone
 * clock moved back). When the build syncs, the server's clock rules every
 * letter it holds (spec 2.2 step 7), so only letters it never held, or no
 * longer holds, with nothing queued for them, are erased here, with nothing
 * sent; otherwise they would wait in Recently deleted forever. Returns how
 * many letters were erased.
 */
export function purgeExpired(nowMs: number, eraseAudio: AudioEraser): number {
  const c = ctx();
  // A book erase a kill cut short is finished first, whatever the clock says: the person already asked for it.
  for (const id of wipe.erasingIds(c)) eraseBook(id, eraseAudio);
  const last = Date.parse(getSetting(LAST_LAUNCH_SETTING) ?? '');
  if (Number.isFinite(last) && nowMs < last) return 0;
  const cutoff = new Date(nowMs - SHELF_MS).toISOString();
  let erased = 0;
  for (const id of capabilities.sync ? entries.expiredLocalOnlyIds(c, cutoff) : entries.expiredIds(c, cutoff)) {
    if (eraseEntry(id, eraseAudio)) erased += 1;
  }
  // Deleted books whose 30 days are over (F17 6.2 D step 6), on this phone's clock, like letters.
  for (const id of wipe.expiredIds(c, cutoff)) eraseBook(id, eraseAudio);
  return erased;
}

/** Writes the launch time for the purge's clock guard. Never moves backwards. */
export function recordLaunch(nowMs: number): void {
  const last = Date.parse(getSetting(LAST_LAUNCH_SETTING) ?? '');
  if (Number.isFinite(last) && last >= nowMs) return;
  setSetting(LAST_LAUNCH_SETTING, new Date(nowMs).toISOString());
}

// ── After a hard erase (BL-387; privacy Review A on #520) ────────────────
/**
 * After rows were erased for good: the WAL is checkpointed and truncated, so the old page images of the erased rows
 * leave `scribe.db-wal` (secure_delete, set at open, has already zeroed them in the database's pages). `full` (Erase
 * everything) also runs VACUUM, which rebuilds the file and drops free pages written before secure_delete was on.
 * Outside any transaction. Never throws: the rows are already gone, and the next erase or launch tries again.
 */
function compactAfterErase(c: RepoContext, full = false): void {
  try {
    if (full) c.db.exec('VACUUM');
    c.db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
  } catch {
    // A reader holds the WAL (rare on one connection); the next erase or the next checkpoint finishes it.
  }
}

// ── Delete a book (BL-387; F17 6.2 D; DATA-REQ-014, F17-REQ-080) ──────────
/**
 * Whether this phone may delete a book or erase everything by itself: only while it has never signed in. After a
 * sign-in the server holds the books too, and deletion goes through the server (request_book_deletion, account
 * deletion), which this build does not offer from here (F17-REQ-026).
 */
export function localDeletionAllowed(): boolean {
  return syncOwner(ctx().db) === null;
}

/**
 * "Delete this book" on a phone that never signed in (F17 6.2 D, sole parent): the book leaves every list, Tonight
 * and Export at once and waits in Recently deleted for 30 days, restorable exactly as it was; then the launch purge
 * erases it for good (eraseBook). Nothing is queued or sent. False when the book does not exist, is already deleted,
 * or the phone has signed in.
 */
export function deleteBook(id: string): boolean {
  const c = ctx();
  if (!localDeletionAllowed()) return false;
  let done = false;
  c.db.transaction(() => {
    done = wipe.markDeleted(c, id);
    if (done && settings.getSetting(c, 'activeChildId') === id) {
      const next = children.listVisible(c)[0]?.id;
      if (next) settings.setSetting(c, 'activeChildId', next);
      else settings.deleteSetting(c, 'activeChildId');
    }
  });
  if (done) bus.emit('children', 'entries', 'drafts', 'settings');
  return done;
}

/** Restore the book from Recently deleted: every letter, draft and choice comes back as it was. */
export function restoreBook(id: string): boolean {
  const done = wipe.unmarkDeleted(ctx(), id);
  if (done) bus.emit('children', 'entries', 'drafts', 'settings');
  return done;
}

/** Deleted books waiting in Recently deleted, newest deletion first. */
export function listDeletedBooks(): wipe.DeletedBook[] {
  return wipe.listDeleted(ctx());
}

/**
 * Erase a deleted book for good: "Erase now" on the shelf, or the purge at day 30. The mark that the erase began is
 * written first, then every recording file of the book goes (its letters, deleted ones too, and its drafts), then
 * the rows in one transaction. A kill part way leaves the mark and rows whose files are gone; the next launch purge
 * finishes it (purgeExpired). The sweep never sees a file without its row, so nothing comes back as a draft. A file
 * that will not go stops the erase with the book still marked, for the next try. True when the book is gone.
 */
export function eraseBook(id: string, eraseAudio: AudioEraser): boolean {
  const c = ctx();
  if (!wipe.isDeleted(c, id)) return false;
  wipe.markErasing(c, id);
  for (const r of wipe.bookAudioRows(c, id)) {
    try {
      eraseAudio(r.audioUri, r.id);
    } catch {
      return false;
    }
  }
  c.db.transaction(() => {
    // D-103: the free-letter count never goes down, except on Erase everything. The book's letters are one of the
    // ledger's three sources, so the mirror is first raised to every letter that counts now (ledger.countPresent,
    // the same rule as the Keep gate, whichever kinds it counts), then the rows go. A mirror behind them (a backup
    // restore before the launch heal, a note kept before notes counted) can no longer drop the count.
    ledger.raiseTo(c, ledger.countPresent(c));
    wipe.removeBook(c, id);
  });
  compactAfterErase(c);
  bus.emit('children', 'entries', 'drafts', 'settings');
  return true;
}

// ── Erase everything on this phone (BL-387; F17 6.2 F; DATA-REQ-024) ─────
/** Removes every recording file, listening copy, temporary copy and export left on this phone. Throws when one will not go. */
export type DeviceFilesEraser = () => void;

/** Whether an Erase everything began and has not finished (a kill, or a file that would not go). */
export function eraseEverythingPending(): boolean {
  return settings.getSetting(ctx(), wipe.ERASE_EVERYTHING_SETTING) !== null;
}

/**
 * Erase everything, the store's part (signed out only, F17 6.2 F step 1). In order:
 *  1. the pending mark, so a kill at any later point is finished at the next launch (a mark is only ever written on
 *     a phone that had not signed in);
 *  2. each letter's and draft's recording, listening copy and temporary copies (`eraseAudio`);
 *  3. every other recording file, listening copy, temporary copy and export left on the phone (`eraseFiles`);
 *  4. every row of every table, settings included, in one transaction; the mark stays.
 * The caller then clears the Keychain (the free-letter count goes after the rows, so a relaunch cannot raise it
 * again from letters still present) and calls finishEraseEverything. Files go before rows, so the sweep never finds
 * a recording without its row to bring back. Nothing is queued or sent.
 * Returns 'signed_in' when the phone has signed in (nothing begun), 'incomplete' when a file would not go (the mark
 * stays; a later try or the next launch finishes), 'erased' when the rows are gone.
 */
export function eraseEverythingLocal(eraseAudio: AudioEraser, eraseFiles: DeviceFilesEraser): 'erased' | 'incomplete' | 'signed_in' {
  const c = ctx();
  if (!eraseEverythingPending()) {
    if (!localDeletionAllowed()) return 'signed_in';
    settings.setSetting(c, wipe.ERASE_EVERYTHING_SETTING, c.now());
  }
  try {
    for (const r of wipe.allAudioRows(c)) eraseAudio(r.audioUri, r.id);
    eraseFiles();
  } catch {
    return 'incomplete';
  }
  c.db.transaction(() => wipe.removeEverything(c));
  compactAfterErase(c, true);
  bus.emit('settings', 'children', 'entries', 'drafts', 'orphan_audio');
  return 'erased';
}

/** The last step of Erase everything: removes the pending mark. The phone is now as on first run. */
export function finishEraseEverything(): void {
  const c = ctx();
  settings.deleteSetting(c, wipe.ERASE_EVERYTHING_SETTING);
  compactAfterErase(c);
  bus.emit('settings', 'children', 'entries', 'drafts', 'orphan_audio');
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

/**
 * A change to a draft, in one transaction with its upload when the draft is held
 * (F16 6.2 I: a held draft of a signed-in author is an author-only row on the
 * server). A draft that was never held queues nothing.
 */
function writeDraft<T>(id: string, write: (c: RepoContext) => T, changed: (out: T) => boolean = (out) => out !== false): T {
  const c = ctx();
  let out!: T;
  let queued = false;
  c.db.transaction(() => {
    out = write(c);
    if (changed(out) && drafts.isHeld(c, id)) {
      enqueueHeldDraft(c.db, id, enqueueContext(c));
      queued = true;
    }
  });
  if (changed(out)) bus.emit('drafts');
  if (queued) signalOutbox();
  return out;
}

/** Sets the raw transcript once. Later calls are ignored: raw is immutable. */
export function setDraftTranscript(id: string, raw: string): void {
  writeDraft(id, (c) => drafts.setTranscriptOnce(c, id, raw));
}

export function setDraftTyped(id: string, text: string): void {
  writeDraft(id, (c) => {
    drafts.setTyped(c, id, text);
    return true;
  });
}

export function setDraftChild(id: string, childId: string): void {
  writeDraft(id, (c) => {
    drafts.setChild(c, id, childId);
    return true;
  });
}

/** Note or letter, chosen in Review (F04-REQ-014). The saved entry takes it. False for a bad value. */
export function setDraftKind(id: string, kind: DraftKind): boolean {
  return writeDraft(id, (c) => drafts.setKind(c, id, kind));
}

/**
 * The date the letter is about and how exactly it is known (F04 11.3). Null
 * means the local date of the draft's creation. False for a malformed date.
 */
export function setDraftOccurred(id: string, occurredOn: string | null, precision: OccurredPrecision): boolean {
  return writeDraft(id, (c) => drafts.setOccurred(c, id, occurredOn, precision));
}

/** The take's language as a BCP-47 tag; null for the author's default. False for a malformed tag. */
export function setDraftLanguage(id: string, language: string | null): boolean {
  return writeDraft(id, (c) => drafts.setLanguage(c, id, language));
}

/** Layout direction of the words (F04 11.3 rule for `base_direction`). */
export function setDraftBaseDirection(id: string, dir: BaseDirection): boolean {
  return writeDraft(id, (c) => drafts.setBaseDirection(c, id, dir));
}

/**
 * "Leave it waiting" at the Keep gate (F14 6.2 B step 2a; F14-REQ-039): the
 * draft stays exactly as it is, marked held, with the destination the author
 * chose. Signed in, the same transaction queues its author-only held row, so the
 * letter survives a lost phone; signed out it stays on this phone only. The
 * screen (review.tsx) calls this where the Keep sheet holds a letter. False for a
 * missing draft or a take still recording.
 */
export function holdDraft(id: string, opts: { inBookChoice: boolean | null }): boolean {
  return writeDraft(id, (c) => drafts.markHeld(c, id, opts.inBookChoice));
}

/** Held drafts, newest first; for one book when given (Tonight's held row, F14-REQ-041). */
export function listHeldDrafts(childId?: string): Draft[] {
  return drafts.listHeld(ctx(), childId);
}

/**
 * Let it go, confirmed (F04-REQ-009): step 1 marks the draft `discarding`;
 * the caller then deletes the file, then calls finishDiscard. A kill in
 * between leaves the mark, and the launch sweep removes the row without ever
 * re-attaching the file. A held draft queues its `held.discard` in the same
 * transaction, which on the server removes the row and its backup.
 */
export function beginDiscard(id: string): boolean {
  const c = ctx();
  let done = false;
  let held = false;
  c.db.transaction(() => {
    held = drafts.isHeld(c, id);
    done = drafts.beginDiscard(c, id);
    if (done && held) {
      enqueueHeldDiscard(c.db, id, enqueueContext(c));
      dropHeldConflictCopies(c.db, id); // letting it go lets every copy of its words go
    }
  });
  if (done) bus.emit('drafts');
  if (done && held) signalOutbox();
  return done;
}

/** Let it go, last step: removes a draft already marked `discarding`, never any other. */
export function finishDiscard(id: string): boolean {
  const done = drafts.finishDiscard(ctx(), id);
  if (done) bus.emit('drafts');
  return done;
}

/**
 * Removes the row only. Audio files are deleted by the explicit Discard in
 * Listen, never here. A held draft's server row goes with it (held.discard).
 */
export function deleteDraft(id: string): void {
  const c = ctx();
  let held = false;
  c.db.transaction(() => {
    held = drafts.isHeld(c, id);
    // Before the row goes: the discard reads the server version the draft holds.
    if (held) {
      enqueueHeldDiscard(c.db, id, enqueueContext(c));
      dropHeldConflictCopies(c.db, id);
    }
    drafts.remove(c, id);
  });
  bus.emit('drafts');
  if (held) signalOutbox();
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
