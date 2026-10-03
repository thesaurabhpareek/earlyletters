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
 */
import type { SqlDb } from '../db/sql';
import { ALL_GROUPS, type EntryData, type FieldGroup, type PushOp, type PushOpType } from './types';

export const SYNC_SETTING = {
  owner: 'sync.ownerId',
  epoch: 'sync.epoch',
  epochStartedAt: 'sync.epochStartedAt',
  restoreAt: 'sync.restoreAt',
  pausedFor: 'sync.pausedFor',
  lastSyncedAt: 'sync.lastSyncedAt',
  lastVerifyAt: 'sync.lastVerifyAt',
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
}

export interface LocalChildRow {
  id: string;
  name: string;
  birthday: string | null;
  due_date: string | null;
  signs_as: string;
  reminders_on: number;
  family_can_read: number;
  created_at: string;
  hidden_at: string | null;
  role: string | null;
  created_by_me: number | null;
  nickname: string | null;
  server_state: string;
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

/** The letter as the server stores it, or null when it cannot upload (no book, or waiting for words). */
export function entrySnapshot(r: LocalEntryRow): EntryData | null {
  if (!r.child_id || r.transcript_status === 'waiting') return null;
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
  };
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
  const data = entrySnapshot(r);
  if (!data) return setEntryState(db, id, r.server_version ? r.sync_state : 'local');
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
      { type: 'entry.upsert', id, data: data as unknown as Record<string, unknown>, changed: [...groups], base: r.server_version },
      ctx,
      { bookId: data.child_id },
    );
  }
  setEntryState(db, id, 'pending');
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
  // The words travel again in case the server's copy is older (a no-op when equal).
  appendOp(
    db,
    { type: 'entry.upsert', id, data: (entrySnapshot(r) ?? {}) as unknown as Record<string, unknown>, changed: [...ALL_GROUPS], base: r.server_version },
    ctx,
    { bookId: r.child_id },
  );
  setEntryState(db, id, 'pending');
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
  db.run("UPDATE children SET server_state = 'pending', role = 'parent', created_by_me = 1 WHERE id = ?", childId);
  enqueuePrefs(db, childId, { signs_as: c.signs_as, include_in_reminders: c.reminders_on === 1 }, ctx);
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

/** Ops that can still reach the server (a book the server refused holds its letters on the phone). */
export function pendingCount(db: SqlDb): number {
  return db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM sync_outbox o WHERE ${NOT_REFUSED}`)!.n;
}

export function rejectedUnseenCount(db: SqlDb): number {
  return db.get<{ n: number }>('SELECT COUNT(*) AS n FROM rejected_writes WHERE seen_at IS NULL')!.n;
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
    `SELECT o.* FROM sync_outbox o WHERE ${NOT_REFUSED} ${opts.onlyDeletes ? "AND o.type = 'entry.delete'" : ''}
     ORDER BY o.lane, o.seq LIMIT ?`,
    maxOps,
  );
  if (rows.length === 0) return { rows: [], ops: [], waitUntil: null };
  if (rows[0].next_attempt_at && rows[0].next_attempt_at > opts.now) return { rows: [], ops: [], waitUntil: rows[0].next_attempt_at };
  const out: OutboxRow[] = [];
  let bytes = 0;
  for (const r of rows) {
    if (out.length > 0 && bytes + r.payload.length > maxBytes) break;
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
  return db.get<OutboxRow>(`SELECT o.* FROM sync_outbox o WHERE ${NOT_REFUSED} ORDER BY o.lane, o.seq LIMIT 1`);
}
