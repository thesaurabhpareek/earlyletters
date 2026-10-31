/// <reference types="node" />
/**
 * The M17 ledger query (D-103, drafted as D-092 in PR #128; F14-REQ-036,
 * F14-REQ-037) through the store facade: a letter counts toward the free letters
 * only when it is this person's own, its words exist, and the author kept it with
 * the words on screen. The other parent's synced letters never count and never
 * raise the count. The ledger never decreases. The gate's decision and copy stay
 * with S06 (lib/billing); this file proves the store side. Fictional family "Asha" only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Edit } from '@scribe/core';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const { takeOwnership } = await import('../src/lib/sync/ownership');

const MAMA = '11111111-1111-1111-1111-111111111111';
const PAPA = '22222222-2222-2222-2222-222222222222';
let close: () => void = () => {};
let seq = 0;
const now = () => '2026-10-03T09:00:00.000Z';
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
let raw: ReturnType<typeof nodeDb>['db'];

beforeEach(() => {
  store.closeStore();
  const h = nodeDb();
  raw = h.db;
  close = h.close;
  expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now, newId }).ok).toBe(true);
});
afterEach(() => {
  store.closeStore();
  close();
});

const counts = () => store.ledgerDb().counts();
function asha(): string {
  return store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
}
function keepTyped(childId: string, text = 'Asha, you laughed at the rain today.'): string {
  const d = store.createDraft({ childId, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: text });
  store.saveLetterFromDraft(d.id, {
    id: d.id, kind: 'letter', occurredOn: '2026-10-03', capturedAt: now(), captureMode: 'typed', editLevel: 'verbatim', promptKey: null,
    engineVersion: 5, rawTranscript: text, machineEdits: [], finalText: text, inBook: true, soundsLikeMe: null, childId, authorSignsAs: 'Mama', audioUri: null,
  });
  return d.id;
}
function keepVoiceOnly(childId: string): string {
  const d = store.createDraft({ childId, captureMode: 'spoken', promptKey: null, audioUri: 'file:///Documents/r.m4a', audioDurationMs: 9000 });
  store.saveVoiceOnlyFromDraft({ ...d, audioSha256: 'a'.repeat(64), audioBytes: 12000 }, { childId, authorSignsAs: 'Mama', inBook: false, engineVersion: 5 });
  return d.id;
}
/** A letter by another author, as a pull writes it (merge.ts mergeOtherRow). */
function pulledFromPapa(childId: string, text: string): string {
  const id = newId();
  raw.run(
    `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits,
       final_text, in_book, updated_at, child_id, author_id, server_version, sync_state) VALUES (?, 'letter', '2026-10-01', ?, 'typed', 'verbatim', 5, '', '[]', ?, 1, ?, ?, ?, '9', 'synced')`,
    id, now(), text, now(), childId, PAPA,
  );
  return id;
}
const words = { rawTranscript: 'um Asha you sang', machineEdits: [] as Edit[], finalText: 'Asha, you sang.', editLevel: 'clean' as const, engineVersion: 5 };

describe('[F14-REQ-036] own letters only', () => {
  it('joining a book with 30 of the other parent\'s letters: my first own letter is free letter 1, and 10 more of theirs change nothing', () => {
    const c = asha();
    takeOwnership(raw, MAMA, { now: now(), newId });
    for (let i = 0; i < 30; i++) pulledFromPapa(c, `Papa's letter ${i}.`);
    expect(counts()).toEqual({ recorded: 0, present: 0 });
    keepTyped(c);
    expect(counts()).toEqual({ recorded: 1, present: 1 });
    for (let i = 0; i < 10; i++) pulledFromPapa(c, `Papa's later letter ${i}.`);
    expect(counts()).toEqual({ recorded: 1, present: 1 });
  });

  it('letters made before any account count once they belong to it, and still count after the first sign-in', () => {
    const c = asha();
    keepTyped(c);
    keepTyped(c, 'Two teeth.');
    expect(counts()).toEqual({ recorded: 2, present: 2 });
    takeOwnership(raw, MAMA, { now: now(), newId });
    expect(counts()).toEqual({ recorded: 2, present: 2 });
  });
});

describe('[F14-REQ-037] words seen: a letter counts at the save where its words are on screen', () => {
  it('voice-only letters never count; words typed for them on the letter page wait for review and count only when kept from Review (#53)', () => {
    const c = asha();
    const v1 = keepVoiceOnly(c);
    const v2 = keepVoiceOnly(c);
    keepVoiceOnly(c);
    expect(counts()).toEqual({ recorded: 0, present: 0 });
    expect(store.setTypedWordsForWaitingEntry(v1, 'You babbled to the cat.')).toBe(true);
    expect(store.setTypedWordsForWaitingEntry(v2, 'You laughed in your sleep.')).toBe(true);
    // The words are the letters' at once (never lost), but the letter page counts nothing (F14 6.1 :129).
    expect(store.getEntry(v1)).toMatchObject({ finalText: 'You babbled to the cat.', wordsUnreviewed: true });
    expect(counts()).toEqual({ recorded: 0, present: 0 });
    expect(store.setTypedWordsForWaitingEntry(v1, 'again')).toBe(false); // once
    // Review's Keep for each letter is the counting moment.
    expect(store.keepReviewedWords(v1, true)).toBe(true);
    expect(store.keepReviewedWords(v2, false)).toBe(true);
    expect(counts()).toEqual({ recorded: 2, present: 2 });
    expect([store.getEntry(v1)?.inBook, store.getEntry(v2)?.inBook]).toEqual([true, false]);
  });

  it('[S28] a spoken letter whose words came back empty takes typed words once, unless the server already has it (P5 #222)', () => {
    const c = asha();
    const v = keepVoiceOnly(c);
    const w = keepVoiceOnly(c);
    // The transcription finished with no words: no longer waiting, raw and words still empty.
    raw.run("UPDATE entries SET transcript_status = NULL WHERE id IN (?, ?)", v, w);
    raw.run("UPDATE entries SET server_version = '100' WHERE id = ?", w); // the server has this one: its raw is fixed there
    // The letter page offers "Write the words" only where the write can happen (P5 critics' pass S3): the same rows.
    expect(store.canTypeWordsFor(v)).toBe(true);
    expect(store.canTypeWordsFor(w)).toBe(false);
    expect(store.canTypeWordsFor('no-such-letter')).toBe(false);
    expect(store.setTypedWordsForWaitingEntry(v, 'You hummed the bath song.')).toBe(true);
    expect(store.canTypeWordsFor(v)).toBe(false); // it has words now
    expect(store.getEntry(v)).toMatchObject({ rawTranscript: 'You hummed the bath song.', finalText: 'You hummed the bath song.', captureMode: 'mixed' });
    expect(store.setTypedWordsForWaitingEntry(v, 'again')).toBe(false); // once
    expect(store.setTypedWordsForWaitingEntry(w, 'Not this one.')).toBe(false);
    expect(counts()).toEqual({ recorded: 0, present: 0 }); // counted at Review's Keep, not on the letter page (#53)
    expect(store.keepReviewedWords(v)).toBe(true);
    expect(counts()).toEqual({ recorded: 1, present: 1 });
  });

  it('words the machine wrote later count only when the author keeps them from Review', () => {
    const c = asha();
    const v = keepVoiceOnly(c);
    expect(store.setWordsForWaitingEntry(v, words)).toBe(true);
    expect(store.getEntry(v)).toMatchObject({ finalText: 'Asha, you sang.', transcriptStatus: null, wordsUnreviewed: true });
    expect(store.listWordsToReview(c).map((e) => e.id)).toEqual([v]);
    expect(counts()).toEqual({ recorded: 0, present: 0 });
    expect(store.keepReviewedWords(v)).toBe(true);
    expect(store.getEntry(v)?.wordsUnreviewed).toBe(false);
    expect(counts()).toEqual({ recorded: 1, present: 1 });
    expect(store.keepReviewedWords(v)).toBe(false); // idempotent
    expect(counts().recorded).toBe(1);
  });

  it('a letter of marks only never counts, before or at the allowance; letters with words still do (#268)', () => {
    const c = asha();
    keepTyped(c, '...');
    keepTyped(c, '?!');
    expect(counts()).toEqual({ recorded: 0, present: 0 });
    keepTyped(c, 'You waved at the moon.');
    keepTyped(c, 'Two teeth.');
    expect(counts()).toEqual({ recorded: 2, present: 2 });
    keepTyped(c, '...'); // at the allowance: still 2, in the mirror and in letters present
    expect(counts()).toEqual({ recorded: 2, present: 2 });
  });

  it('a spoken letter with no words at all (nobody spoke) and a quiet-day mark never count', () => {
    const c = asha();
    const d = store.createDraft({ childId: c, captureMode: 'spoken', promptKey: null, audioUri: null, audioDurationMs: 4000 });
    store.saveLetterFromDraft(d.id, {
      id: d.id, kind: 'letter', occurredOn: '2026-10-03', capturedAt: now(), captureMode: 'spoken', editLevel: 'clean', promptKey: null,
      engineVersion: 5, rawTranscript: '', machineEdits: [], finalText: '', inBook: false, soundsLikeMe: null, childId: c, authorSignsAs: 'Mama', audioUri: null,
    });
    store.saveEntry({
      id: newId(), kind: 'not_much', occurredOn: '2026-10-02', capturedAt: now(), captureMode: 'typed', editLevel: 'verbatim',
      promptKey: null, engineVersion: 5, rawTranscript: '', machineEdits: [], finalText: '', inBook: false, soundsLikeMe: null, childId: c,
    });
    expect(counts()).toEqual({ recorded: 0, present: 0 });
  });
});

describe('[F14-REQ-023] the ledger never decreases', () => {
  it('deleting, restoring and editing never lower or raise the count', () => {
    const c = asha();
    const id = keepTyped(c);
    store.deleteEntry(id);
    expect(counts()).toEqual({ recorded: 1, present: 1 }); // the delete window still counts
    store.undeleteEntry(id);
    store.setEntryInBook(id, false);
    expect(counts()).toEqual({ recorded: 1, present: 1 });
  });
});
