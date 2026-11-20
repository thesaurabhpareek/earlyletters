/// <reference types="node" />
/**
 * A pull answer for tests: one book of the signed-in account and some of its own letters, as a returning account meets
 * them on a new phone. Fictional Asha family only.
 */
import type { PullResponse } from '../../src/lib/sync/types';

const AT = '2026-11-10T09:00:00.000Z';

export const PULLED_BOOK = '0199a000-0000-7000-8000-0000000000b1';
export const PULLED_LETTER = '0199a000-0000-7000-8000-0000000000e1';
export const PULLED_LETTER_2 = '0199a000-0000-7000-8000-0000000000e2';

const letterRow = (id: string, authorId: string) => ({
  id, child_id: PULLED_BOOK, author_id: authorId, author_signs_as: 'Mama', kind: 'letter', occurred_on: '2026-10-01', captured_at: AT,
  capture_mode: 'typed', edit_level: 'verbatim', prompt_key: null, engine_version: 5, raw_transcript: 'Asha laughed.', machine_edits: [],
  final_text: 'Asha laughed.', in_book: true, sounds_like_me: null, approval: 'approved', audio_kept_on_device: false,
  created_at: AT, updated_at: AT, deleted_at: null, own: true, v: '100',
});

/** The account's book "Asha" with the letters named, one page (or the first of several when `more`). */
export function pulledPage(authorId: string, letters: string[], more = false): PullResponse {
  return {
    reset: false, epoch: 1, epoch_started_at: AT, gone: [], more,
    books: [{
      id: PULLED_BOOK, access: 'parent', repull: false, meta_hash: 'h', cursor: '100:00000000-0000-0000-0000-000000000000', more: false,
      meta: { role: 'parent', name: 'Asha', nickname: null, date_of_birth: '2026-03-01', birthday_md: '03-01', due_date: null, family_can_read: false,
        created_by_me: true, my_signs_as: 'Mama', include_in_reminders: true, members: [] },
      rows: letters.map((id) => letterRow(id, authorId)),
    }],
  } as unknown as PullResponse;
}
