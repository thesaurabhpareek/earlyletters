/// <reference types="node" />
/**
 * A letter for another day (NS-15, rescoped 20 Nov; BL-945), the phone half: Review files a draft by the day the parent
 * picks, the letter page keeps its built Change the date for the author only, the picker's bounds, the export, and Erase
 * everything. The about-day is `occurred_on` with `occurred_precision`; the said-on day is `captured_at`, which never
 * moves. Real SQLite (node:sqlite) through the store, as Review and the letter page call it; the screens cannot render
 * in Node, so their wiring is pinned from source (comments stripped). Sync across phones and account deletion on the
 * server are in ns15-about-day-sync.test.ts. Fictional family "Asha" only: Mama and Papa.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';
import { stripComments } from './helpers/strip-comments';
import { ashaSnapshot } from './helpers/asha-export';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));
vi.mock('@/components/child/child-store', () => ({ authorOf: (e: { authorSignsAs?: string }, c: { signsAs: string }) => e.authorSignsAs ?? c.signsAs }));

const store = await import('../src/lib/store');
const { takeOwnership } = await import('../src/lib/sync/ownership');
const { reviewAboutDay, showsBothDays } = await import('../src/components/capture/about-day.logic');
const { laterWordsDraft } = await import('../src/components/capture/later-words.logic');
const { BACKDATE_YEARS, dayBounds, resolvePick } = await import('../src/components/book/date-change.logic');
const { groupChapters, monthFor } = await import('../src/components/book/chapters');
const { dataFiles, planExport } = await import('../src/lib/export/build.logic');

const SRC = join(__dirname, '..', 'src');
const source = (...p: string[]) => stripComments(readFileSync(join(SRC, ...p), 'utf8'));
const review = source('app', 'review.tsx');
const letterPage = source('app', 'letter', '[id].tsx');

const MAMA = '11111111-1111-1111-1111-111111111111';
const PAPA = '22222222-2222-2222-2222-222222222222';
const NOW = '2026-10-03T09:00:00.000Z'; // Asha (born 13 March 2026) is in Month 6
const TODAY = store.todayISO(new Date(NOW));
let close: () => void = () => {};
let seq = 0;
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
let raw: ReturnType<typeof nodeDb>['db'];

beforeEach(() => {
  store.closeStore();
  const h = nodeDb();
  raw = h.db;
  close = h.close;
  expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => NOW, newId }).ok).toBe(true);
});
afterEach(() => {
  store.closeStore();
  close();
});

const asha = () => store.addChild({ name: 'Asha', birthday: '2026-03-13', dueDate: null, signsAs: 'Mama' }).id;
const child = (id: string) => store.getChild(id)!;
const typedDraft = (childId: string, text: string) =>
  store.createDraft({ childId, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: text });
const saidOnOf = (d: { createdAt: string }) => store.todayISO(new Date(d.createdAt));

/** Keep, as review.tsx's save builds the letter: the about-day from the live draft row, captured_at from the draft. */
function keepAsReview(draftId: string): string {
  const live = store.getDraft(draftId)!;
  const day = reviewAboutDay(live, saidOnOf(live));
  const words = live.typedText ?? '';
  expect(
    store.saveLetterFromDraft(draftId, {
      id: draftId, kind: 'letter', occurredOn: day.occurredOn, occurredPrecision: day.occurredPrecision, capturedAt: live.createdAt,
      captureMode: 'typed', editLevel: 'verbatim', promptKey: null, engineVersion: 5, rawTranscript: words, machineEdits: [],
      finalText: words, inBook: true, soundsLikeMe: null, childId: live.childId!, authorSignsAs: 'Mama', audioUri: null,
    }),
  ).toBe(true);
  return draftId;
}
const dates = (id: string) => raw.get<{ occurred_on: string; occurred_precision: string; captured_at: string }>(
  'SELECT occurred_on, occurred_precision, captured_at FROM entries WHERE id = ?', id);

describe('[NS-15-R1] the author can set the day a letter is about', () => {
  it('Review: the dateline on the letter sheet is a button that opens DateSheet, and its Save writes the pick to the draft', () => {
    expect(review).toMatch(/<ReviewDayLine[\s\S]{0,300}hint=\{copy\.book\.entryMenu\.changeDate\}\s*onPress=\{!later && !editing \? openDay : undefined\}/);
    expect(review).toMatch(/const openDay = \(\) => \{\s*haptic\('tap'\);\s*setDateOpen\(true\);\s*\};/);
    expect(review).toMatch(/<DateSheet open=\{dateOpen\} child=\{child\} entry=\{about\} todayISO=\{todayISO\(\)\} onClose=\{\(\) => setDateOpen\(false\)\} onSave=\{changeDay\} \/>/);
    expect(review).toMatch(/if \(!setDraftOccurred\(draft\.id, next\.occurredOn, next\.precision\)\) return toast\.show\(\{ message: copy\.errors\.generic\.title \}\);/);
  });

  it('the letter page: Change the date opens DateSheet, and its Save is one setEntryDate (as built)', () => {
    expect(letterPage).toMatch(/title=\{copy\.book\.entryMenu\.changeDate\}[\s\S]{0,120}onPress=\{\(\) => setDateOpen\(true\)\}/);
    expect(letterPage).toMatch(/<DateSheet open=\{dateOpen\} child=\{child\} entry=\{entry\} todayISO=\{todayISO\(\)\}[^\n]*onSave=\{changeDate\} \/>/);
    expect(letterPage).toMatch(/if \(!setEntryDate\(entry\.id, next\.occurredOn, next\.precision\)\) return toast\.show/);
  });

  it('the pick Review saves goes on the draft, and a held draft keeps it', () => {
    const d = typedDraft(asha(), 'You slept on my chest all afternoon.');
    expect(reviewAboutDay(d, saidOnOf(d))).toEqual({ occurredOn: TODAY, occurredPrecision: 'day' }); // "today" until changed
    expect(store.setDraftOccurred(d.id, '2026-05-20', 'day')).toBe(true);
    expect(store.holdDraft(d.id, { inBookChoice: true })).toBe(true);
    expect(reviewAboutDay(store.getDraft(d.id)!, saidOnOf(d))).toEqual({ occurredOn: '2026-05-20', occurredPrecision: 'day' });
  });
});

describe('[NS-15-R2] the book files by the about-day', () => {
  it('a letter said in Month 6 about a day in Month 2: Review\'s header says Month 2, and Keep files it in Month 2', () => {
    const c = asha();
    const d = typedDraft(c, 'The day you first held your head up.');
    const pick = resolvePick(child(c), { precision: 'day', occurredOn: '2026-05-20' }, TODAY)!;
    expect(store.setDraftOccurred(d.id, pick.occurredOn, pick.precision)).toBe(true);
    const about = reviewAboutDay(store.getDraft(d.id)!, saidOnOf(d));
    expect(monthFor(child(c), about.occurredOn)).toBe(2);
    const id = keepAsReview(d.id);
    expect(dates(id)).toEqual({ occurred_on: '2026-05-20', occurred_precision: 'day', captured_at: NOW }); // said-on day kept
    const chapters = groupChapters(store.listEntriesForChild(c), child(c));
    expect(chapters.map((ch) => ch.key)).toEqual(['m2']);
    expect(chapters[0].data.map((e) => e.id)).toEqual([id]);
  });

  it('a month pick files as the month, with month precision; a day before the birthday files in Before You', () => {
    const c = asha();
    const m = typedDraft(c, 'Sometime that month you found your hands.');
    const month = resolvePick(child(c), { precision: 'month', key: 'm3' }, TODAY)!;
    store.setDraftOccurred(m.id, month.occurredOn, month.precision);
    const before = typedDraft(c, 'The night before you came.');
    store.setDraftOccurred(before.id, '2026-03-12', 'day');
    keepAsReview(m.id);
    keepAsReview(before.id);
    expect(dates(m.id)).toMatchObject({ occurred_on: month.occurredOn, occurred_precision: 'month' });
    expect(groupChapters(store.listEntriesForChild(c), child(c)).map((ch) => ch.key)).toEqual(['m3', 'before']);
  });

  it('review.tsx files by the about-day: the header month and the saved letter both come from reviewAboutDay', () => {
    expect(review).toMatch(/const about = reviewAboutDay\(draft, saidOnOf\(draft\)\);\s*const month = monthFor\(child, about\.occurredOn\);/);
    expect(review).toMatch(/const day = reviewAboutDay\(live, saidOnOf\(draft\)\);/);
    expect(review).toMatch(/occurredOn: day\.occurredOn,\s*occurredPrecision: day\.occurredPrecision,\s*capturedAt: draft\.createdAt,/);
    // The old filing by the day it was said is gone from the save and the header.
    expect(review).not.toMatch(/occurredOn: draft\.createdAt \? todayISO/);
  });

  it('a kept letter whose words arrived later opens Review in its own chapter, not the one it was said in', () => {
    const c = asha();
    const id = keepAsReview(typedDraft(c, 'You laughed at the dog.').id);
    store.setEntryDate(id, '2026-04-20', 'day');
    const later = laterWordsDraft({ ...store.getEntry(id)!, wordsUnreviewed: true }, () => true)!;
    expect(monthFor(child(c), reviewAboutDay(later, saidOnOf(later)).occurredOn)).toBe(1);
  });
});

describe('[NS-15-R3] both days are shown (the rule; the line itself waits for its content key)', () => {
  const ASHA = { birthday: '2026-03-13' };
  it('a letter said on another day than it is about shows both; said on the day it is about, one', () => {
    expect(showsBothDays(ASHA, { occurredOn: '2026-05-20', occurredPrecision: 'day' }, '2026-10-03')).toBe(true);
    expect(showsBothDays(ASHA, { occurredOn: '2026-10-03', occurredPrecision: 'day' }, '2026-10-03')).toBe(false);
  });
  it('a letter dated to a month shows both only when it was said in another month of age', () => {
    expect(showsBothDays(ASHA, { occurredOn: '2026-05-13', occurredPrecision: 'month' }, '2026-10-03')).toBe(true);
    expect(showsBothDays(ASHA, { occurredOn: '2026-09-13', occurredPrecision: 'month' }, '2026-10-03')).toBe(false);
  });
});

describe('[NS-15-R4] the app never reads a date from the words', () => {
  const DATED = 'Last Thursday, 3 March, you rolled over. On Monday the 9th of June we go to the sea. 12/04/2026.';

  it('a letter full of dates and weekdays keeps the day it was said until the parent picks one, through Keep', () => {
    const c = asha();
    const d = typedDraft(c, DATED);
    expect(store.setDraftTyped(d.id, `${DATED} Yesterday was Sunday.`)).toBeUndefined();
    expect(reviewAboutDay(store.getDraft(d.id)!, saidOnOf(d))).toEqual({ occurredOn: TODAY, occurredPrecision: 'day' });
    const id = keepAsReview(d.id);
    expect(dates(id)).toEqual({ occurred_on: TODAY, occurred_precision: 'day', captured_at: NOW });
  });

  it('nothing that computes the about-day takes the words: the logic has no text input, and each screen writes a date only from the sheet\'s pick', () => {
    const logic = source('components', 'capture', 'about-day.logic.ts');
    expect(logic).not.toMatch(/finalText|rawTranscript|typedText|words|photo|picture/i);
    expect(review.match(/setDraftOccurred\(/g)).toHaveLength(1);
    expect(review).toMatch(/const changeDay = \(next: \{ occurredOn: string; precision: OccurredPrecision \}\) =>/);
    expect(letterPage.match(/setEntryDate\(/g)).toHaveLength(1);
    expect(letterPage).toMatch(/const changeDate = \(next: \{ occurredOn: string; precision: OccurredPrecision \}\) =>/);
  });
});

describe('[NS-15-R5] bounds hold', () => {
  it(`no future day, and nothing earlier than ${BACKDATE_YEARS} years before the birthday`, () => {
    expect(BACKDATE_YEARS).toBe(3);
    const born = { birthday: '2026-03-13', dueDate: null };
    expect(dayBounds(born, TODAY)).toEqual({ min: '2023-03-13', max: TODAY });
    expect(resolvePick(born, { precision: 'day', occurredOn: '2026-10-04' }, TODAY)).toBeNull();
    expect(resolvePick(born, { precision: 'day', occurredOn: '2023-03-12' }, TODAY)).toBeNull();
    expect(resolvePick(born, { precision: 'day', occurredOn: '2023-03-13' }, TODAY)).toEqual({ occurredOn: '2023-03-13', precision: 'day' });
    expect(resolvePick(born, { precision: 'day', occurredOn: TODAY }, TODAY)).toEqual({ occurredOn: TODAY, precision: 'day' });
  });

  it('while expecting, the bounds come from the due date; Review gives the sheet today, so tomorrow is never offered', () => {
    const expecting = { birthday: null, dueDate: '2026-12-01' };
    expect(dayBounds(expecting, TODAY)).toEqual({ min: '2023-12-01', max: TODAY });
    expect(resolvePick(expecting, { precision: 'month', key: 'm0' }, TODAY)).toBeNull(); // no month tab before birth
    expect(review).toMatch(/<DateSheet[^\n]*todayISO=\{todayISO\(\)\}/);
  });
});

describe('[NS-15-R6] export has both dates', () => {
  it('every letter carries occurred_on, occurred_precision and captured_at, and a moved letter keeps the day it was said', async () => {
    const snap = ashaSnapshot();
    const moved = snap.entries.find((e) => e.id === 'e3')!;
    moved.occurredOn = '2026-03-20'; // about the first week, said on 20 April
    const { files } = await dataFiles(snap, planExport(snap), new Map(), async (t) => `sha-${t.length}`);
    const rows = JSON.parse(files.find((f) => f.path === 'data/entries.json')!.text).entries as Record<string, unknown>[];
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(r).toHaveProperty('occurred_on');
      expect(r).toHaveProperty('captured_at');
      expect(['day', 'month']).toContain(r.occurred_precision);
    }
    expect(rows.find((r) => r.id === 'e3')).toMatchObject({ occurred_on: '2026-03-20', occurred_precision: 'day', captured_at: '2026-04-20T19:30:00.000Z' });
    expect(rows.find((r) => r.id === 'e11')).toMatchObject({ occurred_precision: 'month' });
  });
});

describe('[NS-15-R7] only the author moves a letter', () => {
  it('the letter page offers Change the date and mounts DateSheet only for the author\'s own letter in a book this phone keeps', () => {
    expect(letterPage).toMatch(/const editable = own && !readOnly;/);
    const actions = letterPage.slice(letterPage.indexOf('{editable && ('), letterPage.indexOf('{readOnly && own && ('));
    expect(actions).toContain('copy.book.entryMenu.changeDate');
    expect(letterPage.slice(letterPage.indexOf('{readOnly && own && (')).match(/entryMenu\.changeDate/g)).toBeNull();
    expect(letterPage).toMatch(/\{editable && \(\s*<DateSheet /);
  });

  it('the store refuses a move of the other parent\'s letter, so no screen can make one', () => {
    const c = asha();
    takeOwnership(raw, MAMA, { now: NOW, newId });
    const id = newId();
    raw.run(
      `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits,
         final_text, in_book, updated_at, child_id, author_id, server_version, sync_state) VALUES (?, 'letter', '2026-08-01', ?, 'typed', 'verbatim', 5, '', '[]', 'From Papa.', 1, ?, ?, ?, '9', 'synced')`,
      id, NOW, NOW, c, PAPA,
    );
    expect(store.setEntryDate(id, '2026-05-13', 'month')).toBe(false);
    expect(dates(id)).toMatchObject({ occurred_on: '2026-08-01', occurred_precision: 'day' });
  });

  it('Review\'s dateline is a control only for a draft being kept here, and DateSheet is not mounted for a kept letter', () => {
    expect(review).toMatch(/\{!later && \(\s*<DateSheet /);
    expect(review).toMatch(/if \(!draft \|\| later\) return;\s*if \(!setDraftOccurred/);
  });
});

describe('[NS-15-R11] removed with the letter', () => {
  it('Erase everything: no row on the phone keeps the about-day or the said-on day of a letter or a held draft', () => {
    const c = asha();
    const d = typedDraft(c, 'Your first bath.');
    store.setDraftOccurred(d.id, '2023-07-04', 'day');
    const id = keepAsReview(d.id);
    const held = typedDraft(c, 'Your first swim.');
    store.setDraftOccurred(held.id, '2023-08-09', 'day');
    store.holdDraft(held.id, { inBookChoice: true });
    store.setEntryDate(id, '2023-07-05', 'day');
    expect(store.eraseEverythingLocal(() => {}, () => {})).toBe('erased');
    store.finishEraseEverything();
    const tables = raw.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").map((t) => t.name);
    const left = tables.flatMap((t) => raw.all<Record<string, unknown>>(`SELECT * FROM "${t}"`).map((r) => ({ t, r: JSON.stringify(r) })));
    for (const needle of [id, held.id, '2023-07-04', '2023-07-05', '2023-08-09', NOW]) {
      expect(left.filter((x) => x.r.includes(needle)).map((x) => x.t)).toEqual([]);
    }
  });
});

describe('[NS-15-R18] no date from a picture', () => {
  it('no picture code writes a letter\'s or a draft\'s day: the about-day moves only by DateSheet', () => {
    const dirs = [join(SRC, 'lib', 'photos'), join(SRC, 'components', 'photos')];
    for (const dir of dirs) {
      for (const f of readdirSync(dir).filter((n) => /\.tsx?$/.test(n))) {
        expect(stripComments(readFileSync(join(dir, f), 'utf8')), f).not.toMatch(/setDraftOccurred|setEntryDate|setOccurred|occurredOn|occurred_on/);
      }
    }
  });
});
