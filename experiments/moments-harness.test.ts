/**
 * The Moments real-library harness (BL-1449, PR 3b) on synthetic fixtures only: the fictional
 * family "Asha", made-up days and made-up place cells. No real library, date or place is here.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { main } from './moments-harness';
import { groupByDay } from '../packages/core/src/moments/group';
import { cells, choose, evaluateCell, isEligible, parseExport, parseJunk, render, rulesFor, runGrid, toWindow, WRONG_REASON_STATUS } from './moments-harness-lib';
import { GRID, MAX_WRONG_REASONS } from './moments-bar';

const LIB = readFileSync(join(__dirname, 'fixtures/moments-asha-library.json'), 'utf8');
const JUNK = readFileSync(join(__dirname, 'fixtures/moments-asha-junk.txt'), 'utf8');
const rows = parseExport(LIB);
const junk = parseJunk(JUNK);
const run = runGrid(rows, junk);
const at = (predicate: 'span' | 'busyHours', minSpanHours: number, nearSeconds = 10, nearGroupMax = 60, placeRareShare = 0.15) =>
  run.results.find(
    (r) => r.predicate === predicate && r.minSpanHours === minSpanHours && r.nearSeconds === nearSeconds && r.nearGroupMax === nearGroupMax && r.placeRareShare === placeRareShare,
  )!;

describe('moments real-library harness', () => {
  it('[NS-53-R205] runs every cell of the 7.2a grid for both predicates', () => {
    expect(cells('span')).toHaveLength(81);
    expect(GRID.minSpanHours.length * GRID.nearSeconds.length * GRID.nearGroupMax.length * GRID.placeRareShare.length).toBe(81);
    expect(run.results).toHaveLength(162);
  });

  it('[NS-53-R40] MIN_SPAN moves the span rule: 2h05 qualifies at 2h, 1h40 only at 1h (Asha goldens)', () => {
    expect(at('span', 1).qualifyingDays).toBe(20);
    expect(at('span', 2).qualifyingDays).toBe(19);
    expect(at('span', 3).qualifyingDays).toBe(18);
  });

  it('[NS-53-R40] the near-duplicate cells change candidates: 40 frames 3 s apart are 2 candidates by default, never 1 chain (spec 7.2a golden)', () => {
    const { window, offsetAt } = toWindow(rows);
    const biggest = (nearSeconds: number, nearGroupMax: number) =>
      groupByDay(window, offsetAt, rulesFor({ predicate: 'span', minSpanHours: 2, nearSeconds, nearGroupMax, placeRareShare: 0.15 })).find((d) => d.dayKey === '2026-02-10')!.candidates.length;
    expect(biggest(10, 60)).toBe(2);
    expect(biggest(5, 30)).toBe(4);
    expect(biggest(20, 120)).toBe(1);
  });

  it('[NS-53-R205] the wrong-reason count is 0 in every cell', () => {
    expect(run.results.every((r) => r.wrongReasons === 0)).toBe(true);
  });

  it('[NS-53-R281] counts junk marks as a share of qualifying days and applies the bar before any use of the verb', () => {
    expect(at('span', 2).junkDays).toBe(2);
    expect(at('span', 2).junkShare).toBeCloseTo(2 / 19, 10);
    expect(at('span', 3).junkDays).toBe(1);
    expect(render(run)).toContain('bar met');
  });

  it('[NS-53-R205] the decision rule: lowest junk share among eligible cells, ties to the larger MIN_SPAN', () => {
    const c = run.chosen.span!;
    expect(c.eligible).toBe(true);
    expect(c.junkShare).toBeCloseTo(1 / 18, 10);
    expect(c.minSpanHours).toBe(3);
    const base = at('span', 2);
    const mk = (minSpanHours: number, junkShare: number, eligible = true) => ({ ...base, minSpanHours, junkShare, eligible });
    expect(choose([mk(1, 0.1), mk(3, 0.1), mk(2, 0.1)])!.minSpanHours).toBe(3);
    expect(choose([mk(1, 0.05), mk(3, 0.1)])!.minSpanHours).toBe(1);
    expect(choose([mk(1, 0.0, false), mk(2, 0.2)])!.junkShare).toBe(0.2);
    expect(choose([mk(1, 0.0, false)])).toBeNull();
  });

  it('[NS-53-R205] a cell with fewer than 3 qualifying days in 14 is not eligible', () => {
    const { window, offsetAt } = toWindow(rows.filter((r) => !r.fav));
    const r = evaluateCell(window, offsetAt, junk, { predicate: 'span', minSpanHours: 2, nearSeconds: 10, nearGroupMax: 60, placeRareShare: 0.15 });
    expect(r.qualifyingPer14).toBeLessThan(3);
    expect(r.eligible).toBe(false);
  });

  it('[NS-53-R205] prints counts and rates only: no day key, place cell, id or date reaches the output', () => {
    const lines: string[] = [];
    expect(main(['lib', 'junk'], (p) => (p === 'lib' ? LIB : JUNK), (s) => lines.push(s))).toBe(0);
    const text = lines.join('\n');
    expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    for (const k of junk) expect(text).not.toContain(k);
    expect(text).not.toContain('cell-home');
    expect(text).not.toContain('cell-away');
    expect(text).not.toMatch(/\br\d+\b/);
  });

  it('[NS-53-R205] writes nothing: the harness sources hold no file write, network or clock call', () => {
    for (const f of ['moments-harness.ts', 'moments-harness-lib.ts']) {
      const src = readFileSync(join(__dirname, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      expect(src).not.toMatch(/writeFile|appendFile|createWriteStream|mkdir|fetch\(|https?:|Date\.now|new Date\(|Math\.random|spawn|exec\(/);
    }
  });

  it('[NS-53-R205] the junk file takes day keys only, and a bad file is refused without echoing it', () => {
    expect(() => parseJunk('2026-01-20\nAsha had a lovely day\n')).toThrow(/day key/);
    expect(() => parseJunk('2026-13-45')).toThrow(/day key/);
    const out: string[] = [];
    expect(main(['lib', 'junk'], (p) => (p === 'lib' ? LIB : 'Asha had a lovely day'), (s) => out.push(s))).toBe(1);
    expect(out.join('')).not.toContain('Asha');
    const bad: string[] = [];
    expect(main(['lib', 'junk'], (p) => (p === 'lib' ? '{"rows": "secret words"' : JUNK), (s) => bad.push(s))).toBe(1);
    expect(bad.join('')).not.toContain('secret');
    expect(main([], () => '', () => undefined)).toBe(1);
  });

  it('[NS-53-R205] the fixtures are the fictional family and made-up cells only', () => {
    expect(new Set(rows.map((r) => r.place))).toEqual(new Set(['cell-home', 'cell-away']));
    expect(rows.every((r) => Number.isInteger(r.t) && r.t > 0)).toBe(true);
    expect(LIB).not.toMatch(/lat|lon|filename|name/i);
  });

  it('[NS-53-R205] a missing or unreadable file prints fixed words, never the path', () => {
    const out: string[] = [];
    expect(main(['/nonexistent/asha-private/export.json', 'junk'], (p) => readFileSync(p, 'utf8'), (s) => out.push(s))).toBe(1);
    expect(out.join('')).not.toMatch(/nonexistent|asha-private|ENOENT|export\.json/);
    expect(out.join('')).toContain('cannot read an input file');
    const odd: string[] = [];
    const boom = (): string => {
      throw new Error("EACCES: permission denied, open '/home/someone/secret-place.json'");
    };
    expect(main(['a', 'b'], boom, (s) => odd.push(s))).toBe(1);
    expect(odd.join('')).not.toMatch(/someone|secret|EACCES/);
  });

  it('[NS-53-R205] negative control: one wrong reason makes a cell ineligible, however many days qualify', () => {
    expect(MAX_WRONG_REASONS).toBe(0);
    expect(isEligible(10, 10, 0)).toBe(true);
    expect(isEligible(10, 10, 1)).toBe(false);
    expect(isEligible(10, 2.9, 0)).toBe(false);
    expect(isEligible(0, 0, 0)).toBe(false);
  });

  it('[NS-53-R205] negative control: days more than 90 days before the newest asset do not count', () => {
    // The fixture holds three busy, hearted days in late 2025, outside the window. Without the 90-day filter they would qualify.
    const { window, offsetAt } = toWindow(rows);
    const all = groupByDay(window, offsetAt, rulesFor({ predicate: 'span', minSpanHours: 2, nearSeconds: 10, nearGroupMax: 60, placeRareShare: 0.15 }));
    expect(all.filter((d) => d.dayKey < '2025-12-31').length).toBe(3);
    expect(at('span', 2).qualifyingDays).toBe(19);
    expect(at('span', 2).windowDays).toBeLessThanOrEqual(90);
    expect(run.results.every((r) => r.windowDays <= 90)).toBe(true);
  });

  it('[NS-53-R281] a junk key outside the window is counted apart and never as a junk day', () => {
    expect(run.junkMarksInWindow).toBe(3);
    expect(run.junkMarksOutside).toBe(1);
    expect(at('span', 2).junkDays).toBe(2);
    const text = render(run);
    expect(text).toContain('junk marks in the 90-day window: 3; outside it, ignored: 1');
    expect(text).toContain('repair bar after one use: 20%');
  });

  it('[NS-53-R205] the wrong-reason count is documented as a placeholder in the code, the output and the README', () => {
    expect(WRONG_REASON_STATUS).toMatch(/^placeholder/);
    expect(render(run)).toContain('wrong-reason count: placeholder');
    const lib = readFileSync(join(__dirname, 'moments-harness-lib.ts'), 'utf8');
    expect(lib).toContain('PLACEHOLDER that cannot fail today');
    const readme = readFileSync(join(__dirname, 'README.md'), 'utf8');
    expect(readme).toMatch(/wrong-reason count is a placeholder that cannot fail today/);
  });

  it('[NS-53-R205] the eligibility rate is per 14 days, as the spec decision rule says', () => {
    expect(at('span', 2).qualifyingPer14).toBeCloseTo((19 * 14) / at('span', 2).windowDays, 10);
  });
});
