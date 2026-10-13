/// <reference types="node" />
/**
 * Quiet-day marks in the Book and the store (D-084): chapters and counts ignore them, a mark on a day
 * with a letter is hidden, a chapter of only marks has no count line, a new mark is saved with no
 * words, and nothing can move a mark into the book. Fictional family "Asha" only.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// child-store reads the native store; the signature rule it provides is the only part used here.
vi.mock('@/components/child/child-store', () => ({ authorOf: (e: { authorSignsAs?: string }, c: { signsAs: string }) => e.authorSignsAs ?? c.signsAs }));

import { countLine, groupChapters } from '../src/components/book/chapters';
import { markOn, newQuietMark } from '../src/components/book/quiet-day.logic';
import * as entries from '../src/lib/db/repos/entries';
import type { Child, Entry } from '../src/lib/store';
import { fixture, seedChild, type Fixture } from './helpers/store-fixture';

const ASHA: Child = { id: 'child-asha', name: 'Asha', birthday: '2026-03-08', dueDate: null, signsAs: 'Mama', remindersOn: true, familyCanRead: false };
const SENTENCE = 'Tuesday. Not much today. Just Asha, and us, and an ordinary day.';
const base = { capturedAt: '2026-10-03T19:00:00.000Z', captureMode: 'typed', editLevel: 'verbatim', promptKey: null, engineVersion: 3, machineEdits: [], soundsLikeMe: null } as const;
const letter = (id: string, occurredOn: string, extra: Partial<Entry> = {}): Entry =>
  ({ ...base, id, kind: 'letter', occurredOn, rawTranscript: 'Asha laughed.', finalText: 'Asha laughed.', inBook: true, ...extra }) as Entry;
const oldMark = (id: string, occurredOn: string): Entry =>
  letter(id, occurredOn, { kind: 'not_much', rawTranscript: SENTENCE, finalText: SENTENCE, inBook: false });

describe('Book chapters and quiet days', () => {
  it('counts and the From line ignore marks, old or new', () => {
    expect(countLine([letter('l1', '2026-10-03'), oldMark('q1', '2026-10-02'), newQuietMark({ id: 'q2', occurredOn: '2026-10-01', capturedAt: base.capturedAt })])).toBe('1 letter');
    const [ch] = groupChapters([letter('l1', '2026-10-03', { authorSignsAs: 'Papa' }), oldMark('q1', '2026-10-02')], ASHA);
    expect(ch.fromLine).toBe('From Papa');
    expect(ch.countLine).toBe('1 letter');
    expect(ch.data.map((e) => e.id)).toEqual(['l1', 'q1']);
  });

  it('a chapter made only of quiet days has no count line and no From line', () => {
    const chapters = groupChapters([oldMark('q1', '2026-10-02'), oldMark('q2', '2026-10-01')], ASHA);
    expect(chapters).toHaveLength(1);
    expect(chapters[0]).toMatchObject({ countLine: '', fromLine: '' });
    expect(chapters[0].data).toHaveLength(2);
    expect(countLine([oldMark('q1', '2026-10-02')])).toBe('');
  });

  it('a mark on a day that has a letter is not listed, and the letter still counts once', () => {
    const [ch] = groupChapters([letter('l1', '2026-10-03'), oldMark('q1', '2026-10-03')], ASHA);
    expect(ch.data.map((e) => e.id)).toEqual(['l1']);
    expect(ch.countLine).toBe('1 letter');
  });
});

describe('saving a quiet day', () => {
  let f: Fixture;
  beforeEach(() => {
    f = fixture();
    seedChild(f.db, ASHA.id);
  });
  const defaults = { childId: ASHA.id, authorSignsAs: 'Mama' };
  const raw = (id: string) => f.db.get<{ kind: string; raw_transcript: string; final_text: string; in_book: number }>('SELECT kind, raw_transcript, final_text, in_book FROM entries WHERE id = ?', id)!;

  it('stores a mark with empty words, and a second tap the same day finds it and adds nothing', () => {
    entries.upsert(f.ctx, newQuietMark({ id: 'q1', occurredOn: '2026-10-03', capturedAt: base.capturedAt }), defaults);
    expect(raw('q1')).toEqual({ kind: 'not_much', raw_transcript: '', final_text: '', in_book: 0 });
    expect(markOn(entries.listForChild(f.ctx, ASHA.id), '2026-10-03')?.id).toBe('q1');
    expect(markOn(entries.listForChild(f.ctx, ASHA.id), '2026-10-04')).toBeNull();
  });

  it('a mark can never be moved into the book, even by a direct call; a letter still can', () => {
    entries.upsert(f.ctx, newQuietMark({ id: 'q1', occurredOn: '2026-10-03', capturedAt: base.capturedAt }), defaults);
    entries.upsert(f.ctx, oldMark('q2', '2026-10-02'), defaults);
    entries.upsert(f.ctx, letter('l1', '2026-10-01', { inBook: false }), defaults);
    expect(entries.setInBook(f.ctx, 'q1', true)).toBe(false);
    expect(entries.setInBook(f.ctx, 'q2', true)).toBe(false);
    expect(raw('q1').in_book).toBe(0);
    expect(raw('q2').in_book).toBe(0);
    expect(entries.setInBook(f.ctx, 'l1', true)).toBe(true);
    expect(raw('l1').in_book).toBe(1);
  });
});
