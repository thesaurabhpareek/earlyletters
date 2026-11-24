/// <reference types="node" />
/**
 * NS-09-R15: the let-go failure count (settings key discard.failures.<draft id>) ends with the let-go when a pull
 * ends it: the letter was kept elsewhere (adoptHeldDraft deletes the draft), or the server kept the held row and the
 * draft goes back from `discarding` to `ready`. A stale count would make a later let-go start above none.
 * Fictional Asha family only.
 */
import { describe, expect, it } from 'vitest';
import { applyPullPage } from '../src/lib/sync/merge';
import { SYNC_SETTING, writeSetting } from '../src/lib/sync/outbox';
import type { PullResponse } from '../src/lib/sync/types';
import { fixture, insertBook } from './helpers/store-fixture';

const NOW = '2026-10-03T09:00:00.000Z';
const ME = '11111111-1111-1111-1111-111111111111';
const CUR = '900:00000000-0000-0000-0000-000000000000';
const key = (id: string) => `discard.failures.${id}`;

function stuckDraft(id: string) {
  const { db } = fixture();
  insertBook(db, { id: 'c1', name: 'Asha', signsAs: 'Mama' });
  writeSetting(db, SYNC_SETTING.owner, ME);
  writeSetting(db, SYNC_SETTING.heldServer, '1');
  db.run(
    "INSERT INTO drafts (id, child_id, capture_mode, created_at, audio_uri, audio_duration_ms, state, held_kind, held_v) VALUES (?, 'c1', 'spoken', ?, 'file:///asha/x.m4a', 3000, 'discarding', 'held_letter', '870')",
    id, NOW,
  );
  db.run('INSERT INTO settings (key, value) VALUES (?, ?)', key(id), '3');
  return db;
}
const count = (db: ReturnType<typeof stuckDraft>, id: string) => db.get('SELECT value FROM settings WHERE key = ?', key(id));

describe('[NS-09-R15] a pull that ends a let-go ends its failure count', () => {
  it('[NS-09-R15] kept elsewhere: merge adopt deletes the draft and its count', () => {
    const db = stuckDraft('h2');
    db.run(
      `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits, final_text,
         in_book, updated_at, child_id, author_id, transcript_status)
       VALUES ('h2', 'letter', '2026-10-02', ?, 'spoken', 'verbatim', 5, 'you sang', '[]', 'you sang', 1, ?, 'c1', ?, 'ready')`,
      NOW, NOW, ME,
    );
    // The draft is still marked `discarding`, so adopt leaves it for the sweep; the count must stay with it.
    applyPullPage(db, { reset: false, epoch: 1, epoch_started_at: NOW, books: [], gone: [], more: false, held: { rows: [{ id: 'h2', gone: 'kept', updated_at: NOW, v: '881' }], cursor: CUR, more: false } } as unknown as PullResponse, NOW);
    expect(db.get('SELECT id FROM drafts WHERE id = ?', 'h2')).not.toBeNull();
    expect(count(db, 'h2')).not.toBeNull();
    // Once the draft is no longer marked (ready), adopt takes the row and the count with it.
    db.run("UPDATE drafts SET state = 'ready' WHERE id = 'h2'");
    applyPullPage(db, { reset: false, epoch: 1, epoch_started_at: NOW, books: [], gone: [], more: false, held: { rows: [{ id: 'h2', gone: 'kept', updated_at: NOW, v: '882' }], cursor: CUR, more: false } } as unknown as PullResponse, NOW);
    expect(db.get('SELECT id FROM drafts WHERE id = ?', 'h2')).toBeNull();
    expect(count(db, 'h2')).toBeNull(); // mutant: adopt deletes the row and leaves the key
  });

  it('[NS-09-R15] the server kept the held row: the draft goes back to ready and its count is cleared', () => {
    const db = stuckDraft('h3');
    applyPullPage(db, {
      reset: false, epoch: 1, epoch_started_at: NOW, books: [], gone: [], more: false,
      held: { rows: [{
        id: 'h3', kind: 'held_letter', child_id: 'c1', capture_mode: 'spoken', created_at: NOW, occurred_on: '2026-10-02', occurred_precision: 'day',
        language: null, base_direction: 'ltr', prompt_key: null, in_book_choice: true, raw_transcript: null, final_text: null, machine_edits: null,
        edit_level: null, author_edits: null, locked_spans: null, typed_text: 'Kept words.', engine_version: null, pack_ref: null,
        audio_kept_on_device: false, updated_at: NOW, v: '890',
      }], cursor: CUR, more: false },
    } as unknown as PullResponse, NOW);
    expect(db.get('SELECT state FROM drafts WHERE id = ?', 'h3')).toEqual({ state: 'ready' });
    expect(count(db, 'h3')).toBeNull(); // mutant: restore leaves the old count
  });
});
