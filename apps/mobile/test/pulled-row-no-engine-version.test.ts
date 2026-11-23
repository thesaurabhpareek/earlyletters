/// <reference types="node" />
/**
 * [FR-AIS-08] A pulled row with no engine_version (the other parent's row since 20261123200000, and any own row from
 * a server that omits it) is stored with 0, the device's "not known". Fictional family "Asha" only.
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
const THEIRS = '0199a5b0-0000-7000-8000-0000000000c1';
const MINE = '0199a5b0-0000-7000-8000-0000000000c2';

const row = (id: string, own: boolean, extra: Partial<PulledRow> = {}): PulledRow => ({
  id, child_id: ASHA, author_id: own ? ME : PAPA, author_signs_as: own ? 'Mama' : 'Papa', kind: 'letter', occurred_on: '2026-10-20',
  captured_at: '2026-10-20T08:00:00.000Z', capture_mode: 'typed', edit_level: 'verbatim', prompt_key: null,
  final_text: 'You laughed at the rain.', in_book: true, sounds_like_me: null, approval: 'approved', audio_kept_on_device: false,
  created_at: '2026-10-20T08:00:00.000Z', updated_at: '2026-10-20T08:00:00.000Z', deleted_at: null, own, v: '100', ...extra,
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

const pull = (rows: PulledRow[]) => {
  const f = fixture();
  f.db.run("INSERT INTO settings (key, value) VALUES ('sync.ownerId', ?)", ME);
  f.db.transaction(() => applyPullPage(f.db, page(rows), NOW));
  return f;
};
const engineOf = (f: ReturnType<typeof fixture>, id: string) =>
  f.db.get<{ engine_version: number }>('SELECT engine_version FROM entries WHERE id = ?', id)?.engine_version;

describe('[FR-AIS-08] a pulled row with no engine_version', () => {
  it('mergeOtherRow stores 0 for the other parent\'s row, and the letter arrives', () => {
    const f = pull([row(THEIRS, false)]);
    expect(engineOf(f, THEIRS)).toBe(0);
    expect(f.db.get<{ final_text: string }>('SELECT final_text FROM entries WHERE id = ?', THEIRS)?.final_text).toBe('You laughed at the rain.');
  });
  it('insertOwnRow stores 0 for an own row that has none', () => {
    expect(engineOf(pull([row(MINE, true)]), MINE)).toBe(0);
  });
  it('control: a row that has engine_version keeps it', () => {
    const f = pull([row(THEIRS, false, { engine_version: 5 }), row(MINE, true, { engine_version: 7 })]);
    expect([engineOf(f, THEIRS), engineOf(f, MINE)]).toEqual([5, 7]);
  });
});
