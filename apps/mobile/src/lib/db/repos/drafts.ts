/**
 * Drafts: captures in progress. Written when recording starts, so a crash
 * or a closed sheet loses nothing (TDD 01 3.4). Rows only: audio files are
 * deleted by a confirmed Let it go (Review, Listen), the launch sweep
 * finishing one (capture/let-it-go.logic.ts, sweep.ts), erasing a deleted
 * book (store.ts eraseBook) and Erase everything (eraseEverythingLocal),
 * never here.
 */
import { draftNameOwner, SIGN_AS_DRAFT_SETTING } from '../../capture/sign-as-other.logic';
import type { SqlDb } from '../sql';
import { changes, type RepoContext } from './context';
import type { BaseDirection, CaptureMode, Draft, DraftKind, DraftState, OccurredPrecision } from './types';

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
  kind: string;
  occurred_on: string | null;
  occurred_precision: string;
  language: string | null;
  base_direction: string;
  held_kind: string | null;
  in_book_choice: number | null;
}

const COLS = `id, child_id, capture_mode, prompt_key, created_at, audio_uri, audio_duration_ms, raw_transcript, typed_text,
  state, audio_sha256, audio_bytes, recovered_at, kind, occurred_on, occurred_precision, language, base_direction,
  held_kind, in_book_choice`;

const draftState = (s: string): DraftState =>
  s === 'recording' || s === 'unrecoverable' || s === 'discarding' ? s : 'ready';

const fromRow = (r: DraftRow): Draft => ({
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
  kind: r.kind === 'note' ? 'note' : 'letter',
  occurredOn: r.occurred_on,
  occurredPrecision: r.occurred_precision === 'month' ? 'month' : 'day',
  language: r.language,
  baseDirection: r.base_direction === 'rtl' ? 'rtl' : 'ltr',
  held: r.held_kind !== null && r.held_kind !== undefined,
  inBookChoice: r.in_book_choice === null || r.in_book_choice === undefined ? null : r.in_book_choice === 1,
});

export type NewDraft = Pick<Draft, 'childId' | 'captureMode' | 'promptKey' | 'audioUri' | 'audioDurationMs'> & {
  typedText?: string | null;
  state?: DraftState;
  audioSha256?: string | null;
  audioBytes?: number | null;
  recoveredAt?: string | null;
  /** Defaults to now. The launch sweep passes the file's own time. */
  createdAt?: string;
};

export function insert(ctx: RepoContext, id: string, input: NewDraft): void {
  ctx.db.run(
    `INSERT INTO drafts (id, child_id, capture_mode, prompt_key, created_at, audio_uri, audio_duration_ms, typed_text,
       state, audio_sha256, audio_bytes, recovered_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, input.childId, input.captureMode, input.promptKey, input.createdAt ?? ctx.now(),
    input.audioUri, input.audioDurationMs, input.typedText ?? null,
    input.state ?? 'ready', input.audioSha256 ?? null, input.audioBytes ?? null, input.recoveredAt ?? null,
  );
}

export function get({ db }: RepoContext, id: string): Draft | null {
  const r = db.get<DraftRow>(`SELECT ${COLS} FROM drafts WHERE id = ?`, id);
  return r ? fromRow(r) : null;
}

/** Drafts waiting to be read back, newest first. A take still recording, or being let go, is not listed. */
export function listForChild({ db }: RepoContext, childId: string): Draft[] {
  return db
    .all<DraftRow>(
      `SELECT ${COLS} FROM drafts WHERE child_id = ? AND state NOT IN ('recording', 'discarding') ORDER BY created_at DESC, id DESC`,
      childId,
    )
    .map(fromRow);
}

/**
 * When the newest draft waiting across the given books was made (`created_at`), in one query (BL-1648, NS-48-R27). A
 * take still recording, or being let go, is not one. Null when none waits. Returns a date, never words.
 */
export function newestWaitingAt({ db }: RepoContext, childIds: readonly string[]): string | null {
  if (childIds.length === 0) return null;
  return (
    db.get<{ created_at: string }>(
      `SELECT created_at FROM drafts WHERE child_id IN (${childIds.map(() => '?').join(',')}) AND state NOT IN ('recording', 'discarding')
       ORDER BY created_at DESC, id DESC LIMIT 1`,
      ...childIds,
    )?.created_at ?? null
  );
}

// ── Review's choices (WP-F04-03; F04 section 11.3) ─────────────────────────
const ISO_DAY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
/** A BCP-47 language tag as the speech and pack code writes them (`en`, `en-GB`, `zh-Hant`). */
const LANGUAGE_TAG = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8}){0,3}$/;

/** Note or letter. False for an unknown kind or a missing draft. */
export function setKind({ db }: RepoContext, id: string, kind: DraftKind): boolean {
  if (kind !== 'note' && kind !== 'letter') return false;
  db.run('UPDATE drafts SET kind = ? WHERE id = ?', kind, id);
  return changes(db) === 1;
}

/**
 * The date the letter is about, and how exactly it is known. A month-precision
 * date is stored as given: the day DateSheet stores for a month, the first day
 * of that month of the child's age (date-change.logic monthChoiceDay), exactly
 * as entries.setOccurred stores it. Never the calendar month's first day: for a
 * child born on the 13th that day is in the month of age before, so Keep would
 * file the letter a month early (NS-15-R2). Null clears it (the local date of
 * the draft's creation is used at save). False for a malformed date or precision.
 */
export function setOccurred({ db }: RepoContext, id: string, occurredOn: string | null, precision: OccurredPrecision): boolean {
  if (precision !== 'day' && precision !== 'month') return false;
  if (occurredOn !== null && !ISO_DAY.test(occurredOn)) return false;
  db.run('UPDATE drafts SET occurred_on = ?, occurred_precision = ? WHERE id = ?', occurredOn, precision, id);
  return changes(db) === 1;
}

/** The take's language (a BCP-47 tag), or null for the author's default. False for a malformed tag. */
export function setLanguage({ db }: RepoContext, id: string, language: string | null): boolean {
  if (language !== null && !LANGUAGE_TAG.test(language)) return false;
  db.run('UPDATE drafts SET language = ? WHERE id = ?', language, id);
  return changes(db) === 1;
}

/** Layout direction of the words, decided at save (F04 11.3). */
export function setBaseDirection({ db }: RepoContext, id: string, dir: BaseDirection): boolean {
  if (dir !== 'ltr' && dir !== 'rtl') return false;
  db.run('UPDATE drafts SET base_direction = ? WHERE id = ?', dir, id);
  return changes(db) === 1;
}

/**
 * Let it go, step 1 of 3 (F04-REQ-009): the row is marked first, so a kill
 * after the file is deleted can never re-attach it. Then the caller deletes the
 * file, then `finishDiscard` removes the row. False for a missing draft.
 */
export function beginDiscard({ db }: RepoContext, id: string): boolean {
  // Review's choices go with it (v9): nothing of a let-go letter waits on the phone.
  db.run(
    "UPDATE drafts SET state = 'discarding', review_put_back = NULL, review_view = NULL, review_text = NULL, review_base = NULL WHERE id = ?",
    id,
  );
  const done = changes(db) === 1;
  // Its typed From name too, now, not when the file finally goes: the draft is already off every list.
  if (done) forgetDraftFromName(db, (d) => d === id);
  return done;
}

/**
 * The From name typed for one draft (NS-16 section 6, `signAs.draft`; BL-980 review B finding 1) is someone else's
 * name, L3, phone only. It goes whenever its draft ends without becoming a letter (Let it go, Delete, a book's erase)
 * and when the row goes at Keep, whether or not Review drew the From card. One slot holds one draft's name, so a name
 * typed for another draft stays. A slot that cannot be read names no draft and is left as it is. Never throws into
 * the removal it rides on: a settings row is not worth keeping a draft for.
 */
export function forgetDraftFromName(db: SqlDb, ends: (draftId: string) => boolean): void {
  try {
    const draftId = draftNameOwner(db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', SIGN_AS_DRAFT_SETTING)?.value);
    if (draftId !== null && ends(draftId)) db.run('DELETE FROM settings WHERE key = ?', SIGN_AS_DRAFT_SETTING);
  } catch {
    // Unreadable: it names no draft.
  }
}

/**
 * The author held this draft at the Keep gate (F14 6.2 B "Leave it waiting"):
 * it stays exactly as it is and is marked held. False for a missing draft, or a
 * take still recording or being let go.
 */
export function markHeld({ db }: RepoContext, id: string, inBookChoice: boolean | null): boolean {
  db.run(
    "UPDATE drafts SET held_kind = 'held_letter', in_book_choice = ? WHERE id = ? AND state NOT IN ('recording', 'discarding')",
    inBookChoice === null ? null : inBookChoice ? 1 : 0, id,
  );
  return changes(db) === 1;
}

/**
 * Every letter waiting on this phone for the export (PL-2, schema 1.6.0): every draft, in every book, that is not
 * still recording and not being let go. Oldest first, the way the export lists them.
 */
export function listForExport({ db }: RepoContext): Draft[] {
  return db
    .all<DraftRow>(`SELECT ${COLS} FROM drafts WHERE state NOT IN ('recording', 'discarding') ORDER BY created_at, id`)
    .map(fromRow);
}

/** Held drafts, newest first; for one book when `childId` is given (Tonight's one held row, F14-REQ-041). */
export function listHeld({ db }: RepoContext, childId?: string): Draft[] {
  const rows = childId === undefined
    ? db.all<DraftRow>(`SELECT ${COLS} FROM drafts WHERE held_kind IS NOT NULL AND state NOT IN ('recording', 'discarding') ORDER BY created_at DESC, id DESC`)
    : db.all<DraftRow>(
      `SELECT ${COLS} FROM drafts WHERE held_kind IS NOT NULL AND child_id = ? AND state NOT IN ('recording', 'discarding') ORDER BY created_at DESC, id DESC`,
      childId,
    );
  return rows.map(fromRow);
}

/** Whether a draft is held (and so may be on the server as an author-only row). */
export function isHeld({ db }: RepoContext, id: string): boolean {
  return db.get<{ t: number }>('SELECT 1 AS t FROM drafts WHERE id = ? AND held_kind IS NOT NULL', id) !== null;
}

/**
 * How many times a let-go draft's delete has failed (NS-09-R15): settings key `discard.failures.<draft id>`, an
 * integer. The key holds a draft id (L3) and the value is a count (L2); it is never logged. It goes with the row
 * (finishDiscard, remove) and with Erase everything (every settings row).
 */
export const DISCARD_FAILURES_PREFIX = 'discard.failures.';
const failuresKey = (id: string) => `${DISCARD_FAILURES_PREFIX}${id}`;

export function discardFailures({ db }: RepoContext, id: string): number {
  const v = db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', failuresKey(id))?.value;
  const n = v === undefined ? 0 : Number.parseInt(v, 10);
  return Number.isSafeInteger(n) && n > 0 ? n : 0;
}

/** One more failed delete for a draft that is still marked `discarding`; a gone or other draft keeps no counter. Returns the new count. */
export function noteDiscardFailure(ctx: RepoContext, id: string): number {
  const { db } = ctx;
  if (!db.get("SELECT 1 AS n FROM drafts WHERE id = ? AND state = 'discarding'", id)) return 0;
  const n = discardFailures(ctx, id) + 1;
  db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', failuresKey(id), String(n));
  return n;
}

/** Let it go, step 3: removes a row already marked `discarding`, never any other. Its failure count goes with it. */
export function finishDiscard({ db }: RepoContext, id: string): boolean {
  let done = false;
  db.transaction(() => {
    db.run("DELETE FROM drafts WHERE id = ? AND state = 'discarding'", id);
    done = changes(db) === 1;
    if (done) db.run('DELETE FROM settings WHERE key = ?', failuresKey(id));
    if (done) forgetDraftFromName(db, (d) => d === id);
  });
  return done;
}

/** Elapsed time so far; only while the take is still recording. */
export function setRecordingProgress({ db }: RepoContext, id: string, durationMs: number): void {
  db.run("UPDATE drafts SET audio_duration_ms = ? WHERE id = ? AND state = 'recording'", Math.round(durationMs), id);
}

/**
 * The take is closed: one statement records where the file is, its length,
 * size and SHA-256, and the new state. A null hash means hashing failed; the
 * audio is still kept and hashed again before save.
 */
export function finalizeAudio(
  ctx: RepoContext,
  id: string,
  f: { audioUri?: string | null; durationMs?: number | null; sha256: string | null; bytes: number | null; state: DraftState; recovered?: boolean },
): void {
  ctx.db.run(
    `UPDATE drafts SET audio_uri = COALESCE(?, audio_uri), audio_duration_ms = COALESCE(?, audio_duration_ms),
       audio_sha256 = ?, audio_bytes = ?, state = ?, recovered_at = CASE WHEN ? THEN ? ELSE recovered_at END
     WHERE id = ?`,
    f.audioUri ?? null, f.durationMs == null ? null : Math.round(f.durationMs), f.sha256, f.bytes, f.state,
    f.recovered ? 1 : 0, ctx.now(), id,
  );
}

export function setAudioHash({ db }: RepoContext, id: string, sha256: string, bytes: number): void {
  db.run('UPDATE drafts SET audio_sha256 = ?, audio_bytes = ? WHERE id = ?', sha256, bytes, id);
}

/** Sets the raw transcript once. Later calls change nothing and return false: raw is immutable. */
export function setTranscriptOnce({ db }: RepoContext, id: string, raw: string): boolean {
  db.run('UPDATE drafts SET raw_transcript = ? WHERE id = ? AND raw_transcript IS NULL', raw, id);
  return changes(db) === 1;
}

export function setTyped({ db }: RepoContext, id: string, text: string): void {
  db.run('UPDATE drafts SET typed_text = ? WHERE id = ?', text, id);
}

export function setChild({ db }: RepoContext, id: string, childId: string): void {
  db.run('UPDATE drafts SET child_id = ? WHERE id = ?', childId, id);
}

// ── Review's own choices (v9; SR-C-06, CR-39) ──────────────────────────────
/** Review's choices as stored: JSON and text, read by lib/capture/review-persist.logic. Null for a missing draft. */
export interface DraftReviewRow {
  putBack: string | null;
  view: string | null;
  text: string | null;
  base: string | null;
}

export function getReview({ db }: RepoContext, id: string): DraftReviewRow | null {
  const r = db.get<{ review_put_back: string | null; review_view: string | null; review_text: string | null; review_base: string | null }>(
    'SELECT review_put_back, review_view, review_text, review_base FROM drafts WHERE id = ?',
    id,
  );
  return r ? { putBack: r.review_put_back, view: r.review_view, text: r.review_text, base: r.review_base } : null;
}

/**
 * Writes the named parts of Review's choices, with the fingerprint of the words they were made on. Choices made on
 * other words (an older base) are cleared in the same statement, so old and new never mix. Only a draft still being
 * read back takes them (not one recording or being let go). False for a missing draft, a bad view or a bad base.
 * Never touches raw_transcript, typed_text or anything that syncs.
 */
export function setReview(
  { db }: RepoContext,
  id: string,
  base: string,
  patch: { putBack?: string; view?: 'fixes' | 'exact'; text?: string | null },
): boolean {
  if (!base) return false;
  if (patch.view !== undefined && patch.view !== 'fixes' && patch.view !== 'exact') return false;
  const same = 'review_base IS ?';
  const sets: string[] = ['review_base = ?'];
  const params: (string | null)[] = [base];
  const part = (col: string, has: boolean, value: string | null) => {
    if (has) {
      sets.push(`${col} = ?`);
      params.push(value);
    } else {
      sets.push(`${col} = CASE WHEN ${same} THEN ${col} ELSE NULL END`);
      params.push(base);
    }
  };
  part('review_put_back', patch.putBack !== undefined, patch.putBack ?? null);
  part('review_view', patch.view !== undefined, patch.view ?? null);
  part('review_text', patch.text !== undefined, patch.text ?? null);
  db.run(`UPDATE drafts SET ${sets.join(', ')} WHERE id = ? AND state NOT IN ('recording', 'discarding')`, ...params, id);
  return changes(db) === 1;
}

/** Removes the row only, never the file. */
export function remove({ db }: RepoContext, id: string): void {
  db.run('DELETE FROM drafts WHERE id = ?', id);
  db.run('DELETE FROM settings WHERE key = ?', failuresKey(id));
  forgetDraftFromName(db, (d) => d === id); // Keep, Delete and the sweep all remove a draft here
}

export function audioRows({ db }: RepoContext): { id: string; audioUri: string | null; state: string }[] {
  return db
    .all<{ id: string; audio_uri: string | null; state: string }>('SELECT id, audio_uri, state FROM drafts ORDER BY id')
    .map((r) => ({ id: r.id, audioUri: r.audio_uri, state: r.state }));
}

/** Takes kept but marked unrecoverable (empty, or would not play after a kill). Listed in Settings > Recordings. */
export function countUnrecoverable({ db }: RepoContext): number {
  return db.get<{ n: number }>("SELECT COUNT(*) AS n FROM drafts WHERE state = 'unrecoverable' AND audio_uri IS NOT NULL")?.n ?? 0;
}

export function rebaseAudioUri({ db }: RepoContext, id: string, uri: string): void {
  db.run('UPDATE drafts SET audio_uri = ? WHERE id = ?', uri, id);
}
