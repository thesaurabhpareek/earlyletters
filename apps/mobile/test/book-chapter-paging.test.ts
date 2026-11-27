/// <reference types="node" />
/**
 * BL-2225: the Book reads one chapter of rows at a time (PRD 7.1: a chapter of 60 letters; BL-111). The store's ranged
 * read is the real repo on a migrated node:sqlite store, and the focus read goes through the real store module (the
 * functions book.tsx imports); the pages are the Book's own (book-pages.logic.ts), and the Book screen's wiring is
 * pinned by its source, as the other Book screen tests do. Fictional family "Asha" only.
 */
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// child-store reads the native store; the signature rule it provides is the only part chapters.ts uses.
vi.mock('@/components/child/child-store', () => ({ authorOf: (e: { authorSignsAs?: string }, c: { signsAs: string }) => e.authorSignsAs ?? c.signsAs }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

import { firstSeen, parseSeen, watchBook, type BookRead } from '../src/components/book/book.logic';
import { BOOK_PAGE, arrivalReach, createBookPages, monthsFromOutline, readPage, type BookArrivals, type BookPages, type RangeRead } from '../src/components/book/book-pages.logic';
import { bookChapters } from '../src/components/book/chapters';
import { monthRows, showsMonthsButton } from '../src/components/book/book-page.logic';
import { readableInBook } from '../src/components/book/quiet-day.logic';
import { entries } from '../src/lib/db/repos';
import type { SqlDb } from '../src/lib/db/sql';
import type { Child, Entry } from '../src/lib/store';
import { nodeDb } from './helpers/node-db';
import { fixture, insertBook, letter } from './helpers/store-fixture';

const store = await import('../src/lib/store');

const ASHA = 'child-asha';
const NIA = 'child-nia';
const BORN = '2021-10-01';
const child = (id: string): Child => ({ id, name: 'Asha', birthday: BORN, dueDate: null, signsAs: 'Mama', remindersOn: true, familyCanRead: false });

const id = (n: number) => `0199a5b0-0000-7000-8000-${n.toString(16).padStart(12, '0')}`;
const dayOf = (i: number) => new Date(Date.UTC(2021, 10, 1) + Math.floor((i * 1826) / 1000) * 86_400_000).toISOString().slice(0, 10);

/** perf.sql.test.ts's 2,000 letters: two books of 1,000 over five years, each with an edit list, into any SqlDb. */
function seedLetters(ctx: Parameters<typeof entries.upsert>[0], total = 2000) {
  insertBook(ctx.db, { id: ASHA, name: 'Asha', birthday: BORN });
  insertBook(ctx.db, { id: NIA, name: 'Nia', birthday: BORN });
  ctx.db.transaction(() => {
    for (let i = 0; i < total; i++) {
      const childId = i % 2 === 0 ? ASHA : NIA;
      const n = Math.floor(i / 2);
      const edit = { type: 'filler', start: 0, end: 3, before: 'um ', after: '' };
      entries.upsert(
        ctx,
        letter({ id: id(i), childId, occurredOn: dayOf(n), capturedAt: `${dayOf(n)}T08:30:00.000Z`, finalText: `Asha laughed at the rain, letter ${i}.`, machineEdits: [edit] as never, inBook: true }),
        { childId, authorSignsAs: 'Mama' },
      );
    }
  });
}

function seeded(total = 2000) {
  const f = fixture();
  seedLetters(f.ctx, total);
  return f;
}

/** Every SELECT sent through `db` and how many rows came back into the app. */
function counting(db: SqlDb) {
  const seen: { sql: string; rows: number }[] = [];
  const spy: SqlDb = {
    ...db,
    get: <T,>(sql: string, ...p: never[]) => {
      const r = db.get<T>(sql, ...p);
      seen.push({ sql, rows: r ? 1 : 0 });
      return r;
    },
    all: <T,>(sql: string, ...p: never[]) => {
      const r = db.all<T>(sql, ...p);
      seen.push({ sql, rows: r.length });
      return r;
    },
  };
  return { seen, spy };
}

function spied(f: ReturnType<typeof fixture>) {
  const { seen, spy } = counting(f.db);
  const ctx = { ...f.ctx, db: spy };
  const read: RangeRead = (childId, range) => entries.listBookRange(ctx, childId, range);
  return { seen, ctx, read };
}

/** A held state, applied the way React applies a functional update (as book-subscribe-gap.test.ts does). */
function holder(initial: BookRead) {
  let held = initial;
  return { get: () => held, set: (next: BookRead | ((h: BookRead) => BookRead)) => void (held = typeof next === 'function' ? next(held) : next) };
}

const ids = (list: readonly Entry[]) => list.map((e) => e.id);
const entryRows = (seen: { sql: string; rows: number }[]) => seen.filter((s) => /\bFROM entries\b/.test(s.sql));

describe('[BL-2225] on focus the Book reads at most one chapter of rows (the real store, 2,000 letters)', () => {
  // The store the screen reads, over node:sqlite, with every SELECT counted.
  store.closeStore();
  const h = nodeDb();
  const { seen, spy } = counting(h.db);
  expect(store.openStore({ open: () => ({ db: spy, close: () => {} }), now: () => '2026-11-20T09:00:00.000Z' }).ok).toBe(true);
  seedLetters({ db: store.localSqlDb(), now: () => '2026-11-20T09:00:00.000Z', newId: () => id(99_999) });
  afterAll(() => {
    store.closeStore();
    h.close();
  });

  it('[BL-2225] the focus read (initialiser, watch and catch-up, outline) brings at most one chapter of rows into the app, and no edit list', () => {
    seen.length = 0;
    // What book.tsx does on focus, with the functions it imports: createBookPages(listBookRange, BOOK_PAGE,
    // bookArrivals), pages.first in the initialiser (with the arrivals mark), watchBook with pages.reread and the
    // store's subscribe, and the outline while older pages are unread.
    const pages = createBookPages(store.listBookRange, BOOK_PAGE, store.bookArrivals);
    const state = holder({ childId: ASHA, entries: pages.first(ASHA) });
    const off = watchBook({ childId: ASHA, read: pages.reread, subscribe: store.subscribe, set: state.set });
    const outline = pages.done(ASHA) ? null : store.bookOutline(ASHA);
    off();

    const reads = entryRows(seen);
    expect(reads.length).toBeGreaterThan(0);
    for (const r of reads) expect(r.rows).toBeLessThanOrEqual(BOOK_PAGE);
    // The page and its catch-up reread are the same chapter: the whole focus read is two reads of one chapter (a full
    // page gives back its cut day, so each is under BOOK_PAGE rows), plus one outline row and the arrivals mark's one
    // row. Without paging this is 1,000 rows each.
    expect(reads.reduce((n, r) => n + r.rows, 0)).toBeLessThanOrEqual(2 * BOOK_PAGE + 1);
    expect(state.get().entries.length).toBeGreaterThan(0);
    expect(state.get().entries.length).toBeLessThanOrEqual(BOOK_PAGE);
    for (const r of reads) expect(r.sql).not.toMatch(/(?<!AS )\bmachine_edits\b/);
    expect(pages.done(ASHA)).toBe(false);
    expect(outline).toEqual({ firstLetterOn: '2021-11-01', lastLetterOn: expect.any(String), readable: true });
  });
});

describe('[BL-2225] the Book reads one chapter of rows at a time', () => {
  const f = seeded();
  const whole = entries.listForBook(f.ctx, ASHA);

  it('[BL-2225] the first page is the start of the whole read, newest first, and never its edit lists', () => {
    const { seen, read } = spied(f);
    const pages = createBookPages(read);
    const first = pages.first(ASHA);
    expect(first.length).toBeGreaterThan(0);
    expect(first.length).toBeLessThanOrEqual(BOOK_PAGE);
    expect(ids(first)).toEqual(ids(whole.slice(0, first.length)));
    for (const e of first) expect(e.machineEdits).toEqual([]);
    expect(seen).toHaveLength(1);
    expect(seen[0].sql).toMatch(/LIMIT \?/);
  });

  it('[BL-2225] reading on to the end gives exactly the whole read, in its order, one page at a time', () => {
    const { seen, read } = spied(f);
    const pages = createBookPages(read);
    let held: Entry[] = pages.first(ASHA);
    let turns = 0;
    for (let join = pages.more(ASHA); join; join = pages.more(ASHA)) {
      held = join(held);
      turns += 1;
    }
    expect(pages.done(ASHA)).toBe(true);
    expect(ids(held)).toEqual(ids(whole));
    expect(turns).toBeGreaterThanOrEqual(Math.floor(whole.length / BOOK_PAGE));
    for (const s of seen) expect(s.rows).toBeLessThanOrEqual(BOOK_PAGE);
    expect(pages.more(ASHA)).toBeNull();
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

  it('[BL-2225] a store change applied before the next page joins is kept, and no row is doubled', () => {
    const g = seeded(400);
    const { read } = spied(g);
    const pages = createBookPages(read);
    const state = holder({ childId: ASHA, entries: pages.first(ASHA) });
    // The order React may apply them in: a store change's reread is queued (it reads when applied), then the page is
    // read on scroll, then both apply. The reread reads from the new floor, so it already holds the page.
    entries.upsert(g.ctx, letter({ id: id(9003), childId: ASHA, occurredOn: '2026-11-21', capturedAt: '2026-11-21T09:00:00.000Z' }), { childId: ASHA, authorSignsAs: 'Mama' });
    const join = pages.more(ASHA)!;
    state.set(() => ({ childId: ASHA, entries: pages.reread(ASHA) }));
    state.set((h) => ({ childId: ASHA, entries: join(h.entries) }));
    const held = ids(state.get().entries);
    expect(held[0]).toBe(id(9003));
    expect(new Set(held).size).toBe(held.length);
    expect(held).toEqual(ids(entries.listForBook(g.ctx, ASHA).slice(0, held.length)));
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

  it('[BL-2225] an arrived letter dated back is read down to its day only, whole days, and its day is then held', () => {
    const { seen, read } = spied(f);
    const pages = createBookPages(read);
    const first = pages.first(ASHA);
    const day = whole[150].occurredOn;
    expect(pages.holds(ASHA, day)).toBe(false);
    seen.length = 0;
    const rows = pages.reach(ASHA, day)!;
    expect(seen).toHaveLength(1);
    expect(ids(rows)).toEqual(ids(whole.filter((e) => e.occurredOn >= day)));
    expect(ids(rows.slice(0, first.length))).toEqual(ids(first));
    expect(pages.holds(ASHA, day)).toBe(true);
    expect(pages.done(ASHA)).toBe(false);
    expect(pages.reach(ASHA, day)).toBeNull();
  });
});

describe('[BL-2225] an older page is never news to the first-seen wash', () => {
  const f = seeded(400);
  const { read } = spied(f);

  it('[BL-2225] rows first read by paging down are older pages; the first page and a letter that arrives by a store change are not', () => {
    const pages = createBookPages(read);
    const first = pages.first(ASHA);
    const page2 = pages.more(ASHA)!([]);
    expect(page2.length).toBeGreaterThan(0);
    for (const e of first) expect(pages.olderPage(e.id)).toBe(false);
    for (const e of page2) expect(pages.olderPage(e.id)).toBe(true);
    // The other parent's letter, synced and dated into the page already scrolled to: it arrives, so it may wash.
    const synced = letter({ id: id(9004), childId: ASHA, occurredOn: page2[2].occurredOn, capturedAt: `${page2[2].occurredOn}T23:00:00.000Z` });
    entries.upsert(f.ctx, synced, { childId: ASHA, authorSignsAs: 'Papa' });
    expect(ids(pages.reread(ASHA))).toContain(id(9004));
    expect(pages.olderPage(id(9004))).toBe(false);
    // Holding the whole book (Months) marks what it brings in as older, and a new focus starts the list again.
    pages.all(ASHA);
    expect(pages.olderPage(entries.listForBook(f.ctx, ASHA).at(-1)!.id)).toBe(true);
    pages.first(ASHA);
    for (const e of page2) expect(pages.olderPage(e.id)).toBe(false);
  });
});

describe('[BL-2225] the other parent\'s letter synced in below the first page washes when its page is read, once', () => {
  // Review A note 2, CTO ruling on #2147: before paging the whole read held such a letter and it washed. book.tsx's
  // first-seen effect, as it runs on every change of the rows held: older pages left out, then firstSeen.
  const theirs = (e: Pick<Entry, 'id'>) => (e as Entry).authorSignsAs === 'Papa';
  const effect = (held: readonly Entry[], pages: BookPages, seen: string[] | null) => firstSeen(held.filter((e) => !pages.olderPage(e.id)), (e) => !theirs(e), seen);

  it('[BL-2225] scrolled to (onEndReached) or held whole (Months), it washes once; letters there before the first page, and one seen already, never wash', () => {
    for (const reachIt of ['scroll', 'whole book'] as const) {
      const g = seeded(400);
      const { ctx, read } = spied(g);
      const arrivals: BookArrivals = { mark: () => entries.rowMark(ctx), kept: () => null, since: (c, m) => entries.arrivalsSince(ctx, c, m) };
      const papa = (n: number, on: string) => entries.upsert(g.ctx, letter({ id: id(n), childId: ASHA, occurredOn: on, capturedAt: '2026-11-20T09:00:00.000Z', authorSignsAs: 'Papa' }), { childId: ASHA, authorSignsAs: 'Papa' });
      papa(9100, '2022-03-04'); // theirs, in the store before the first page and below it: never news
      const pages = createBookPages(read, BOOK_PAGE, arrivals);
      let held: Entry[] = pages.first(ASHA);
      const floor = held[held.length - 1].occurredOn;
      // A phone whose seen list started on the first page; 9102 was shown on this phone before.
      let seen: string[] = [...effect(held, pages, null).seen, id(9102)];
      const washed: string[] = [];
      const run = () => {
        const next = effect(held, pages, seen);
        washed.push(...next.wash);
        seen = next.seen;
      };
      // The other parent's letters for days long before the first page sync in: a store change rereads from the floor.
      papa(9101, '2022-03-05');
      papa(9102, '2022-03-06');
      expect('2022-03-06' < floor).toBe(true);
      held = pages.reread(ASHA);
      run();
      expect(ids(held)).not.toContain(id(9101));
      if (reachIt === 'scroll') {
        for (let join = pages.more(ASHA); join; join = pages.more(ASHA)) {
          held = join(held);
          run();
        }
      } else {
        held = pages.all(ASHA);
        run();
      }
      expect(ids(held)).toEqual(expect.arrayContaining([id(9100), id(9101), id(9102)]));
      expect(pages.olderPage(id(9100))).toBe(true);
      expect(pages.olderPage(id(9101))).toBe(false);
      expect(washed).toEqual([id(9101)]);
      // Once: the next change of the rows held does not wash it again.
      held = pages.reread(ASHA);
      run();
      expect(washed).toEqual([id(9101)]);
      g.close();
    }
  });

  it('[BL-2225] the arrivals read only the rows added since the mark, by rowid, and only this book\'s live ones', () => {
    const g = seeded(40);
    const mark = entries.rowMark(g.ctx);
    expect(entries.arrivalsSince(g.ctx, ASHA, mark)).toEqual([]);
    entries.upsert(g.ctx, letter({ id: id(9201), childId: ASHA, occurredOn: '2022-01-01' }), { childId: ASHA, authorSignsAs: 'Papa' });
    entries.upsert(g.ctx, letter({ id: id(9202), childId: NIA, occurredOn: '2022-01-01' }), { childId: NIA, authorSignsAs: 'Papa' });
    entries.upsert(g.ctx, letter({ id: id(0), childId: ASHA, occurredOn: dayOf(0), finalText: 'Asha laughed again.' }), { childId: ASHA, authorSignsAs: 'Mama' }); // an edit keeps its rowid
    const { seen, ctx } = spied(g);
    expect(entries.arrivalsSince(ctx, ASHA, mark)).toEqual([{ id: id(9201), row: mark + 1, day: '2022-01-01' }]);
    entries.tombstone(g.ctx, id(9201));
    expect(entries.arrivalsSince(g.ctx, ASHA, mark)).toEqual([]);
    // The plan of the very SQL the repo sent: the rowid range, never a walk of the book's index or of all of entries.
    const plan = g.db.all<{ detail: string }>(`EXPLAIN QUERY PLAN ${seen[0].sql}`, mark, ASHA).map((r) => r.detail);
    expect(plan.some((l) => /SEARCH entries USING INTEGER PRIMARY KEY \(rowid>\?\)/.test(l))).toBe(true);
    expect(plan.some((l) => /^SCAN entries|INDEX entries_(child|sync)/.test(l))).toBe(false);
    g.close();
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
    ['a letter left out of the book only', [{ occurredOn: '2024-01-05', inBook: false }]],
    ['an empty book', []],
  ] as [string, Partial<Entry>[]][])('[BL-2225] %s: the outline says what the whole book says of Months and Read together', (_name, rows) => {
    const f = bookOf(rows);
    const all = entries.listForBook(f.ctx, ASHA);
    const outline = entries.bookOutline(f.ctx, ASHA);
    expect(monthsFromOutline(outline, kid)).toBe(showsMonthsButton(monthRows(bookChapters(all, kid, '2024-02-01'))));
    expect(outline.readable).toBe(readableInBook(all).length > 0);
    f.close();
  });

  it('[BL-2225] an arrived letter not shown is read down to when it is this book\'s and its day is not held, and only then', () => {
    const sections = [{ data: [{ id: 'a' }, { id: 'b' }] }];
    const book: Record<string, Pick<Entry, 'childId' | 'occurredOn'>> = {
      b: { childId: ASHA, occurredOn: '2026-11-01' },
      c: { childId: ASHA, occurredOn: '2025-02-03' },
      d: { childId: NIA, occurredOn: '2025-02-03' },
    };
    const at = (param: string | undefined, held: string | null) =>
      arrivalReach({ param, sections, childId: ASHA, lookup: (x) => book[x] ?? null, holds: (d) => held === null || held <= d });
    expect(at('c', '2026-10-01')).toBe('2025-02-03'); // dated back, below the pages held
    expect(at('c', '2025-01-01')).toBeNull(); // its day is held (a hidden mark, say): the gate runs with no card
    expect(at('c', null)).toBeNull(); // the whole book is held
    expect(at('b', '2026-10-01')).toBeNull(); // shown already
    expect(at('d', '2026-10-01')).toBeNull(); // another book's letter
    expect(at('gone', '2026-10-01')).toBeNull(); // deleted since
    expect(at(undefined, '2026-10-01')).toBeNull();
  });
});

describe('[BL-2225] the Book screen reads by page (source)', () => {
  const screen = readFileSync(new URL('../src/app/(tabs)/book.tsx', import.meta.url), 'utf8');

  it('[BL-2225] reads its first page on focus and follows the store from its floor, never the whole book', () => {
    expect(screen).toMatch(/const \[pages\] = useState\(\(\) => createBookPages\(listBookRange, BOOK_PAGE, bookArrivals\)\);/);
    expect(screen).toMatch(/useState\(\(\) => \(\{ childId: active\?\.id \?\? null, entries: active \? pages\.first\(active\.id\) : \[\] \}\)\)/);
    expect(screen).toMatch(/return watchBook\(\{ childId: active\.id, read: pages\.reread, subscribe, set: setRead \}\);/);
    expect(screen).not.toMatch(/listBookEntries|listForBook|listEntriesForChild/);
    // The outline is read only while older pages are unread.
    expect(screen).toMatch(/const outline = useMemo\(\(\) => \(active && !done \? bookOutline\(active\.id\) : null\)/);
  });

  it('[BL-2225] loads the next page as the reader scrolls to it, joined to what is held, and shows the end of the book only once it is all read', () => {
    expect(screen).toMatch(/onEndReached=\{readMore\}/);
    expect(screen).toMatch(/setRead\(\(held\) => \(held\.childId === id \? \{ childId: id, entries: join\(held\.entries\) \} : held\)\)/);
    expect(screen).toMatch(/ListFooterComponent=\{done \? EndOfBook : null\}/);
  });

  it('[BL-2225] holds the whole book for the Months sheet and the Photos lens, and reads an arrived letter down to its day', () => {
    expect(screen).toMatch(/onPress: \(\) => \{\s*holdWholeBook\(\);\s*setMonthsOpen\(true\);/);
    expect(screen).toMatch(/if \(showPhotos\) holdWholeBook\(\);/);
    expect(screen).toMatch(/const rows = pages\.reach\(active\.id, reachDay\);/);
  });

  it('[BL-2225] the first-seen wash leaves out the older pages the reader scrolls to', () => {
    expect(screen).toMatch(/firstSeen\(entries\.filter\(\(e\) => !pages\.olderPage\(e\.id\)\), /);
    expect(screen).not.toMatch(/entries\.slice\(0, BOOK_PAGE\)/);
  });

  it('[BL-2225] keeps the book\'s wash mark in the first-seen effect, after the seen list is written', () => {
    expect(screen).toMatch(
      /if \(value !== raw\) setSetting\(SEEN_KEY, value\);\s*(\/\/[^\n]*\n\s*)*const keep = pages\.keepMark\(active\.id\);\s*if \(keep !== null\) bookArrivals\.keep\(active\.id, keep\);/,
    );
  });
});

describe('[BL-2225] the wash mark is kept per book next to the seen list, across launches and book switches', () => {
  // CTO ruling on #2147 (Reviews A and B): the mark lived only while the Book was open, so the other parent's letter
  // that synced in before the Book was first opened (at launch), or into one book while another was on screen, was in
  // the store at the mark and never washed; develop's whole read washed it. These run the real store module, and
  // book.tsx's first-seen effect as it runs on every change of the rows held: older pages left out, firstSeen, the
  // seen list written, then the book's mark kept.
  const NOW = '2026-11-20T09:00:00.000Z';
  const SEEN = 'book.seenFromOthers';
  const papaSigns = (e: Pick<Entry, 'id'>) => (e as Entry).authorSignsAs === 'Papa';
  let h: ReturnType<typeof nodeDb>;
  let sent: { sql: string; rows: number }[] = [];
  /** A launch: the store opened over the same file, as the root layout opens it. */
  const launch = () => {
    store.closeStore();
    const { seen, spy } = counting(h.db);
    sent = seen;
    expect(store.openStore({ open: () => ({ db: spy, close: () => {} }), now: () => NOW }).ok).toBe(true);
  };
  const papa = (n: number, childId: string, on: string) =>
    entries.upsert({ db: store.localSqlDb(), now: () => NOW, newId: () => id(99_998) }, letter({ id: id(n), childId, occurredOn: on, capturedAt: NOW, authorSignsAs: 'Papa', inBook: true }), { childId, authorSignsAs: 'Papa' });

  /** The Book on one book: its pages, the rows held, and what its first-seen effect washed. */
  function book(pages: BookPages, childId: string, washed: string[]) {
    let held: Entry[] = [];
    const effect = () => {
      const raw = store.getSetting(SEEN);
      const next = firstSeen(held.filter((e) => !pages.olderPage(e.id)), (e) => !papaSigns(e), parseSeen(raw));
      washed.push(...next.wash);
      const value = JSON.stringify(next.seen);
      if (value !== raw) store.setSetting(SEEN, value);
      const keep = pages.keepMark(childId);
      if (keep !== null) store.bookArrivals.keep(childId, keep);
    };
    return {
      open() {
        held = pages.reread(childId);
        effect();
      },
      scrollOne() {
        const join = pages.more(childId);
        expect(join).not.toBeNull();
        held = join!(held);
        effect();
      },
      scrollToEnd() {
        for (let join = pages.more(childId); join; join = pages.more(childId)) {
          held = join(held);
          effect();
        }
      },
      held: () => held,
    };
  }

  beforeAll(() => {
    h = nodeDb();
    launch();
    seedLetters({ db: store.localSqlDb(), now: () => NOW, newId: () => id(99_999) }, 400);
  });
  afterAll(() => {
    store.closeStore();
    h.close();
  });

  it('[BL-2225] a letter of theirs synced in at launch, before the Book opens, washes once when its page is read; letters there at the last read, and one seen already, never wash', () => {
    papa(9300, ASHA, '2022-03-04'); // in the store before this phone ever read the book: never news
    const washed: string[] = [];
    const first = book(createBookPages(store.listBookRange, BOOK_PAGE, store.bookArrivals), ASHA, washed);
    first.open();
    const floor = first.held().at(-1)!.occurredOn;
    // 9302 was shown on this phone before (another screen, say): it is on the seen list.
    store.setSetting(SEEN, JSON.stringify([id(9302), ...(parseSeen(store.getSetting(SEEN)) ?? [])]));

    // The app closes. The next launch's sync brings the other parent's letters for days long before the first page.
    launch();
    papa(9301, ASHA, '2022-03-05');
    papa(9302, ASHA, '2022-03-06');
    expect('2022-03-06' < floor).toBe(true);
    const next = book(createBookPages(store.listBookRange, BOOK_PAGE, store.bookArrivals), ASHA, washed);
    next.open();
    expect(ids(next.held())).not.toContain(id(9301));
    next.scrollToEnd();
    expect(ids(next.held())).toEqual(expect.arrayContaining([id(9300), id(9301), id(9302)]));
    expect(washed).toEqual([id(9301)]);

    // Once: a third launch reads the same pages and washes nothing.
    launch();
    const third = book(createBookPages(store.listBookRange, BOOK_PAGE, store.bookArrivals), ASHA, washed);
    third.open();
    third.scrollToEnd();
    expect(washed).toEqual([id(9301)]);
  });

  it('[BL-2225] a letter of theirs synced into one book while the other is on screen washes when its page is read after switching back', () => {
    const washed: string[] = [];
    const pages = createBookPages(store.listBookRange, BOOK_PAGE, store.bookArrivals);
    const asha = book(pages, ASHA, washed);
    asha.open();
    asha.scrollToEnd();
    // A child switch: watchBook's reread calls first() for the other book, then the sync lands in this one.
    const nia = book(pages, NIA, washed);
    nia.open();
    papa(9310, ASHA, '2022-04-01');
    asha.open();
    expect(ids(asha.held())).not.toContain(id(9310));
    asha.scrollToEnd();
    expect(washed).toEqual([id(9310)]);
  });

  it('[BL-2225] the kept mark passes every letter come in and held, and stops below the first one still unread', () => {
    const washed: string[] = [];
    const mark = () => entries.rowMark({ db: store.localSqlDb(), now: () => NOW, newId: () => id(1) });
    launch();
    const before = mark();
    book(createBookPages(store.listBookRange, BOOK_PAGE, store.bookArrivals), ASHA, washed).open();
    expect(store.bookArrivals.kept(ASHA)).toBe(before);
    // Between launches, one letter of theirs for a day long ago. The reader reads one page further, still above its
    // day, and closes the app: the mark stays below it, so the next launch still counts it as come in.
    launch();
    papa(9320, ASHA, '2022-02-01');
    const row = mark();
    const one = book(createBookPages(store.listBookRange, BOOK_PAGE, store.bookArrivals), ASHA, washed);
    one.open();
    expect(store.bookArrivals.kept(ASHA)).toBe(before);
    one.scrollOne();
    expect(one.held().at(-1)!.occurredOn > '2022-02-01').toBe(true);
    expect(store.bookArrivals.kept(ASHA)).toBe(row - 1);
    expect(washed).toEqual([]);
    // Read down to it on the next launch: it washes, and the mark passes it.
    launch();
    const two = book(createBookPages(store.listBookRange, BOOK_PAGE, store.bookArrivals), ASHA, washed);
    two.open();
    two.scrollToEnd();
    expect(washed).toEqual([id(9320)]);
    expect(store.bookArrivals.kept(ASHA)).toBe(row);
  });

  it('[BL-2225] the marks\' own plans: the newest row is one step off the end of the rowid tree, the kept mark one settings key', () => {
    launch();
    sent.length = 0;
    expect(store.bookArrivals.mark()).toBeGreaterThan(0);
    expect(store.bookArrivals.kept(ASHA)).toBeGreaterThan(0);
    const [markSql, keptSql] = sent.map((s) => s.sql);
    expect(sent.map((s) => s.rows)).toEqual([1, 1]);
    const plan = (sql: string, ...p: string[]) => h.db.all<{ detail: string }>(`EXPLAIN QUERY PLAN ${sql}`, ...p).map((r) => r.detail);
    // SQLite's max(rowid) shortcut: one SEARCH, never a SCAN of entries or a walk of an index. With a WHERE the plan
    // still reads SEARCH but walks back from the end until a row matches, so the mark has none.
    expect(plan(markSql)).toEqual(['SEARCH entries']);
    expect(markSql).toMatch(/^SELECT max\(rowid\)/);
    expect(markSql).not.toMatch(/\bWHERE\b/);
    expect(plan(keptSql, 'book.readMark.' + ASHA).join(' ')).toMatch(/^SEARCH settings USING (INDEX sqlite_autoindex_settings_1|PRIMARY KEY) \(key=\?\)$/);
    expect(keptSql).toMatch(/FROM settings WHERE key = \?/);
  });

  it('[BL-2225] the kept mark holds a row number under a book id: no words, no name', () => {
    launch();
    const keys = h.db.all<{ key: string; value: string }>("SELECT key, value FROM settings WHERE key LIKE 'book.readMark.%'");
    expect(keys.length).toBeGreaterThan(0);
    for (const k of keys) {
      expect(k.key).toMatch(/^book\.readMark\.child-(asha|nia)$/);
      expect(k.value).toMatch(/^[1-9][0-9]*$/);
    }
  });
});

describe('[BL-2225] an empty-store or first-ever mark never reads the whole table', () => {
  const f = seeded(400);
  const { seen, ctx, read } = spied(f);
  const now = entries.rowMark(f.ctx);
  /** The store's arrivals with a given kept mark and a given mark now, every `since` mark recorded. */
  function arrivals(kept: number | null, markNow = now) {
    const asked: number[] = [];
    const a: BookArrivals = {
      mark: () => markNow,
      since: (c, m) => {
        asked.push(m);
        return entries.arrivalsSince(ctx, c, m);
      },
      kept: () => kept,
    };
    return { a, asked };
  }
  const pageDown = (pages: BookPages) => {
    for (let join = pages.more(ASHA); join; join = pages.more(ASHA)) join([]);
  };
  const arrivalRows = () => seen.filter((s) => /WHERE rowid > \?/.test(s.sql)).reduce((n, s) => n + s.rows, 0);

  it('[BL-2225] a store that was empty at the mark (0) asks for no arrivals: from 0 the range is the whole table', () => {
    const { a, asked } = arrivals(null, 0);
    seen.length = 0;
    const pages = createBookPages(read, BOOK_PAGE, a);
    pages.first(ASHA);
    pageDown(pages);
    expect(asked).toEqual([]);
    expect(arrivalRows()).toBe(0);
    expect(pages.keepMark(ASHA)).toBeNull();
  });

  it.each([
    ['no mark kept yet (the first read of this book)', null],
    ['a kept 0 (the store was empty)', 0],
    ['a kept mark above the newest row (rows purged or renumbered since)', now + 50],
  ] as [string, number | null][])('[BL-2225] %s: the mark is the newest row now, so no row there washes and no old row is read', (_name, kept) => {
    const { a, asked } = arrivals(kept);
    seen.length = 0;
    const pages = createBookPages(read, BOOK_PAGE, a);
    pages.first(ASHA);
    expect(pages.keepMark(ASHA)).toBe(now);
    pageDown(pages);
    expect(new Set(asked)).toEqual(new Set([now]));
    expect(arrivalRows()).toBe(0);
  });

  it('[BL-2225] a kept mark inside the rows is the one the arrivals are read from', () => {
    const { a, asked } = arrivals(now - 3);
    const pages = createBookPages(read, BOOK_PAGE, a);
    pages.first(ASHA);
    expect(pages.keepMark(ASHA)).toBe(now - 3);
    pageDown(pages);
    expect(new Set(asked)).toEqual(new Set([now - 3]));
    expect(pages.keepMark(ASHA)).toBe(now);
  });

  it('[BL-2225] a book held whole without its first page read keeps no mark: the one in hand is the other book\'s', () => {
    const { a } = arrivals(now - 3);
    const pages = createBookPages(read, BOOK_PAGE, a);
    pages.first(ASHA);
    pages.all(NIA);
    expect(pages.keepMark(NIA)).toBeNull();
    expect(pages.keepMark(ASHA)).toBeNull();
  });
});
