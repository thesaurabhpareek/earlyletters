/**
 * [FR-AIS-08] engine_version is the author's working material: book_entries no longer carries it (20261123200000),
 * so another member's pulled row has none. The contract accepts that row, and still refuses a wrong type.
 * Fictional family "Asha" only.
 */
import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { PulledRowSchema } from '../server';

const base = {
  id: '0199a5b0-0000-7000-8000-0000000000c1',
  child_id: '0199a5b0-0000-7000-8000-0000000000a1',
  author_id: '22222222-2222-2222-2222-222222222221',
  author_signs_as: 'Papa',
  kind: 'letter',
  occurred_on: '2026-10-20',
  captured_at: '2026-10-20T08:00:00.000Z',
  capture_mode: 'typed',
  edit_level: 'verbatim',
  prompt_key: null,
  final_text: 'You laughed at the rain.',
  in_book: true,
  sounds_like_me: null,
  approval: 'approved',
  audio_kept_on_device: false,
  created_at: '2026-10-20T08:00:00.000Z',
  updated_at: '2026-10-20T08:00:00.000Z',
  deleted_at: null,
  own: false,
  v: '100',
};

describe('[FR-AIS-08] PulledRowSchema and engine_version', () => {
  it('accepts a row with no engine_version (the other parent\'s row)', () => {
    expect(v.safeParse(PulledRowSchema, base).success).toBe(true);
  });
  it('still accepts the author\'s own row with a number', () => {
    const r = v.safeParse(PulledRowSchema, { ...base, own: true, engine_version: 7 });
    expect(r.success).toBe(true);
  });
  it('refuses a wrong type', () => {
    expect(v.safeParse(PulledRowSchema, { ...base, engine_version: '7' }).success).toBe(false);
    expect(v.safeParse(PulledRowSchema, { ...base, engine_version: null }).success).toBe(false);
  });
  it('is a control: the base row without another required field fails', () => {
    const { final_text: _drop, ...rest } = base;
    expect(v.safeParse(PulledRowSchema, rest).success).toBe(false);
  });
});
