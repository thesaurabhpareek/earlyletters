/**
 * BL-444, D-113, F11-REQ-011, DATA-REQ-016: a book this phone has left stays readable ("Letters to {child}").
 * After `leave_child` the next pull sends the book in `gone` (not_member). Merge marks it left and drops the other parent's
 * letters; the book list hides it. This is the read side: left books are listed, with only the person's own letters, and
 * nothing else is reachable through it. Real repositories and the real merge. Fictional family "Asha" only.
 */
import { describe, expect, it } from 'vitest';
import { children, entries } from '../src/lib/db/repos';
import { markDeleted } from '../src/lib/db/repos/wipe';
import { applyPullPage } from '../src/lib/sync/merge';
import type { PullResponse, PulledRow } from '../src/lib/sync/types';
import { fixture } from './helpers/store-fixture';

const NOW = '2026-10-30T09:00:00.000Z';
const ME = '11111111-1111-1111-1111-111111111111';
const PAPA = '22222222-2222-2222-2222-222222222222';
const ASHA = '0199a5b0-0000-7000-8000-0000000000a1';
const MINE = '0199a5b0-0000-7000-8000-0000000000b1';
const HIS = '0199a5b0-0000-7000-8000-0000000000b2';

const row = (id: string, author: string): PulledRow => ({
  id, child_id: ASHA, author_id: author, author_signs_as: author === ME ? 'Mama' : 'Papa', kind: 'letter', occurred_on: '2026-10-20',
  captured_at: '2026-10-20T08:00:00.000Z', capture_mode: 'typed', edit_level: 'verbatim', prompt_key: null, engine_version: 5,
  raw_transcript: `You laughed at the rain ${id.slice(-2)}.`, machine_edits: [], final_text: `You laughed at the rain ${id.slice(-2)}.`,
  in_book: true, sounds_like_me: null, approval: 'approved', audio_kept_on_device: false, language: 'en',
  created_at: '2026-10-20T08:00:00.000Z', updated_at: '2026-10-20T08:00:00.000Z', deleted_at: null, own: author === ME, v: '100',
});
const bookPage = (rows: PulledRow[]): PullResponse => ({
  reset: false, epoch: 1, epoch_started_at: NOW,
  books: [{
    id: ASHA, access: 'parent', repull: false, meta_hash: 'h1', cursor: '100:00000000-0000-0000-0000-000000000000', more: false, rows,
    meta: {
      role: 'parent', name: 'Asha', nickname: null, date_of_birth: '2026-03-01', birthday_md: '03-01', due_date: null, family_can_read: false,
      created_by_me: false, my_signs_as: 'Mama', include_in_reminders: true,
      members: [
        { profile_id: ME, role: 'parent', is_me: true, joined_at: NOW, signs_as: null },
        { profile_id: PAPA, role: 'parent', is_me: false, joined_at: NOW, signs_as: null },
      ],
    },
  }],
  gone: [],
});
const gonePage = (reason: 'not_member' | 'deleted'): PullResponse => ({
  reset: false, epoch: 1, epoch_started_at: NOW, books: [],
  gone: [{ id: ASHA, reason, rows: [], cursor: '200:00000000-0000-0000-0000-000000000000', more: false }],
});

function phone() {
  const f = fixture();
  f.db.run("INSERT INTO settings (key, value) VALUES ('sync.ownerId', ?)", ME);
  f.db.transaction(() => applyPullPage(f.db, bookPage([row(MINE, ME), row(HIS, PAPA)]), NOW));
  return f;
}
const leave = (f: ReturnType<typeof phone>, reason: 'not_member' | 'deleted' = 'not_member') =>
  f.db.transaction(() => applyPullPage(f.db, gonePage(reason), NOW));

describe('[BL-444] a book this phone has left stays readable', () => {
  it('before leaving, the book is listed as usual and is not a left book', () => {
    const f = phone();
    expect(children.listVisible(f.ctx).map((c) => c.id)).toEqual([ASHA]);
    expect(children.listLeft(f.ctx)).toEqual([]);
    f.close();
  });

  it('after the leaving pull the book leaves the usual list and is listed as left, with only the person\'s own letter', () => {
    const f = phone();
    leave(f);
    expect(children.listVisible(f.ctx)).toEqual([]);
    expect(children.listLeft(f.ctx).map((c) => c.id)).toEqual([ASHA]);
    expect(children.listLeft(f.ctx)[0]?.name).toBe('Asha');
    expect(entries.listForBook(f.ctx, ASHA).map((e) => e.id)).toEqual([MINE]);
    f.close();
  });

  it('a book the server deleted is not a left book (it has its own list)', () => {
    const f = phone();
    leave(f, 'deleted');
    expect(children.listLeft(f.ctx)).toEqual([]);
    expect(children.listClosedByServer(f.ctx).map((c) => c.id)).toEqual([ASHA]);
    f.close();
  });

  it('a left book with no live letter left is not listed, and a deleted letter does not count', () => {
    const f = phone();
    leave(f);
    expect(entries.tombstone(f.ctx, MINE)).toBe(true);
    expect(children.listLeft(f.ctx)).toEqual([]);
    f.close();
  });

  it('a left book deleted on this phone waits in Recently deleted and is not listed', () => {
    const f = phone();
    leave(f);
    expect(markDeleted(f.ctx, ASHA)).toBe(true);
    expect(children.listLeft(f.ctx)).toEqual([]);
    f.close();
  });
});
