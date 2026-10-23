/**
 * Drafts: captures in progress. Written when recording starts, so a crash
 * or a closed sheet loses nothing (TDD 01 3.4). Rows only: audio files are
 * deleted by the explicit Discard in Listen, never here.
 */
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
}

const COLS = `id, child_id, capture_mode, prompt_key, created_at, audio_uri, audio_duration_ms, raw_transcript, typed_text,
  state, audio_sha256, audio_bytes, recovered_at, kind, occurred_on, occurred_precision, language, base_direction`;

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
 * date is stored as the first of that month. Null clears it (the local date of
 * the draft's creation is used at save). False for a malformed date or precision.
 */
export function setOccurred({ db }: RepoContext, id: string, occurredOn: string | null, precision: OccurredPrecision): boolean {
  if (precision !== 'day' && precision !== 'month') return false;
  if (occurredOn !== null && !ISO_DAY.test(occurredOn)) return false;
  const day = occurredOn !== null && precision === 'month' ? `${occurredOn.slice(0, 8)}01` : occurredOn;
  db.run('UPDATE drafts SET occurred_on = ?, occurred_precision = ? WHERE id = ?', day, precision, id);
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
  db.run("UPDATE drafts SET state = 'discarding' WHERE id = ?", id);
  return changes(db) === 1;
}

/** Let it go, step 3: removes a row already marked `discarding`, never any other. */
export function finishDiscard({ db }: RepoContext, id: string): boolean {
  db.run("DELETE FROM drafts WHERE id = ? AND state = 'discarding'", id);
  return changes(db) === 1;
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

/** Removes the row only, never the file. */
export function remove({ db }: RepoContext, id: string): void {
  db.run('DELETE FROM drafts WHERE id = ?', id);
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
