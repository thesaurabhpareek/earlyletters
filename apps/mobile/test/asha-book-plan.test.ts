/// <reference types="node" />
/**
 * The seeded Asha book (MEASUREMENT-PLAN.md section 3, helper H2; test plan b13 file 06, cases P06, P07, M01 wait on
 * it). Every check here is about the fixture itself: no timing, no threshold. Fictional family only.
 */
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import * as entries from '../src/lib/db/repos/entries';
import { DEFAULT_SEED, planBook, planSha256, RANGE, SIZES } from '../../../scripts/qa/asha-book/plan.mjs';
import { ASHA_BOOK_ID, buildAshaBook, entryOf, letterId } from './helpers/asha-book-db';

const dir = mkdtempSync(join(tmpdir(), 'asha-book-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex');
// Kept apart from VOCAB on purpose, so adding a word to the generator turns this test red.
const ENGLISH = new Set("asha laughed rain window dal nani papa mama morning blanket spoon giggle sleepy garden shoes bath song kitten bubbles walked clapped sunny cuddle story yellow cup puddle".split(" "));
const NON_LATIN = /^[\p{Script=Devanagari}\p{Script=Arabic}\p{Script=Han}]+$/u;
const allowed = (w: string) => ENGLISH.has(w) || NON_LATIN.test(w);

describe('[NS-34-R5] seeded book is generated and fictional', () => {
  it('[NS-34-R5] same seed gives the same plan and the same database bytes; another seed differs', () => {
    expect(planSha256(planBook({ seed: DEFAULT_SEED }))).toBe(planSha256(planBook({ seed: DEFAULT_SEED })));
    const files = ['a', 'b', 'c'].map((n) => join(dir, `${n}.db`));
    const dbs = [DEFAULT_SEED, DEFAULT_SEED, 7].map((seed, i) => buildAshaBook({ seed, ...SIZES.small, path: files[i] }));
    dbs.forEach((d) => d.close());
    expect(sha(files[0])).toBe(sha(files[1]));
    expect(sha(files[0])).not.toBe(sha(files[2]));
  });

  it('[NS-34-R5] the plan for seed 20261120 is pinned, so drift is visible', () => {
    expect(planSha256(planBook({ seed: DEFAULT_SEED }))).toBe('eb143dd2be70b7d49bc697a75756cf17d67d3f7ed8b4c41be75cc67352c8d2db');
  });

  it('[NS-34-R5] 1,000 letters and 300 pictures on 300 distinct letters, with the shape the plan names', () => {
    const { items } = planBook({ seed: DEFAULT_SEED });
    expect(items).toHaveLength(1000);
    const pics = items.filter((i) => i.picture);
    expect(pics).toHaveLength(300);
    expect(new Set(pics.map((i) => i.picture!.file)).size).toBe(300);
    expect(pics.every((i) => i.picture!.bytes >= 2_000_000 && i.picture!.bytes <= 4_000_000)).toBe(true);
    expect(pics.filter((i) => i.picture!.format === 'png')).toHaveLength(10);
    expect(pics.filter((i) => i.picture!.orientation !== 1)).toHaveLength(10);
    expect(items.filter((i) => i.deleted)).toHaveLength(20);
    expect(items.filter((i) => i.words === 4000)).toHaveLength(3);
    for (const l of ['hi', 'ar', 'zh']) expect(items.filter((i) => i.language === l)).toHaveLength(10);
    expect(items.filter((i) => i.words < 20 || i.words > 4000)).toHaveLength(0);
    const perMonth = new Map<string, number>();
    items.forEach((i) => perMonth.set(i.date.slice(0, 7), (perMonth.get(i.date.slice(0, 7)) ?? 0) + 1));
    expect(perMonth.size).toBe(60);
    expect(Math.min(...perMonth.values())).toBeGreaterThanOrEqual(3);
    expect(Math.max(...perMonth.values())).toBe(60);
  });

  it('[NS-34-R5] every letter has a real calendar date inside the range', () => {
    for (const { date } of planBook({ seed: DEFAULT_SEED }).items) {
      expect(date >= RANGE.from && date <= RANGE.to).toBe(true);
      expect(new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10)).toBe(date);
    }
  });

  it('[NS-34-R5] no field holds anything outside the Asha vocabulary', () => {
    const { items } = planBook({ seed: DEFAULT_SEED });
    for (const i of items) {
      for (const w of i.text.split(' ')) expect(allowed(w)).toBe(true);
      expect(i.picture === null || /^asha-\d+\.(jpg|png)$/.test(i.picture.file)).toBe(true);
      expect(i.audio === null || /^[0-9a-f]{64}$/.test(i.audio.sha256)).toBe(true);
    }
    // The stored rows carry the same words and nothing else: ids and audio names are generated, the author is Asha's book.
    const book = buildAshaBook({ ...SIZES.small });
    for (const e of entries.listForChild(book.ctx, ASHA_BOOK_ID)) {
      for (const w of e.rawTranscript.split(' ')) expect(allowed(w)).toBe(true);
      expect(e.authorSignsAs).toBe('Mama');
      expect(e.audioUri === null || /^file:\/\/\/Documents\/asha-\d+\.m4a$/.test(e.audioUri ?? '')).toBe(true);
    }
    book.close();
  });

  it('[NS-34-R5] the full book round-trips through the store reader', () => {
    const book = buildAshaBook({ seed: DEFAULT_SEED });
    const live = entries.listForChild(book.ctx, ASHA_BOOK_ID);
    const gone = entries.listDeleted(book.ctx);
    expect(live).toHaveLength(980);
    expect(gone).toHaveLength(20);
    expect(book.pictures).toHaveLength(300);
    const byId = new Map([...live, ...gone].map((e) => [e.id, e]));
    expect(byId.size).toBe(1000);
    for (const item of book.plan.items) {
      const got = byId.get(letterId(item))!;
      const want = entryOf(item);
      expect(got.rawTranscript).toBe(want.rawTranscript);
      expect(got.finalText).toBe(want.finalText);
      expect(got.occurredOn).toBe(item.date);
      expect(got.language).toBe(item.language);
      expect(got.baseDirection).toBe(want.baseDirection);
      expect(got.captureMode).toBe(want.captureMode);
      expect(got.audioSha256 ?? null).toBe(item.audio?.sha256 ?? null);
    }
    // PERF-ROW: P06 / NFR S-01 and P19 / NFR Q-02 plug in here with this book. This file asserts no timing.
    book.close();
  });
});
