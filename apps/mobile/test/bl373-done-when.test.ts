/// <reference types="node" />
/**
 * BL-373 (D-082, D-083): two of the row's Done-when points, held at the app level where packages/core's tests cannot
 * reach them.
 *
 *  - "The allowance is read from one constant." The number of free letters lives in packages/core
 *    (DEFAULT_FREE_LETTERS, raised only through freeLettersFrom). No billing file on the phone compares the allowance
 *    or the letter count with a number of its own, so a change to the reviewed default reaches every screen at once.
 *  - "A lapsed member can read, play and export every letter and cannot add one." Adding is decided at the Keep step
 *    only (keep-step.ts, plan.ts decideKeepLetter). The surfaces that read, play, export, share or restore a letter
 *    never call the Keep gate, and where they ask whether Plus is on, it is only to label a count or a manifest,
 *    never to stop anything. Failure mode this catches: a future "if (!hasPlus()) return" on export or playback,
 *    which would lock a lapsed family out of letters they already have (LEGAL-REQ-050).
 *
 * Source checks, like billing-f5-lines.test.ts: comments are stripped before matching. Fixtures: none.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_FREE_LETTERS } from '@scribe/core';

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
  // A number compared with the allowance or the letter count, in either order: `allowance === 2`, `lettersKept >= 2`,
  // `2 <= kept`. The ledger's own counts (kept + 1) are arithmetic, not comparisons, and stay allowed.
  const LITERAL_COMPARE =
    /\b(allowance|lettersKept|kept|lettersLeft)\b\s*(===|!==|==|!=|>=|<=|>|<)\s*\d|\d\s*(===|!==|==|!=|>=|<=|>|<)\s*\b(allowance|lettersKept|kept|lettersLeft)\b/;

  const billing = filesUnder('lib/billing');

  it('reads every billing file on the phone (the walk is not empty)', () => {
    expect(billing).toContain('lib/billing/keep-step.ts');
    expect(billing).toContain('lib/billing/gates.ts');
  });

  it.each(billing)('%s compares the allowance and the letter count with no number of its own', (rel) => {
    const lines = code(rel).split('\n').filter((l) => LITERAL_COMPARE.test(l));
    expect(lines, rel).toEqual([]);
  });

  it('the "second free letter" line is tied to the reviewed default from packages/core', () => {
    const src = code('lib/billing/keep-step.ts');
    expect(src).toMatch(/import \{ DEFAULT_FREE_LETTERS \} from '@scribe\/core';/);
    expect(src).toMatch(/return allowance === DEFAULT_FREE_LETTERS;/);
    expect(DEFAULT_FREE_LETTERS).toBe(2);
  });
});

describe('[BL-373, LEGAL-REQ-050] reading, playing, exporting and restoring never meet the Keep gate', () => {
  // Every way into the Keep decision on the phone. A surface that only shows or hands over letters that exist must
  // reach none of them.
  const KEEP_GATE = /\b(keepSheetFor|keepGateFor|keepLetterGate|decideKeepLetter|countAfterSave|PlusGate)\b/;
  // hasPlus() may label a count or a manifest ("plus" or "free"); any other use could become a stop.
  const HAS_PLUS_CALL = /hasPlus\(\)/g;
  const LABEL_ONLY = /hasPlus\(\) \? 'plus' : 'free'/g;

  const surfaces = [
    'app/letter/[id].tsx',
    'components/player/audio-player.tsx',
    'app/read-together.tsx',
    'app/settings/export.tsx',
    'app/settings/recently-deleted.tsx',
    ...filesUnder('lib/export'),
  ];

  it('the list of surfaces is real (every file exists and the export folder was walked)', () => {
    expect(surfaces.filter((s) => s.startsWith('lib/export/')).length).toBeGreaterThan(3);
    for (const s of surfaces) expect(() => code(s), s).not.toThrow();
  });

  it.each(surfaces)('%s never calls the Keep gate', (rel) => {
    expect(code(rel), rel).not.toMatch(KEEP_GATE);
  });

  it.each(surfaces)('%s asks whether Plus is on only to label, never to stop', (rel) => {
    const src = code(rel);
    const calls = src.match(HAS_PLUS_CALL)?.length ?? 0;
    const labels = src.match(LABEL_ONLY)?.length ?? 0;
    expect(calls, rel).toBe(labels);
  });
});
