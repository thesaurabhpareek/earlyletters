/// <reference types="node" />
/**
 * A quiet day is its author's own (NS-07-C5-8, C5-12): a pull that carries the other parent's mark
 * never stores it on this phone, while the other parent's letter still arrives. Fictional family "Asha" only.
 */
import { describe, expect, it, vi } from 'vitest';
import { applyPullPage } from '../src/lib/sync/merge';
import type { PullResponse, PulledRow } from '../src/lib/sync/types';
import { fixture } from './helpers/store-fixture';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const NOW = '2026-10-30T09:00:00.000Z';
const ME = '11111111-1111-1111-1111-111111111111';
const PAPA = '22222222-2222-2222-2222-222222222221';
const ASHA = '0199a5b0-0000-7000-8000-0000000000a1';

const row = (id: string, kind: string, extra: Partial<PulledRow> = {}): PulledRow => ({
  id, child_id: ASHA, author_id: PAPA, author_signs_as: 'Papa', kind, occurred_on: '2026-10-20', captured_at: '2026-10-20T08:00:00.000Z',
  capture_mode: 'typed', edit_level: 'verbatim', prompt_key: null, engine_version: 5, final_text: kind === 'letter' ? 'You laughed at the rain.' : '',
  in_book: kind === 'letter', sounds_like_me: null, approval: 'approved', audio_kept_on_device: false,
  created_at: '2026-10-20T08:00:00.000Z', updated_at: '2026-10-20T08:00:00.000Z', deleted_at: null, own: false, v: '100', ...extra,
});

const page = (rows: PulledRow[]): PullResponse => ({
  reset: false, epoch: 1, epoch_started_at: NOW,
  books: [{
    id: ASHA, access: 'parent', repull: false, meta_hash: 'h1', rows, cursor: '100:00000000-0000-0000-0000-000000000000', more: false,
    meta: {
      role: 'parent', name: 'Asha', nickname: null, date_of_birth: '2026-03-01', birthday_md: '03-01', due_date: null, family_can_read: false,
      created_by_me: false, my_signs_as: 'Mama', include_in_reminders: true,
      members: [{ profile_id: ME, role: 'parent', is_me: true, joined_at: NOW, signs_as: null }, { profile_id: PAPA, role: 'parent', is_me: false, joined_at: NOW, signs_as: null }],
    },
  }],
  gone: [],
});

describe('[NS-07-C5-8] the other parent never sees a quiet day', () => {
  it('stores the other parent\'s letter and not the other parent\'s quiet mark', () => {
    const f = fixture();
    f.db.run("INSERT INTO settings (key, value) VALUES ('sync.ownerId', ?)", ME);
    f.db.transaction(() => applyPullPage(f.db, page([row('0199a5b0-0000-7000-8000-0000000000c1', 'letter'), row('0199a5b0-0000-7000-8000-0000000000c2', 'not_much')]), NOW));
    const kinds = f.db.all<{ kind: string }>('SELECT kind FROM entries ORDER BY id').map((r) => r.kind);
    expect(kinds).toEqual(['letter']);
  });
});
