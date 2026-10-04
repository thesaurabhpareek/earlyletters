/// <reference types="node" />
/**
 * Write paths for letters (MOB-04, PMOB-02, DATA-REQ-040, DATA-REQ-048),
 * against a real SQLite engine. Fictional Asha family only.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { drafts, entries, letters } from '../src/lib/db/repos';
import { EntryTombstonedError } from '../src/lib/db/repos/entries';
import { fixture, letter, rawRow, seedChild, type Fixture } from './helpers/store-fixture';

let f: Fixture;
const defaults = { childId: null, authorSignsAs: null };

beforeEach(() => {
  f = fixture();
  seedChild(f.db);
  seedChild(f.db, 'child-ravi', 'Amma');
});
afterEach(() => f.close());

describe('entries.upsert: write-once columns', () => {
  it('[DATA-REQ-040] an upsert never changes raw_transcript', () => {
    entries.upsert(f.ctx, letter(), defaults);
    entries.upsert(f.ctx, letter({ rawTranscript: 'something else entirely' }), defaults);
    expect(rawRow(f.db, letter().id)!.raw_transcript).toBe(letter().rawTranscript);
  });

  it('[DATA-REQ-040] an upsert never changes captured_at or occurred_on', () => {
    entries.upsert(f.ctx, letter(), defaults);
    entries.upsert(f.ctx, letter({ capturedAt: '2030-01-01T00:00:00.000Z', occurredOn: '2030-01-01' }), defaults);
    expect(rawRow(f.db, letter().id)).toMatchObject({ captured_at: letter().capturedAt, occurred_on: '2026-10-03' });
  });

  it('[DATA-REQ-046] an upsert never changes the audio path, length, hash or size', () => {
    entries.upsert(f.ctx, letter(), defaults);
    entries.upsert(f.ctx, letter({ audioUri: null, audioDurationMs: 1, audioSha256: 'b'.repeat(64), audioBytes: 1 }), defaults);
    expect(rawRow(f.db, letter().id)).toMatchObject({
      audio_uri: 'file:///Documents/recording-1.m4a',
      audio_duration_ms: 31000,
      audio_sha256: 'a'.repeat(64),
      audio_bytes: 48000,
    });
  });

  it('an upsert never changes kind, capture mode, prompt or the signature frozen at save', () => {
    entries.upsert(f.ctx, letter(), defaults);
    entries.upsert(f.ctx, letter({ kind: 'not_much', captureMode: 'typed', promptKey: null, authorSignsAs: 'Papa' }), defaults);
    expect(rawRow(f.db, letter().id)).toMatchObject({ kind: 'letter', capture_mode: 'spoken', prompt_key: 'first-laugh', author_signs_as: 'Mama' });
  });

  it('an upsert updates only the editable columns and stamps updated_at', () => {
    entries.upsert(f.ctx, letter(), defaults);
    f.tick();
    entries.upsert(f.ctx, letter({ finalText: 'Asha, you laughed at the rain.', editLevel: 'verbatim', inBook: true, soundsLikeMe: true }), defaults);
    const r = rawRow(f.db, letter().id)!;
    expect(r).toMatchObject({ final_text: 'Asha, you laughed at the rain.', edit_level: 'verbatim', in_book: 1, sounds_like_me: 1 });
    expect(r.updated_at).toBe('2026-10-03T09:01:00.000Z');
  });

  it('a damaged machine_edits value reads back as no edits, never hiding the letter', () => {
    entries.upsert(f.ctx, letter(), defaults);
    f.db.run("UPDATE entries SET machine_edits = '{oops' WHERE id = ?", letter().id);
    expect(entries.get(f.ctx, letter().id)).toMatchObject({ machineEdits: [], finalText: letter().finalText });
  });
});

describe('entries.upsert: child_id', () => {
  it('child_id can move between books while the letter has never synced', () => {
    entries.upsert(f.ctx, letter(), defaults);
    entries.upsert(f.ctx, letter({ childId: 'child-ravi' }), defaults);
    expect(rawRow(f.db, letter().id)!.child_id).toBe('child-ravi');
  });

  it('[DATA-REQ-040] child_id is frozen once the letter has synced', () => {
    entries.upsert(f.ctx, letter(), defaults);
    f.db.run('UPDATE entries SET synced_at = ? WHERE id = ?', '2026-10-03T09:05:00.000Z', letter().id);
    entries.upsert(f.ctx, letter({ childId: 'child-ravi' }), defaults);
    expect(rawRow(f.db, letter().id)!.child_id).toBe('child-asha');
  });

  it('[PMOB-02] an update without a child keeps the stored book (no fallback to a default)', () => {
    entries.upsert(f.ctx, letter(), defaults);
    entries.upsert(f.ctx, letter({ childId: undefined }), { childId: 'child-ravi', authorSignsAs: 'Amma' });
    expect(rawRow(f.db, letter().id)).toMatchObject({ child_id: 'child-asha', author_signs_as: 'Mama' });
  });

  it('[PMOB-02] a first insert uses only the defaults the caller passed', () => {
    entries.upsert(f.ctx, letter({ childId: undefined, authorSignsAs: undefined }), { childId: 'child-ravi', authorSignsAs: 'Amma' });
    expect(rawRow(f.db, letter().id)).toMatchObject({ child_id: 'child-ravi', author_signs_as: 'Amma' });
  });

  it('[PMOB-02] with no child and no default, the letter is stored without a book rather than guessed', () => {
    entries.upsert(f.ctx, letter({ childId: undefined, authorSignsAs: undefined }), defaults);
    expect(rawRow(f.db, letter().id)).toMatchObject({ child_id: null, author_signs_as: null });
  });
});

describe('tombstones (PMOB-02)', () => {
  beforeEach(() => entries.upsert(f.ctx, letter(), defaults));

  it('a tombstoned letter refuses an upsert with entry_tombstoned and is unchanged', () => {
    expect(entries.tombstone(f.ctx, letter().id)).toBe(true);
    const before = rawRow(f.db, letter().id);
    expect(() => entries.upsert(f.ctx, letter({ finalText: 'changed', inBook: true }), defaults)).toThrow(EntryTombstonedError);
    expect(rawRow(f.db, letter().id)).toEqual(before);
  });

  it('a tombstoned letter refuses setInBook', () => {
    entries.tombstone(f.ctx, letter().id);
    expect(entries.setInBook(f.ctx, letter().id, true)).toBe(false);
    expect(rawRow(f.db, letter().id)!.in_book).toBe(0);
  });

  it('a tombstoned waiting letter refuses its words', () => {
    entries.upsert(f.ctx, letter({ id: 'w1', rawTranscript: '', finalText: '', transcriptStatus: 'waiting' }), defaults);
    entries.tombstone(f.ctx, 'w1');
    const w = { rawTranscript: 'hello Asha', machineEdits: [], finalText: 'Hello Asha.', editLevel: 'clean' as const, engineVersion: 3 };
    expect(entries.setWordsOnce(f.ctx, 'w1', w)).toBe(false);
    expect(rawRow(f.db, 'w1')!.raw_transcript).toBe('');
  });

  it('deleting twice keeps the first deleted_at', () => {
    entries.tombstone(f.ctx, letter().id);
    const first = rawRow(f.db, letter().id)!.deleted_at;
    f.tick();
    expect(entries.tombstone(f.ctx, letter().id)).toBe(false);
    expect(rawRow(f.db, letter().id)!.deleted_at).toBe(first);
  });

  it('a tombstoned letter is hidden from reads but still listed for the launch sweep', () => {
    entries.tombstone(f.ctx, letter().id);
    expect(entries.get(f.ctx, letter().id)).toBeNull();
    expect(entries.listForChild(f.ctx, 'child-asha')).toEqual([]);
    expect(entries.audioRows(f.ctx)).toEqual([{ id: letter().id, audioUri: 'file:///Documents/recording-1.m4a', deleted: true }]);
  });

  it('[D-085] the shelf: listDeleted is newest first, expiredIds respects the cutoff, eraseRow refuses a live letter', () => {
    entries.tombstone(f.ctx, letter().id);
    const deletedAt = rawRow(f.db, letter().id)!.deleted_at as string;
    expect(entries.listDeleted(f.ctx).map((e) => [e.id, e.deletedAt])).toEqual([[letter().id, deletedAt]]);
    expect(entries.expiredIds(f.ctx, new Date(Date.parse(deletedAt) - 1).toISOString())).toEqual([]);
    expect(entries.expiredIds(f.ctx, deletedAt)).toEqual([letter().id]);
    expect(entries.deletedAudioUri(f.ctx, letter().id)).toBe('file:///Documents/recording-1.m4a');
    entries.undelete(f.ctx, letter().id);
    expect(entries.deletedAudioUri(f.ctx, letter().id)).toBeUndefined();
    expect(entries.eraseRow(f.ctx, letter().id)).toBe(false);
    expect(entries.get(f.ctx, letter().id)).not.toBeNull();
    entries.tombstone(f.ctx, letter().id);
    expect(entries.eraseRow(f.ctx, letter().id)).toBe(true);
    expect(rawRow(f.db, letter().id)).toBeNull();
    expect(entries.eraseRow(f.ctx, letter().id)).toBe(false);
  });

  it('undelete restores a tombstone and reports false when there was none', () => {
    entries.tombstone(f.ctx, letter().id);
    expect(entries.undelete(f.ctx, letter().id)).toBe(true);
    expect(entries.get(f.ctx, letter().id)?.finalText).toBe(letter().finalText);
    expect(entries.undelete(f.ctx, letter().id)).toBe(false);
  });

  it('the audio path of a tombstoned letter can still be rebased after a container move', () => {
    entries.tombstone(f.ctx, letter().id);
    entries.rebaseAudioUri(f.ctx, letter().id, 'file:///NEW/Documents/recording-1.m4a');
    expect(rawRow(f.db, letter().id)!.audio_uri).toBe('file:///NEW/Documents/recording-1.m4a');
  });

  it('rebasing never gives a typed letter an audio path', () => {
    entries.upsert(f.ctx, letter({ id: 't1', audioUri: null, captureMode: 'typed' }), defaults);
    entries.rebaseAudioUri(f.ctx, 't1', 'file:///NEW/Documents/recording-9.m4a');
    expect(rawRow(f.db, 't1')!.audio_uri).toBeNull();
  });
});

describe('words for a waiting letter are set once', () => {
  const w = { rawTranscript: 'Asha you clapped', machineEdits: [], finalText: 'Asha, you clapped.', editLevel: 'clean' as const, engineVersion: 3 };
  beforeEach(() => entries.upsert(f.ctx, letter({ id: 'w1', rawTranscript: '', finalText: '', transcriptStatus: 'waiting' }), defaults));

  it('the first transcript becomes the raw and the letter stops waiting', () => {
    expect(entries.setWordsOnce(f.ctx, 'w1', w)).toBe(true);
    expect(entries.get(f.ctx, 'w1')).toMatchObject({ rawTranscript: 'Asha you clapped', transcriptStatus: null });
    expect(entries.listWaiting(f.ctx, 'child-asha')).toEqual([]);
  });

  it('a second transcript is refused and the first raw is kept', () => {
    entries.setWordsOnce(f.ctx, 'w1', w);
    expect(entries.setWordsOnce(f.ctx, 'w1', { ...w, rawTranscript: 'a different hearing' })).toBe(false);
    expect(rawRow(f.db, 'w1')!.raw_transcript).toBe('Asha you clapped');
  });

  it('a letter that already had words never takes new ones', () => {
    entries.upsert(f.ctx, letter({ id: 'l2' }), defaults);
    expect(entries.setWordsOnce(f.ctx, 'l2', w)).toBe(false);
  });
});

describe('draft to letter (DATA-REQ-048)', () => {
  function draft() {
    const id = f.ctx.newId();
    drafts.insert(f.ctx, id, { childId: 'child-asha', captureMode: 'spoken', promptKey: null, audioUri: 'file:///Documents/recording-2.m4a', audioDurationMs: 9000, audioSha256: 'c'.repeat(64), audioBytes: 9000 });
    return drafts.get(f.ctx, id)!;
  }

  it('saving inserts the letter under the draft id and removes the draft', () => {
    const d = draft();
    letters.saveFromDraft(f.ctx, d.id, letter({ id: 'ignored' }), defaults);
    expect(entries.get(f.ctx, d.id)).not.toBeNull();
    expect(drafts.get(f.ctx, d.id)).toBeNull();
  });

  it('a throw while deleting the draft rolls back the letter: the intact draft remains, never both, never neither', () => {
    const d = draft();
    f.failNextRun(/DELETE FROM drafts/);
    expect(() => letters.saveFromDraft(f.ctx, d.id, letter(), defaults)).toThrow('injected_failure');
    expect(rawRow(f.db, d.id)).toBeNull();
    expect(drafts.get(f.ctx, d.id)).toEqual(d);
  });

  it('a throw while inserting the letter leaves the draft untouched', () => {
    const d = draft();
    f.failNextRun(/INSERT INTO entries/);
    expect(() => letters.saveFromDraft(f.ctx, d.id, letter(), defaults)).toThrow('injected_failure');
    expect(drafts.get(f.ctx, d.id)).toEqual(d);
    expect(rawRow(f.db, d.id)).toBeNull();
  });

  it('a spoken letter whose audio file is gone is refused and the draft is kept', () => {
    const d = draft();
    expect(() => letters.saveFromDraft(f.ctx, d.id, letter(), defaults, false)).toThrow('audio_missing');
    expect(drafts.get(f.ctx, d.id)).not.toBeNull();
  });

  it('saving onto a tombstoned letter id is refused and the draft is kept', () => {
    const d = draft();
    entries.upsert(f.ctx, letter({ id: d.id }), defaults);
    entries.tombstone(f.ctx, d.id);
    expect(() => letters.saveFromDraft(f.ctx, d.id, letter(), defaults)).toThrow(EntryTombstonedError);
    expect(drafts.get(f.ctx, d.id)).not.toBeNull();
  });

  it('a voice-only letter waits for its words, keeps the recording and is private unless chosen', () => {
    const d = draft();
    const e = letters.voiceOnlyEntry(d, { childId: 'child-asha', authorSignsAs: 'Mama', inBook: false, engineVersion: 3, occurredOn: '2026-10-03' });
    letters.saveFromDraft(f.ctx, d.id, e, defaults);
    expect(entries.get(f.ctx, d.id)).toMatchObject({
      rawTranscript: '',
      finalText: '',
      transcriptStatus: 'waiting',
      inBook: false,
      audioUri: d.audioUri,
      audioSha256: d.audioSha256,
      capturedAt: d.createdAt,
    });
  });

  it('a voice-only letter needs a recording', () => {
    const d = { ...draft(), audioUri: null };
    expect(() => letters.voiceOnlyEntry(d, { childId: 'child-asha', authorSignsAs: 'Mama', inBook: false, engineVersion: 3, occurredOn: '2026-10-03' })).toThrow('audio_missing');
  });
});

describe('reads', () => {
  it('letters for a book are newest first and other books are excluded', () => {
    entries.upsert(f.ctx, letter({ id: 'a', occurredOn: '2026-09-01', capturedAt: '2026-09-01T10:00:00.000Z' }), defaults);
    entries.upsert(f.ctx, letter({ id: 'b', occurredOn: '2026-10-01', capturedAt: '2026-10-01T10:00:00.000Z' }), defaults);
    entries.upsert(f.ctx, letter({ id: 'c', occurredOn: '2026-10-01', capturedAt: '2026-10-01T11:00:00.000Z' }), defaults);
    entries.upsert(f.ctx, letter({ id: 'r', childId: 'child-ravi' }), defaults);
    expect(entries.listForChild(f.ctx, 'child-asha').map((e) => e.id)).toEqual(['c', 'b', 'a']);
  });
});
