/**
 * Applying server answers to the phone's SQLite. Pure (SqlDb only); the engine
 * runs each function inside one local transaction.
 *
 * Merge rules (D-023):
 * - Last writer wins by server arrival, per field group. A letter with ops still
 *   queued keeps its local words (the queued op is the later writer and will
 *   win); only a server tombstone is applied to it (delete wins).
 * - Deletes are tombstones: an own letter deleted on another phone arrives with
 *   deleted_at and stays in Recently deleted. Another person's letter that is no
 *   longer readable is removed from this phone (found through the digest).
 * - raw_transcript is never changed once set.
 * - A restore never deletes anything here: see enterRestoreMode.
 */
import type { SqlDb } from '../db/sql';
import {
  ALL_GROUPS,
  type BookMeta,
  type Digest,
  type EntryState,
  type GoneBook,
  type PulledBook,
  type PulledRow,
  type PullResponse,
  type PushOp,
  type PushResponse,
} from './types';
import {
  SYNC_SETTING,
  appendOp,
  enqueueEntryUpsert,
  entrySnapshot,
  getChildRow,
  getEntryRow,
  hasPendingOps,
  readSetting,
  refreshEntryState,
  rejectOp,
  removeOp,
  syncOwner,
  writeSetting,
  type EnqueueContext,
  type LocalEntryRow,
  type OutboxRow,
} from './outbox';

const MOD48 = 2 ** 48;

/** The digest the server computes: count and 48-bit sum of the ids' last 12 hex digits. */
export function digestOf(ids: Iterable<string>): Digest {
  let n = 0;
  let sum = 0;
  for (const id of ids) {
    n++;
    sum = (sum + parseInt(id.replace(/-/g, '').slice(-12), 16)) % MOD48;
  }
  return { n, sum };
}

/** Letters of a book this phone holds as confirmed by the server in this epoch. */
function confirmedIds(db: SqlDb, childId: string, epoch: number): { id: string; author_id: string | null }[] {
  return db.all(
    "SELECT id, author_id FROM entries WHERE child_id = ? AND server_version IS NOT NULL AND server_epoch = ? AND sync_state NOT IN ('held', 'gone')",
    childId, epoch,
  );
}

export function localDigest(db: SqlDb, childId: string, epoch: number): Digest {
  return digestOf(confirmedIds(db, childId, epoch).map((r) => r.id));
}

export function currentEpoch(db: SqlDb): number | null {
  const v = readSetting(db, SYNC_SETTING.epoch);
  return v === null ? null : Number(v);
}

// ── Push results ──────────────────────────────────────────────────────────

/** Records the server's state of a letter after an op (versions always; content only when nothing else is queued). */
export function applyEntryState(db: SqlDb, s: EntryState, epoch: number | null, now: string): void {
  db.run(
    'UPDATE entries SET server_version = ?, server_updated_at = ?, server_epoch = ?, synced_at = ? WHERE id = ?',
    s.v, s.updated_at, epoch, now, s.id,
  );
  if (hasPendingOps(db, s.id)) return;
  db.run(
    `UPDATE entries SET approval = ?, in_book = ?, sync_state = 'synced',
       deleted_at = CASE WHEN ? IS NOT NULL THEN COALESCE(deleted_at, ?) ELSE deleted_at END
     WHERE id = ?`,
    s.approval, s.in_book ? 1 : 0, s.deleted_at, s.deleted_at, s.id,
  );
}

export interface PushOutcome {
  pushed: number;
  rejected: number;
  /** SCCON: the rest of the batch was not applied. */
  paused: boolean;
  consent: string | null;
  /** A transient server error stopped the batch at this op (retry from it). */
  stoppedAt: OutboxRow | null;
}

/** Applies one sync_push answer. `rows` is the batch as sent, in order. */
export function applyPushResponse(db: SqlDb, rows: OutboxRow[], res: PushResponse, ctx: EnqueueContext): PushOutcome {
  const epoch = currentEpoch(db);
  const byOp = new Map(rows.map((r) => [r.op_id, r]));
  const answered = new Set<string>();
  /** Books refused in this batch: later ops for them stay queued (parked), they are not rejected. */
  const parked = new Set<string>(
    db.all<{ id: string }>("SELECT id FROM children WHERE server_state = 'refused'").map((r) => r.id),
  );
  let pushed = 0;
  let rejected = 0;
  for (const r of res.results ?? []) {
    const row = byOp.get(r.op);
    if (!row) continue;
    answered.add(row.op_id);
    if (r.ok) {
      pushed++;
      removeOp(db, row.seq);
      if (row.type.startsWith('entry.')) {
        if (r.missing) {
          // The server does not have this letter: a restore sends it whole; a delete has nothing to do.
          if (row.type === 'entry.restore') enqueueEntryUpsert(db, row.entity_id, ALL_GROUPS, ctx);
          if (row.type === 'entry.delete') db.run('UPDATE entries SET server_version = NULL, server_epoch = NULL WHERE id = ?', row.entity_id);
        } else if (r.entry) {
          applyEntryState(db, r.entry, epoch, ctx.now);
        }
        refreshEntryState(db, row.entity_id);
      } else if (row.type === 'book.create') {
        db.run("UPDATE children SET server_state = 'synced' WHERE id = ? AND server_state IN ('pending', 'local', 'refused')", row.entity_id);
      } else if (row.type === 'book.first_run') {
        const kids = ((JSON.parse(row.payload) as PushOp).data.children ?? []) as { id: string }[];
        for (const k of kids) db.run("UPDATE children SET server_state = 'synced' WHERE id = ? AND server_state IN ('pending', 'local')", k.id);
      }
      continue;
    }
    // Refused for good.
    if (r.code === 'SCPLS' && (row.type === 'book.create' || row.type === 'book.first_run')) {
      // Older servers only (Plus is decided on the phone since 20261004000000): the book and its
      // letters stay on the phone, parked, until retryRefusedBook().
      db.run("UPDATE children SET server_state = 'refused' WHERE id = ?", row.entity_id);
      parked.add(row.entity_id);
      continue;
    }
    if (row.book_id && parked.has(row.book_id)) continue; // failed only because its book is not on the server
    rejected++;
    rejectOp(db, row, r.code, ctx.now);
    if (row.type === 'book.create' || row.type === 'book.first_run') {
      const ids = row.type === 'book.create'
        ? [row.entity_id]
        : (((JSON.parse(row.payload) as PushOp).data.children ?? []) as { id: string }[]).map((k) => k.id);
      for (const id of ids) db.run("UPDATE children SET server_state = 'refused' WHERE id = ?", id);
    } else if (row.type.startsWith('entry.')) {
      if (r.gone) {
        // Deleted on another phone and purged: it stays in Recently deleted here, never uploads again.
        db.run('DELETE FROM sync_outbox WHERE entity_id = ?', row.entity_id);
        db.run(
          "UPDATE entries SET deleted_at = COALESCE(deleted_at, ?), server_version = NULL, server_epoch = NULL, sync_state = 'gone' WHERE id = ?",
          ctx.now, row.entity_id,
        );
      } else if (!hasPendingOps(db, row.entity_id)) {
        db.run("UPDATE entries SET sync_state = 'rejected' WHERE id = ?", row.entity_id);
      }
    }
  }
  const unanswered = rows.filter((r) => !answered.has(r.op_id));
  return {
    pushed,
    rejected,
    paused: !!res.paused,
    consent: res.paused ? (res.consent ?? null) : null,
    stoppedAt: res.stopped ? (unanswered[0] ?? null) : null,
  };
}

// ── Pull pages ────────────────────────────────────────────────────────────

const bool = (v: boolean | null | undefined) => (v === null || v === undefined ? null : v ? 1 : 0);

function mergeOwnRow(db: SqlDb, row: PulledRow, epoch: number, now: string): void {
  const local = getEntryRow(db, row.id);
  const edits = JSON.stringify(row.machine_edits ?? []);
  if (!local) {
    db.run(
      `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, prompt_key, engine_version,
         raw_transcript, machine_edits, final_text, in_book, sounds_like_me, updated_at, deleted_at, synced_at,
         child_id, author_id, author_signs_as, approval, server_version, server_updated_at, server_epoch, sync_state)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
      row.id, row.kind, row.occurred_on, row.captured_at, row.capture_mode, row.edit_level, row.prompt_key, row.engine_version,
      row.raw_transcript ?? '', edits, row.final_text, row.in_book ? 1 : 0, bool(row.sounds_like_me), now, row.deleted_at, now,
      row.child_id, row.author_id, row.author_signs_as, row.approval, row.v, row.updated_at, epoch,
    );
    return;
  }
  if (local.author_id !== null && local.author_id !== row.author_id) return;
  db.run(
    'UPDATE entries SET server_version = ?, server_updated_at = ?, server_epoch = ?, synced_at = ?, author_id = ? WHERE id = ?',
    row.v, row.updated_at, epoch, now, row.author_id, row.id,
  );
  if (hasPendingOps(db, row.id)) {
    // Our queued op is the later writer; only a delete from elsewhere wins over it.
    if (row.deleted_at && !local.deleted_at) db.run('UPDATE entries SET deleted_at = ? WHERE id = ?', row.deleted_at, row.id);
    return;
  }
  db.run(
    `UPDATE entries SET kind = ?, occurred_on = ?, edit_level = ?, prompt_key = ?, final_text = ?, machine_edits = ?,
       in_book = ?, sounds_like_me = ?, author_signs_as = ?, approval = ?, deleted_at = ?, updated_at = ?,
       raw_transcript = CASE WHEN raw_transcript = '' THEN ? ELSE raw_transcript END,
       sync_state = 'synced'
     WHERE id = ?`,
    row.kind, row.occurred_on, row.edit_level, row.prompt_key, row.final_text, edits,
    row.in_book ? 1 : 0, bool(row.sounds_like_me), row.author_signs_as, row.approval, row.deleted_at, now,
    row.raw_transcript ?? '', row.id,
  );
}

/** Another person's letter: words and metadata only, never their raw transcript or edit list. */
function mergeOtherRow(db: SqlDb, row: PulledRow, owner: string | null, epoch: number, now: string): void {
  const local = getEntryRow(db, row.id);
  if (local && (local.author_id === null || local.author_id === owner)) return;
  db.run(
    `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, prompt_key, engine_version,
       raw_transcript, machine_edits, final_text, in_book, sounds_like_me, updated_at, deleted_at, synced_at,
       child_id, author_id, author_signs_as, approval, server_version, server_updated_at, server_epoch, sync_state)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', '[]', ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
     ON CONFLICT(id) DO UPDATE SET
       kind = excluded.kind, occurred_on = excluded.occurred_on, edit_level = excluded.edit_level,
       prompt_key = excluded.prompt_key, final_text = excluded.final_text, in_book = excluded.in_book,
       sounds_like_me = excluded.sounds_like_me, updated_at = excluded.updated_at, deleted_at = NULL,
       synced_at = excluded.synced_at, author_signs_as = excluded.author_signs_as, approval = excluded.approval,
       server_version = excluded.server_version, server_updated_at = excluded.server_updated_at,
       server_epoch = excluded.server_epoch, sync_state = 'synced'`,
    row.id, row.kind, row.occurred_on, row.captured_at, row.capture_mode, row.edit_level, row.prompt_key, row.engine_version,
    row.final_text, row.in_book ? 1 : 0, bool(row.sounds_like_me), now, now,
    row.child_id, row.author_id, row.author_signs_as, row.approval, row.v, row.updated_at, epoch,
  );
}

function mergeRows(db: SqlDb, rows: PulledRow[], owner: string | null, epoch: number, now: string): void {
  for (const r of rows) {
    if (r.own) mergeOwnRow(db, r, epoch, now);
    else mergeOtherRow(db, r, owner, epoch, now);
  }
}

/** Creates or updates the local book from the server's settings. Returns false when they were not applied. */
function mergeBook(db: SqlDb, b: PulledBook, now: string): boolean {
  const c = getChildRow(db, b.id);
  const m: BookMeta | undefined = b.meta;
  if (!c) {
    if (!m) return false;
    db.run(
      `INSERT INTO children (id, name, birthday, due_date, signs_as, reminders_on, family_can_read, created_at, updated_at,
         role, created_by_me, nickname, server_state)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
      b.id, m.name, m.date_of_birth, m.due_date, m.my_signs_as ?? '', m.include_in_reminders ? 1 : 0, m.family_can_read ? 1 : 0,
      now, now, m.role, m.created_by_me ? 1 : 0, m.nickname,
    );
    return true;
  }
  if (c.server_state !== 'synced') db.run("UPDATE children SET server_state = 'synced' WHERE id = ?", b.id);
  if (!m) return true;
  db.run('UPDATE children SET role = ?, created_by_me = ? WHERE id = ?', m.role, m.created_by_me ? 1 : 0, b.id);
  // Settings or my signature changed here and not yet sent: the queued op wins; ask again later.
  if (hasPendingOps(db, b.id)) return false;
  db.run(
    `UPDATE children SET name = ?, birthday = ?, due_date = ?, family_can_read = ?, nickname = ?,
       signs_as = COALESCE(?, signs_as), reminders_on = ?, updated_at = ?
     WHERE id = ?`,
    m.name, m.role === 'parent' ? m.date_of_birth : null, m.role === 'parent' ? m.due_date : null, m.family_can_read ? 1 : 0, m.nickname,
    m.my_signs_as, m.include_in_reminders ? 1 : 0, now, b.id,
  );
  return true;
}

/** Drops what this phone holds for a book that the server no longer lists (per the id list). */
function reconcileIds(db: SqlDb, childId: string, ids: string[], owner: string | null, epoch: number, now: string): void {
  const keep = new Set(ids);
  for (const r of confirmedIds(db, childId, epoch)) {
    if (keep.has(r.id)) continue;
    if (r.author_id === owner || r.author_id === null) {
      if (hasPendingOps(db, r.id)) continue;
      // Deleted on another phone and purged since this phone last looked: keep it in Recently deleted.
      db.run(
        "UPDATE entries SET deleted_at = COALESCE(deleted_at, ?), server_version = NULL, server_epoch = NULL, sync_state = 'gone' WHERE id = ?",
        now, r.id,
      );
    } else {
      // Someone else's letter that is private, set aside or deleted now: it leaves this phone.
      db.run('DELETE FROM entries WHERE id = ?', r.id);
    }
  }
}

function upsertSyncBook(db: SqlDb, id: string, fields: { cursor: string | null; access: string | null }): void {
  db.run(
    `INSERT INTO sync_books (child_id, cursor, access) VALUES (?, ?, ?)
     ON CONFLICT(child_id) DO UPDATE SET cursor = excluded.cursor, access = excluded.access, state = 'live'`,
    id, fields.cursor, fields.access,
  );
}

export interface PullOutcome {
  pulled: number;
  /** Some book's digest differs from the server's: pull again with ids. */
  wantIds: boolean;
}

/** Applies one sync_pull page (not a reset). */
export function applyPullPage(db: SqlDb, res: PullResponse, now: string): PullOutcome {
  const owner = syncOwner(db);
  if (readSetting(db, SYNC_SETTING.epoch) === null) {
    writeSetting(db, SYNC_SETTING.epoch, String(res.epoch));
    writeSetting(db, SYNC_SETTING.epochStartedAt, res.epoch_started_at);
  }
  const epoch = res.epoch;
  let pulled = 0;
  let wantIds = false;
  for (const b of res.books ?? []) {
    const applied = mergeBook(db, b, now);
    upsertSyncBook(db, b.id, { cursor: b.cursor, access: b.access });
    if (b.meta) {
      db.run(
        'UPDATE sync_books SET meta_hash = ?, members = ?, birthday_md = ? WHERE child_id = ?',
        applied ? b.meta_hash : null, JSON.stringify(b.meta.members ?? []), b.meta.birthday_md, b.id,
      );
    }
    mergeRows(db, b.rows, owner, epoch, now);
    pulled += b.rows.length;
    if (b.more) continue;
    if (b.ids) {
      reconcileIds(db, b.id, b.ids, owner, epoch, now);
      db.run('UPDATE sync_books SET want_ids = 0 WHERE child_id = ?', b.id);
    } else if (b.visible) {
      const mine = localDigest(db, b.id, epoch);
      const differs = mine.n !== b.visible.n || mine.sum !== b.visible.sum;
      db.run('UPDATE sync_books SET want_ids = ? WHERE child_id = ?', differs ? 1 : 0, b.id);
      wantIds = wantIds || differs;
    }
  }
  for (const g of res.gone ?? []) {
    mergeRows(db, g.rows, owner, epoch, now);
    pulled += g.rows.length;
    if (g.more) {
      db.run('UPDATE sync_books SET cursor = ? WHERE child_id = ?', g.cursor, g.id);
      continue;
    }
    closeBook(db, g, owner);
  }
  return { pulled, wantIds };
}

/** A book this person left, was removed from, or that was deleted: own letters stay on the phone, others' leave it. */
function closeBook(db: SqlDb, g: GoneBook, owner: string | null): void {
  db.run('UPDATE children SET server_state = ? WHERE id = ?', g.reason === 'deleted' ? 'deleted' : 'left', g.id);
  db.run('DELETE FROM entries WHERE child_id = ? AND author_id IS NOT NULL AND author_id <> ?', g.id, owner ?? '');
  db.run('DELETE FROM sync_books WHERE child_id = ?', g.id);
}

/** The p_since request for the next pull. */
export function buildPullRequest(db: SqlDb, opts: { verify: boolean }): { epoch?: number; books: Record<string, unknown> } {
  const epoch = currentEpoch(db);
  const books: Record<string, unknown> = {};
  const rows = db.all<{ child_id: string; cursor: string | null; access: string | null; meta_hash: string | null; want_ids: number }>(
    'SELECT child_id, cursor, access, meta_hash, want_ids FROM sync_books',
  );
  for (const r of rows) {
    const req: Record<string, unknown> = {};
    if (r.cursor) req.cursor = r.cursor;
    if (r.access) req.access = r.access;
    if (r.meta_hash) req.meta = r.meta_hash;
    if (epoch !== null) req.have = localDigest(db, r.child_id, epoch);
    if (opts.verify) req.verify = true;
    if (r.want_ids) req.ids = true;
    books[r.child_id] = req;
  }
  return epoch === null ? { books } : { epoch, books };
}

// ── Restore (TDD 06 P-1) ──────────────────────────────────────────────────

/**
 * The server was restored (new epoch, or this phone's cursor is ahead of it).
 * Nothing is deleted here. Every letter of mine the server once held goes up
 * again first (lane 0, op entry.reupload with the server time this phone last
 * saw); books started here are re-created (idempotent); other people's letters
 * are kept and marked held until their authors' phones bring them back; every
 * book is pulled again from the start.
 */
export function enterRestoreMode(db: SqlDb, res: PullResponse, ctx: EnqueueContext): number {
  const owner = syncOwner(db);
  writeSetting(db, SYNC_SETTING.epoch, String(res.epoch));
  writeSetting(db, SYNC_SETTING.epochStartedAt, res.epoch_started_at);
  writeSetting(db, SYNC_SETTING.restoreAt, ctx.now);
  let queued = 0;
  const books = db.all<{ id: string; name: string; birthday: string | null; due_date: string | null }>(
    "SELECT id, name, birthday, due_date FROM children WHERE created_by_me = 1 AND server_state = 'synced'",
  );
  for (const c of books) {
    appendOp(db, { type: 'book.create', id: c.id, data: { name: c.name, date_of_birth: c.birthday, due_date: c.due_date } }, ctx, { lane: 0, bookId: c.id });
  }
  // A new epoch: every letter not yet confirmed in it. A cursor ahead of the server (restored without a
  // new epoch, an operator mistake): every letter, since versions from before the restore prove nothing.
  const everything = res.reason === 'cursor_ahead';
  const mine = db.all<LocalEntryRow>(
    `SELECT * FROM entries WHERE server_version IS NOT NULL AND sync_state <> 'gone'
       AND (author_id IS NULL OR author_id = ?) AND (? = 1 OR server_epoch IS NULL OR server_epoch <> ?)`,
    owner ?? '', everything ? 1 : 0, res.epoch,
  );
  for (const r of mine) {
    const snap = entrySnapshot(r);
    if (!snap || !r.server_updated_at) continue;
    appendOp(
      db,
      { type: 'entry.reupload', id: r.id, data: { ...snap, deleted: r.deleted_at !== null } as unknown as Record<string, unknown>, known_at: r.server_updated_at },
      ctx,
      { lane: 0, bookId: snap.child_id },
    );
    db.run("UPDATE entries SET sync_state = 'pending' WHERE id = ?", r.id);
    queued++;
  }
  db.run(
    "UPDATE entries SET sync_state = 'held' WHERE author_id IS NOT NULL AND author_id <> ? AND server_version IS NOT NULL",
    owner ?? '',
  );
  db.run('UPDATE sync_books SET cursor = NULL, access = NULL, meta_hash = NULL, want_ids = 0');
  return queued;
}

/** Letters by others still held this long after a restore have not come back: their authors' phones are gone. */
export const HELD_AFTER_RESTORE_MS = 30 * 24 * 3600_000;

export function dropStaleHeld(db: SqlDb, nowMs: number): number {
  const at = readSetting(db, SYNC_SETTING.restoreAt);
  if (!at || nowMs - Date.parse(at) < HELD_AFTER_RESTORE_MS) return 0;
  const n = db.get<{ n: number }>("SELECT COUNT(*) AS n FROM entries WHERE sync_state = 'held'")!.n;
  db.run("DELETE FROM entries WHERE sync_state = 'held'");
  writeSetting(db, SYNC_SETTING.restoreAt, null);
  return n;
}
