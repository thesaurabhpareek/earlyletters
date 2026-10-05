/**
 * Letters (entries). The write rules live here, next to the SQL that
 * enforces them, and are tested against a real SQLite engine
 * (test/store.entries.test.ts):
 *
 * - raw_transcript, captured_at, kind, capture mode, prompt, author and the
 *   audio columns are written once, on insert, and never by an upsert
 *   (DATA-REQ-040). The audio path changes only through `rebaseAudioUri`,
 *   which repairs a stale container path and never changes the file.
 * - child_id can move only while the row has never synced, and only when
 *   the caller names a child (an upsert without a child keeps the stored one).
 * - A tombstoned row refuses edits (PMOB-02): upsert throws
 *   EntryTombstonedError, the other writers return false. The only ways out
 *   of a tombstone are `undelete` (local Undo) and, later, a restore intent
 *   (WS-09). Reads of the audio path for the launch sweep still see them.
 * - Words of a waiting voice-only letter are set once.
 *
 * No defaults are read here: the caller passes the child and signature it
 * resolved (store.ts does that), so a repository never falls back to the
 * active child on its own.
 */
import type { Edit, EditLevel } from '@scribe/core';
import { changes, type RepoContext } from './context';
import type { EntrySyncState } from '../../sync/types';
import type { CaptureMode, Entry, EntryKind } from './types';

interface EntryRow {
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
  audio_sha256: string | null;
  audio_bytes: number | null;
  transcript_status: string | null;
  sync_state: string | null;
  approval: string | null;
}

const COLS = `id, kind, occurred_on, captured_at, capture_mode, edit_level, prompt_key, engine_version, raw_transcript,
  machine_edits, final_text, in_book, sounds_like_me, child_id, author_id, author_signs_as, audio_uri, audio_duration_ms,
  audio_sha256, audio_bytes, transcript_status, sync_state, approval`;

/** The row exists but is tombstoned; edits are refused until it is restored. Code only, no row content. */
export class EntryTombstonedError extends Error {
  constructor() {
    super('entry_tombstoned');
  }
}

function parseEdits(json: string): Edit[] {
  try {
    const v = JSON.parse(json) as unknown;
    return Array.isArray(v) ? (v as Edit[]) : [];
  } catch {
    return []; // a damaged edit list must never hide the letter itself
  }
}

const fromRow = (r: EntryRow): Entry => ({
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

/** Values the caller resolved for a first insert. Ignored when the row already exists. */
export interface InsertDefaults {
  childId: string | null;
  authorSignsAs: string | null;
}

export function isTombstoned({ db }: RepoContext, id: string): boolean {
  return db.get<{ t: number }>('SELECT 1 AS t FROM entries WHERE id = ? AND deleted_at IS NOT NULL', id) !== null;
}

/**
 * The one INSERT for entries; runs alone or inside the caller's transaction.
 * On conflict it updates only the editable columns (final text, edits, edit
 * level, book membership, "sounds like me") and child_id while unsynced.
 * Throws EntryTombstonedError when the row is tombstoned.
 */
export function upsert(ctx: RepoContext, e: Entry, defaults: InsertDefaults): void {
  const childForInsert = e.childId ?? defaults.childId;
  const childForUpdate = e.childId ?? null;
  const signsAs = e.authorSignsAs ?? defaults.authorSignsAs;
  ctx.db.run(
    `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, prompt_key,
       engine_version, raw_transcript, machine_edits, final_text, in_book, sounds_like_me, updated_at,
       child_id, author_id, author_signs_as, audio_uri, audio_duration_ms, audio_sha256, audio_bytes, transcript_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       final_text = excluded.final_text, machine_edits = excluded.machine_edits,
       edit_level = excluded.edit_level, in_book = excluded.in_book,
       sounds_like_me = excluded.sounds_like_me,
       child_id = CASE WHEN entries.synced_at IS NULL AND ? IS NOT NULL THEN ? ELSE entries.child_id END,
       updated_at = excluded.updated_at
     WHERE entries.deleted_at IS NULL`,
    e.id, e.kind, e.occurredOn, e.capturedAt, e.captureMode, e.editLevel, e.promptKey,
    e.engineVersion, e.rawTranscript, JSON.stringify(e.machineEdits), e.finalText,
    e.inBook ? 1 : 0, e.soundsLikeMe === null ? null : e.soundsLikeMe ? 1 : 0, ctx.now(),
    childForInsert, e.authorId ?? null, signsAs, e.audioUri ?? null, e.audioDurationMs ?? null,
    e.audioSha256 ?? null, e.audioBytes ?? null, e.transcriptStatus ?? null,
    childForUpdate, childForUpdate,
  );
  if (changes(ctx.db) === 0) throw new EntryTombstonedError();
}

/** A live entry, or null (missing or tombstoned). */
export function get({ db }: RepoContext, id: string): Entry | null {
  const r = db.get<EntryRow>(`SELECT ${COLS} FROM entries WHERE id = ? AND deleted_at IS NULL`, id);
  return r ? fromRow(r) : null;
}

/** Live entries for one book, newest first. */
export function listForChild({ db }: RepoContext, childId: string): Entry[] {
  return db
    .all<EntryRow>(
      `SELECT ${COLS} FROM entries WHERE deleted_at IS NULL AND child_id = ? ORDER BY occurred_on DESC, captured_at DESC, id DESC`,
      childId,
    )
    .map(fromRow);
}

/** Spoken letters still waiting for their words, oldest first. */
export function listWaiting({ db }: RepoContext, childId: string): Entry[] {
  return db
    .all<EntryRow>(
      `SELECT ${COLS} FROM entries WHERE child_id = ? AND deleted_at IS NULL AND transcript_status = 'waiting'
       ORDER BY captured_at ASC, id ASC`,
      childId,
    )
    .map(fromRow);
}

/** Add to book / make private. Never touches text. False when missing or tombstoned. */
export function setInBook(ctx: RepoContext, id: string, inBook: boolean): boolean {
  // A quiet-day mark is never in the book (D-084), whatever a screen asks for.
  ctx.db.run("UPDATE entries SET in_book = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL AND kind <> 'not_much'", inBook ? 1 : 0, ctx.now(), id);
  return changes(ctx.db) === 1;
}

/**
 * Sets the words of a voice-only letter, once: only while it is waiting,
 * its raw is still '' and it is not tombstoned. The first transcript becomes
 * the immutable raw (TDD 03 FM-9). False when it already had words.
 */
export function setWordsOnce(
  ctx: RepoContext,
  id: string,
  w: { rawTranscript: string; machineEdits: Edit[]; finalText: string; editLevel: EditLevel; engineVersion: number },
): boolean {
  ctx.db.run(
    `UPDATE entries SET raw_transcript = ?, machine_edits = ?, final_text = ?, edit_level = ?, engine_version = ?,
       transcript_status = NULL, updated_at = ?
     WHERE id = ? AND transcript_status = 'waiting' AND raw_transcript = '' AND deleted_at IS NULL`,
    w.rawTranscript, JSON.stringify(w.machineEdits), w.finalText, w.editLevel, w.engineVersion, ctx.now(), id,
  );
  return changes(ctx.db) === 1;
}

/** Tombstone, never a hard delete. Keeps the first deleted_at. False when missing or already tombstoned. */
export function tombstone(ctx: RepoContext, id: string): boolean {
  const now = ctx.now();
  ctx.db.run('UPDATE entries SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL', now, now, id);
  return changes(ctx.db) === 1;
}

/**
 * Local Undo of a tombstone. The server refuses `deleted_at = NULL` (SCTMB,
 * MOB-03); WS-09 turns this into a restore intent. False when not tombstoned.
 */
export function undelete(ctx: RepoContext, id: string): boolean {
  ctx.db.run('UPDATE entries SET deleted_at = NULL, updated_at = ? WHERE id = ? AND deleted_at IS NOT NULL', ctx.now(), id);
  return changes(ctx.db) === 1;
}

/** Every entry that points at audio, tombstoned ones included (the sweep must never treat their files as orphans). */
export function audioRows({ db }: RepoContext): { id: string; audioUri: string }[] {
  return db
    .all<{ id: string; audio_uri: string }>('SELECT id, audio_uri FROM entries WHERE audio_uri IS NOT NULL ORDER BY id')
    .map((r) => ({ id: r.id, audioUri: r.audio_uri }));
}

/** The app container moved (iOS update): point the row at the same file's current path. Allowed on tombstones. */
export function rebaseAudioUri({ db }: RepoContext, id: string, uri: string): void {
  db.run('UPDATE entries SET audio_uri = ? WHERE id = ? AND audio_uri IS NOT NULL', uri, id);
}
