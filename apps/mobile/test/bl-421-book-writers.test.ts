/// <reference types="node" />
/**
 * [BL-421] Who counts as a writer of a book, for the Book's cards (J09-03): distinct authors of the book's live
 * letters, read in one SQL count on a real migrated store. A row with no author is this phone's user's, a renamed
 * signature is the same person, a quiet-day mark is not a letter, and a deleted letter no longer counts. Then the
 * card's rule (`cardShowsSignature`) and its VoiceOver label, which keeps the writer either way.
 * Fictional family Asha only: Mama and Papa.
 */
import { describe, expect, it } from 'vitest';
import { en } from '@scribe/content';
import { entries } from '../src/lib/db/repos';
import type { SqlDb } from '../src/lib/db/sql';
import { cardLabel, cardShowsSignature } from '../src/components/book/letter-card.logic';
import { fixture, insertBook, letter, type Fixture } from './helpers/store-fixture';

const ASHA = 'child-asha';
const NIA = 'child-nia';
const MAMA = 'profile-mama';
const PAPA = 'profile-papa';
const id = (i: number) => `0199a5b0-0000-7000-8000-${i.toString(16).padStart(12, '0')}`;

function book(): Fixture {
  const f = fixture();
  insertBook(f.db, { id: ASHA, name: 'Asha' });
  insertBook(f.db, { id: NIA, name: 'Nia' });
  return f;
}

/** Writes a row as sync or an older build left it: the author column set directly (upsert keeps it as given). */
function put(f: Fixture, i: number, over: { childId?: string; authorId?: string | null; signsAs?: string; kind?: 'letter' | 'not_much' }) {
  entries.upsert(
    f.ctx,
    letter({ id: id(i), childId: over.childId ?? ASHA, kind: over.kind ?? 'letter', authorSignsAs: over.signsAs ?? 'Mama', occurredOn: `2026-10-${String(1 + i).padStart(2, '0')}` }),
    { childId: over.childId ?? ASHA, authorSignsAs: over.signsAs ?? 'Mama' },
  );
  f.db.run('UPDATE entries SET author_id = ? WHERE id = ?', over.authorId ?? null, id(i));
}

function recorded(f: Fixture): { ctx: Fixture['ctx']; sql: string[] } {
  const sql: string[] = [];
  const spy = (fn: string) => (q: string, ...p: never[]) => {
    sql.push(q);
    return (f.db as unknown as Record<string, (...a: unknown[]) => unknown>)[fn](q, ...p);
  };
  return { ctx: { ...f.ctx, db: { ...f.db, all: spy('all'), get: spy('get'), run: spy('run') } as unknown as SqlDb }, sql };
}

describe('[BL-421] a book has more than one writer only when two people wrote its letters', () => {
  it('[BL-421] a one-writer book counts one: letters from before the first sign-in (no author) and after it (the owner) are the same person', () => {
    const f = book();
    put(f, 0, { authorId: null });
    put(f, 1, { authorId: MAMA });
    put(f, 2, { authorId: MAMA, signsAs: 'Mum' }); // renamed later: still Mama
    expect(entries.countWriters(f.ctx, ASHA, MAMA)).toBe(1);
    // Signed out on a phone that never signed in: every row is this phone's user's.
    const g = book();
    put(g, 0, { authorId: null });
    put(g, 1, { authorId: null });
    expect(entries.countWriters(g.ctx, ASHA, null)).toBe(1);
  });

  it("[BL-421] the other parent's letter makes two writers, whoever signs as what", () => {
    const f = book();
    put(f, 0, { authorId: null });
    put(f, 1, { authorId: PAPA, signsAs: 'Mama' }); // the same sign-off, a different person
    expect(entries.countWriters(f.ctx, ASHA, MAMA)).toBe(2);
  });

  it("[BL-421] a quiet-day mark, a deleted letter and another book's letters never make a second writer", () => {
    const f = book();
    put(f, 0, { authorId: MAMA });
    put(f, 1, { authorId: PAPA, kind: 'not_much' });
    put(f, 2, { authorId: PAPA });
    entries.tombstone(f.ctx, id(2));
    put(f, 3, { authorId: PAPA, childId: NIA });
    expect(entries.countWriters(f.ctx, ASHA, MAMA)).toBe(1);
    expect(entries.countWriters(f.ctx, NIA, MAMA)).toBe(1);
  });

  it('[BL-421] an empty book has no writers, and the count is one SQL statement that loads no letter', () => {
    const f = book();
    expect(entries.countWriters(f.ctx, ASHA, MAMA)).toBe(0);
    put(f, 0, { authorId: PAPA });
    const { ctx, sql } = recorded(f);
    entries.countWriters(ctx, ASHA, MAMA);
    expect(sql).toHaveLength(1);
    expect(sql[0]).toMatch(/count\(DISTINCT/);
    expect(sql[0]).not.toMatch(/final_text|raw_transcript|machine_edits/);
  });
});

describe('[BL-421] the card draws the signature only in a shared book; VoiceOver hears it either way', () => {
  it('[BL-421] signed letter: drawn with two writers, not with one; a letter with no words is never signed (D-084)', () => {
    expect(cardShowsSignature({ signed: true, shared: true })).toBe(true);
    expect(cardShowsSignature({ signed: true, shared: false })).toBe(false);
    expect(cardShowsSignature({ signed: false, shared: true })).toBe(false);
  });

  it('[BL-421] the label still opens with "From Mama" (the existing book.signature line), shared or not', () => {
    const label = cardLabel({
      signature: 'From Mama',
      dateline: 'Tuesday, October 14, 2026, Asha is 7 months old',
      text: 'Asha laughed at the dog',
      inBook: true,
      privateLabel: en.book.privateLabel,
      audioUri: null,
      recordingOnPhone: en.book.recordingOnPhone,
    });
    expect(label).toBe('From Mama. Tuesday, October 14, 2026, Asha is 7 months old. Asha laughed at the dog');
  });
});
