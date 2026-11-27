/// <reference types="node" />
/**
 * BL-2225: the Book reads one chapter of rows at a time (PRD 7.1: a chapter of 60 letters; BL-111). The store's ranged
 * read is the real repo on a migrated node:sqlite store; the pages are the Book's own (book-pages.logic.ts), and the
 * Book screen's wiring is pinned by its source, as the other Book screen tests do. Fictional family "Asha" only.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

// child-store reads the native store; the signature rule it provides is the only part chapters.ts uses.
vi.mock('@/components/child/child-store', () => ({ authorOf: (e: { authorSignsAs?: string }, c: { signsAs: string }) => e.authorSignsAs ?? c.signsAs }));

import { watchBook, type BookRead } from '../src/components/book/book.logic';
import { BOOK_PAGE, arrivalNeedsRest, createBookPages, monthsFromOutline, readPage, type RangeRead } from '../src/components/book/book-pages.logic';
import { bookChapters } from '../src/components/book/chapters';
import { monthRows, showsMonthsButton } from '../src/components/book/book-page.logic';
import { readableInBook } from '../src/components/book/quiet-day.logic';
import { entries } from '../src/lib/db/repos';
import type { Child, Entry } from '../src/lib/store';
import { fixture, insertBook, letter } from './helpers/store-fixture';

const ASHA = 'child-asha';
const NIA = 'child-nia';
const BORN = '2021-10-01';
const child = (id: string): Child => ({ id, name: 'Asha', birthday: BORN, dueDate: null, signsAs: 'Mama', remindersOn: true, familyCanRead: false });

const id = (n: number) => `0199a5b0-0000-7000-8000-${n.toString(16).padStart(12, '0')}`;
const dayOf = (i: number) => new Date(Date.UTC(2021, 10, 1) + Math.floor((i * 1826) / 1000) * 86_400_000).toISOString().slice(0, 10);

/** The 2,000-letter fixture of perf.sql.test.ts: two books of 1,000 letters over five years, with an edit list on each. */
function seeded(total = 2000) {
  const f = fixture();
  insertBook(f.db, { id: ASHA, name: 'Asha', birthday: BORN });
  insertBook(f.db, { id: NIA, name: 'Nia', birthday: BORN });
  f.db.transaction(() => {
    for (let i = 0; i < total; i++) {
      const childId = i % 2 === 0 ? ASHA : NIA;
      const n = Math.floor(i / 2);
      const edit = { type: 'filler', start: 0, end: 3, before: 'um ', after: '' };
      entries.upsert(
        f.ctx,
        letter({ id: id(i), childId, occurredOn: dayOf(n), capturedAt: `${dayOf(n)}T08:30:00.000Z`, finalText: `Asha laughed at the rain, letter ${i}.`, machineEdits: [edit] as never, inBook: true }),
        { childId, authorSignsAs: 'Mama' },
      );
    }
  });
  return f;
}

/** Every SELECT the repo sends and how many rows came back into the app. */
function spied(f: ReturnType<typeof fixture>) {
  const seen: { sql: string; rows: number }[] = [];
  const db = {
    ...f.db,
    get: <T,>(sql: string, ...p: never[]) => {
      const r = f.db.get<T>(sql, ...p);
      seen.push({ sql, rows: r ? 1 : 0 });
      return r;
    },
    all: <T,>(sql: string, ...p: never[]) => {
      const r = f.db.all<T>(sql, ...p);
      seen.push({ sql, rows: r.length });
      return r;
    },
  } as typeof f.db;
  const ctx = { ...f.ctx, db };
  const read: RangeRead = (childId, range) => entries.listBookRange(ctx, childId, range);
  return { seen, ctx, read };
}

/** A held state, applied the way React applies a functional update (as book-subscribe-gap.test.ts does). */
function holder(initial: BookRead) {
  let held = initial;
  return { get: () => held, set: (next: (h: BookRead) => BookRead) => void (held = next(held)) };
}

const ids = (list: readonly Entry[]) => list.map((e) => e.id);

describe('[BL-2225] the Book reads one chapter of rows at a time', () => {
  const f = seeded();
  const whole = entries.listForBook(f.ctx, ASHA);

  it('[BL-2225] on focus the Book reads at most one chapter of rows from the 2,000-letter fixture, newest first, and never its edit lists', () => {
    const { seen, ctx, read } = spied(f);
    let listener: (() => void) | null = null;
    // What book.tsx does on focus: the initialiser's read, the watch's subscribe and catch-up read, the outline.
    const pages = createBookPages(read);
    const state = holder({ childId: ASHA, entries: pages.first(ASHA) });
    watchBook({ childId: ASHA, read: pages.reread, subscribe: (l) => ((listener = l), () => (listener = null)), set: state.set });
    if (!pages.done(ASHA)) entries.bookOutline(ctx, ASHA);

    expect(listener).not.toBeNull();
    expect(seen.length).toBeGreaterThan(0);
    for (const s of seen) expect(s.rows).toBeLessThanOrEqual(BOOK_PAGE);
    expect(state.get().entries.length).toBeGreaterThan(0);
    expect(state.get().entries.length).toBeLessThanOrEqual(BOOK_PAGE);
    expect(ids(state.get().entries)).toEqual(ids(whole.slice(0, state.get().entries.length)));
    // The stored edit list is never selected: only the stand-in `'[]' AS machine_edits` (BL-434), so nothing is parsed.
    for (const s of seen) expect(s.sql).not.toMatch(/(?<!AS )\bmachine_edits\b/);
    for (const e of state.get().entries) expect(e.machineEdits).toEqual([]);
    expect(pages.done(ASHA)).toBe(false);
  });

  it('[BL-2225] reading on to the end gives exactly the whole read, in its order, one page at a time', () => {
    const { seen, read } = spied(f);
    const pages = createBookPages(read);
    let held = pages.first(ASHA);
    let turns = 0;
    for (let next = pages.more(ASHA, held); next; next = pages.more(ASHA, held)) {
      held = next;
      turns += 1;
    }
    expect(pages.done(ASHA)).toBe(true);
    expect(ids(held)).toEqual(ids(whole));
    expect(turns).toBeGreaterThanOrEqual(Math.floor(whole.length / BOOK_PAGE));
    for (const s of seen) expect(s.rows).toBeLessThanOrEqual(BOOK_PAGE);
    expect(pages.more(ASHA, held)).toBeNull();
  });

  it('[BL-2225] a reread after a change reads from the floor up: a new letter shows, nothing below the floor is read', () => {
    const g = seeded(400);
    const { seen, read } = spied(g);
    const pages = createBookPages(read);
    const held = pages.first(ASHA);
    const floor = held[held.length - 1].occurredOn;
    const save = (n: number, on: string) => entries.upsert(g.ctx, letter({ id: id(n), childId: ASHA, occurredOn: on, capturedAt: `${on}T09:00:00.000Z` }), { childId: ASHA, authorSignsAs: 'Mama' });
    save(9001, '2026-11-20'); // kept today: newest
    save(9002, '2021-11-02'); // dated years back: below the floor
    seen.length = 0;
    const fresh = pages.reread(ASHA);
    expect(ids(fresh)).toEqual([id(9001), ...ids(held)]);
    expect(seen).toHaveLength(1);
    expect(seen[0].sql).toMatch(/occurred_on >= \?/);
    expect(seen[0].sql).not.toMatch(/LIMIT/);
    expect(fresh.every((e) => e.occurredOn >= floor)).toBe(true);
    g.close();
  });

  it('[BL-2225] all() holds the whole book; the other book starts again at its first page', () => {
    const { read } = spied(f);
    const pages = createBookPages(read);
    pages.first(ASHA);
    expect(ids(pages.all(ASHA))).toEqual(ids(whole));
    expect(pages.done(ASHA)).toBe(true);
    expect(ids(pages.reread(ASHA))).toEqual(ids(whole));
    const nia = pages.reread(NIA);
    expect(nia.length).toBeLessThanOrEqual(BOOK_PAGE);
    expect(pages.done(NIA)).toBe(false);
    expect(pages.done(ASHA)).toBe(false);
  });
});

describe('[BL-2225] pages hold whole days', () => {
  const day = (d: number) => `2026-0${Math.floor(d / 28) + 1}-${String((d % 28) + 1).padStart(2, '0')}`;
  /** A fake ranged read over a list already newest first, with the repo's bounds. */
  const over = (list: Entry[]): RangeRead => (_c, r) => {
    const rows = list.filter((e) => (!r.from || e.occurredOn >= r.from) && (!r.before || e.occurredOn < r.before));
    return r.limit != null ? rows.slice(0, r.limit) : rows;
  };
  const row = (n: number, occurredOn: string, kind: Entry['kind'] = 'letter') => ({ id: id(n), kind, occurredOn, capturedAt: `${occurredOn}T0${n % 10}:00:00.000Z`, inBook: true }) as Entry;

  it('[BL-2225] a day split by the page size goes whole to the next page, so its letter and its quiet-day mark stay together', () => {
    // Newest first: 4 days of 1 letter, then a day with a letter and a mark across the 5th and 6th rows.
    const list = [row(1, day(9)), row(2, day(8)), row(3, day(7)), row(4, day(6)), row(5, day(5)), row(6, day(5), 'not_much'), row(7, day(4))];
    const read = over(list);
    const page = readPage(read, ASHA, null, 5);
    expect(ids(page.entries)).toEqual(ids(list.slice(0, 4)));
    expect(page.floor).toBe(day(6));
    const next = readPage(read, ASHA, page.floor, 5);
    expect(ids(next.entries)).toEqual(ids(list.slice(4)));
    expect(next.floor).toBeNull();
  });

  it('[BL-2225] one day with more letters than a page is read whole, never split', () => {
    const list = [row(1, day(9)), row(2, day(9)), row(3, day(9)), row(4, day(9)), row(5, day(8))];
    const page = readPage(over(list), ASHA, null, 3);
    expect(ids(page.entries)).toEqual(ids(list.slice(0, 4)));
    expect(page.floor).toBe(day(9));
  });
});

describe('[BL-2225] what the Book still knows of letters it has not read', () => {
  const kid = child(ASHA);

  function bookOf(rows: Partial<Entry>[]) {
    const f = fixture();
    insertBook(f.db, { id: ASHA, name: 'Asha', birthday: BORN });
    rows.forEach((r, i) => entries.upsert(f.ctx, letter({ id: id(i + 1), childId: ASHA, ...r }), { childId: ASHA, authorSignsAs: 'Mama' }));
    return f;
  }

  it.each([
    ['letters in many months', [{ occurredOn: '2024-01-05', inBook: true }, { occurredOn: '2023-03-02' }]],
    ['letters in one month', [{ occurredOn: '2024-01-05', inBook: true }, { occurredOn: '2024-01-07' }]],
    ['one letter month and a mark in another', [{ occurredOn: '2024-01-05' }, { occurredOn: '2023-03-02', kind: 'not_much', inBook: false }]],
    ['marks only', [{ occurredOn: '2024-01-05', kind: 'not_much', inBook: false }]],
    ['a waiting letter only', [{ occurredOn: '2024-01-05', inBook: true, transcriptStatus: 'waiting' }]],
    ['an empty book', []],
  ] as [string, Partial<Entry>[]][])('[BL-2225] %s: the outline says what the whole book says of Months and Read together', (_name, rows) => {
    const f = bookOf(rows);
    const all = entries.listForBook(f.ctx, ASHA);
    const outline = entries.bookOutline(f.ctx, ASHA);
    expect(monthsFromOutline(outline, kid)).toBe(showsMonthsButton(monthRows(bookChapters(all, kid, '2024-02-01'))));
    expect(outline.readable).toBe(readableInBook(all).length > 0);
    f.close();
  });

  it('[BL-2225] an arrived letter not in the pages held asks for the rest of the book, and only then', () => {
    const sections = [{ data: [{ id: 'a' }, { id: 'b' }] }];
    expect(arrivalNeedsRest('c', sections, false)).toBe(true);
    expect(arrivalNeedsRest('c', sections, true)).toBe(false);
    expect(arrivalNeedsRest('b', sections, false)).toBe(false);
    expect(arrivalNeedsRest(undefined, sections, false)).toBe(false);
  });
});

describe('[BL-2225] the Book screen reads by page', () => {
  const screen = readFileSync(new URL('../src/app/(tabs)/book.tsx', import.meta.url), 'utf8');

  it('[BL-2225] reads its first page on focus and follows the store from its floor, never the whole book', () => {
    expect(screen).toMatch(/const \[pages\] = useState\(\(\) => createBookPages\(listBookRange\)\);/);
    expect(screen).toMatch(/useState\(\(\) => \(\{ childId: active\?\.id \?\? null, entries: active \? pages\.first\(active\.id\) : \[\] \}\)\)/);
    expect(screen).toMatch(/return watchBook\(\{ childId: active\.id, read: pages\.reread, subscribe, set: setRead \}\);/);
    expect(screen).not.toMatch(/listBookEntries|listForBook|listEntriesForChild/);
  });

  it('[BL-2225] loads the next page as the reader scrolls to it, and shows the end of the book only once it is all read', () => {
    expect(screen).toMatch(/onEndReached=\{readMore\}/);
    expect(screen).toMatch(/ListFooterComponent=\{done \? EndOfBook : null\}/);
  });
});
