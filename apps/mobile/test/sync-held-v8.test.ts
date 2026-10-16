/// <reference types="node" />
/**
 * Local schema v8 and the client half of held drafts on the server (WP-F14-22,
 * WP-F16-17; PRD V2 F16 6.2 I, F14-REQ-039 and F14-REQ-041): only a draft the author
 * held at the Keep gate, or a voice-only letter waiting for its words, ever goes up,
 * and only as an author-only held row; the batch keeps one op per draft; a held
 * answer rebases what is queued, and a words refusal keeps this phone's words; the
 * pull brings this author's held rows back into the waiting row. The two-phone test
 * runs the same rules against the server. Fictional Asha family only.
 */
import { describe, expect, it } from 'vitest';
import { LATEST_VERSION, MIGRATIONS, migrate } from '../src/lib/db/migrations';
import { drafts, type RepoContext } from '../src/lib/db/repos';
import type { SqlDb } from '../src/lib/db/sql';
import { applyPullPage, buildPullRequest } from '../src/lib/sync/merge';
import {
  SYNC_SETTING,
  enqueueEntryUpsert,
  enqueueHeldDiscard,
  enqueueHeldDraft,
  listConflictCopies,
  settleHeldAnswer,
  takeBatch,
  writeSetting,
} from '../src/lib/sync/outbox';
import { takeOwnership } from '../src/lib/sync/ownership';
import type { PullResponse, PushOp } from '../src/lib/sync/types';
import { nodeDb } from './helpers/node-db';
import { fixture, insertBook } from './helpers/store-fixture';

const NOW = '2026-10-03T09:00:00.000Z';
const ME = '11111111-1111-1111-1111-111111111111';
let n = 0;
const ids = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
const qctx = { now: NOW, newId: ids };
const ops = (db: SqlDb) => db.all<{ type: string; entity_id: string; payload: string }>('SELECT type, entity_id, payload FROM sync_outbox ORDER BY lane, seq');
const cols = (db: SqlDb, table: string) => db.all<{ name: string }>(`PRAGMA table_info(${table})`).map((c) => c.name);

function signedIn(): { db: SqlDb; repo: RepoContext; draft: (text: string | null, audio?: string) => string } {
  const f = fixture();
  insertBook(f.db, { id: 'c1', name: 'Asha', signsAs: 'Mama' });
  writeSetting(f.db, SYNC_SETTING.owner, ME);
  writeSetting(f.db, SYNC_SETTING.heldServer, '1'); // a server whose pull carried a held section
  const draft = (text: string | null, audio?: string) => {
    const id = ids();
    drafts.insert(f.ctx, id, { childId: 'c1', captureMode: text === null ? 'spoken' : 'typed', promptKey: null, audioUri: audio ?? null, audioDurationMs: audio ? 3_000 : null, typedText: text });
    return id;
  };
  return { db: f.db, repo: f.ctx, draft };
}

describe('[F14-REQ-039] migration 8: held drafts can sync as author-only rows', () => {
  it('adds the held columns; existing drafts were never held, so nothing is queued for them', () => {
    const { db } = nodeDb();
    migrate(db, qctx, MIGRATIONS.filter((m) => m.version <= 7));
    db.run("INSERT INTO children (id, name, birthday, due_date, created_at, updated_at) VALUES ('c1', 'Asha', '2025-04-12', NULL, ?, ?)", NOW, NOW);
    db.run("INSERT INTO drafts (id, child_id, capture_mode, created_at, typed_text, state) VALUES ('d1', 'c1', 'typed', ?, 'A typed draft', 'ready')", NOW);
    db.run("INSERT INTO settings (key, value) VALUES ('sync.ownerId', ?)", ME);
    expect(migrate(db, qctx)).toMatchObject({ from: 7, to: LATEST_VERSION });
    expect(cols(db, 'drafts')).toEqual(expect.arrayContaining(['held_kind', 'in_book_choice', 'held_v']));
    expect(cols(db, 'entries')).toContain('held_v');
    expect(db.get('SELECT held_kind, held_v FROM drafts WHERE id = ?', 'd1')).toEqual({ held_kind: null, held_v: null });
    expect(ops(db)).toEqual([]);
  });

  it('a signed-in phone queues its voice-only letters waiting for words as waiting_letter rows', () => {
    const { db } = nodeDb();
    migrate(db, qctx, MIGRATIONS.filter((m) => m.version <= 7));
    db.run("INSERT INTO children (id, name, birthday, due_date, created_at, updated_at) VALUES ('c1', 'Asha', '2025-04-12', NULL, ?, ?)", NOW, NOW);
    db.run("INSERT INTO settings (key, value) VALUES ('sync.ownerId', ?)", ME);
    db.run(
      `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits, final_text,
         in_book, updated_at, child_id, author_id, audio_uri, transcript_status)
       VALUES ('w1', 'letter', '2026-10-02', ?, 'spoken', 'verbatim', 5, '', '[]', '', 1, ?, 'c1', ?, 'file:///asha/w1.m4a', 'waiting')`,
      NOW, NOW, ME,
    );
    migrate(db, qctx);
    const [op] = ops(db);
    expect(op).toMatchObject({ type: 'held.upsert', entity_id: 'w1' });
    expect((JSON.parse(op.payload) as PushOp).data).toMatchObject({ kind: 'waiting_letter', child_id: 'c1', raw_transcript: null, audio_kept_on_device: true, in_book_choice: true });
  });
});

describe('[F16 6.2 I] what may leave the phone', () => {
  it('a draft that was never held never queues, whatever changes; holding it queues one whole row', () => {
    const { db, repo, draft } = signedIn();
    const d = draft('You laughed at the dog.');
    enqueueHeldDraft(db, d, qctx);
    expect(ops(db)).toEqual([]);
    expect(drafts.markHeld(repo, d, false)).toBe(true);
    enqueueHeldDraft(db, d, qctx);
    drafts.setTyped(repo, d, 'You laughed at the dog, then at me.');
    enqueueHeldDraft(db, d, qctx);
    const all = ops(db);
    expect(all.map((o) => o.type)).toEqual(['held.upsert']); // an unsent upload is rewritten, never doubled
    const p = JSON.parse(all[0].payload) as PushOp;
    expect(p).toMatchObject({ type: 'held.upsert', id: d, base: null });
    expect(p.data).toMatchObject({ id: d, kind: 'held_letter', typed_text: 'You laughed at the dog, then at me.', in_book_choice: false, raw_transcript: null, final_text: null });
  });

  it('a take still recording is never held', () => {
    const { db, repo, draft } = signedIn();
    const d = draft(null, 'file:///asha/take.m4a');
    db.run("UPDATE drafts SET state = 'recording' WHERE id = ?", d);
    expect(drafts.markHeld(repo, d, true)).toBe(false);
    enqueueHeldDraft(db, d, qctx);
    expect(ops(db)).toEqual([]);
  });

  it('nothing queues before the first sign-in; the sign-in claim sends held drafts and leaves the rest', () => {
    const f = fixture();
    insertBook(f.db, { id: 'c1', name: 'Asha', signsAs: 'Mama' });
    const held = ids();
    const loose = ids();
    drafts.insert(f.ctx, held, { childId: 'c1', captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'Held at the gate.' });
    drafts.insert(f.ctx, loose, { childId: 'c1', captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'Not saved yet.' });
    drafts.markHeld(f.ctx, held, true);
    enqueueHeldDraft(f.db, held, qctx);
    expect(ops(f.db)).toEqual([]);
    takeOwnership(f.db, ME, qctx);
    expect(ops(f.db).filter((o) => o.type.startsWith('held.')).map((o) => o.entity_id)).toEqual([held]);
  });

  it('letting go of a held draft that never reached the server sends nothing; once it did, one held.discard', () => {
    const { db, repo, draft } = signedIn();
    const a = draft('Never sent.');
    drafts.markHeld(repo, a, null);
    enqueueHeldDraft(db, a, qctx);
    enqueueHeldDiscard(db, a, qctx);
    expect(ops(db)).toEqual([]);

    const b = draft('On the server.');
    drafts.markHeld(repo, b, null);
    db.run("UPDATE drafts SET held_v = '901' WHERE id = ?", b);
    enqueueHeldDiscard(db, b, qctx);
    enqueueHeldDiscard(db, b, qctx);
    expect(ops(db).map((o) => o.type)).toEqual(['held.discard']);
    expect(takeBatch(db, { now: NOW, onlyDeletes: true }).ops.map((o) => o.type)).toEqual(['held.discard']); // goes during a consent pause
  });

  it('one op per draft per batch: a later upload, or the letter it becomes, waits for the answer', () => {
    const { db, repo, draft } = signedIn();
    const d = draft('Waiting for Plus.');
    drafts.markHeld(repo, d, true);
    enqueueHeldDraft(db, d, qctx);
    db.run('UPDATE sync_outbox SET sent_at = ? WHERE entity_id = ?', NOW, d); // in flight
    drafts.setTyped(repo, d, 'Waiting for Plus, still.');
    enqueueHeldDraft(db, d, qctx);
    expect(ops(db).map((o) => o.type)).toEqual(['held.upsert', 'held.upsert']);
    expect(takeBatch(db, { now: NOW }).ops).toHaveLength(1);
  });
});

describe('an older server', () => {
  it('held ops wait on the phone until the pull shows a held section; everything else still goes', () => {
    const { db, repo, draft } = signedIn();
    writeSetting(db, SYNC_SETTING.heldServer, null);
    const d = draft('Held before the server knew.');
    drafts.markHeld(repo, d, true);
    enqueueHeldDraft(db, d, qctx);
    db.run(
      `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits, final_text,
         in_book, updated_at, child_id, author_id) VALUES ('e1', 'letter', '2026-10-02', ?, 'typed', 'verbatim', 5, 'Hi.', '[]', 'Hi.', 1, ?, 'c1', ?)`,
      NOW, NOW, ME,
    );
    enqueueEntryUpsert(db, 'e1', ['text'], qctx);
    expect(takeBatch(db, { now: NOW }).ops.map((o) => o.type)).toEqual(['entry.upsert']);
    const page = (held: boolean): PullResponse => ({
      reset: false, epoch: 1, epoch_started_at: NOW, books: [], gone: [], more: false,
      ...(held ? { held: { rows: [], cursor: null, more: false } } : {}),
    });
    applyPullPage(db, page(true), NOW);
    expect(takeBatch(db, { now: NOW }).ops.map((o) => o.type)).toEqual(['held.upsert', 'entry.upsert']);
    applyPullPage(db, page(false), NOW); // the server went back to a build without held drafts
    expect(takeBatch(db, { now: NOW }).ops.map((o) => o.type)).toEqual(['entry.upsert']);
  });
});

describe('[F16 6.2 E] [F16-REQ-025] a held answer', () => {
  it('sets the server version and rebases the upload still queued on it', () => {
    const { db, repo, draft } = signedIn();
    const d = draft('First words.');
    drafts.markHeld(repo, d, true);
    enqueueHeldDraft(db, d, qctx);
    const [first] = db.all<{ op_id: string }>('SELECT op_id FROM sync_outbox');
    db.run('UPDATE sync_outbox SET sent_at = ?', NOW);
    drafts.setTyped(repo, d, 'Second words.');
    enqueueHeldDraft(db, d, qctx);
    db.run('DELETE FROM sync_outbox WHERE op_id = ?', first.op_id);
    expect(settleHeldAnswer(db, first.op_id, d, { held: { id: d, v: '777', updated_at: NOW } }, NOW)).toBe(false);
    expect(db.get('SELECT held_v FROM drafts WHERE id = ?', d)).toEqual({ held_v: '777' });
    const p = JSON.parse(ops(db)[0].payload) as PushOp;
    expect(p.base).toBe('777');
    expect(p.data).toMatchObject({ typed_text: 'Second words.' });
  });

  it('a words refusal keeps this phone\'s words as a conflict copy and the draft follows the server', () => {
    const { db, repo, draft } = signedIn();
    const d = draft('Mine.');
    drafts.markHeld(repo, d, true);
    const r = { held: { id: d, v: '800', updated_at: NOW }, conflict_groups: ['text'], current: { typed_text: 'Theirs.', v: '799' } };
    expect(settleHeldAnswer(db, 'op-1', d, r, NOW)).toBe(true);
    expect(drafts.get(repo, d)?.typedText).toBe('Theirs.');
    expect(listConflictCopies(db, d)).toEqual([expect.objectContaining({ opId: 'op-1', draft: true, words: expect.objectContaining({ final_text: 'Mine.' }) })]);
    // The same answer again (a duplicate) makes no second copy and loses nothing.
    expect(settleHeldAnswer(db, 'op-1', d, r, NOW)).toBe(false);
    expect(listConflictCopies(db, d)).toHaveLength(1);
  });
});

describe('[F14-REQ-041] [F16-U30] held rows in the pull', () => {
  const page = (rows: unknown[]): PullResponse => ({
    reset: false, epoch: 1, epoch_started_at: NOW, books: [], gone: [], more: false,
    held: { rows: rows as NonNullable<PullResponse['held']>['rows'], cursor: '900:00000000-0000-0000-0000-000000000000', more: false },
  });
  const base = {
    child_id: 'c1', capture_mode: 'typed', created_at: NOW, occurred_on: '2026-10-02', occurred_precision: 'day', language: null,
    base_direction: 'ltr', prompt_key: null, in_book_choice: true, raw_transcript: null, final_text: null, machine_edits: null,
    edit_level: null, author_edits: null, locked_spans: null, typed_text: 'From my other phone.', engine_version: null, pack_ref: null,
    audio_kept_on_device: false, updated_at: NOW, v: '850',
  };

  it('a held letter becomes a held draft in the waiting row; a waiting letter becomes a letter waiting for its words', () => {
    const { db, repo } = signedIn();
    applyPullPage(db, page([
      { ...base, id: 'h1', kind: 'held_letter' },
      { ...base, id: 'w1', kind: 'waiting_letter', capture_mode: 'spoken', typed_text: null, engine_version: 5 },
    ]), NOW);
    expect(drafts.listHeld(repo, 'c1').map((d) => [d.id, d.typedText, d.inBookChoice, d.held])).toEqual([['h1', 'From my other phone.', true, true]]);
    expect(db.get('SELECT transcript_status, author_id, held_v, final_text FROM entries WHERE id = ?', 'w1')).toEqual({
      transcript_status: 'waiting', author_id: ME, held_v: '850', final_text: '',
    });
    expect(ops(db)).toEqual([]);
    expect(buildPullRequest(db, { verify: false }).held).toEqual({ cursor: '900:00000000-0000-0000-0000-000000000000' });
  });

  it('let go elsewhere: the draft is marked for the launch sweep, a waiting letter goes to Recently deleted; nothing is erased here', () => {
    const { db, repo } = signedIn();
    applyPullPage(db, page([{ ...base, id: 'h1', kind: 'held_letter' }, { ...base, id: 'w1', kind: 'waiting_letter', typed_text: null }]), NOW);
    settleHeldAnswer(db, 'op-h1', 'h1', { held: { id: 'h1', v: '855', updated_at: NOW }, conflict_groups: ['text'], current: { typed_text: 'Elsewhere.', v: '854' } }, NOW);
    expect(listConflictCopies(db, 'h1')).toHaveLength(1);
    applyPullPage(db, page([{ id: 'h1', gone: 'discarded', updated_at: NOW, v: '860' }, { id: 'w1', gone: 'discarded', updated_at: NOW, v: '861' }]), NOW);
    expect(listConflictCopies(db, 'h1')).toEqual([]); // the author let it go: this phone's copy of its words goes too
    expect(db.get('SELECT state FROM drafts WHERE id = ?', 'h1')).toEqual({ state: 'discarding' });
    expect(drafts.listHeld(repo, 'c1')).toEqual([]);
    expect(db.get<{ deleted_at: string | null }>('SELECT deleted_at FROM entries WHERE id = ?', 'w1')?.deleted_at).not.toBeNull();
  });

  it('a draft with its own upload queued keeps its own values', () => {
    const { db, repo, draft } = signedIn();
    const d = draft('Edited here, not sent yet.');
    drafts.markHeld(repo, d, true);
    enqueueHeldDraft(db, d, qctx);
    applyPullPage(db, page([{ ...base, id: d, kind: 'held_letter', typed_text: 'Older words.' }]), NOW);
    expect(drafts.get(repo, d)?.typedText).toBe('Edited here, not sent yet.');
  });

  it('kept elsewhere: the letter arrives in its book and takes this phone\'s recording; the draft row goes', () => {
    const { db } = signedIn();
    db.run(
      "INSERT INTO drafts (id, child_id, capture_mode, created_at, audio_uri, audio_duration_ms, state, held_kind, held_v) VALUES ('h2', 'c1', 'spoken', ?, 'file:///asha/h2.m4a', 3000, 'ready', 'held_letter', '870')",
      NOW,
    );
    applyPullPage(db, {
      reset: false, epoch: 1, epoch_started_at: NOW, more: false, gone: [],
      books: [{
        id: 'c1', access: 'parent', repull: false, meta_hash: 'x', cursor: '900:00000000-0000-0000-0000-000000000000', more: false,
        rows: [{
          id: 'h2', child_id: 'c1', author_id: ME, author_signs_as: 'Mama', kind: 'letter', occurred_on: '2026-10-02', captured_at: NOW,
          capture_mode: 'spoken', edit_level: 'verbatim', prompt_key: null, engine_version: 5, raw_transcript: 'you sang', machine_edits: [],
          final_text: 'you sang', in_book: true, sounds_like_me: null, approval: null, created_at: NOW, updated_at: NOW, deleted_at: null, own: true, v: '880',
        }],
      }] as unknown as PullResponse['books'],
      held: { rows: [{ id: 'h2', gone: 'kept', updated_at: NOW, v: '881' }], cursor: '900:00000000-0000-0000-0000-000000000000', more: false },
    }, NOW);
    expect(db.get('SELECT id FROM drafts WHERE id = ?', 'h2')).toBeNull();
    expect(db.get('SELECT audio_uri, final_text FROM entries WHERE id = ?', 'h2')).toEqual({ audio_uri: 'file:///asha/h2.m4a', final_text: 'you sang' });
  });

  it('a waiting letter whose words exist now leaves as the letter, and its unsent held upload is dropped', () => {
    const { db } = signedIn();
    db.run(
      `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits, final_text,
         in_book, updated_at, child_id, author_id, audio_uri, transcript_status)
       VALUES ('w2', 'letter', '2026-10-02', ?, 'spoken', 'verbatim', 5, '', '[]', '', 1, ?, 'c1', ?, 'file:///asha/w2.m4a', 'waiting')`,
      NOW, NOW, ME,
    );
    enqueueEntryUpsert(db, 'w2', ['text'], qctx);
    expect(ops(db).map((o) => o.type)).toEqual(['held.upsert']);
    db.run("UPDATE entries SET raw_transcript = 'you clapped', final_text = 'you clapped', transcript_status = 'unreviewed' WHERE id = 'w2'");
    enqueueEntryUpsert(db, 'w2', ['text'], qctx);
    expect(ops(db).map((o) => o.type)).toEqual(['entry.upsert']);
  });
});
