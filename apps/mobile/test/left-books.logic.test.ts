/// <reference types="node" />
/**
 * BL-444 slice 2 (D-113): "Letters to {child}", the Settings row and the page, as pure views. The screen draws these and
 * reads only listLeftBooks and listLeftBookEntries (store.ts); nothing here touches a store. Fictional family "Asha".
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { leftBookPage, leftBookRows } from '../src/components/settings/left-books.logic';
import type { Child, Entry } from '../src/lib/db/repos';
import { letter } from './helpers/store-fixture';

const asha = { id: 'c1', name: 'Asha', birthday: null, dueDate: null, signsAs: 'Mama', remindersOn: true, familyCanRead: false } as Child;
const noName = { ...asha, id: 'c2', name: '' } as Child;
const mine = { ...letter({ childId: 'c1', finalText: 'You laughed at the rain.' }), id: 'e1' } as Entry;
const mark = { ...letter({ childId: 'c1', finalText: '' }), id: 'e2', kind: 'not_much' } as Entry;

describe('[BL-444] Settings rows, one per left book', () => {
  it('no left book, no row', () => {
    expect(leftBookRows([])).toEqual([]);
  });

  it('a row reads "Letters to Asha", with a hint, and a blank name reads "your child"', () => {
    const rows = leftBookRows([asha, noName]);
    expect(rows.map((r) => r.title)).toEqual(['Letters to Asha', 'Letters to your child']);
    expect(rows[0]?.hint).toBe("Opens the letters you wrote in Asha's book.");
    expect(rows[1]?.hint).toBe("Opens the letters you wrote in your child's book.");
    expect(rows.map((r) => r.id)).toEqual(['c1', 'c2']);
  });
});

describe('[BL-444] the page', () => {
  it('lists the book\'s letters, titled for the child, with the one lead line', () => {
    const p = leftBookPage([asha], 'c1', () => [mine]);
    expect(p.title).toBe('Letters to Asha');
    expect(p.lead).toBe("You left Asha's book. The letters you wrote in it are kept on this phone.");
    expect(p.entries.map((e) => e.id)).toEqual(['e1']);
    expect(p.child).toBe(asha);
    expect(p.empty).toBeNull();
  });

  it('a quiet-day mark is not a letter and has no page, so it is not listed', () => {
    expect(leftBookPage([asha], 'c1', () => [mark, mine]).entries.map((e) => e.id)).toEqual(['e1']);
  });

  it('a book that is not in the left list (joined again, another account, an unknown id) shows the empty line and reads no letters', () => {
    let read = 0;
    const p = leftBookPage([], 'c1', () => {
      read++;
      return [mine];
    });
    expect(p).toMatchObject({ title: 'Letters', lead: null, empty: 'There are no letters to show here.', child: null, entries: [] });
    expect(read).toBe(0);
    expect(leftBookPage([asha], 'other', () => [mine]).empty).not.toBeNull();
  });

  it('a left book whose letters are all marks shows the empty line', () => {
    expect(leftBookPage([asha], 'c1', () => [mark]).empty).toBe('There are no letters to show here.');
  });

  it('a long name stays whole in the title and the lead', () => {
    const long = { ...asha, name: 'Anastasia Marguerite Wilhelmina' } as Child;
    const p = leftBookPage([long], 'c1', () => [mine]);
    expect(p.title).toBe('Letters to Anastasia Marguerite Wilhelmina');
    expect(p.lead).toContain("Anastasia Marguerite Wilhelmina's book");
  });
});

describe('[BL-444] the screens are wired as the slice says (source)', () => {
  const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');

  it('the page reads only the two store functions, and no repo or write', () => {
    const page = src('app/settings/left-book/[id].tsx');
    expect(page).toMatch(/listLeftBooks\(\), id, listLeftBookEntries/);
    expect(page).not.toMatch(/db\/repos|localSqlDb|deleteEntry|setEntry|saveEntry|exportEntries/);
  });

  it('every word on the page and the row is content\'s: no string literal in the page, the logic or the row', () => {
    const page = src('app/settings/left-book/[id].tsx').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(page).not.toMatch(/>\s*[A-Z][a-z]+[^<{]*</);
    expect(page).not.toMatch(/title:\s*'|label=\{?'|accessibilityLabel=\{?'/);
    expect(src('components/settings/left-books.logic.ts').replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/'[A-Za-z ]{6,}'/);
  });

  it('Settings shows the rows from the left list, under Children, and the page is a registered Settings screen', () => {
    expect(src('app/settings/index.tsx')).toMatch(/left: leftBookRows\(listLeftBooks\(\)\)/);
    expect(src('app/settings/index.tsx')).toMatch(/s\.left\.map/);
    expect(src('app/settings/_layout.tsx')).toMatch(/name="left-book\/\[id\]"/);
  });

  it('the letter page of a left book is read only: no action list, no date sheet, no words card, no review card', () => {
    const page = src('app/letter/[id].tsx');
    expect(page).toMatch(/const readOnly = isLeftBookLetter\(entry\);\s+const editable = own && !readOnly;/);
    expect(page).toMatch(/\{editable && \(\s+<View style=\{\{ marginHorizontal: 20 - CARD_TEXT_INSET \}\}>/);
    expect(page).toMatch(/\{editable && \(\s+<DateSheet/);
    expect(page).toMatch(/\{editable && words === 'words'/);
    expect(page).toMatch(/const wordsCard = readOnly \? null/);
  });

  it('the page honours Reduce Motion through the shared hook, and the Settings row carries the content hint', () => {
    expect(src('app/settings/left-book/[id].tsx')).toMatch(/useReducedMotion\(\)/);
    expect(src('app/settings/left-book/[id].tsx')).toMatch(/<BookRow reduced=\{reduced\}>/);
    expect(src('app/settings/index.tsx')).toMatch(/accessibilityHint=\{b\.hint\}/);
  });
});
