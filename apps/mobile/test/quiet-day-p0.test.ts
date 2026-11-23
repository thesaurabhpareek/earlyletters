/// <reference types="node" />
/**
 * The three P0 rows of NS-07 C5 that had no titled test (BL-974; docs/product/prd/07-remaining-capability-rows.md 3.7):
 * C5-3 quiet days are never counted, C5-9 consecutive quiet days are not drawn as a run, C5-12 a second account on the
 * phone sees none of the first account's quiet days. C5-8 and C5-10 are in quiet-day-other-author.test.ts and
 * read-together.guards.test.ts. Fictional family "Asha" only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { countLine } from '../src/components/book/chapters';
import { newQuietMark, visibleInBook } from '../src/components/book/quiet-day.logic';
import { entries } from '../src/lib/db/repos';
import { SYNC_SETTING, writeSetting } from '../src/lib/sync/outbox';
import { nodeDb } from './helpers/node-db';
import { insertBook, letter } from './helpers/store-fixture';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const auth = await import('../src/lib/auth/auth-store');

const src = (rel: string) => readFileSync(join(__dirname, '..', 'src', rel), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const A = '0192f0aa-0000-7000-8000-0000000000a1'; // made the quiet days on this phone
const B = '0192f0aa-0000-7000-8000-0000000000b2'; // signs in on the same phone
const NOW = '2026-11-20T09:00:00.000Z';
let n = 0;
const id7 = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
const DAYS = ['2026-11-16', '2026-11-17', '2026-11-18'];
const mark = (day: string) => newQuietMark({ id: id7(), occurredOn: day, capturedAt: `${day}T20:00:00.000Z` });

/** A store over a fresh in-memory phone with one book, so the real reads run. */
function openPhone() {
  store.closeStore();
  const h = nodeDb();
  expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => NOW, newId: id7 }).ok).toBe(true);
  const db = store.localSqlDb();
  insertBook(db, { id: 'child-asha', name: 'Asha', birthday: '2026-03-01', at: NOW });
  return { db, close: h.close };
}

afterEach(() => {
  auth.resetAuthStoreForTests();
  store.closeStore();
});

describe('[NS-07-C5-3] quiet days are never counted', () => {
  it('the Book line counts letters and notes and leaves quiet days out', () => {
    const quiet = DAYS.map((d) => ({ ...mark(d), childId: 'child-asha' }));
    expect(countLine(quiet as never)).toBe('');
    const withLetter = [...quiet, letter({ id: id7(), inBook: true })];
    expect(countLine(withLetter as never)).toBe(countLine([withLetter[3]] as never));
  });

  it('the ledger and the letter count do not move for quiet days', () => {
    const phone = openPhone();
    try {
      for (const d of DAYS) entries.upsert({ db: phone.db, now: () => NOW, newId: id7 }, { ...mark(d), childId: 'child-asha', authorSignsAs: null } as never, { childId: null, authorSignsAs: null });
      expect(store.listEntriesForChild('child-asha')).toHaveLength(3); // control: the marks are stored
      expect(store.countBookLetters('child-asha')).toBe(0);
    } finally {
      phone.close();
    }
  });

  it('no quiet-day screen file holds a count, a streak or a run (source)', () => {
    for (const f of ['components/book/quiet-day-row.tsx', 'components/tonight/quiet-day-inline.tsx', 'components/book/quiet-day.logic.ts']) {
      expect(src(f), f).not.toMatch(/streak|\.length\}|\bcount\w*\(|\brun\b|consecutive/i);
    }
  });

  it('the export file name is the format and the date, never anything about quiet days (source)', () => {
    expect(src('lib/export/device.ts')).toContain('const fileName = `${EXPORT_FORMAT}-${snapshot.generatedAt.slice(0, 10)}.zip`;');
  });
});

describe('[NS-07-C5-9] consecutive quiet days are not drawn as a run', () => {
  it('three days in a row stay three separate rows, in order, with nothing between or around them', () => {
    const marks = DAYS.map(mark);
    const shown = visibleInBook(marks);
    expect(shown).toEqual(marks); // the same entries, one each: no wrapper, group or summary item
    expect(shown.map((m) => m.occurredOn)).toEqual(DAYS);
  });

  it('the Book draws each mark with its own row and the row has no connector (source)', () => {
    const book = src('app/(tabs)/book.tsx');
    expect(book).toMatch(/isQuietMark\(item\) \? \(\s*<QuietDayRow entry=\{item\}/);
    expect(book).not.toMatch(/quietRun|quietGroup|groupQuiet|consecutive/i);
    expect(src('components/book/quiet-day-row.tsx')).not.toMatch(/connector|border-l|divider|<Line|run|group|streak/i);
  });
});

describe('[NS-07-C5-12] a second account sees no quiet days of the first', () => {
  it('B signed in on A\'s phone lists none of A\'s quiet days; A and the signed-out phone still do', () => {
    const phone = openPhone();
    try {
      for (const d of DAYS) entries.upsert({ db: phone.db, now: () => NOW, newId: id7 }, { ...mark(d), childId: 'child-asha', authorSignsAs: null } as never, { childId: null, authorSignsAs: null });
      writeSetting(phone.db, SYNC_SETTING.owner, A);
      auth.publishAuth({ status: 'ready', userId: A, sync: 'on' });
      expect(store.listEntriesForChild('child-asha')).toHaveLength(3); // control: A sees them
      auth.publishAuth({ status: 'ready', userId: B, sync: 'on' });
      expect(store.listEntriesForChild('child-asha')).toEqual([]);
      expect(store.listBookEntries('child-asha')).toEqual([]); // the Book's own read
      auth.resetAuthStoreForTests(); // signed out: the book stays with the phone (D1)
      expect(store.listEntriesForChild('child-asha')).toHaveLength(3);
    } finally {
      phone.close();
    }
  });
});
