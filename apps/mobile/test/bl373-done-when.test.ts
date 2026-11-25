/// <reference types="node" />
/**
 * BL-373 (D-082, D-083): two of the row's Done-when points, held at the app level where packages/core's tests cannot
 * reach them.
 *
 *  - "The allowance is read from one constant." The number of free letters lives in packages/core
 *    (DEFAULT_FREE_LETTERS, raised only through freeLettersFrom). Remote config (packages/api) keeps a bundled copy for
 *    its schema, pinned equal here. No file on the phone compares the allowance or the letter count with a number of
 *    its own, so a change to the reviewed default reaches every screen at once.
 *  - "A lapsed member can read, play and export every letter and cannot add one." Adding is decided at the Keep step
 *    only (keep-step.ts, plan.ts decideKeepLetter). The surfaces that read, play, find, export, share, back up or
 *    restore a letter never call the Keep gate or read the plan, except `hasPlus() ? 'plus' : 'free'` to label a count
 *    or a manifest, and never compare that label. Failure mode this catches: a future "if (!hasPlus()) return" on export or playback,
 *    which would lock a lapsed family out of letters they already have (LEGAL-REQ-050).
 *
 * Source checks, like billing-f5-lines.test.ts: comments are stripped before matching, one line at a time. Known
 * limit: lib/store.ts is not a surface here (it also holds the Keep step's holdDraft); its restore paths are covered
 * by the store tests. Fixtures: none.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BUNDLED_FREE_LETTERS, MAX_FREE_LETTERS as API_MAX_FREE_LETTERS } from '@scribe/api';
import { DEFAULT_FREE_LETTERS, MAX_FREE_LETTERS } from '@scribe/core';

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) =>
  readFileSync(join(SRC, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

function filesUnder(rel: string): string[] {
  const out: string[] = [];
  const walk = (abs: string) => {
    for (const e of readdirSync(abs, { withFileTypes: true })) {
      const p = join(abs, e.name);
      if (e.isDirectory()) {
        if (e.name !== '__tests__') walk(p);
      } else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) {
        out.push(relative(SRC, p));
      }
    }
  };
  walk(join(SRC, rel));
  return out.sort();
}

describe('[BL-373] the free-letter allowance is read from one constant', () => {
  // A number from 1 up compared with the allowance or the letter count, in either order (`allowance === 2`,
  // `freeLettersAllowance() >= 2`, `2 <= kept`), or used to clamp the allowance (`Math.max(2, allowance)`). Zero checks
  // (`kept === 0`) are about "none yet", not the allowance, and stay allowed.
  const NAME = String.raw`(?:\b(?:allowance|lettersKept|kept|lettersLeft)\b|freeLettersAllowance\(\))`;
  const OP = String.raw`(?:===|!==|==|!=|>=|<=|>|<)`;
  const N = String.raw`\b[1-9]\d*\b`;
  const LITERAL_COMPARE = new RegExp(String.raw`${NAME}\s*${OP}\s*${N}|${N}\s*${OP}\s*${NAME}|Math\.(?:min|max)\([^)]*${N}[^)]*\ballowance\b`);

  const phone = filesUnder('.');

  it('the rule itself: what it catches and what it leaves alone', () => {
    for (const bad of ['allowance === 2', 'freeLettersAllowance() >= 2', '2 <= kept', 'if (lettersKept > 1) x()', 'Math.max(2, g.allowance)'])
      expect(LITERAL_COMPARE.test(bad), bad).toBe(true);
    for (const ok of ['kept === 0', 'lettersLeft <= 0', 'allowance === DEFAULT_FREE_LETTERS', 'kept + 1', 'Math.min(1000, g.lettersKept)'])
      expect(LITERAL_COMPARE.test(ok), ok).toBe(false);
  });

  it('reads every source file on the phone (the walk is not empty)', () => {
    expect(phone).toContain('lib/billing/keep-step.ts');
    expect(phone.length).toBeGreaterThan(200);
  });

  it('no file on the phone compares the allowance or the letter count with a number of its own', () => {
    const hits = phone.flatMap((rel) => code(rel).split('\n').filter((l) => LITERAL_COMPARE.test(l)).map((l) => `${rel}: ${l.trim()}`));
    expect(hits).toEqual([]);
  });

  it('the "second free letter" line and the analytics clamps use the constants from packages/core', () => {
    const src = code('lib/billing/keep-step.ts');
    expect(src).toMatch(/import \{ DEFAULT_FREE_LETTERS, MAX_FREE_LETTERS \} from '@scribe\/core';/);
    expect(src).toMatch(/return allowance === DEFAULT_FREE_LETTERS;/);
    expect(src).toMatch(/Math\.min\(MAX_FREE_LETTERS, Math\.max\(DEFAULT_FREE_LETTERS, g\.allowance\)\)/);
    expect(src).toMatch(/Math\.min\(MAX_FREE_LETTERS, allowance\)/);
  });

  it('remote config bundles the same default and cap as packages/core', () => {
    expect(DEFAULT_FREE_LETTERS).toBe(2);
    expect(BUNDLED_FREE_LETTERS).toBe(DEFAULT_FREE_LETTERS);
    expect(API_MAX_FREE_LETTERS).toBe(MAX_FREE_LETTERS);
  });
});

describe('[BL-373, LEGAL-REQ-050] reading, playing, exporting and restoring never meet the Keep gate', () => {
  // Every way into the Keep decision or the plan on the phone. A surface that only shows or hands over letters that
  // exist must reach none of them.
  const KEEP_GATE = /\b(keepSheetFor|keepGateFor|keepLetterGate|decideKeepLetter|countAfterSave|PlusGate|freeLettersAllowance|lettersKeptNow)\b/;
  const PLAN_READ = /\b(usePlan|plusOn|planActive|isAllowed|getPlan|planReadiness)\b|\bdecide\(/;
  // hasPlus() may label a count or a manifest ("plus" or "free"), and the label is never compared.
  const HAS_PLUS_CALL = /hasPlus\(\)/g;
  const LABEL_ONLY = /hasPlus\(\) \? 'plus' : 'free'/g;
  const LABEL_COMPARED = /(===|!==|==|!=)\s*'(plus|free)'|'(plus|free)'\s*(===|!==|==|!=)/;

  const one = (rel: string) => [rel];
  const surfaces = [
    ...filesUnder('app/letter'),
    ...one('app/(tabs)/book.tsx'),
    ...one('app/(tabs)/moments.tsx'),
    ...one('app/read-together.tsx'),
    ...one('app/settings/export.tsx'),
    ...one('app/settings/backup.tsx'),
    ...one('app/settings/recently-deleted.tsx'),
    ...one('app/settings/children/hidden.tsx'),
    ...filesUnder('app/settings/left-book'),
    ...filesUnder('components/book'),
    ...filesUnder('components/player'),
    ...filesUnder('components/find'),
    ...filesUnder('lib/player'),
    ...filesUnder('lib/export'),
    ...filesUnder('lib/backup'),
    ...filesUnder('lib/find'),
    ...one('lib/read-it-back.ts'),
    ...one('lib/resilience/recovery-export.ts'),
    ...one('lib/resilience/recovery-export.logic.ts'),
  ];

  it('the list of surfaces is real (every file exists and each folder was walked)', () => {
    for (const dir of ['app/letter/', 'components/book/', 'lib/export/', 'lib/backup/', 'lib/player/', 'lib/find/'])
      expect(surfaces.filter((s) => s.startsWith(dir)).length, dir).toBeGreaterThan(0);
    for (const s of surfaces) expect(() => code(s), s).not.toThrow();
  });

  it.each(surfaces)('%s never calls the Keep gate or reads the plan', (rel) => {
    const src = code(rel);
    expect(src, rel).not.toMatch(KEEP_GATE);
    expect(src, rel).not.toMatch(PLAN_READ);
  });

  it.each(surfaces)('%s asks whether Plus is on only to label, never to stop', (rel) => {
    const src = code(rel);
    const calls = src.match(HAS_PLUS_CALL)?.length ?? 0;
    const labels = src.match(LABEL_ONLY)?.length ?? 0;
    expect(calls, rel).toBe(labels);
    if (calls > 0) expect(src, rel).not.toMatch(LABEL_COMPARED);
  });
});
