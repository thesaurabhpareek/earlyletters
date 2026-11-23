/**
 * [NX-39-R33] The letter the phone uploads has exactly the keys the server
 * stores and nothing else: no picture, no media id, no place, no derived field.
 * `photos-surfaces.test.ts` checks the same promise with a name regex; this one
 * pins the whole key list, so a new key must be added here on purpose.
 * Fictional family "Asha" only.
 */
import { describe, expect, it } from 'vitest';
import { entrySnapshot, type LocalEntryRow } from '../src/lib/sync/outbox';

const ALLOWED = [
  'audio_kept_on_device', 'base_direction', 'capture_mode', 'captured_at', 'child_id', 'edit_level', 'engine_version', 'final_text', 'id',
  'in_book', 'kind', 'language', 'machine_edits', 'occurred_on', 'occurred_precision', 'prompt_key', 'raw_transcript', 'sounds_like_me', 'author_signs_as',
].sort();

const row: LocalEntryRow = {
  id: 'e1', kind: 'letter', occurred_on: '2026-06-12', captured_at: '2026-06-12T09:00:00Z', capture_mode: 'typed', edit_level: 'clean',
  prompt_key: 'p1', engine_version: 1, raw_transcript: 'Asha laughed.', machine_edits: '[]', final_text: 'Asha laughed.', in_book: 1, sounds_like_me: 1,
  updated_at: '2026-06-12T09:00:00Z', deleted_at: null, synced_at: null, child_id: 'c1', author_id: 'u1', author_signs_as: 'Papa', audio_uri: 'file:///a.m4a',
  transcript_status: null, server_version: null, server_updated_at: null, server_epoch: null, sync_state: 'pending', approval: null,
  language: 'en', occurred_precision: 'day', base_direction: 'ltr',
};

describe('[NX-39-R33] the sync payload carries no media and no derived field', () => {
  it('a full local row uploads exactly the allowlisted keys', () => {
    const snap = entrySnapshot(row);
    expect(snap).not.toBeNull();
    expect(Object.keys(snap as object).sort()).toEqual(ALLOWED);
  });
});
