/**
 * Applying server answers to the phone's SQLite. Pure (SqlDb only); the engine
 * runs each function inside one local transaction.
 *
 * Merge rules (D-023; protocol v1 in docs/adr/0025-sync-protocol-v1.md):
 * - Words (`text` group) are compare and set: the server takes this phone's words
 *   only if nobody changed them since the op's base. On a conflict the phone
 *   follows the server's words and keeps its own as a conflict copy for the
 *   author (F16 6.2 E). Nothing ever merges two versions of words.
 * - Every other group: later arrival wins. A letter with ops still queued keeps
 *   those groups locally (the queued op is the later writer); it takes the
 *   server's words when none of its queued ops changes words. Only a server
 *   tombstone is applied over queued ops (delete wins).
 * - Deletes are tombstones: an own letter deleted on another phone arrives with
 *   deleted_at and stays in Recently deleted. Another person's letter that is no
 *   longer readable is removed from this phone (found through the digest).
 * - raw_transcript is never changed once set.
 * - A restore never deletes anything here: see enterRestoreMode.
 */
import { prefsRow, upsertPrefs } from '../db/repos/children';
import { WORDS_UNREVIEWED } from '../db/repos/entries';
import type { SqlDb } from '../db/sql';
import {
  ALL_GROUPS,
  type BookMeta,
  type Digest,
  type EntryData,
  type EntryState,
  type GoneBook,
  type PulledBook,
  type PulledRow,
  type PullResponse,
  type PushOp,
  type PushResponse,
  type PulledHeld,
  type PulledHeldGone,
  type PushResultOk,
  type WordsGroup,
} from './types';
import {
  SYNC_SETTING,
  addConflictCopy,
  addHeldConflictCopy,
  appendOp,
  opsFor,
  removeConflictCopy,
  enqueueEntryUpsert,
  enqueueHeldDraft,
  entrySnapshot,
  getChildRow,
  getDraftRow,
  getEntryRow,
  hasPendingOps,
  listConflictCopies,
  queuedWordOps,
  readSetting,
  rebaseQueued,
  refreshEntryState,
  rejectOp,
  removeOp,
  sameWords,
  ERASE_LANE,
  eraseQueued,
  settleHeldAnswer,
  syncOwner,
  wireLanguage,
  wordsOf,
  writeSetting,
  type HeldAnswer,
  type EnqueueContext,
  type LocalEntryRow,
  type OutboxRow,
} from './outbox';

const MOD48 = 2 ** 48;
/** An erase refused by a server that cannot erase yet tries again after this long. */
const ERASE_RETRY_MS = 6 * 3600_000;

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
    "SELECT id, author_id FROM entries WHERE child_id = ? AND server_version IS NOT NULL AND server_epoch = ? AND sync_state NOT IN ('held', 'gone', 'erased')",
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

/** Writes the server's words into the local row (raw_transcript is never touched). */
function takeWords(db: SqlDb, id: string, w: WordsGroup): void {
  db.run(
    'UPDATE entries SET final_text = ?, machine_edits = ?, edit_level = ? WHERE id = ?',
    w.final_text, JSON.stringify(w.machine_edits ?? []), w.edit_level, id,
  );
}

const untouchedOp = (o: OutboxRow) => o.sent_at === null && o.attempts === 0 && o.lane === 1;

/**
 * Protocol v1, after an entry op answered ok (F16 6.2 A step 7, E step 3):
 * - `current` came back: the server's words changed since this op's base. If this
 *   op's words were refused (`conflict_groups` has `text`) or this phone still has
 *   its own words queued, this phone's latest words become a conflict copy, the
 *   queued ops stop carrying words, and the letter follows the server's words.
 *   With nothing of its own queued, the phone simply takes the server's words.
 * - otherwise, every later queued upsert of the letter is rebased on the version
 *   this op wrote (F16-REQ-025): a duplicate only on `applied_v`, never on the
 *   current version, which may hold another phone's words.
 * Returns true when a conflict copy was made.
 */
function settleWords(db: SqlDb, row: OutboxRow, r: PushResultOk, ctx: EnqueueContext): boolean {
  if (row.type !== 'entry.upsert') return false;
  const local = getEntryRow(db, row.entity_id);
  if (!local) return false;
  const current = r.current ?? null;
  if (!current) {
    const v = r.applied_v ?? (r.dup ? null : (r.entry?.v ?? null));
    if (v) rebaseQueued(db, row.entity_id, v);
    return false;
  }
  const refused = (r.conflict_groups ?? []).includes('text');
  const later = queuedWordOps(db, row.entity_id);
  let copied = false;
  if ((refused || later.length > 0) && !sameWords(wordsOf(local), current)) {
    const snap = entrySnapshot(local);
    const already = listConflictCopies(db, row.entity_id).some((c) => sameWords(c.words, wordsOf(local)));
    if (snap && !already) {
      addConflictCopy(db, row.op_id, snap, current.v, ctx.now);
      copied = true;
    }
    for (const o of later) {
      if (!untouchedOp(o) || o.type !== 'entry.upsert') continue;
      const p = JSON.parse(o.payload) as PushOp;
      const groups = (p.changed ?? ALL_GROUPS).filter((g) => g !== 'text');
      if (groups.length === 0) {
        removeOp(db, o.seq);
        continue;
      }
      p.changed = groups;
      p.data = { ...p.data, final_text: current.final_text, machine_edits: current.machine_edits, edit_level: current.edit_level };
      db.run('UPDATE sync_outbox SET payload = ? WHERE seq = ?', JSON.stringify(p), o.seq);
    }
  }
  // Words still queued from an earlier, possibly applied send are left to the server to judge:
  // the letter keeps its words and those ops keep their base, so the server can still refuse them.
  const pendingWords = queuedWordOps(db, row.entity_id).length > 0;
  if (!pendingWords) takeWords(db, row.entity_id, current);
  rebaseQueued(db, row.entity_id, laterV(r.entry?.v ?? null, current.v), { exceptWords: true });
  return copied;
}

/** The later of two server versions (decimal xid8 text). */
function laterV(a: string | null, b: string): string {
  if (a === null) return b;
  return /^\d+$/.test(a) && /^\d+$/.test(b) && BigInt(b) > BigInt(a) ? b : a;
}

function isWordsOp(row: OutboxRow): boolean {
  if (row.type === 'entry.reupload') return true;
  if (row.type !== 'entry.upsert') return false;
  return ((JSON.parse(row.payload) as PushOp).changed ?? ALL_GROUPS).includes('text');
}

/**
 * The version this phone records for a letter after an op's answer: the next words
 * edit is compared against it, so it must never name a state whose words this phone
 * has not seen (ADR 0025 section 5).
 * - A duplicate reports the letter as it is now, which may hold another phone's words:
 *   its own write's version (`applied_v`) is used. A duplicate of a words op with no
 *   `applied_v` and no `current` (a receipt written before protocol v1) says nothing
 *   about the words, so the version this phone had is kept; with none, '0', so the
 *   next words edit is compared, never applied unseen.
 * - After a words conflict the phone has the server's words (`current`): the later of
 *   the row's version and the words version, so "Use this phone's version" is not
 *   refused again for a version the phone already holds.
 */
function stateVersion(db: SqlDb, row: OutboxRow, r: PushResultOk, v: string): string {
  if (r.dup) {
    if (r.applied_v) return r.applied_v;
    if (!r.current && isWordsOp(row)) return getEntryRow(db, row.entity_id)?.server_version ?? '0';
  }
  return r.current ? laterV(v, r.current.v) : v;
}

export interface PushOutcome {
  pushed: number;
  rejected: number;
  /** Word conflicts found in this batch (a conflict copy was kept for each). */
  conflicts: number;
  /** SCCON: the rest of the batch was not applied. */
  paused: boolean;
  consent: string | null;
  /** A transient server error stopped the batch at this op (retry from it). */
  stoppedAt: OutboxRow | null;
}

/**
 * An upload of this author's letter refused because the server holds other provenance for it (SCIMM: its
 * raw transcript, engine or capture time). That happens after a second Keep of one held draft, when this
 * phone's edit left before the pull row that brings the first keep's provenance. Words the upload carried
 * become a conflict copy the author sees and can pick ("Use this phone's version" sends them again with the
 * letter's provenance by then), because the next pull gives the letter the server's words. A letter the
 * server does not hold for this phone keeps its words itself (DATA-REQ-043, a plain refused write). False
 * when it carried no words, or they are already a copy.
 */
function keepWordsOfRefusedUpload(db: SqlDb, row: OutboxRow, now: string): boolean {
  if (row.type !== 'entry.upsert' && row.type !== 'entry.reupload') return false;
  const p = JSON.parse(row.payload) as PushOp;
  if (row.type === 'entry.upsert' && !(p.changed ?? ALL_GROUPS).includes('text')) return false;
  const local = getEntryRow(db, row.entity_id);
  if (!local || local.server_version === null) return false;
  if (local.author_id !== null && local.author_id !== syncOwner(db)) return false;
  const data = p.data as unknown as EntryData;
  const words: WordsGroup = { final_text: data.final_text, machine_edits: data.machine_edits ?? [], edit_level: data.edit_level };
  if (typeof words.final_text !== 'string' || words.final_text.trim() === '') return false;
  if (listConflictCopies(db, row.entity_id).some((c) => sameWords(c.words, words))) return true;
  addConflictCopy(db, row.op_id, data, local.server_version, now);
  return true;
}

/**
 * The server's provenance of this author's letter (raw transcript, engine version, capture time; immutable
 * there) is the letter's on this phone too, and in its uploads still queued, which the server would refuse
 * (SCIMM) with any other. After a second Keep of one held draft (ADR 0025 section 9, row C) the letter is the
 * first keep's; this phone's own words are in its conflict copy.
 */
function takeProvenance(db: SqlDb, row: PulledRow): void {
  const raw = row.raw_transcript ?? '';
  db.run(
    `UPDATE entries SET raw_transcript = CASE WHEN ? <> '' THEN ? ELSE raw_transcript END,
       engine_version = COALESCE(?, engine_version), captured_at = COALESCE(?, captured_at) WHERE id = ?`,
    raw, raw, row.engine_version ?? null, row.captured_at ?? null, row.id,
  );
  for (const o of opsFor(db, row.id)) {
    if (!untouchedOp(o) || (o.type !== 'entry.upsert' && o.type !== 'entry.reupload')) continue;
    const p = JSON.parse(o.payload) as PushOp;
    const d = { ...p.data } as Record<string, unknown>;
    if (raw !== '') d.raw_transcript = raw;
    if (row.engine_version !== null && row.engine_version !== undefined) d.engine_version = row.engine_version;
    if (row.captured_at) d.captured_at = row.captured_at;
    p.data = d;
    db.run('UPDATE sync_outbox SET payload = ? WHERE seq = ?', JSON.stringify(p), o.seq);
  }
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
  let conflicts = 0;
  for (const r of res.results ?? []) {
    const row = byOp.get(r.op);
    if (!row) continue;
    answered.add(row.op_id);
    if (r.ok && row.type.startsWith('held.') && (r as { held_off?: boolean }).held_off) {
      // Held-draft sync is switched off on the server (app.held_sync = 'off'): the op is not claimed there and
      // stays queued here, unsent, until a pull carries a held section again (the same op id applies then).
      writeSetting(db, SYNC_SETTING.heldServer, null);
      continue;
    }
    if (r.ok) {
      pushed++;
      removeOp(db, row.seq);
      // A delete the server took: every upload of the letter queued before it is moot, and one that
      // waited (a consent pause sends deletions first) must never bring the letter back.
      if (row.type === 'entry.delete') {
        db.run("DELETE FROM sync_outbox WHERE entity_id = ? AND type IN ('entry.upsert', 'entry.reupload') AND seq < ?", row.entity_id, row.seq);
      }
      if (row.type === 'entry.erase') {
        // Erased on the server (or already gone there, or kept under a hold until it lifts): the row left this phone first.
        continue;
      }
      if (row.type.startsWith('entry.')) {
        if (r.missing) {
          // The server does not have this letter: a restore sends it whole; a delete has nothing to do.
          if (row.type === 'entry.restore') enqueueEntryUpsert(db, row.entity_id, ALL_GROUPS, ctx);
          if (row.type === 'entry.delete') db.run('UPDATE entries SET server_version = NULL, server_epoch = NULL WHERE id = ?', row.entity_id);
        } else {
          // A Keep refused because the held words moved on elsewhere (no letter was made; review K blocking 1):
          // the held words come as current, with typed_text standing in for words a typed draft has as text.
          // Client rule c2: applied false with no letter is a refusal, whatever current says.
          const keepRefused = row.type === 'entry.upsert' && !r.entry && r.applied === false;
          const answer: PushResultOk = keepRefused && r.current
            ? { ...r, current: { ...r.current, final_text: r.current.final_text ?? r.current.typed_text ?? '', machine_edits: r.current.machine_edits ?? [], edit_level: r.current.edit_level ?? 'verbatim' } }
            : r;
          if (settleWords(db, row, answer, ctx)) conflicts++;
          const s = r.entry ? { ...r.entry, v: stateVersion(db, row, r, r.entry.v) } : r.entry;
          if (s) applyEntryState(db, s, epoch, ctx.now);
          if (r.entry && row.type === 'entry.upsert') db.run('UPDATE entries SET held_v = NULL WHERE id = ?', row.entity_id); // kept: no held row now
          if (keepRefused) {
            // As for an entry: this phone's words are a conflict copy, the letter follows the held words, and the
            // Keep goes again naming their version, so the letter exists everywhere while the author chooses.
            // With no current (let go or erased elsewhere since), the letter keeps this phone's words and the
            // Keep goes again as it was; the server then answers by what exists (table rows B to E).
            if (answer.current) db.run('UPDATE entries SET held_v = ? WHERE id = ?', answer.current.v, row.entity_id);
            enqueueEntryUpsert(db, row.entity_id, ALL_GROUPS, ctx);
          }
        }
        refreshEntryState(db, row.entity_id);
      } else if (row.type === 'held.upsert') {
        // The row is on the server now (author-only), or its words met another phone's first.
        const sent = JSON.parse(row.payload) as PushOp;
        const answer = r as HeldAnswer;
        if (settleHeldAnswer(db, row.op_id, row.entity_id, answer, ctx.now, { typed_text: (sent.data as { typed_text?: string | null }).typed_text ?? null, changed: sent.changed })) conflicts++;
      } else if (row.type === 'held.discard') {
        if ((r as { kept?: boolean }).kept) {
          // The words changed on another phone since this phone last saw them: the server kept the row,
          // and the next pull brings it back here from the start (a later edit wins over a let-go).
          writeSetting(db, SYNC_SETTING.heldCursor, null);
        } else {
          // Let go on the server: an upload of it queued before the discard (one that waited out a consent
          // pause) must never put it back (final review A-B2).
          db.run("DELETE FROM sync_outbox WHERE entity_id = ? AND type = 'held.upsert' AND seq < ?", row.entity_id, row.seq);
          db.run('UPDATE drafts SET held_v = NULL WHERE id = ?', row.entity_id);
          db.run('UPDATE entries SET held_v = NULL WHERE id = ?', row.entity_id);
        }
      } else if (row.type === 'book.create') {
        db.run("UPDATE children SET server_state = 'synced' WHERE id = ? AND server_state IN ('pending', 'local', 'refused')", row.entity_id);
      } else if (row.type === 'book.first_run') {
        const kids = ((JSON.parse(row.payload) as PushOp).data.children ?? []) as { id: string }[];
        for (const k of kids) db.run("UPDATE children SET server_state = 'synced' WHERE id = ? AND server_state IN ('pending', 'local')", k.id);
      }
      continue;
    }
    // A server that cannot erase yet (no entry.erase): the erase waits in its lane and tries again later.
    if (row.type === 'entry.erase' && r.code === '22023') {
      db.run('UPDATE sync_outbox SET attempts = attempts + 1, next_attempt_at = ? WHERE seq = ?',
        new Date(Date.parse(ctx.now) + ERASE_RETRY_MS).toISOString(), row.seq);
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
    if (r.code === 'SCIMM' && keepWordsOfRefusedUpload(db, row, ctx.now)) {
      // The server holds another raw transcript for this letter (a second Keep whose pull row has not come yet;
      // review K re-check 4): the words are never left in a refused write the author cannot see.
      conflicts++;
      removeOp(db, row.seq);
      refreshEntryState(db, row.entity_id);
      continue;
    }
    if (row.type === 'held.upsert' && r.gone) {
      // Erased with Erase now on another phone (its marker says so): this phone's copy goes too, words and
      // all, whatever was queued for it (a Restore made offline never undoes an erase; re-check B-R2).
      removeOp(db, row.seq);
      db.run('DELETE FROM sync_outbox WHERE entity_id = ?', row.entity_id);
      db.run('DELETE FROM rejected_writes WHERE entity_id = ?', row.entity_id);
      db.run("UPDATE drafts SET state = 'discarding', held_v = NULL WHERE id = ? AND state <> 'recording'", row.entity_id);
      db.run("UPDATE entries SET deleted_at = COALESCE(deleted_at, ?), sync_state = 'erased', held_v = NULL WHERE id = ?", ctx.now, row.entity_id);
      continue;
    }
    rejected++;
    rejectOp(db, row, r.code, ctx.now);
    if (row.type === 'book.create' || row.type === 'book.first_run') {
      const ids = row.type === 'book.create'
        ? [row.entity_id]
        : (((JSON.parse(row.payload) as PushOp).data.children ?? []) as { id: string }[]).map((k) => k.id);
      for (const id of ids) db.run("UPDATE children SET server_state = 'refused' WHERE id = ?", id);
    } else if (row.type.startsWith('entry.')) {
      if (r.gone) {
        // Purged on the server: already deleted here, it is erased here too; otherwise it stays in Recently deleted.
        db.run('DELETE FROM sync_outbox WHERE entity_id = ?', row.entity_id);
        markGone(db, row.entity_id, ctx.now);
      } else if (!hasPendingOps(db, row.entity_id)) {
        db.run("UPDATE entries SET sync_state = 'rejected' WHERE id = ?", row.entity_id);
      }
    }
  }
  const unanswered = rows.filter((r) => !answered.has(r.op_id));
  if (res.paused) {
    // SCCON: the op that met it and every op after it did not apply (the server rolled that op back and
    // stopped). They are as if never sent, so a delete made during the pause drops them instead of
    // overtaking them, and nothing waits to bring the letter back when consent returns.
    for (const u of unanswered) db.run('UPDATE sync_outbox SET sent_at = NULL, attempts = 0, next_attempt_at = NULL WHERE seq = ?', u.seq);
  }
  return {
    pushed,
    rejected,
    conflicts,
    paused: !!res.paused,
    consent: res.paused ? (res.consent ?? null) : null,
    stoppedAt: res.stopped ? (unanswered[0] ?? null) : null,
  };
}

// ── Pull pages ────────────────────────────────────────────────────────────

const bool = (v: boolean | null | undefined) => (v === null || v === undefined ? null : v ? 1 : 0);

/** A text value the server sent, or null when the server does not have that column yet. */
const opt = (v: string | null | undefined): string | null => (typeof v === 'string' && v !== '' ? v : null);

function mergeOwnRow(db: SqlDb, row: PulledRow, epoch: number, now: string): void {
  // Erased on this phone, its erase not yet applied on the server: it never comes back.
  if (eraseQueued(db, row.id)) return;
  const local = getEntryRow(db, row.id);
  const edits = JSON.stringify(row.machine_edits ?? []);
  if (!local) {
    insertOwnRow(db, row, edits, epoch, now);
    // A letter this author kept on another phone from a draft this phone also holds: the letter takes the
    // draft's recording, if this phone has it, and the draft goes (a kept letter never exists twice).
    adoptHeldDraft(db, row.id, now);
    return;
  }
  mergeExistingOwnRow(db, row, local, edits, epoch, now);
}

function insertOwnRow(db: SqlDb, row: PulledRow, edits: string, epoch: number, now: string): void {
  db.run(
      `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, prompt_key, engine_version,
         raw_transcript, machine_edits, final_text, in_book, sounds_like_me, updated_at, deleted_at, synced_at,
         child_id, author_id, author_signs_as, approval, server_version, server_updated_at, server_epoch, sync_state,
         language, occurred_precision, base_direction)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, COALESCE(?, 'day'), COALESCE(?, 'ltr'))`,
      row.id, row.kind, row.occurred_on, row.captured_at, row.capture_mode, row.edit_level, row.prompt_key, row.engine_version,
      row.raw_transcript ?? '', edits, row.final_text, row.in_book ? 1 : 0, bool(row.sounds_like_me), now, row.deleted_at, now,
      row.child_id, row.author_id, row.author_signs_as, row.approval, row.v, row.updated_at, epoch,
      opt(row.language), opt(row.occurred_precision), opt(row.base_direction),
  );
}

/**
 * A letter that arrived for an id this phone holds as a draft (the author kept it on another phone):
 * the letter takes the draft's recording when it has none, and the draft row goes. The recording file
 * itself is never deleted here.
 */
function adoptHeldDraft(db: SqlDb, id: string, now: string): void {
  const d = getDraftRow(db, id);
  if (!d) return;
  // Let go on this phone, not yet finished: nothing of it is adopted or kept; the launch sweep finishes it.
  if (d.state === 'discarding') return;
  // This phone changed the held draft's words (its own upload is still queued or in flight) and the letter
  // was kept elsewhere from other words: they stay as a conflict copy of the letter, never lost.
  const mine = d.typed_text ?? '';
  const kept = getEntryRow(db, id)?.final_text ?? '';
  const edited = (d.typed_text ?? null) !== (d.held_typed ?? null);
  if (edited && mine.trim() !== '' && mine !== kept && !listConflictCopies(db, id).some((c) => c.words.final_text === mine)) {
    addHeldConflictCopy(db, `kept-${id}`, id, mine, getEntryRow(db, id)?.server_version ?? null, now);
  }
  // A copy that matches the kept words is no conflict (this phone's upload carried what was kept).
  for (const c of listConflictCopies(db, id)) if (c.draft && c.words.final_text === kept) removeConflictCopy(db, c.opId);
  db.run(
    `UPDATE entries SET audio_uri = COALESCE(audio_uri, ?),
       audio_duration_ms = COALESCE(audio_duration_ms, (SELECT audio_duration_ms FROM drafts WHERE id = ?)),
       audio_sha256 = COALESCE(audio_sha256, (SELECT audio_sha256 FROM drafts WHERE id = ?)),
       audio_bytes = COALESCE(audio_bytes, (SELECT audio_bytes FROM drafts WHERE id = ?))
     WHERE id = ?`,
    d.audio_uri, id, id, id, id,
  );
  db.run("DELETE FROM sync_outbox WHERE entity_id = ? AND type IN ('held.upsert', 'held.discard') AND sent_at IS NULL AND attempts = 0", id);
  db.run('DELETE FROM drafts WHERE id = ?', id);
}

// ── Held drafts in the pull (F16 6.2 I; S07 PulledHeld, PulledHeldGone) ─────
/**
 * This author's own held drafts (no one else's ever arrive). New ones become a
 * local draft in the waiting row, or for a waiting letter a local letter waiting
 * for its words (F14-REQ-041); their recordings come back through the owner's
 * backup (F08 6.5 B), never through sync. A draft with ops still queued keeps its
 * own values (the queued op is the later writer). Nothing is ever deleted here:
 * a draft let go elsewhere is marked `discarding` (the launch sweep finishes it,
 * F04-REQ-004), a waiting letter let go elsewhere goes to Recently deleted.
 */
function applyHeldRows(db: SqlDb, rows: (PulledHeld | PulledHeldGone)[], owner: string | null, now: string): number {
  let n = 0;
  for (const h of rows) {
    n++;
    const pending = hasPendingOps(db, h.id);
    const draft = getDraftRow(db, h.id);
    const entry = getEntryRow(db, h.id);
    if ('gone' in h) {
      if (h.gone === 'erased') {
        // Erase now on another phone of this author: erased here too, whatever is queued for it, never restorable.
        db.run('DELETE FROM sync_outbox WHERE entity_id = ?', h.id);
        db.run("DELETE FROM rejected_writes WHERE entity_id = ?", h.id);
        if (draft) db.run("UPDATE drafts SET state = 'discarding', held_v = NULL WHERE id = ? AND state <> 'recording'", h.id);
        if (entry) db.run("UPDATE entries SET deleted_at = COALESCE(deleted_at, ?), sync_state = 'erased', held_v = NULL WHERE id = ?", now, h.id);
        continue;
      }
      if (h.gone === 'kept') {
        if (entry) {
          db.run('UPDATE entries SET held_v = NULL WHERE id = ?', h.id);
          adoptHeldDraft(db, h.id, now);
        }
        continue; // the letter itself arrives in its book
      }
      if (pending) continue;
      // Let go on another phone: its words go everywhere, this phone's conflict copy of them too.
      if (draft) {
        db.run("UPDATE drafts SET state = 'discarding', held_v = NULL WHERE id = ? AND state <> 'recording'", h.id);
        db.run("DELETE FROM rejected_writes WHERE entity_id = ? AND type = 'held.upsert'", h.id);
      }
      if (entry && entry.transcript_status === 'waiting' && entry.deleted_at === null) {
        db.run('UPDATE entries SET deleted_at = ?, updated_at = ?, held_v = NULL WHERE id = ?', now, now, h.id);
      }
      continue;
    }
    if (entry) {
      if (entry.transcript_status === 'waiting') db.run('UPDATE entries SET held_v = ? WHERE id = ?', h.v, h.id);
      continue; // the letter row is what this phone shows
    }
    if (draft) {
      // With its own ops queued the draft keeps its values and its version (a queued let-go or upload is
      // compared against what this phone last saw, never a version it has not taken; final review B-2).
      if (pending) continue;
      // Not pending and still marked for the sweep: the server kept the row (this phone's let-go met newer
      // words), so the draft comes back with them.
      db.run(
        `UPDATE drafts SET child_id = ?, occurred_on = ?, occurred_precision = ?, language = COALESCE(?, language),
           base_direction = ?, prompt_key = ?, in_book_choice = ?, typed_text = ?, held_typed = ?,
           raw_transcript = COALESCE(raw_transcript, ?), held_kind = ?, held_v = ?,
           state = CASE WHEN state = 'discarding' THEN 'ready' ELSE state END
         WHERE id = ?`,
        h.child_id, h.occurred_on, h.occurred_precision, h.language, h.base_direction, h.prompt_key,
        h.in_book_choice === null ? null : h.in_book_choice ? 1 : 0, h.typed_text, h.typed_text, h.raw_transcript, h.kind, h.v, h.id,
      );
      continue;
    }
    if (h.kind === 'waiting_letter') {
      db.run(
        `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, prompt_key, engine_version,
           raw_transcript, machine_edits, final_text, in_book, sounds_like_me, updated_at, child_id, author_id,
           author_signs_as, audio_uri, transcript_status, sync_state, language, occurred_precision, base_direction, held_v)
         VALUES (?, 'letter', ?, ?, ?, 'verbatim', ?, ?, '', '[]', '', ?, NULL, ?, ?, ?,
           (SELECT signs_as FROM child_member_prefs WHERE child_id = ?), NULL, 'waiting', 'local', ?, ?, ?, ?)`,
        h.id, h.occurred_on, h.created_at, h.capture_mode, h.prompt_key, h.engine_version ?? 0,
        h.in_book_choice ? 1 : 0, now, h.child_id, owner, h.child_id, h.language, h.occurred_precision, h.base_direction, h.v,
      );
    } else {
      db.run(
        `INSERT INTO drafts (id, child_id, capture_mode, prompt_key, created_at, audio_uri, audio_duration_ms, raw_transcript, typed_text,
           held_typed, state, occurred_on, occurred_precision, language, base_direction, held_kind, in_book_choice, held_v)
         VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, 'ready', ?, ?, ?, ?, ?, ?, ?)`,
        h.id, h.child_id, h.capture_mode, h.prompt_key, h.created_at, h.raw_transcript, h.typed_text, h.typed_text,
        h.occurred_on, h.occurred_precision, h.language, h.base_direction, h.kind,
        h.in_book_choice === null ? null : h.in_book_choice ? 1 : 0, h.v,
      );
    }
  }
  return n;
}

function mergeExistingOwnRow(db: SqlDb, row: PulledRow, local: LocalEntryRow, edits: string, epoch: number, now: string): void {
  if (local.author_id !== null && local.author_id !== row.author_id) return;
  // The letter now exists on the server: any held row it had is gone there.
  if (local.held_v) db.run('UPDATE entries SET held_v = NULL WHERE id = ?', row.id);
  db.run(
    'UPDATE entries SET server_version = ?, server_updated_at = ?, server_epoch = ?, synced_at = ?, author_id = ? WHERE id = ?',
    row.v, row.updated_at, epoch, now, row.author_id, row.id,
  );
  takeProvenance(db, row);
  if (hasPendingOps(db, row.id)) {
    // Our queued ops are the later writer for the groups they change; only a delete from elsewhere wins over them.
    if (row.deleted_at && !local.deleted_at) db.run('UPDATE entries SET deleted_at = ? WHERE id = ?', row.deleted_at, row.id);
    // Words: compare and set, never last writer. With no words of ours queued, the server's words are the
    // letter's words now, and the queued ops descend from them (their base moves to this version).
    if (queuedWordOps(db, row.id).length === 0 && row.final_text !== undefined) {
      takeWords(db, row.id, { final_text: row.final_text, machine_edits: row.machine_edits ?? [], edit_level: row.edit_level });
      rebaseQueued(db, row.id, row.v);
    }
    return;
  }
  db.run(
    `UPDATE entries SET kind = ?, occurred_on = ?, edit_level = ?, prompt_key = ?, final_text = ?, machine_edits = ?,
       in_book = ?, sounds_like_me = ?, author_signs_as = ?, approval = ?, deleted_at = ?, updated_at = ?,
       -- A letter that waited here for its words got them on another phone (v8): they wait for this
       -- author's review here too, and count only once kept (M17; the server has no review mark yet).
       transcript_status = CASE WHEN transcript_status = 'waiting' AND ? <> '' THEN '${WORDS_UNREVIEWED}' ELSE transcript_status END,
       language = ?,
       occurred_precision = COALESCE(?, occurred_precision),
       base_direction = COALESCE(?, base_direction),
       sync_state = 'synced'
     WHERE id = ?`,
    row.kind, row.occurred_on, row.edit_level, row.prompt_key, row.final_text, edits,
    row.in_book ? 1 : 0, bool(row.sounds_like_me), row.author_signs_as, row.approval, row.deleted_at, now,
    row.raw_transcript ?? '',
    mergedLanguage(local.language, row.language),
    opt(row.occurred_precision), opt(row.base_direction),
    row.id,
  );
}

/**
 * The server holds one of seven codes; this phone may hold a finer tag (`en-GB`).
 * Keep the phone's tag while it names the same language; take the server's code
 * when another phone chose a different one. A server with no value changes nothing
 * (this phone never sends a value the server cannot hold, so null is not a clear).
 */
function mergedLanguage(local: string | null, server: string | null | undefined): string | null {
  const s = opt(server);
  if (!s) return local;
  return wireLanguage(local) === s ? local : s;
}

/**
 * Another person's letter: words and metadata only, never their raw transcript,
 * edit list or language. The date precision and direction are shared with members
 * (book_entries, S02 20261015030000); a server without them leaves the defaults.
 */
function mergeOtherRow(db: SqlDb, row: PulledRow, owner: string | null, epoch: number, now: string): void {
  const local = getEntryRow(db, row.id);
  if (local && (local.author_id === null || local.author_id === owner)) return;
  db.run(
    `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, prompt_key, engine_version,
       raw_transcript, machine_edits, final_text, in_book, sounds_like_me, updated_at, deleted_at, synced_at,
       child_id, author_id, author_signs_as, approval, server_version, server_updated_at, server_epoch, sync_state,
       occurred_precision, base_direction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', '[]', ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, 'synced',
       COALESCE(?, 'day'), COALESCE(?, 'ltr'))
     ON CONFLICT(id) DO UPDATE SET
       kind = excluded.kind, occurred_on = excluded.occurred_on, edit_level = excluded.edit_level,
       prompt_key = excluded.prompt_key, final_text = excluded.final_text, in_book = excluded.in_book,
       sounds_like_me = excluded.sounds_like_me, updated_at = excluded.updated_at, deleted_at = NULL,
       synced_at = excluded.synced_at, author_signs_as = excluded.author_signs_as, approval = excluded.approval,
       server_version = excluded.server_version, server_updated_at = excluded.server_updated_at,
       server_epoch = excluded.server_epoch, sync_state = 'synced',
       occurred_precision = excluded.occurred_precision, base_direction = excluded.base_direction`,
    row.id, row.kind, row.occurred_on, row.captured_at, row.capture_mode, row.edit_level, row.prompt_key, row.engine_version,
    row.final_text, row.in_book ? 1 : 0, bool(row.sounds_like_me), now, now,
    row.child_id, row.author_id, row.author_signs_as, row.approval, row.v, row.updated_at, epoch,
    opt(row.occurred_precision), opt(row.base_direction),
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
      `INSERT INTO children (id, name, birthday, due_date, family_can_read, created_at, updated_at,
         role, created_by_me, created_by, nickname, server_state, signs_as)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
      b.id, m.name, m.date_of_birth, m.due_date, m.family_can_read ? 1 : 0,
      now, now, m.role, m.created_by_me ? 1 : 0, m.created_by_me ? syncOwner(db) : null, m.nickname,
      m.my_signs_as ?? '', // NOT NULL since v1; v7 keeps the column for a v6 build (upsertPrefs mirrors it)
    );
    upsertPrefs(db, b.id, { signsAs: m.my_signs_as ?? '', remindersOn: m.include_in_reminders }, now);
    return true;
  }
  if (c.server_state !== 'synced') db.run("UPDATE children SET server_state = 'synced' WHERE id = ?", b.id);
  if (!m) return true;
  db.run('UPDATE children SET role = ?, created_by_me = ? WHERE id = ?', m.role, m.created_by_me ? 1 : 0, b.id);
  // Settings or my signature changed here and not yet sent: the queued op wins; ask again later.
  if (hasPendingOps(db, b.id)) return false;
  db.run(
    `UPDATE children SET name = ?, birthday = ?, due_date = ?, family_can_read = ?, nickname = ?, updated_at = ?
     WHERE id = ?`,
    m.name, m.role === 'parent' ? m.date_of_birth : null, m.role === 'parent' ? m.due_date : null, m.family_can_read ? 1 : 0, m.nickname,
    now, b.id,
  );
  // This person's choices (v7): the server holds the signature and the reminder switch; hide and quiet stay
  // on the phone until the server has them (S02 WP-F12-09).
  const mine = prefsRow(db, b.id);
  const next = { signsAs: m.my_signs_as ?? mine?.signsAs ?? '', remindersOn: m.include_in_reminders };
  // Written only when something differs, so updated_at keeps saying when this person last chose.
  if (!mine || mine.signsAs !== next.signsAs || mine.remindersOn !== next.remindersOn) upsertPrefs(db, b.id, next, now);
  return true;
}

/**
 * One of this account's letters the server no longer holds (erased there, by Erase
 * now on another phone or by the 30 day purge, F16-REQ-024). Already deleted on
 * this phone: it is erased here too (`erased`; the store removes the file, then the
 * row, right after the sync, never in the pull). Still live here (this phone missed
 * the deletion): it moves to Recently deleted (`gone`) and never uploads again.
 */
function markGone(db: SqlDb, id: string, now: string): void {
  db.run(
    `UPDATE entries SET sync_state = CASE WHEN deleted_at IS NOT NULL THEN 'erased' ELSE 'gone' END,
       deleted_at = COALESCE(deleted_at, ?), server_version = NULL, server_epoch = NULL WHERE id = ?`,
    now, id,
  );
}

/** Drops what this phone holds for a book that the server no longer lists (per the id list). */
function reconcileIds(db: SqlDb, childId: string, ids: string[], owner: string | null, epoch: number, now: string): void {
  const keep = new Set(ids);
  for (const r of confirmedIds(db, childId, epoch)) {
    if (keep.has(r.id)) continue;
    if (r.author_id === owner || r.author_id === null) {
      if (hasPendingOps(db, r.id)) continue;
      markGone(db, r.id, now);
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
  if (res.held) {
    pulled += applyHeldRows(db, res.held.rows ?? [], owner, now);
    writeSetting(db, SYNC_SETTING.heldCursor, res.held.cursor);
  }
  // Held ops go only to a server that holds held drafts (an older one has no held section).
  const heldServer = res.held ? '1' : null;
  if (readSetting(db, SYNC_SETTING.heldServer) !== heldServer) writeSetting(db, SYNC_SETTING.heldServer, heldServer);
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
export function buildPullRequest(db: SqlDb, opts: { verify: boolean }): { epoch?: number; books: Record<string, unknown>; held?: { cursor: string | null } } {
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
  // v1: this author's own held drafts (an older server ignores the key).
  const held = { cursor: readSetting(db, SYNC_SETTING.heldCursor) };
  return epoch === null ? { books, held } : { epoch, books, held };
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
    `SELECT * FROM entries WHERE server_version IS NOT NULL AND sync_state NOT IN ('gone', 'erased')
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
  // Held drafts the server once held go up again (an upsert is idempotent), then are pulled from the start.
  for (const d of db.all<{ id: string }>('SELECT id FROM drafts WHERE held_kind IS NOT NULL AND held_v IS NOT NULL')) {
    enqueueHeldDraft(db, d.id, ctx);
  }
  for (const w of db.all<{ id: string }>("SELECT id FROM entries WHERE transcript_status = 'waiting' AND held_v IS NOT NULL AND deleted_at IS NULL")) {
    enqueueEntryUpsert(db, w.id, ALL_GROUPS, ctx);
  }
  writeSetting(db, SYNC_SETTING.heldCursor, null);
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
