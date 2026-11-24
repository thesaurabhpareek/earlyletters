// BL-444 slice 2 (D-113): the words for "Letters to {child}", the page of a book this phone has left.
// rules.test.ts reads every registered feature; these add the rules that belong to this page: the child is always
// {child}, no line promises what a later slice builds (export, delete) or a freshness a left book does not have, and
// no fear, guilt or loss word.
import { describe, expect, it } from 'vitest';
import { features } from '../src/features';
import { leftBookCopy } from '../src/features/left-book.en';

function leaves(o: unknown, path = 'leftBook'): { path: string; text: string }[] {
  if (typeof o === 'string') return [{ path, text: o }];
  if (o && typeof o === 'object') return Object.entries(o).flatMap(([k, v]) => leaves(v, `${path}.${k}`));
  return [];
}
const ALL = leaves(leftBookCopy);

describe('[BL-444] left book copy', () => {
  it('is registered with the other features, so the general rules test reads it', () => {
    expect(features.leftBook).toBe(leftBookCopy);
  });

  it('is plain ASCII, with no "we" and no AI claim', () => {
    for (const l of ALL) {
      expect(l.text, l.path).not.toMatch(/[^\x20-\x7e]/);
      expect(l.text, l.path).not.toMatch(/\b(we|our|ai|assistant)\b/i);
    }
  });

  it('names the child with {child} only, never a gendered word', () => {
    expect(leftBookCopy.title).toBe('Letters to {child}');
    for (const l of ALL) expect(l.text, l.path).not.toMatch(/\b(he|she|his|her|him|baby)\b/i);
    expect(ALL.filter((l) => l.text.includes('{child}')).map((l) => l.path)).toEqual(expect.arrayContaining(['leftBook.title', 'leftBook.lead', 'leftBook.rowHint']));
  });

  it('uses only placeholders the screen fills', () => {
    for (const l of ALL) for (const m of l.text.matchAll(/\{(\w+)\}/g)) expect(m[1], l.path).toBe('child');
  });

  it('promises no export, delete or erase (later slices), no freshness, and no loss, fear or guilt words', () => {
    for (const l of ALL) {
      expect(l.text, l.path).not.toMatch(/\b(export|delete|erase|remove|download|share|sync|synced|latest|up to date|always|forever|safe|backed up|lost|gone|miss|missing|sorry|forgot)\b/i);
    }
  });

  it('[BL-1960] the lead names what is on the page and makes no storage promise (DATA-REQ-016: a left book\'s letters can be deleted and erased here)', () => {
    expect(leftBookCopy.lead).toBe("The letters you wrote in {child}'s book.");
    expect(leftBookCopy.lead).not.toMatch(/\b(kept|keep|keeps|stay|stays|saved|here|phone)\b/i);
  });

  it('says nothing about numbers or counts', () => {
    for (const l of ALL) expect(l.text, l.path).not.toMatch(/\d|\{(n|count|total)\}/);
  });

  it('has a calm line for a book with nothing to show, and it is not a question or an ask', () => {
    expect(leftBookCopy.empty.length).toBeGreaterThan(0);
    expect(leftBookCopy.empty).not.toMatch(/[?!]/);
  });
});
