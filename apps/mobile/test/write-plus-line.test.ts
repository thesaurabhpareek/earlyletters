/// <reference types="node" />
/**
 * The Plus line on Write (BL-560; F14-REQ-040, F04-REQ-045; catalog row RT-PLN-04): the Write half of Tonight's
 * standing line. Same component (components/tonight/plus-line.tsx, from #508), same rule (plusLineShows), never in an
 * alpha build (Karma ruling on #508), never a count or a button (founder decision F5). Node cannot load React Native,
 * so the rule runs here and the screen's use of it is checked in its source. Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MAX_FREE_LETTERS, type PlanView } from '@scribe/core';
import { describe, expect, it } from 'vitest';
import { plusLine, plusLineShows } from '../src/components/tonight/tonight-plus.logic';

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) =>
  readFileSync(join(SRC, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const NOW = '2026-11-08T20:30:00.000Z';
const plan = (over: Partial<PlanView> = {}): PlanView => ({ state: 'none', effectiveUntil: null, verifiedAt: null, environment: 'production', ...over }) as PlanView;
const ON = plan({ state: 'active', effectiveUntil: '2026-12-08T20:30:00.000Z', verifiedAt: NOW });
const LAPSED = plan({ state: 'expired', effectiveUntil: '2026-11-01T00:00:00.000Z', verifiedAt: NOW });

describe('the rule Write uses (the same as Tonight)', () => {
  it('store build: absent before the allowance is used, shown after, absent with Plus on', () => {
    expect(plusLineShows({ plan: plan(), now: NOW, lettersKept: 1, allowance: undefined, alpha: false })).toBe(false);
    expect(plusLineShows({ plan: plan(), now: NOW, lettersKept: 2, allowance: undefined, alpha: false })).toBe(true);
    expect(plusLineShows({ plan: LAPSED, now: NOW, lettersKept: 2, allowance: undefined, alpha: false })).toBe(true);
    expect(plusLineShows({ plan: ON, now: NOW, lettersKept: 40, allowance: undefined, alpha: false })).toBe(false);
  });

  it('alpha build: never, at any count, allowance or plan', () => {
    for (const lettersKept of [0, 2, 3, 99, 100, 101]) for (const allowance of [undefined, 3, MAX_FREE_LETTERS]) for (const p of [plan(), LAPSED, ON]) expect(plusLineShows({ plan: p, now: NOW, lettersKept, allowance, alpha: true })).toBe(false);
  });

  it('never before letters kept has been read', () => {
    expect(plusLineShows({ plan: plan(), now: NOW, lettersKept: null, allowance: undefined, alpha: false })).toBe(false);
  });

  it('a state with no number (F5)', () => {
    expect(plusLine()).not.toMatch(/\d|\$|price|trial|left|remaining/i);
  });
});

describe('Write wires it', () => {
  const screen = code('app/write.tsx');

  it('reuses #508\'s PlusLine and plusLineShows, nothing of its own', () => {
    expect(screen).toMatch(/import \{ PlusLine \} from '@\/components\/tonight\/plus-line';/);
    expect(screen).toMatch(/import \{ plusLineShows \} from '@\/components\/tonight\/tonight-plus\.logic';/);
    expect(screen).not.toMatch(/billingCopy|tonight\.plusLine/);
  });

  it('passes the build\'s own PLUS_ALPHA and reads billing through its index only', () => {
    expect(screen).toMatch(/plusLineShows\(\{ plan: plan\.view, now: new Date\(\)\.toISOString\(\), lettersKept, allowance: freeLettersAllowance\(\), alpha: PLUS_ALPHA \}\)/);
    expect(screen).toMatch(/import \{ freeLettersAllowance, lettersKeptNow, PLUS_ALPHA, usePlan \} from '@\/lib\/billing';/);
    expect(screen).not.toMatch(/@\/lib\/billing\/(?!index)/);
  });

  it('reads letters kept once on open, never awaited, starting from null', () => {
    expect(screen).toMatch(/useState<number \| null>\(null\)/);
    expect(screen).toMatch(/useEffect\(\(\) => \{\s*let live = true;\s*void lettersKeptNow\(\)\.then/);
    expect(screen).not.toMatch(/await lettersKeptNow/);
  });

  it('draws the line above the two destinations, only when the rule says so', () => {
    const footer = screen.slice(screen.indexOf('border-t border-border'));
    expect(footer.indexOf('{showPlusLine ? (')).toBeGreaterThan(-1);
    expect(footer.indexOf('<PlusLine />')).toBeLessThan(footer.indexOf('testID="write.keep.book"'));
    expect(footer.indexOf('testID="write.keep.book"')).toBeLessThan(footer.indexOf('testID="write.keep.private"'));
  });
});
