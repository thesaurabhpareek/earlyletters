/// <reference types="node" />
/**
 * Read together's guards against quiet-day marks (D-084) and letters without
 * words: what the screen may read aloud, what the Book lists, and the wiring
 * that keeps the screen behind those guards (a source scan, so a refactor that
 * drops the guard is noticed). Fictional Asha family only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION } from '@scribe/core';
import { letterWords } from '../src/components/book/letter-words.logic';
import { isLetterLike, isQuietMark, markOn, newQuietMark, readableInBook, showsSignature, visibleInBook } from '../src/components/book/quiet-day.logic';
import type { Entry } from '../src/lib/store';

const SRC = join(__dirname, '..', 'src');
const src = (f: string) => readFileSync(join(SRC, f), 'utf8');

const base = { capturedAt: '2026-10-03T19:00:00.000Z', captureMode: 'spoken', editLevel: 'clean', promptKey: null, engineVersion: 3, machineEdits: [], soundsLikeMe: null } as const;
const letter = (id: string, occurredOn: string, extra: Partial<Entry> = {}): Entry =>
  ({ ...base, id, kind: 'letter', occurredOn, rawTranscript: 'Asha laughed.', finalText: 'Asha laughed.', inBook: true, ...extra }) as Entry;
const SENTENCE = 'Tuesday. Not much today. Just Asha, and us, and an ordinary day.';
const oldMark = (id: string, occurredOn: string, extra: Partial<Entry> = {}): Entry =>
  letter(id, occurredOn, { kind: 'not_much', captureMode: 'typed', editLevel: 'verbatim', rawTranscript: SENTENCE, finalText: SENTENCE, inBook: false, ...extra });

describe('readableInBook: what Read together may play and read', () => {
  const cases: Array<[string, Entry, boolean]> = [
    ['a letter in the book with words', letter('a', '2026-10-01'), true],
    ['a note in the book with words', letter('b', '2026-10-01', { kind: 'note' }), true],
    ['a typed letter in the book', letter('c', '2026-10-01', { captureMode: 'typed', audioUri: null }), true],
    ['a private letter', letter('d', '2026-10-01', { inBook: false }), false],
    ['a letter still waiting for its words', letter('e', '2026-10-01', { transcriptStatus: 'waiting', finalText: '', rawTranscript: '' }), false],
    ['a new quiet-day mark', newQuietMark({ id: 'f', occurredOn: '2026-10-01', capturedAt: base.capturedAt }), false],
    ['an old mark holding the template sentence', oldMark('g', '2026-10-01'), false],
    ['an old mark an old build moved into the book', oldMark('h', '2026-10-01', { inBook: true }), false],
    ['a spoken letter where nobody spoke (empty words) in the book', letter('i', '2026-10-01', { finalText: '', rawTranscript: '' }), true],
  ];

  it.each(cases)('%s', (_name, e, readable) => {
    expect(readableInBook([e]).length === 1).toBe(readable);
  });

  it('keeps the order it was given and never invents an entry', () => {
    const all = cases.map(([, e]) => e);
    expect(readableInBook(all).map((e) => e.id)).toEqual(['a', 'b', 'c', 'i']);
    expect(readableInBook([])).toEqual([]);
  });

  it('[D-084] a mark is never passed on to the signature line: the guard drops it before showsSignature could be asked', () => {
    // On its own a typed mark would read as "words" (typed, empty); the screen must never get that far.
    for (const m of [oldMark('m', '2026-10-01', { inBook: true }), newQuietMark({ id: 'n', occurredOn: '2026-10-01', capturedAt: base.capturedAt })]) {
      expect(readableInBook([m])).toEqual([]);
      expect(isLetterLike(m)).toBe(false);
      expect(isQuietMark(m)).toBe(true);
    }
    expect(showsSignature(letterWords(letter('w', '2026-10-01', { transcriptStatus: 'waiting', finalText: '' })))).toBe(false);
    expect(showsSignature(letterWords(letter('s', '2026-10-01', { finalText: '' })))).toBe(false);
    expect(showsSignature(letterWords(letter('l', '2026-10-01')))).toBe(true);
  });
});

describe('visibleInBook and markOn', () => {
  it('two marks on one day with no letter are both listed; one letter on that day hides both', () => {
    const marks = [oldMark('q1', '2026-10-02'), newQuietMark({ id: 'q2', occurredOn: '2026-10-02', capturedAt: base.capturedAt })];
    expect(visibleInBook(marks).map((e) => e.id)).toEqual(['q1', 'q2']);
    expect(visibleInBook([...marks, letter('l', '2026-10-02')]).map((e) => e.id)).toEqual(['l']);
  });

  it('a note counts as words on its day; a waiting letter and a private letter do too (the day has an entry)', () => {
    expect(visibleInBook([oldMark('q', '2026-10-02'), letter('n', '2026-10-02', { kind: 'note' })]).map((e) => e.id)).toEqual(['n']);
    expect(visibleInBook([oldMark('q', '2026-10-02'), letter('w', '2026-10-02', { transcriptStatus: 'waiting', finalText: '' })]).map((e) => e.id)).toEqual(['w']);
    expect(visibleInBook([oldMark('q', '2026-10-02'), letter('p', '2026-10-02', { inBook: false })]).map((e) => e.id)).toEqual(['p']);
  });

  it('markOn finds the first mark of that day only and ignores the text an old row holds', () => {
    const entries = [letter('l', '2026-10-03'), oldMark('q1', '2026-10-03'), newQuietMark({ id: 'q2', occurredOn: '2026-10-03', capturedAt: base.capturedAt })];
    expect(markOn(entries, '2026-10-03')?.id).toBe('q1');
    expect(markOn(entries, '2026-10-03T19:00:00Z')).toBeNull(); // the day is compared as stored, a plain date
    expect(markOn([], '2026-10-03')).toBeNull();
  });

  it('newQuietMark uses the current engine version and carries nothing a screen could mistake for words', () => {
    const m = newQuietMark({ id: 'm', occurredOn: '2026-10-03', capturedAt: base.capturedAt });
    expect(m.engineVersion).toBe(ENGINE_VERSION);
    expect(letterWords(m)).toBe('words'); // typed and empty: exactly why every screen must check the kind first
    expect(isQuietMark(m)).toBe(true);
    expect(Object.keys(m).sort()).toEqual(['captureMode', 'capturedAt', 'editLevel', 'engineVersion', 'finalText', 'id', 'inBook', 'kind', 'machineEdits', 'occurredOn', 'promptKey', 'rawTranscript', 'soundsLikeMe']);
  });
});

describe('wiring (source scan)', () => {
  it('[D-084] the Read together screen takes its letters through readableInBook and its signature line through showsSignature', () => {
    const screen = src('app/read-together.tsx');
    expect(screen).toMatch(/readableInBook\(listEntriesForChild\(/);
    expect(screen).toMatch(/\bshowsSignature\(/);
    expect(screen).not.toMatch(/listEntriesForChild\([^)]*\)\.filter\(/);
  });

  it('[D-084] the Book lists through the same module (chapters.ts imports the quiet-day guards)', () => {
    expect(src('components/book/chapters.ts')).toMatch(/from '\.\/quiet-day\.logic'/);
  });
});
