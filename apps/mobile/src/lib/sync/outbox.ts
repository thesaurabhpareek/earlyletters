/**
 * The upload queue (outbox) on the phone's SQLite. Pure: every function takes
 * a SqlDb and never opens its own transaction, so store.ts can enqueue in the
 * same transaction as the write it records (a kill leaves both or neither).
 *
 * Rules (DATA-REQ-043, -044; D-023):
 * - Ordered: ops go out by (lane, seq). Lane 0 holds restore re-uploads.
 * - Idempotent: every op has a device-made UUIDv7 op id; the server applies an
 *   op id once. An op that may have reached the server (sent_at set) is never
 *   changed again; edits after that become new ops.
 * - Coalesced: consecutive edits of one letter that never left the phone
 *   collapse into one op (the newest snapshot, the union of field groups).
 * - Nothing uploads before the first sign-in claimed this phone's data
 *   (sync.ownerId), and other people's letters are never uploaded.
 * - A letter waiting for its words (transcript_status 'waiting') is held: its
 *   raw transcript is set once, later, and the server would refuse a change.
 * - Protocol v1 (docs/adr/0025-sync-protocol-v1.md): an op's `base` is the
 *   server version its words descend from. A new op behind other queued ops of
 *   the same letter inherits their base and is rebased when they apply
 *   (F16-REQ-025); a batch carries at most one op per letter, so the rebase
 *   always lands before the next op leaves.
 * - A words conflict keeps this phone's version as a conflict copy in
 *   rejected_writes (code 'conflict'), never on the server, until the author picks.
 */
import { LANGUAGE_CODES } from '@scribe/core';
import { prefsRow } from '../db/repos/children';
import type { SqlDb } from '../db/sql';
import { ALL_GROUPS, type EntryData, type FieldGroup, type HeldDraftData, type PushOp, type PushOpType, type WordsGroup } from './types';

export const SYNC_SETTING = {
  owner: 'sync.ownerId',
  epoch: 'sync.epoch',
  epochStartedAt: 'sync.epochStartedAt',
  restoreAt: 'sync.restoreAt',
  pausedFor: 'sync.pausedFor',
  lastSyncedAt: 'sync.lastSyncedAt',
  lastVerifyAt: 'sync.lastVerifyAt',
  /** v8: cursor of this author's own held drafts in the pull. */
  heldCursor: 'sync.heldCursor',
  /** v8: '1' while the server's pull carries a held section, so it takes held ops (WP-F16-17). */
  heldServer: 'sync.heldServer',
} as const;

export interface EnqueueContext {
  /** ISO time (device clock; only orders the queue, never sent as a lifecycle time). */
  now: string;
  /** UUIDv7 maker for op ids. */
  newId: () => string;
}

export interface OutboxRow {
  seq: number;
  op_id: string;
  lane: number;
  type: PushOpType;
  entity_id: string;
  book_id: string | null;
  payload: string;
  created_at: string;
  attempts: number;
  next_attempt_at: string | null;
  sent_at: string | null;
}

/** The local entries columns sync reads (SELECT *). */
export interface LocalEntryRow {
  id: string;
  kind: string;
  occurred_on: string;
  captured_at: string;
  capture_mode: string;
  edit_level: string;
  prompt_key: string | null;
  engine_version: number;
  raw_transcript: string;
  machine_edits: string;
  final_text: string;
  in_book: number;
  sounds_like_me: number | null;
  updated_at: string;
  deleted_at: string | null;
  synced_at: string | null;
  child_id: string | null;
  author_id: string | null;
  author_signs_as: string | null;
  audio_uri: string | null;
  transcript_status: string | null;
  server_version: string | null;
  server_updated_at: string | null;
  server_epoch: number | null;
  sync_state: string;
  approval: string | null;
  /** v8: server version of this waiting letter's held_drafts row (null = not on the server as held). */
  held_v?: string | null;
  /** v6 (WP-F04-03, G-26). */
  language: string | null;
  occurred_precision: string;
  base_direction: string;
}

/** A book row (book-level columns only since local schema v7; this person's choices are in child_member_prefs). */
export interface LocalChildRow {
  id: string;
  name: string;
  birthday: string | null;
  due_date: string | null;
  family_can_read: number;
  created_at: string;
  hidden_at: string | null;
  role: string | null;
  created_by_me: number | null;
  nickname: string | null;
  server_state: string;
  created_by: string | null;
  first_run_batch: string | null;
}

/** This person's prefs.upsert fields for a book, from child_member_prefs (v7). */
export function prefsFields(db: SqlDb, childId: string): { signs_as: string; include_in_reminders: boolean } {
  const p = prefsRow(db, childId);
  return { signs_as: p?.signsAs ?? '', include_in_reminders: p?.remindersOn ?? true };
}

// ── Settings (same table as store.ts) ─────────────────────────────────────
export function readSetting(db: SqlDb, key: string): string | null {
  return db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', key)?.value ?? null;
}

export function writeSetting(db: SqlDb, key: string, value: string | null): void {
  if (value === null) db.run('DELETE FROM settings WHERE key = ?', key);
  else db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, value);
}

/** The account that owns this phone's letters, set once at the first sign-in. */
export function syncOwner(db: SqlDb): string | null {
  return readSetting(db, SYNC_SETTING.owner);
}

// ── Snapshots ─────────────────────────────────────────────────────────────
function parseEdits(json: string): unknown[] {
  try {
    const v = JSON.parse(json) as unknown;
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/**
 * The code the server's `language` check accepts for a stored language, or null.
 * The phone may hold a BCP-47 tag (F04 11.3: `en-US`, `zh-Hant`); the server takes
 * the seven primary codes only, so anything else is not sent rather than refused.
 */
export function wireLanguage(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const primary = stored.trim().toLowerCase().split(/[-_]/)[0];
  return (LANGUAGE_CODES as readonly string[]).includes(primary) ? primary : null;
}

/** The letter as the server stores it, or null when it cannot upload (no book, or waiting for words). */
export function entrySnapshot(r: LocalEntryRow): EntryData | null {
  if (!r.child_id || r.transcript_status === 'waiting') return null;
  const language = wireLanguage(r.language);
  return {
    id: r.id,
    child_id: r.child_id,
    kind: r.kind,
    occurred_on: r.occurred_on,
    captured_at: r.captured_at,
    capture_mode: r.capture_mode,
    edit_level: r.edit_level,
    prompt_key: r.prompt_key,
    engine_version: r.engine_version,
    raw_transcript: r.raw_transcript,
    machine_edits: parseEdits(r.machine_edits),
    final_text: r.final_text,
    in_book: r.in_book === 1,
    sounds_like_me: r.sounds_like_me === null ? null : r.sounds_like_me === 1,
    author_signs_as: r.author_signs_as,
    audio_kept_on_device: r.audio_uri !== null,
    ...(language ? { language } : {}),
    occurred_precision: r.occurred_precision ?? 'day',
    base_direction: r.base_direction ?? 'ltr',
  };
}

/** The words group of a local row, as the server compares it. */
export function wordsOf(r: Pick<LocalEntryRow, 'final_text' | 'machine_edits' | 'edit_level'>): WordsGroup {
  return { final_text: r.final_text, machine_edits: parseEdits(r.machine_edits), edit_level: r.edit_level };
}

/** Two words groups are the same words (key order inside edits does not matter). */
export function sameWords(a: WordsGroup, b: WordsGroup): boolean {
  return a.final_text === b.final_text && a.edit_level === b.edit_level && canonical(a.machine_edits) === canonical(b.machine_edits);
}

function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`).join(',')}}`;
  }
  return JSON.stringify(v ?? null);
}

export function getEntryRow(db: SqlDb, id: string): LocalEntryRow | null {
  return db.get<LocalEntryRow>('SELECT * FROM entries WHERE id = ?', id);
}

export function getChildRow(db: SqlDb, id: string): LocalChildRow | null {
  return db.get<LocalChildRow>('SELECT * FROM children WHERE id = ?', id);
}

const isOwn = (owner: string, r: LocalEntryRow) => r.author_id === null || r.author_id === owner;

// ── Queue primitives ──────────────────────────────────────────────────────
export function opsFor(db: SqlDb, entityId: string): OutboxRow[] {
  return db.all<OutboxRow>('SELECT * FROM sync_outbox WHERE entity_id = ? ORDER BY lane, seq', entityId);
}

export function hasPendingOps(db: SqlDb, entityId: string): boolean {
  return db.get<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox WHERE entity_id = ?', entityId)!.n > 0;
}

/** Appends one op and returns its op id. */
export function appendOp(
  db: SqlDb,
  op: Omit<PushOp, 'op'>,
  ctx: EnqueueContext,
  opts: { lane?: number; bookId?: string | null } = {},
): string {
  const opId = ctx.newId();
  const full: PushOp = { op: opId, ...op };
  db.run(
    'INSERT INTO sync_outbox (op_id, lane, type, entity_id, book_id, payload, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    opId, opts.lane ?? 1, op.type, op.id, opts.bookId ?? null, JSON.stringify(full), ctx.now,
  );
  return opId;
}

/** An op that never left the phone may still be rewritten (coalesced). */
const untouched = (o: OutboxRow) => o.sent_at === null && o.attempts === 0 && o.lane === 1;

function setEntryState(db: SqlDb, id: string, state: string): void {
  db.run('UPDATE entries SET sync_state = ? WHERE id = ?', state, id);
}

/** Recomputes a letter's sync_state from its queue and server version (keeps rejected, held and gone). */
export function refreshEntryState(db: SqlDb, id: string): void {
  const r = getEntryRow(db, id);
  if (!r) return;
  if (hasPendingOps(db, id)) return setEntryState(db, id, 'pending');
  if (r.sync_state === 'pending' || r.sync_state === 'local' || r.sync_state === 'synced') {
    setEntryState(db, id, r.server_version ? 'synced' : 'local');
  }
}

// ── Letters ───────────────────────────────────────────────────────────────
/** A save or an edit of one's own letter. `groups` are the field groups the write changed. */
export function enqueueEntryUpsert(db: SqlDb, id: string, groups: readonly FieldGroup[], ctx: EnqueueContext): void {
  const owner = syncOwner(db);
  if (!owner) return;
  const r = getEntryRow(db, id);
  if (!r || !isOwn(owner, r) || r.deleted_at !== null) return;
  // A voice-only letter waiting for its words goes up as an author-only held row (F16 6.2 I waiting_letter).
  if (r.transcript_status === 'waiting' && r.child_id && !r.server_version) return enqueueHeld(db, id, heldFromWaiting(r), r.held_v ?? null, ctx);
  const data = entrySnapshot(r);
  if (!data) return setEntryState(db, id, r.server_version ? r.sync_state : 'local');
  // Its words exist now: the letter itself goes up, and on the server it replaces its held row (same id).
  db.run("DELETE FROM sync_outbox WHERE entity_id = ? AND type = 'held.upsert' AND sent_at IS NULL AND attempts = 0 AND lane = 1", id);
  const ops = opsFor(db, id);
  const tail = ops[ops.length - 1];
  if (tail && tail.type === 'entry.upsert' && untouched(tail)) {
    const p = JSON.parse(tail.payload) as PushOp;
    const changed = new Set<FieldGroup>([...(p.changed ?? ALL_GROUPS), ...groups]);
    p.data = data as unknown as Record<string, unknown>;
    p.changed = ALL_GROUPS.filter((g) => changed.has(g));
    db.run('UPDATE sync_outbox SET payload = ?, book_id = ? WHERE seq = ?', JSON.stringify(p), data.child_id, tail.seq);
  } else {
    appendOp(
      db,
      { type: 'entry.upsert', id, data: data as unknown as Record<string, unknown>, changed: [...groups], base: baseFor(db, r, ops) },
      ctx,
      { bookId: data.child_id },
    );
  }
  setEntryState(db, id, 'pending');
}

/**
 * The base of a new op. Behind another queued upsert of the same letter, it
 * inherits that op's base: this phone's words descend from what that op sends,
 * whose server version is not known yet; the rebase after it applies sets the
 * real one. Otherwise the server version this phone holds. A pull may move
 * `server_version` forward while ops wait (merge.ts keeps the local words then),
 * so the queued op's base, not the row, is the truth for a letter with ops.
 */
function baseFor(db: SqlDb, r: LocalEntryRow, ops: OutboxRow[]): string | null {
  for (let i = ops.length - 1; i >= 0; i--) {
    if (ops[i].type !== 'entry.upsert') continue;
    const p = JSON.parse(ops[i].payload) as PushOp;
    return p.base ?? null;
  }
  // Only a restore-time re-upload is queued: a pull may have moved server_version past words this phone
  // keeps for the server to judge, so the version proves nothing; '0' means the edit is compared.
  if (r.server_version !== null && ops.some((o) => o.type === 'entry.reupload')) return '0';
  return r.server_version;
}

/** Ops of a letter still waiting, in queue order, that change its words. */
export function queuedWordOps(db: SqlDb, id: string): OutboxRow[] {
  return opsFor(db, id).filter((o) => {
    if (o.type !== 'entry.upsert') return o.type === 'entry.reupload';
    const p = JSON.parse(o.payload) as PushOp;
    return (p.changed ?? ALL_GROUPS).includes('text');
  });
}

/**
 * F16-REQ-025: after an op of this letter applied at `v`, every later queued
 * upsert of it descends from that version.
 */
export function rebaseQueued(db: SqlDb, id: string, v: string, opts: { exceptWords?: boolean } = {}): void {
  for (const o of opsFor(db, id)) {
    if (o.type !== 'entry.upsert') continue;
    const p = JSON.parse(o.payload) as PushOp;
    if (opts.exceptWords && (p.changed ?? ALL_GROUPS).includes('text')) continue;
    if (p.base === v) continue;
    // Only forward: a base names words this phone has seen, and an older answer arriving
    // late (a duplicate's applied_v) must not move it back (a false conflict).
    if (p.base && /^\d+$/.test(p.base) && /^\d+$/.test(v) && BigInt(p.base) > BigInt(v)) continue;
    p.base = v;
    db.run('UPDATE sync_outbox SET payload = ? WHERE seq = ?', JSON.stringify(p), o.seq);
  }
}

/**
 * Tombstone. A letter the server never received leaves no trace there: its
 * queued upload is dropped and nothing is sent (it was deleted before it left
 * the phone). Otherwise unsent edits are dropped and one delete goes up.
 */
export function enqueueEntryDelete(db: SqlDb, id: string, ctx: EnqueueContext): void {
  const owner = syncOwner(db);
  if (!owner) return;
  const r = getEntryRow(db, id);
  if (!r || !isOwn(owner, r)) return;
  // A waiting letter is a held row on the server: it is let go there (restorable here, Recently deleted).
  if (r.transcript_status === 'waiting' && !r.server_version) return enqueueHeldDiscard(db, id, ctx);
  const ops = opsFor(db, id);
  const everSent = ops.some((o) => o.sent_at !== null || o.attempts > 0);
  if (!r.server_version && !everSent) {
    db.run('DELETE FROM sync_outbox WHERE entity_id = ?', id);
    return setEntryState(db, id, 'local');
  }
  db.run(
    "DELETE FROM sync_outbox WHERE entity_id = ? AND sent_at IS NULL AND attempts = 0 AND lane = 1 AND type IN ('entry.upsert', 'entry.restore')",
    id,
  );
  appendOp(db, { type: 'entry.delete', id, data: {} }, ctx, { bookId: r.child_id });
  setEntryState(db, id, 'pending');
}

/** Restore from Recently deleted. */
export function enqueueEntryRestore(db: SqlDb, id: string, ctx: EnqueueContext): void {
  const owner = syncOwner(db);
  if (!owner) return;
  const r = getEntryRow(db, id);
  if (!r || !isOwn(owner, r)) return;
  if (r.transcript_status === 'waiting' && !r.server_version) {
    // Restored before the discard left: cancel it; otherwise the held row goes up again.
    db.run("DELETE FROM sync_outbox WHERE entity_id = ? AND type = 'held.discard' AND sent_at IS NULL AND attempts = 0 AND lane = 1", id);
    return enqueueEntryUpsert(db, id, ALL_GROUPS, ctx);
  }
  const ops = opsFor(db, id);
  const unsentDeletes = ops.filter((o) => o.type === 'entry.delete' && untouched(o));
  const sentDelete = ops.some((o) => o.type === 'entry.delete' && !untouched(o));
  if (unsentDeletes.length > 0 && !sentDelete) {
    // The server never learned of the delete.
    for (const o of unsentDeletes) db.run('DELETE FROM sync_outbox WHERE seq = ?', o.seq);
    return refreshEntryState(db, id);
  }
  const everSent = ops.some((o) => !untouched(o));
  if (!r.server_version && !everSent) return enqueueEntryUpsert(db, id, ALL_GROUPS, ctx);
  appendOp(db, { type: 'entry.restore', id, data: {} }, ctx, { bookId: r.child_id });
  // The words travel again in case the server's copy is older (a no-op when equal). Its base is
  // the version this phone's words came from: a restore is not a words write, so it never rebases this.
  appendOp(
    db,
    { type: 'entry.upsert', id, data: (entrySnapshot(r) ?? {}) as unknown as Record<string, unknown>, changed: [...ALL_GROUPS], base: baseFor(db, r, ops) },
    ctx,
    { bookId: r.child_id },
  );
  setEntryState(db, id, 'pending');
}

// ── Held drafts (F16 6.2 I; WP-F16-17 and WP-F14-22, client) ──────────────
/**
 * A draft row as sync reads it (v8). Only a draft the author explicitly held at
 * the Keep gate (`held_kind` set) ever becomes a held row; every other draft
 * (a take in progress, a typed draft not yet saved, one waiting to be read back)
 * stays on this phone (F04 section 8).
 */
export interface LocalDraftRow {
  id: string;
  child_id: string;
  capture_mode: string;
  prompt_key: string | null;
  created_at: string;
  audio_uri: string | null;
  raw_transcript: string | null;
  typed_text: string | null;
  state: string;
  kind: string;
  occurred_on: string | null;
  occurred_precision: string;
  language: string | null;
  base_direction: string;
  held_kind: string | null;
  in_book_choice: number | null;
  held_v: string | null;
  /** v8: the typed words as the server last had them. */
  held_typed: string | null;
}

export function getDraftRow(db: SqlDb, id: string): LocalDraftRow | null {
  return db.get<LocalDraftRow>('SELECT * FROM drafts WHERE id = ?', id);
}

/** The local calendar day of an ISO time (a draft with no chosen date is dated by its creation). */
function localDay(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** The held row of a draft the author held, or null when it may not leave the phone. */
export function heldFromDraft(d: LocalDraftRow): HeldDraftData | null {
  if (!d.held_kind || d.state === 'recording' || d.state === 'discarding') return null;
  return {
    id: d.id,
    child_id: d.child_id,
    kind: d.held_kind === 'held_words' ? 'held_words' : 'held_letter',
    capture_mode: d.capture_mode,
    created_at: d.created_at,
    occurred_on: d.occurred_on ?? localDay(d.created_at),
    occurred_precision: d.occurred_precision ?? 'day',
    language: wireLanguage(d.language),
    base_direction: d.base_direction ?? 'ltr',
    prompt_key: d.prompt_key,
    in_book_choice: d.in_book_choice === null ? null : d.in_book_choice === 1,
    raw_transcript: d.raw_transcript && d.raw_transcript.length > 0 ? d.raw_transcript : null,
    final_text: null,
    machine_edits: null,
    edit_level: null,
    author_edits: null,
    locked_spans: null,
    typed_text: d.typed_text,
    engine_version: null,
    pack_ref: null,
    audio_kept_on_device: d.audio_uri !== null,
  };
}

/** A voice-only letter waiting for its words, as its held row (kind waiting_letter). */
export function heldFromWaiting(r: LocalEntryRow): HeldDraftData {
  return {
    id: r.id,
    child_id: r.child_id!,
    kind: 'waiting_letter',
    capture_mode: r.capture_mode,
    created_at: r.captured_at,
    occurred_on: r.occurred_on,
    occurred_precision: r.occurred_precision ?? 'day',
    language: wireLanguage(r.language),
    base_direction: r.base_direction ?? 'ltr',
    prompt_key: r.prompt_key,
    // A saved letter always has a destination (in the book or private), so "not chosen" never applies here.
    in_book_choice: r.in_book === 1,
    raw_transcript: null,
    final_text: null,
    machine_edits: null,
    edit_level: null,
    author_edits: null,
    locked_spans: null,
    typed_text: null,
    engine_version: r.engine_version,
    pack_ref: null,
    audio_kept_on_device: r.audio_uri !== null,
  };
}

/** Queues the whole held row; an unsent upsert of the same draft is rewritten in place (newest snapshot). */
/**
 * The groups a held upload changes, told truthfully (final review B-3): `text` only when the typed
 * words differ from the words the server last had (`held_typed`), so a date or language change made
 * after another phone changed the words never raises a words conflict. A row the server never had
 * sends every group.
 */
function heldChanged(heldV: string | null, data: HeldDraftData, serverTyped: string | null): FieldGroup[] {
  if (!heldV) return [...ALL_GROUPS];
  const meta = ALL_GROUPS.filter((g) => g !== 'text');
  return (data.typed_text ?? null) !== (serverTyped ?? null) ? [...ALL_GROUPS] : meta;
}

function enqueueHeld(db: SqlDb, id: string, data: HeldDraftData | null, heldV: string | null, ctx: EnqueueContext, serverTyped: string | null = null): void {
  if (!data) return;
  const ops = opsFor(db, id);
  const tail = ops[ops.length - 1];
  const earlier = [...ops].reverse().find((o) => o.type === 'held.upsert');
  // Behind an upload still queued or unanswered, this one descends from that upload's base (it is rebased
  // when the answer names the version that upload wrote), never from a version this phone has not seen.
  const base = earlier ? ((JSON.parse(earlier.payload) as PushOp).base ?? null) : heldV;
  const changed = heldChanged(base, data, serverTyped);
  if (tail && tail.type === 'held.upsert' && untouched(tail)) {
    const p = JSON.parse(tail.payload) as PushOp;
    p.data = data as unknown as Record<string, unknown>;
    p.changed = changed;
    db.run('UPDATE sync_outbox SET payload = ?, book_id = ? WHERE seq = ?', JSON.stringify(p), data.child_id, tail.seq);
    return;
  }
  appendOp(db, { type: 'held.upsert', id, data: data as unknown as Record<string, unknown>, changed, base }, ctx, { bookId: data.child_id });
}

/**
 * A held draft changed, or was just held (store.ts holdDraft and the draft
 * setters): queue its held row. Does nothing before the first sign-in, or for a
 * draft that was never held.
 */
export function enqueueHeldDraft(db: SqlDb, draftId: string, ctx: EnqueueContext): void {
  if (!syncOwner(db)) return;
  const d = getDraftRow(db, draftId);
  if (!d) return;
  enqueueHeld(db, draftId, heldFromDraft(d), d.held_v, ctx, d.held_typed);
}

/**
 * The author let a held draft go (F04-REQ-009) or deleted a waiting letter: an
 * upload that never left is dropped; if the server may hold the row, one
 * held.discard goes up, which also removes its backup (F08-REQ-043).
 */
export function enqueueHeldDiscard(db: SqlDb, id: string, ctx: EnqueueContext): void {
  if (!syncOwner(db)) return;
  const ops = opsFor(db, id).filter((o) => o.type === 'held.upsert' || o.type === 'held.discard');
  const everSent = ops.some((o) => !untouched(o));
  const heldV = getDraftRow(db, id)?.held_v ?? getEntryRow(db, id)?.held_v ?? null;
  db.run("DELETE FROM sync_outbox WHERE entity_id = ? AND type = 'held.upsert' AND sent_at IS NULL AND attempts = 0 AND lane = 1", id);
  if (!heldV && !everSent) return;
  if (ops.some((o) => o.type === 'held.discard' && untouched(o))) return;
  const book = getDraftRow(db, id)?.child_id ?? getEntryRow(db, id)?.child_id ?? null;
  // The last version this phone saw: the server keeps the row if its words changed since (a later edit
  // on another phone wins over this let-go, in either order; final review B-2).
  appendOp(db, { type: 'held.discard', id, data: {}, base: heldV }, ctx, { bookId: book });
}

// ── Erase now for a letter the server holds (WP-F16-13, F16-REQ-024) ──────
/**
 * Erase ops wait in their own lane, after every other op, so one that waits
 * for a server that cannot erase yet never holds up the rest of the queue.
 */
export const ERASE_LANE = 2;

/**
 * "Erase now" on a letter the server may hold: one entry.erase, sent after the
 * local row is gone (store.eraseEntry erases the file, then the row, then calls
 * this). It carries the id only, never words. It still goes during a consent
 * pause (a deletion, LEGAL-REQ-009). Only this account's own letters.
 */
export function enqueueEntryErase(db: SqlDb, id: string, bookId: string | null, ctx: EnqueueContext): void {
  if (!syncOwner(db)) return;
  if (db.get<{ n: number }>("SELECT COUNT(*) AS n FROM sync_outbox WHERE entity_id = ? AND type = 'entry.erase'", id)!.n > 0) return;
  appendOp(db, { type: 'entry.erase', id, data: {} }, ctx, { lane: ERASE_LANE, bookId });
}

/** Whether any held op of this letter or draft ever left the phone. */
export function heldEverSent(db: SqlDb, id: string): boolean {
  return db.get<{ n: number }>(
    "SELECT COUNT(*) AS n FROM sync_outbox WHERE entity_id = ? AND type LIKE 'held.%' AND (sent_at IS NOT NULL OR attempts > 0)", id,
  )!.n > 0;
}

/** Whether any op of this letter ever left the phone (the server may hold it). */
export function everSent(db: SqlDb, id: string): boolean {
  return db.get<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox WHERE entity_id = ? AND (sent_at IS NOT NULL OR attempts > 0)', id)!.n > 0;
}

/** Whether an erase of this letter is still on its way to the server (a pull must not bring it back). */
export function eraseQueued(db: SqlDb, id: string): boolean {
  return db.get<{ n: number }>("SELECT COUNT(*) AS n FROM sync_outbox WHERE entity_id = ? AND type = 'entry.erase'", id)!.n > 0;
}

/**
 * The author let a held draft go: every copy of its words this phone keeps in rejected_writes goes
 * with it, conflict copies and refused uploads alike (never in an export after; final review A-M3).
 */
export function dropHeldConflictCopies(db: SqlDb, draftId: string): void {
  db.run("DELETE FROM rejected_writes WHERE entity_id = ? AND type = 'held.upsert'", draftId);
}

/** A held draft became a letter (Keep after Plus): its letter replaces the held row on the server, so no held upload is needed. */
export function dropQueuedHeldUpsert(db: SqlDb, id: string): void {
  db.run("DELETE FROM sync_outbox WHERE entity_id = ? AND type = 'held.upsert' AND sent_at IS NULL AND attempts = 0 AND lane = 1", id);
}

/** What held.upsert answers about the words (protocol v1): the server's words when it kept them. */
export interface HeldAnswer {
  held?: { id: string; v: string; updated_at: string } | null;
  conflict_groups?: string[];
  current?: { typed_text?: string | null; v: string } | null;
  /** A duplicate: `held` is the row as it is now, which may hold another phone's words. */
  dup?: boolean;
  /** The version this op wrote when it first applied (held receipts; S02 request). */
  applied_v?: string | null;
}

/**
 * A held.upsert answer (F16 6.2 I, words by compare and set as 6.2 E).
 * - The version this phone's words now descend from becomes `held_v`, and an
 *   upload of the same draft still queued is rebased on it. For a duplicate that
 *   is only the version this op wrote (`applied_v`), never the row's version now,
 *   which may hold another phone's words; with no `applied_v` nothing moves, so the
 *   next upload is compared against what this phone last saw (final review A-B1).
 * - Words refused (another phone of this author changed them first): this phone's
 *   typed words are kept as a conflict copy, but only when this phone changed them
 *   (they differ from `held_typed`); the draft follows the server's words, and the
 *   queued upload carries those. A `current` without `typed_text` says nothing about
 *   the typed words: they are kept as they are (final review B7).
 * - Kept on another phone before this upload arrived (`held: null`): words this phone
 *   changed stay as a conflict copy until the letter arrives.
 * Returns true when a conflict copy was made.
 */
export function settleHeldAnswer(
  db: SqlDb, opId: string, id: string, r: HeldAnswer, now: string, sent?: { typed_text?: string | null; changed?: FieldGroup[] },
): boolean {
  const v = r.dup ? (r.applied_v ?? null) : (r.held?.v ?? null);
  if (v) {
    db.run('UPDATE drafts SET held_v = ? WHERE id = ?', v, id);
    db.run("UPDATE entries SET held_v = ? WHERE id = ? AND transcript_status = 'waiting'", v, id);
  }
  let copied = false;
  const draft = getDraftRow(db, id);
  const changedHere = (d: LocalDraftRow) => (d.typed_text ?? null) !== (d.held_typed ?? null);
  if (draft && draft.state !== 'discarding' && r.held === null && (draft.typed_text ?? '').trim() !== '' && changedHere(draft)
      && !listConflictCopies(db, id).some((c) => c.words.final_text === draft.typed_text)) {
    addHeldConflictCopy(db, opId, id, draft.typed_text!, null, now);
    copied = true;
  }
  const refused = (r.conflict_groups ?? []).includes('text');
  if (draft && refused && r.current && 'typed_text' in r.current) {
    const theirs = r.current.typed_text ?? null;
    if ((draft.typed_text ?? null) !== theirs) {
      const mine = draft.typed_text ?? '';
      if (changedHere(draft) && mine.trim() !== '' && !listConflictCopies(db, id).some((c) => c.words.final_text === mine)) {
        addHeldConflictCopy(db, opId, id, mine, r.current.v, now);
        copied = true;
      }
      db.run('UPDATE drafts SET typed_text = ? WHERE id = ?', theirs, id);
    }
    db.run('UPDATE drafts SET held_typed = ? WHERE id = ?', theirs, id);
  } else if (draft && v && !refused && sent && (sent.changed ?? ALL_GROUPS).includes('text')) {
    // These words are the server's now.
    db.run('UPDATE drafts SET held_typed = ? WHERE id = ?', sent.typed_text ?? null, id);
  }
  const later = opsFor(db, id).filter((o) => o.type === 'held.upsert' && untouched(o));
  if (later.length > 0) {
    const d = getDraftRow(db, id);
    const e = d ? null : getEntryRow(db, id);
    const data = d ? heldFromDraft(d) : e && e.transcript_status === 'waiting' && e.child_id ? heldFromWaiting(e) : null;
    for (const o of later) {
      const p = JSON.parse(o.payload) as PushOp;
      if (data) p.data = data as unknown as Record<string, unknown>;
      if (v) p.base = v;
      if (data) p.changed = heldChanged(p.base ?? null, data, d?.held_typed ?? null);
      db.run('UPDATE sync_outbox SET payload = ? WHERE seq = ?', JSON.stringify(p), o.seq);
    }
  }
  return copied;
}

// ── Books and per-book preferences ────────────────────────────────────────
function bookCreateData(c: LocalChildRow): Record<string, unknown> {
  return { name: c.name, date_of_birth: c.birthday, due_date: c.due_date };
}

/** A book started on this phone after sign-in (first-run books go in one batch, see ownership.ts). */
export function enqueueBookCreate(db: SqlDb, childId: string, ctx: EnqueueContext): void {
  if (!syncOwner(db)) return;
  const c = getChildRow(db, childId);
  if (!c) return;
  appendOp(db, { type: 'book.create', id: childId, data: bookCreateData(c) }, ctx, { bookId: childId });
  db.run(
    "UPDATE children SET server_state = 'pending', role = 'parent', created_by_me = 1, created_by = COALESCE(created_by, ?) WHERE id = ?",
    syncOwner(db), childId,
  );
  enqueuePrefs(db, childId, prefsFields(db, childId), ctx);
}

function coalesceOrAppend(db: SqlDb, type: 'book.update' | 'prefs.upsert', childId: string, fields: Record<string, unknown>, ctx: EnqueueContext): void {
  const ops = opsFor(db, childId);
  const tail = ops[ops.length - 1];
  if (tail && tail.type === type && untouched(tail)) {
    const p = JSON.parse(tail.payload) as PushOp;
    p.data = { ...p.data, ...fields };
    db.run('UPDATE sync_outbox SET payload = ? WHERE seq = ?', JSON.stringify(p), tail.seq);
  } else {
    appendOp(db, { type, id: childId, data: fields }, ctx, { bookId: childId });
  }
}

/** Book settings a parent changed: only the fields that changed travel (per-field last writer wins). */
export function enqueueBookUpdate(db: SqlDb, childId: string, fields: Record<string, unknown>, ctx: EnqueueContext): void {
  if (!syncOwner(db) || Object.keys(fields).length === 0) return;
  const c = getChildRow(db, childId);
  if (!c || c.server_state === 'local' || c.role === 'contributor') return;
  coalesceOrAppend(db, 'book.update', childId, fields, ctx);
}

/** What this child calls me, and my reminder switch for this book (person-per-book scope). */
export function enqueuePrefs(db: SqlDb, childId: string, fields: Record<string, unknown>, ctx: EnqueueContext): void {
  if (!syncOwner(db) || Object.keys(fields).length === 0) return;
  const c = getChildRow(db, childId);
  if (!c || c.server_state === 'local') return;
  coalesceOrAppend(db, 'prefs.upsert', childId, fields, ctx);
}

// ── Sending ───────────────────────────────────────────────────────────────
const NOT_REFUSED = "NOT EXISTS (SELECT 1 FROM children c WHERE c.id = o.book_id AND c.server_state = 'refused')";

/**
 * Held ops wait on the phone until the server has shown it holds held drafts (its
 * pull carries a `held` section). An older server would refuse them as an unknown
 * op type and the rows would be lost from the queue; this way they stay queued.
 */
function sendable(db: SqlDb): string {
  return readSetting(db, SYNC_SETTING.heldServer) === '1' ? NOT_REFUSED : `${NOT_REFUSED} AND o.type NOT LIKE 'held.%'`;
}

/**
 * Ops that can still reach the server now: a book the server refused holds its letters on the
 * phone, held ops wait for a server with held drafts, and an erase waiting for a server that can
 * erase is not counted.
 */
export function pendingCount(db: SqlDb): number {
  // An erase waiting for a server that can erase is not pending work either (it never holds a pause or the drain).
  return db.get<{ n: number }>(
    `SELECT COUNT(*) AS n FROM sync_outbox o WHERE ${sendable(db)}
       AND NOT (o.lane = ${ERASE_LANE} AND o.next_attempt_at IS NOT NULL AND o.next_attempt_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
  )!.n;
}

export function rejectedUnseenCount(db: SqlDb): number {
  return db.get<{ n: number }>('SELECT COUNT(*) AS n FROM rejected_writes WHERE seen_at IS NULL AND code <> ?', CONFLICT_CODE)!.n;
}

// ── Word conflicts (F16 6.2 E step 3, WP-F16-15) ──────────────────────────
/**
 * A conflict copy is a row in rejected_writes with this code: this phone's
 * version of a letter's words that the server did not take, kept on the phone
 * (L4, never uploaded unless the author picks it) and in export until the author
 * chooses (F16-REQ-023). rejected_writes already has exactly that life cycle, so
 * no new local table is needed (local schema numbers are fixed, 08 section 4).
 * payload is an entry.upsert op with this phone's whole snapshot and
 * `conflict: { server_v }`, the version the letter was rebased on.
 */
export const CONFLICT_CODE = 'conflict';

export interface ConflictCopy {
  /** The op id of the push that met the conflict (the row key). */
  opId: string;
  /** The letter, or for a held draft (`draft`) the draft; the id is the same once it is kept. */
  entryId: string;
  /** v8: a held draft's typed words (in `words.final_text`), not a saved letter's. */
  draft: boolean;
  /** This phone's words. */
  words: WordsGroup;
  /** Server version the letter now follows. */
  serverV: string | null;
  /** Device time the conflict was found. */
  at: string;
  seenAt: string | null;
}

interface ConflictPayload extends PushOp {
  conflict?: { server_v: string | null };
}

export function addConflictCopy(db: SqlDb, opId: string, data: EntryData, serverV: string | null, now: string): void {
  const payload: ConflictPayload = {
    op: opId,
    type: 'entry.upsert',
    id: data.id,
    data: data as unknown as Record<string, unknown>,
    changed: ['text'],
    conflict: { server_v: serverV },
  };
  db.run(
    'INSERT OR REPLACE INTO rejected_writes (op_id, type, entity_id, payload, code, rejected_at) VALUES (?, ?, ?, ?, ?, ?)',
    opId, 'entry.upsert', data.id, JSON.stringify(payload), CONFLICT_CODE, now,
  );
}

/**
 * A held draft's conflict copy (v8): this phone's typed words that the server did
 * not take. Same table and life cycle as a letter's; `draft` tells them apart.
 */
export function addHeldConflictCopy(db: SqlDb, opId: string, draftId: string, typedText: string, serverV: string | null, now: string): void {
  const payload: ConflictPayload = { op: opId, type: 'held.upsert', id: draftId, data: { id: draftId, typed_text: typedText }, conflict: { server_v: serverV } };
  db.run(
    'INSERT OR REPLACE INTO rejected_writes (op_id, type, entity_id, payload, code, rejected_at) VALUES (?, ?, ?, ?, ?, ?)',
    opId, 'held.upsert', draftId, JSON.stringify(payload), CONFLICT_CODE, now,
  );
}

function toConflict(r: { op_id: string; entity_id: string; payload: string; rejected_at: string; seen_at: string | null }): ConflictCopy {
  const p = JSON.parse(r.payload) as ConflictPayload;
  const d = p.data as Partial<EntryData> & { typed_text?: string };
  const draft = p.type === 'held.upsert';
  return {
    opId: r.op_id,
    entryId: r.entity_id,
    draft,
    words: draft
      ? { final_text: String(d.typed_text ?? ''), machine_edits: [], edit_level: 'verbatim' }
      : { final_text: String(d.final_text ?? ''), machine_edits: Array.isArray(d.machine_edits) ? d.machine_edits : [], edit_level: String(d.edit_level ?? 'clean') },
    serverV: p.conflict?.server_v ?? null,
    at: r.rejected_at,
    seenAt: r.seen_at,
  };
}

/** Conflict copies, newest first; for one letter when `entryId` is given. */
export function listConflictCopies(db: SqlDb, entryId?: string): ConflictCopy[] {
  const rows = entryId === undefined
    ? db.all<{ op_id: string; entity_id: string; payload: string; rejected_at: string; seen_at: string | null }>(
      'SELECT op_id, entity_id, payload, rejected_at, seen_at FROM rejected_writes WHERE code = ? ORDER BY rejected_at DESC, op_id DESC', CONFLICT_CODE)
    : db.all<{ op_id: string; entity_id: string; payload: string; rejected_at: string; seen_at: string | null }>(
      'SELECT op_id, entity_id, payload, rejected_at, seen_at FROM rejected_writes WHERE code = ? AND entity_id = ? ORDER BY rejected_at DESC, op_id DESC',
      CONFLICT_CODE, entryId);
  return rows.map(toConflict);
}

/** Letters with a conflict copy waiting for the author. */
export function conflictCount(db: SqlDb): number {
  return db.get<{ n: number }>('SELECT COUNT(DISTINCT entity_id) AS n FROM rejected_writes WHERE code = ?', CONFLICT_CODE)!.n;
}

export function removeConflictCopy(db: SqlDb, opId: string): boolean {
  const had = db.get<{ n: number }>('SELECT COUNT(*) AS n FROM rejected_writes WHERE op_id = ? AND code = ?', opId, CONFLICT_CODE)!.n;
  db.run('DELETE FROM rejected_writes WHERE op_id = ? AND code = ?', opId, CONFLICT_CODE);
  return had > 0;
}

export interface Batch {
  rows: OutboxRow[];
  ops: PushOp[];
  /** Set when the head of the queue is backing off: nothing goes before this time. */
  waitUntil: string | null;
}

/**
 * The next batch in queue order: at most `maxOps` ops and about `maxBytes` of
 * JSON (the server takes 50 and 256 KB). When the head op is backing off,
 * nothing is sent (order is kept). `onlyDeletes` is the consent-pause mode:
 * tombstones still go (LEGAL-REQ-009).
 */
export function takeBatch(db: SqlDb, opts: { now: string; onlyDeletes?: boolean; maxOps?: number; maxBytes?: number }): Batch {
  const maxOps = opts.maxOps ?? 50;
  const maxBytes = opts.maxBytes ?? 200_000;
  const rows = db.all<OutboxRow>(
    `SELECT o.* FROM sync_outbox o WHERE ${sendable(db)} ${opts.onlyDeletes ? "AND o.type IN ('entry.delete', 'held.discard', 'entry.erase')" : ''}
     ORDER BY o.lane, o.seq LIMIT ?`,
    maxOps,
  );
  if (rows.length === 0) return { rows: [], ops: [], waitUntil: null };
  if (rows[0].next_attempt_at && rows[0].next_attempt_at > opts.now) return { rows: [], ops: [], waitUntil: rows[0].next_attempt_at };
  const out: OutboxRow[] = [];
  const letters = new Set<string>();
  let bytes = 0;
  for (const r of rows) {
    if (out.length > 0 && bytes + r.payload.length > maxBytes) break;
    // An erase waiting for a server that can erase is skipped until its time (its lane never blocks the rest).
    if (r.lane === ERASE_LANE && r.next_attempt_at && r.next_attempt_at > opts.now) continue;
    // One op per letter per batch: the next op of a letter leaves only after this one's answer
    // rebased it (F16-REQ-025). The batch ends here, so queue order is kept exactly.
    // A held draft and the letter it becomes share the id, so held ops take part in the same rule.
    const perLetter = r.type.startsWith('entry.') || r.type.startsWith('held.');
    if (perLetter && letters.has(r.entity_id)) break;
    if (perLetter) letters.add(r.entity_id);
    out.push(r);
    bytes += r.payload.length;
  }
  return { rows: out, ops: out.map((r) => JSON.parse(r.payload) as PushOp), waitUntil: null };
}

/** Marks ops as possibly applied before the request leaves (so they are never rewritten). */
export function markSent(db: SqlDb, rows: OutboxRow[], now: string): void {
  for (const r of rows) db.run('UPDATE sync_outbox SET sent_at = COALESCE(sent_at, ?) WHERE seq = ?', now, r.seq);
}

export function removeOp(db: SqlDb, seq: number): void {
  db.run('DELETE FROM sync_outbox WHERE seq = ?', seq);
}

/** Moves an op to rejected_writes with its SQLSTATE (DATA-REQ-043); the queue continues. */
export function rejectOp(db: SqlDb, row: OutboxRow, code: string, now: string): void {
  db.run(
    'INSERT OR REPLACE INTO rejected_writes (op_id, type, entity_id, payload, code, rejected_at) VALUES (?, ?, ?, ?, ?, ?)',
    row.op_id, row.type, row.entity_id, row.payload, code.slice(0, 8), now,
  );
  removeOp(db, row.seq);
}

/** The head op waits `delayMs` before the next try (exponential backoff with jitter, decided by the caller). */
export function backoff(db: SqlDb, row: OutboxRow, now: number, delayMs: number): void {
  db.run(
    'UPDATE sync_outbox SET attempts = attempts + 1, next_attempt_at = ? WHERE seq = ?',
    new Date(now + delayMs).toISOString(), row.seq,
  );
}

export function headOp(db: SqlDb): OutboxRow | null {
  return db.get<OutboxRow>(`SELECT o.* FROM sync_outbox o WHERE ${sendable(db)} ORDER BY o.lane, o.seq LIMIT 1`);
}
