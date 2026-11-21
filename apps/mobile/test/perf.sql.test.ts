/// <reference types="node" />
/**
 * BL-1402: the phone's local store at five years of use, timed on the SQL path.
 *
 * This times the app's real local database (node:sqlite with the app's MIGRATIONS, the repos the Book and
 * Tonight screens read through) on a CI machine. It is NOT a phone figure: phone timings come from the
 * Maestro runs (BL-1403) and the device run (BL-044). The budgets are BL-408's, not new ones.
 * Fixture: 2,000 letters for the fictional family Asha (two children, 1,000 each, over five years).
 */
import { describe, expect, it } from 'vitest';
import { entries, children, letters, settings } from '../src/lib/db/repos';
import { fixture, insertBook, letter } from './helpers/store-fixture';

/** The one place the budgets and the sample count are named (BL-408, PRD 7.1). */
export const BUDGETS = { chapterMs: 500, saveMs: 200, switchMs: 300 } as const;
export const SAMPLES = 40;
export const LETTERS_TOTAL = 2000;
export const CHAPTER_SIZE = 60;

const ASHA = 'child-asha';
const NIA = 'child-nia';

/** Nearest-rank p95. */
export function p95(samples: number[]): number {
  const s = [...samples].sort((a, b) => a - b);
  return s[Math.ceil(0.95 * s.length) - 1];
}

/** Times `fn` `n` times; returns the elapsed milliseconds of each run. */
export function time(n: number, fn: (i: number) => void): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = performance.now();
    fn(i);
    out.push(performance.now() - t);
  }
  return out;
}

/** True when the p95 of the samples is inside the budget. */
export const within = (samples: number[], budgetMs: number): boolean => p95(samples) <= budgetMs;

const day = (i: number): string => {
  // 1,000 letters per child spread over five years (about 1.8 days apart), from 2021-11-01.
  const d = new Date(Date.UTC(2021, 10, 1) + Math.floor((i * 1826) / 1000) * 86_400_000);
  return d.toISOString().slice(0, 10);
};

function seeded() {
  const f = fixture();
  insertBook(f.db, { id: ASHA, name: 'Asha', birthday: '2021-10-01' });
  insertBook(f.db, { id: NIA, name: 'Nia', birthday: '2021-10-01' });
  settings.setSetting(f.ctx, 'activeChildId', ASHA);
  f.db.transaction(() => {
    for (let i = 0; i < LETTERS_TOTAL; i++) {
      const childId = i % 2 === 0 ? ASHA : NIA;
      const n = Math.floor(i / 2);
      entries.upsert(
        f.ctx,
        letter({
          id: `0199a5b0-0000-7000-8000-${i.toString(16).padStart(12, '0')}`,
          childId,
          occurredOn: day(n),
          capturedAt: `${day(n)}T08:30:00.000Z`,
          finalText: `Asha laughed at the rain, letter ${i}.`,
          rawTranscript: `um Asha laughed at the rain letter ${i}`,
        }),
        { childId, authorSignsAs: 'Mama' },
      );
    }
  });
  return f;
}

describe('[BL-1402] the local store at five years, SQL path on a CI machine', () => {
  const f = seeded();

  it('[BL-1402] the fixture is 2,000 letters in two children', () => {
    expect(entries.listForChild(f.ctx, ASHA)).toHaveLength(LETTERS_TOTAL / 2);
    expect(entries.listForChild(f.ctx, NIA)).toHaveLength(LETTERS_TOTAL / 2);
  });

  it('[BL-1402] a chapter of 60 letters reads inside 500 ms (p95)', () => {
    const t = time(SAMPLES, () => {
      const all = entries.listForChild(f.ctx, ASHA); // the Book's read, newest first
      expect(all.slice(0, CHAPTER_SIZE)).toHaveLength(CHAPTER_SIZE);
    });
    expect(p95(t)).toBeLessThanOrEqual(BUDGETS.chapterMs);
  });

  it('[BL-1402] one local save finishes inside 200 ms (p95)', () => {
    const t = time(SAMPLES, (i) => {
      f.tick();
      const id = `0199a5b1-0000-7000-8000-${i.toString(16).padStart(12, '0')}`;
      letters.saveFromDraft(f.ctx, id, letter({ id, childId: ASHA, finalText: `Asha, save ${i}.` }), { childId: ASHA, authorSignsAs: 'Mama' });
    });
    expect(p95(t)).toBeLessThanOrEqual(BUDGETS.saveMs);
  });

  it('[BL-1402] switching the active child (and reading its letters) finishes inside 300 ms (p95)', () => {
    const t = time(SAMPLES, (i) => {
      const to = i % 2 === 0 ? NIA : ASHA;
      settings.setSetting(f.ctx, 'activeChildId', to);
      expect(children.listVisible(f.ctx)).toHaveLength(2);
      expect(children.get(f.ctx, to)?.id).toBe(to);
      expect(entries.listForChild(f.ctx, to).length).toBeGreaterThan(CHAPTER_SIZE);
    });
    expect(p95(t)).toBeLessThanOrEqual(BUDGETS.switchMs);
  });

  it('[BL-1402] planted slow read: the budget check turns red on a slow path and green on the real one', () => {
    const slow = time(5, () => {
      // Planted slowness: an unindexed scan repeated until it costs more than the chapter budget.
      const end = performance.now() + BUDGETS.chapterMs + 20;
      while (performance.now() < end) f.db.all("SELECT count(*) FROM entries WHERE lower(final_text) LIKE '%rain%'");
    });
    expect(within(slow, BUDGETS.chapterMs)).toBe(false);
    const real = time(5, () => entries.listForChild(f.ctx, ASHA));
    expect(within(real, BUDGETS.chapterMs)).toBe(true);
  });
});
