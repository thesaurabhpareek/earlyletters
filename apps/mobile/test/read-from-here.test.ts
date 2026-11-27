/// <reference types="node" />
/**
 * Read from here (BL-1792, spec docs/design/specs/13-READ-A-YEAR-TOGETHER-23nov.md section 5, RYT-06 to RYT-11).
 * There is no screen renderer for the letter page or Read together in this repo's tests, so behaviour is proved on the
 * pure logic (read-from-here.logic.ts) and the wiring and layout facts by source-text pins, named as such. The Months
 * sheet's rendered rows are in test/component/read-from-here-months-sheet.test.tsx. Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readableInBook } from '../src/components/book/quiet-day.logic';
import { monthStart, monthStarts, readTogetherPlan, readsFromLetter } from '../src/components/book/read-from-here.logic';
import type { Child, Entry } from '../src/lib/store';
import { stripComments } from './helpers/strip-comments';

const src = (f: string) => stripComments(readFileSync(join(__dirname, '..', 'src', f), 'utf8'));

const L = (id: string, occurredOn: string, extra: Partial<Entry> = {}): Entry =>
  ({ id, kind: 'letter', occurredOn, capturedAt: `${occurredOn}T19:00:00.000Z`, captureMode: 'spoken', inBook: true, transcriptStatus: 'ready', finalText: 'Asha laughed.', rawTranscript: 'Asha laughed.', ...extra }) as unknown as Entry;
const asha = { id: 'asha', name: 'Asha', birthday: '2025-03-10' } as unknown as Child;
/** Newest first, as the store lists one book (listForChild). */
const newestFirst = (es: Entry[]) => [...es].sort((a, b) => (a.occurredOn === b.occurredOn ? (a.capturedAt < b.capturedAt ? 1 : -1) : a.occurredOn < b.occurredOn ? 1 : -1));
const book = newestFirst([L('a', '2025-01-10'), L('b', '2025-04-02'), L('c', '2025-06-20'), L('d', '2026-04-01'), L('e', '2026-05-15')]);
const ON = { yearsOn: true } as const;

describe('[RYT-06] read from a letter', () => {
  it('opens the whole book, oldest first, on the chosen letter; Back one is the letter before it', () => {
    const plan = readTogetherPlan(book, asha, { ...ON, from: 'c' });
    expect(plan.letters.map((e) => e.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(plan.letters[plan.start].id).toBe('c');
    expect(plan.letters[plan.start - 1].id).toBe('b');
  });

  it('runs past the month and the year to the end of the book; progress and "Letter n of m" count the whole book', () => {
    const plan = readTogetherPlan(book, asha, { ...ON, from: 'b' });
    expect(plan.letters.slice(plan.start).map((e) => e.id)).toEqual(['b', 'c', 'd', 'e']);
    expect(plan.letters).toHaveLength(5);
  });

  it('a year wins over `from` (the interface never sends both)', () => {
    const plan = readTogetherPlan(book, asha, { ...ON, year: 'y2', from: 'b' });
    expect(plan.letters.map((e) => e.id)).toEqual(['d', 'e']);
    expect(plan.start).toBe(0);
  });

  it('stays behind EXPO_PUBLIC_READ_THE_YEAR: with the flag off `from` is ignored and the book opens at its first letter', () => {
    const plan = readTogetherPlan(book, asha, { yearsOn: false, from: 'c' });
    expect(plan.start).toBe(0);
    expect(plan.letters.map((e) => e.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('source pins: the letter page row opens Read together with this letter, and Read together opens on plan.start', () => {
    const page = src('app/letter/[id].tsx');
    expect(page).toMatch(/router\.push\(\{ pathname: '\/read-together', params: \{ childId: child\.id, from: entry\.id \} \}\)/);
    const rt = src('app/read-together.tsx');
    expect(rt).toMatch(/useLocalSearchParams<\{ childId\?: string; year\?: string; from\?: string \}>/);
    expect(rt).toMatch(/readTogetherPlan\(readableInBook\(listEntriesForChild\(child\.id\)\), child, \{ yearsOn: readTheYearOn\(process\.env\.EXPO_PUBLIC_READ_THE_YEAR\), year, from \}\)/);
    expect(rt).toMatch(/useState\(plan\.start\)/);
    expect(rt).toMatch(/onPress=\{\(\) => go\(index - 1\)\}/);
    expect(rt).toMatch(/fill\(rt\.positionA11y, \{ n: Math\.min\(index \+ 1, letters\.length\), count: letters\.length \}\)/);
  });

  it('source pins (layout): the letter page row is the first of the list, 56 pt, with the book glyph, and shows on the other parent\'s letters too', () => {
    const page = src('app/letter/[id].tsx');
    const row = page.slice(page.indexOf('const readFromRow'), page.indexOf(') : null;', page.indexOf('const readFromRow')));
    expect(row).toMatch(/title=\{copy\.readTogether\.fromHere\}/);
    expect(row).toMatch(/leading=\{<BookOpenIcon /);
    expect(row).toMatch(/minHeight=\{tokens\.target\.primary\}/);
    expect(row).toMatch(/accessibilityHint=\{copy\.readTogether\.fromHereLetterA11y\}/);
    // First in the list; Change words (BL-413) comes next, then Make private or Move to the book.
    expect(page).toMatch(/<ListSection>\s*\{readFromRow\}\s*\{changeWords && \(/);
    expect(page).toMatch(/\{!editable && readFromRow && \(/);
    expect(src('components/ui/list-row.tsx')).toMatch(/style=\{minHeight \? \{ minHeight \} : undefined\}/);
  });
});

describe('[RYT-07] no start on an unplayable letter', () => {
  const on = { yearsOn: true, leftBook: false };
  it('offers the row only on a letter Read together can play (the readableInBook filter)', () => {
    const cases: Array<[string, Entry, boolean]> = [
      ['a letter in the book with words', L('p', '2025-05-01'), true],
      ['the other parent\'s letter in the book', L('q', '2025-05-01', { authorId: 'other' } as Partial<Entry>), true],
      ['a private letter', L('r', '2025-05-01', { inBook: false }), false],
      ['a letter waiting for its words', L('s', '2025-05-01', { transcriptStatus: 'waiting', finalText: '' }), false],
      ['a quiet-day mark', L('t', '2025-05-01', { kind: 'not_much', inBook: false }), false],
    ];
    for (const [name, e, shown] of cases) {
      expect(readsFromLetter(e, on), name).toBe(shown);
      expect(readsFromLetter(e, on), name).toBe(readableInBook([e]).length === 1);
    }
  });

  it('is absent with the flag off, and on a letter of a book this phone has left', () => {
    expect(readsFromLetter(L('p', '2025-05-01'), { yearsOn: false, leftBook: false })).toBe(false);
    expect(readsFromLetter(L('p', '2025-05-01'), { yearsOn: true, leftBook: true })).toBe(false);
  });

  it('source pin: the letter page decides by readsFromLetter behind EXPO_PUBLIC_READ_THE_YEAR, and only then draws the row', () => {
    const page = src('app/letter/[id].tsx');
    expect(page).toMatch(/const readFromRow = readsFromLetter\(entry, \{ yearsOn: readTheYearOn\(process\.env\.EXPO_PUBLIC_READ_THE_YEAR\), leftBook: readOnly \}\) \? \(/);
    expect(page.match(/copy\.readTogether\.fromHere\b/g)).toHaveLength(1);
  });
});

describe('[RYT-08] read from a month', () => {
  it("starts at the month's first playable letter by about-day, then capture time", () => {
    const month = [
      L('late', '2025-06-20', { capturedAt: '2025-06-20T21:00:00.000Z' }),
      L('early', '2025-06-20', { capturedAt: '2025-06-20T08:00:00.000Z' }),
      L('private', '2025-06-12', { inBook: false }),
      L('waiting', '2025-06-11', { transcriptStatus: 'waiting' }),
      L('mark', '2025-06-10', { kind: 'not_much' }),
      L('later', '2025-06-25'),
    ];
    expect(monthStart(month)).toBe('early');
  });

  it('gives a month with no playable letter no start (no control), and each other month its own', () => {
    expect(monthStart([L('private', '2025-06-12', { inBook: false }), L('waiting', '2025-06-11', { transcriptStatus: 'waiting' })])).toBeNull();
    // Chapters as the Book holds them (chapters.ts loads React Native, so they are written out here): newest first.
    const chapters = [
      { key: 'm14', data: [book[0]] },
      { key: 'm12', data: [book[1]] },
      { key: 'm5', data: [L('hidden', '2025-08-20', { inBook: false })] },
      { key: 'm3', data: [book[2]] },
      { key: 'm0', data: [book[3]] },
      { key: 'before', data: [book[4]] },
    ];
    const starts = monthStarts(chapters);
    expect([...starts]).toEqual([['m14', 'e'], ['m12', 'd'], ['m3', 'c'], ['m0', 'b'], ['before', 'a']]);
    expect(starts.has('m5')).toBe(false);
    // The start letter is one Read together lists, so it opens there.
    for (const id of starts.values()) {
      const plan = readTogetherPlan(book, asha, { ...ON, from: id });
      expect(plan.letters[plan.start].id).toBe(id);
    }
  });

  it('source pins: the Book passes the starts behind the flag and opens Read together at the month; the row body still goes to the month', () => {
    const b = src('app/(tabs)/book.tsx');
    expect(b).toMatch(/const starts = useMemo\(\(\) => \(readTheYearOn\(process\.env\.EXPO_PUBLIC_READ_THE_YEAR\) \? monthStarts\(chapters\) : undefined\), \[chapters\]\);/);
    expect(b).toMatch(/onChoose=\{jumpTo\}/);
    expect(b).toMatch(/starts=\{starts\} onReadFrom=\{\(from\) => \{ setMonthsOpen\(false\); router\.push\(\{ pathname: '\/read-together', params: \{ childId: active\.id, from \} \}\); \}\}/);
    expect(src('components/book/months-sheet.tsx')).toMatch(/onPress=\{\(\) => onChoose\(row\)\}/);
  });
});

describe('[RYT-09] stale start falls back to the first letter', () => {
  it.each([
    ['deleted (no longer listed)', book.filter((e) => e.id !== 'c')],
    ['made private', book.map((e) => (e.id === 'c' ? { ...e, inBook: false } : e))],
    ['words waiting', book.map((e) => (e.id === 'c' ? { ...e, transcriptStatus: 'waiting' } : e)) as Entry[]],
  ])('a `from` that is %s opens on the first letter', (_name, entries) => {
    const plan = readTogetherPlan(entries, asha, { ...ON, from: 'c' });
    expect(plan.start).toBe(0);
    expect(plan.letters[0].id).toBe('a');
    expect(plan.letters.map((e) => e.id)).not.toContain('c');
  });

  it('source pin: Read together says nothing about it (no toast, note or announcement keyed to `from`)', () => {
    const rt = src('app/read-together.tsx');
    expect(rt).not.toMatch(/\bfrom\b[^\n]*(toast|announce|AppNote|StateScreen)/);
    expect(rt).not.toMatch(/useToast/);
  });
});

describe('[RYT-10] action only for VoiceOver, 44 pt control for touch', () => {
  const sheet = src('components/book/months-sheet.tsx');
  it('source pins: the row carries the "Read from here" VoiceOver action, and the visible control is hidden from VoiceOver', () => {
    expect(sheet).toMatch(/accessibilityActions=\{from \? \[\{ name: READ_FROM_HERE_ACTION, label: copy\.readTogether\.fromHere \}\] : undefined\}/);
    expect(sheet).toMatch(/e\.nativeEvent\.actionName === READ_FROM_HERE_ACTION && onReadFrom\?\.\(from\)/);
    expect(sheet).toMatch(/<View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden/);
    const lr = src('components/ui/list-row.tsx');
    expect(lr).toMatch(/accessibilityActions=\{accessibilityActions\}\s+onAccessibilityAction=\{onAccessibilityAction\}/);
  });

  it('source pins (layout): 44 pt control (Button sm), 8 pt from the row with no hitSlop into the gap, under the row text and full width at accessibility sizes', () => {
    expect(sheet).toMatch(/<Button variant="quiet" size="sm" fullWidth=\{ax\}/);
    expect(src('components/ui/button.tsx')).toMatch(/sm: 'min-h-11 /);
    expect(sheet).toMatch(/className=\{ax \? 'gap-2 pb-3' : 'flex-row items-center gap-2 pr-4'\}/);
    const control = sheet.slice(sheet.indexOf('<Button variant="quiet"'), sheet.indexOf('/>', sheet.indexOf('<Button variant="quiet"')));
    expect(control).not.toMatch(/hitSlop/);
  });
});

describe('[RYT-11] free with a lapsed plan', () => {
  it('nothing that decides where reading starts reads a plan: the plan and row rules take no plan and give the same answer', () => {
    const logic = src('components/book/read-from-here.logic.ts');
    expect(logic).not.toMatch(/@\/lib\/billing|hasPlus|entitle/);
    const plan = readTogetherPlan(book, asha, { ...ON, from: 'd' });
    expect(plan.letters).toHaveLength(5);
    expect(plan.letters[plan.start].id).toBe('d');
  });

  it('source pins: the letter row, the month control and Read together open no gate; Read together reads hasPlus only for analytics', () => {
    for (const f of ['components/book/months-sheet.tsx', 'components/book/read-from-here.logic.ts']) expect(src(f), f).not.toMatch(/@\/lib\/billing|hasPlus|PlusGate|plus-gate/);
    const page = src('app/letter/[id].tsx');
    const row = page.slice(page.indexOf('const readFromRow'), page.indexOf(') : null;', page.indexOf('const readFromRow')));
    expect(row).not.toMatch(/hasPlus|plan|Plus/);
    const rt = src('app/read-together.tsx');
    expect(rt.match(/hasPlus\(\)/g)).toHaveLength(1);
    expect(rt).toMatch(/access: hasPlus\(\) \? 'plus' : 'free'/);
  });
});
