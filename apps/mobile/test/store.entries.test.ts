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

describe('[BL-413] a background-words letter is marked for reading, and the mark clears once it is read', () => {
  const w = { rawTranscript: 'Asha you clapped', machineEdits: [], finalText: 'Asha you clapped', editLevel: 'verbatim' as const, engineVersion: 3 };
  beforeEach(() => entries.upsert(f.ctx, letter({ id: 'w1', rawTranscript: '', finalText: '', transcriptStatus: 'waiting' }), defaults));

  it('words set in the background wait for review: marked, and listed for Review', () => {
    entries.setWordsOnce(f.ctx, 'w1', w);
    expect(entries.get(f.ctx, 'w1')).toMatchObject({ wordsUnreviewed: true, finalText: 'Asha you clapped' });
    expect(entries.listWordsToReview(f.ctx, 'child-asha').map((e) => e.id)).toEqual(['w1']);
  });

  it('read in Review, the mark clears once, and the words are not touched', () => {
    entries.setWordsOnce(f.ctx, 'w1', w);
    expect(entries.markWordsReviewed(f.ctx, 'w1')).toBe(true);
    expect(entries.get(f.ctx, 'w1')).toMatchObject({ wordsUnreviewed: false, finalText: 'Asha you clapped', rawTranscript: 'Asha you clapped' });
    expect(entries.listWordsToReview(f.ctx, 'child-asha')).toEqual([]);
    expect(entries.markWordsReviewed(f.ctx, 'w1')).toBe(false);
  });
});

describe('[BL-413] Change words on a saved letter: a person edit, raw untouched, each edit put back on its own', () => {
  const KEPT = 'Usher laughed at the rain today.';
  const edits = [{ type: 'filler' as const, start: 0, end: 3, original: 'um ', replacement: '', source: 'rule' as const }];
  const OWNER = '11111111-1111-1111-1111-111111111111';
  const row = () => rawRow(f.db, 'l1') as { raw_transcript: string; machine_edits: string; final_text: string; edit_level: string; author_base: string | null };
  beforeEach(() => entries.upsert(f.ctx, letter({ id: 'l1', rawTranscript: 'um Usher laughed at the rain today', machineEdits: edits, finalText: KEPT }), defaults));

  it('the person\'s words become the letter\'s; raw_transcript, the machine edits and the edit level stay', () => {
    const before = row();
    expect(entries.changeWords(f.ctx, 'l1', '  Asha laughed at the rain today.  ', null)).toBe(true);
    expect(row()).toMatchObject({ final_text: 'Asha laughed at the rain today.', raw_transcript: before.raw_transcript, machine_edits: before.machine_edits, edit_level: before.edit_level, author_base: KEPT });
  });

  it('every edit is stored against the words as kept, which are written once', () => {
    entries.changeWords(f.ctx, 'l1', 'Asha laughed at the rain today.', null);
    entries.changeWords(f.ctx, 'l1', 'Asha laughed in the rain today.', null);
    const layer = entries.authorLayer(f.ctx, 'l1')!;
    expect(layer.base).toBe(KEPT);
    expect(layer.edits).toEqual([
      { start: 0, end: 5, replacement: 'Asha' },
      { start: 14, end: 16, replacement: 'in' },
    ]);
  });

  it('each edit is put back on its own, and the others stay', () => {
    entries.changeWords(f.ctx, 'l1', 'Asha laughed in the rain today.', null);
    const [name, word] = entries.authorLayer(f.ctx, 'l1')!.edits;
    expect(entries.putBackEdit(f.ctx, 'l1', word, null)).toBe(true);
    expect(row().final_text).toBe('Asha laughed at the rain today.');
    expect(entries.authorLayer(f.ctx, 'l1')!.edits).toEqual([name]);
  });

  it('with every edit put back the letter reads exactly as kept and nothing is left to put back', () => {
    entries.changeWords(f.ctx, 'l1', 'Asha laughed in the rain today.', null);
    for (const e of [...entries.authorLayer(f.ctx, 'l1')!.edits].reverse()) expect(entries.putBackEdit(f.ctx, 'l1', e, null)).toBe(true);
    expect(row()).toMatchObject({ final_text: KEPT, author_base: null });
    expect(entries.authorLayer(f.ctx, 'l1')).toBeNull();
  });

  it('a put back for an edit that is no longer there changes nothing', () => {
    entries.changeWords(f.ctx, 'l1', 'Asha laughed at the rain today.', null);
    expect(entries.putBackEdit(f.ctx, 'l1', { start: 0, end: 5, replacement: 'Ravi' }, null)).toBe(false);
    expect(row().final_text).toBe('Asha laughed at the rain today.');
  });

  it('refuses empty words and the same words, writing nothing', () => {
    expect(entries.changeWords(f.ctx, 'l1', '   ', null)).toBe(false);
    expect(entries.changeWords(f.ctx, 'l1', KEPT, null)).toBe(false);
    expect(row()).toMatchObject({ final_text: KEPT, author_base: null });
  });

  it('refuses a letter still waiting, words still waiting for Review, a quiet-day mark, a deleted letter and another author\'s', () => {
    entries.upsert(f.ctx, letter({ id: 'w1', rawTranscript: '', finalText: '', transcriptStatus: 'waiting' }), defaults);
    entries.upsert(f.ctx, letter({ id: 'w2', rawTranscript: '', finalText: '', transcriptStatus: 'waiting' }), defaults);
    entries.setWordsOnce(f.ctx, 'w2', { rawTranscript: 'Asha clapped', machineEdits: [], finalText: 'Asha clapped', editLevel: 'verbatim', engineVersion: 3 });
    entries.upsert(f.ctx, letter({ id: 'q1', kind: 'not_much', finalText: 'Quiet.' }), defaults);
    entries.upsert(f.ctx, letter({ id: 'd1' }), defaults);
    entries.tombstone(f.ctx, 'd1');
    entries.upsert(f.ctx, letter({ id: 'o1', authorId: '22222222-2222-2222-2222-222222222222' }), defaults);
    for (const id of ['w1', 'w2', 'q1', 'd1', 'o1']) {
      expect(entries.canChangeWords(f.ctx, id, OWNER)).toBe(false);
      expect(entries.changeWords(f.ctx, id, 'Asha splashed.', OWNER)).toBe(false);
    }
    expect(entries.canChangeWords(f.ctx, 'l1', OWNER)).toBe(true);
  });
});

describe('typed words for a waiting letter (D-086, "Write the words")', () => {
  beforeEach(() => entries.upsert(f.ctx, letter({ id: 'w1', rawTranscript: '', finalText: '', transcriptStatus: 'waiting' }), defaults));

  it('become the words once, untouched, and the letter is a recording with typed words', () => {
    expect(entries.setTypedWordsOnce(f.ctx, 'w1', '  Asha clapped at the dog  ')).toBe(true);
    expect(entries.get(f.ctx, 'w1')).toMatchObject({
      rawTranscript: 'Asha clapped at the dog',
      finalText: 'Asha clapped at the dog',
      machineEdits: [],
      captureMode: 'mixed',
      editLevel: 'verbatim',
      transcriptStatus: null,
      wordsUnreviewed: true, // they wait for the author's review: they count only when kept from Review (#53)
    });
  });

  it('are refused when empty, and a letter that already has words keeps them', () => {
    expect(entries.setTypedWordsOnce(f.ctx, 'w1', '   ')).toBe(false);
    entries.setTypedWordsOnce(f.ctx, 'w1', 'first words');
    expect(entries.setTypedWordsOnce(f.ctx, 'w1', 'second words')).toBe(false);
    expect(rawRow(f.db, 'w1')!.raw_transcript).toBe('first words');
    entries.upsert(f.ctx, letter({ id: 'l2' }), defaults);
    expect(entries.setTypedWordsOnce(f.ctx, 'l2', 'new words')).toBe(false);
  });

  it('never write into a deleted letter', () => {
    entries.tombstone(f.ctx, 'w1');
    expect(entries.setTypedWordsOnce(f.ctx, 'w1', 'words')).toBe(false);
  });
});

describe('[P5 critics S3] the offer and the write agree: canTypeWords is exactly what setTypedWordsOnce would do', () => {
  // One letter per case, in the state named; the letter page offers "Write the words" when the check says yes.
  const noWords = { rawTranscript: '', finalText: '', transcriptStatus: null } as const;
  const outbox = (id: string, cols: string, vals: string) =>
    f.db.run(`INSERT INTO sync_outbox (op_id, lane, type, entity_id, payload, created_at${cols}) VALUES ('op-' || ?, 1, 'entry.upsert', ?, '{}', ?${vals})`, id, id, f.ctx.now());
  const cases: Array<[string, Partial<Parameters<typeof letter>[0]>, (id: string) => void, boolean]> = [
    ['a letter waiting for its words', { rawTranscript: '', finalText: '', transcriptStatus: 'waiting' }, () => {}, true],
    ['a recording whose words came back empty', noWords, () => {}, true],
    ['a no-words recording queued but never sent (no attempt yet)', noWords, (id) => outbox(id, '', ''), true],
    ['a no-words recording the server has (server_version set)', noWords, (id) => f.db.run("UPDATE entries SET server_version = '100' WHERE id = ?", id), false],
    ['a no-words recording whose upload was sent (sent_at set)', noWords, (id) => outbox(id, ', sent_at', ", '2026-10-03T09:00:00.000Z'"), false],
    ['a no-words recording with an upload attempted (attempts above 0)', noWords, (id) => outbox(id, ', attempts', ', 1'), false],
    ['a deleted no-words recording', noWords, (id) => entries.tombstone(f.ctx, id), false],
    ['a deleted letter that was waiting', { rawTranscript: '', finalText: '', transcriptStatus: 'waiting' }, (id) => entries.tombstone(f.ctx, id), false],
    ['a letter with words', {}, () => {}, false],
    ['a letter that already took typed words (waiting for review)', noWords, (id) => entries.setTypedWordsOnce(f.ctx, id, 'first'), false],
    ['raw words with nothing kept', { rawTranscript: 'um', finalText: '', transcriptStatus: null }, () => {}, false],
    ['a quiet-day mark with no words', { ...noWords, kind: 'not_much', captureMode: 'typed' }, () => {}, false],
  ];

  it.each(cases)('%s', (_name, over, prepare, expected) => {
    const id = '0199a5b0-0000-7000-8000-0000000000aa';
    entries.upsert(f.ctx, letter({ id, ...over }), defaults);
    prepare(id);
    const offered = entries.canTypeWords(f.ctx, id);
    expect(offered).toBe(expected);
    // The write answers the same: a check that says yes is a write that lands, and a no is a write that is refused, untouched.
    const before = rawRow(f.db, id);
    expect(entries.setTypedWordsOnce(f.ctx, id, 'You hummed the bath song.')).toBe(offered);
    if (!offered) expect(rawRow(f.db, id)).toEqual(before);
  });

  it('a letter that is not there is not offered, and not written', () => {
    expect(entries.canTypeWords(f.ctx, 'no-such-letter')).toBe(false);
    expect(entries.setTypedWordsOnce(f.ctx, 'no-such-letter', 'words')).toBe(false);
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
