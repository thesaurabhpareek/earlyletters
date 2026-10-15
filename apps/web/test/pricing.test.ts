/**
 * The Plus prices and trial lengths on earlyletters.com come from one place, src/content/pricing.ts.
 * RULE: no string under src states a dollar amount or a free-trial length that differs from it, the old
 * prices ($3.99 a month, $29.99 a year) never come back, and the pricing sentence reads both plans from it.
 * Reads every text file under src as written, and every string site.ts exports as rendered (so a template
 * that fills in the constants is checked after it is filled). If this fails, change pricing.ts, not the sentence.
 */
import { type Dirent, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { plusPricing } from '../src/content/pricing';
import * as siteModule from '../src/content/site';

type Text = { where: string; text: string };

const WEB_ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(WEB_ROOT, 'src');
/** Everything under src that holds text (fonts are skipped). */
const TEXT_FILE = /\.(ts|tsx|js|mjs|cjs|css|md|mdx|txt|svg|json|html|xml|ya?ml)$/;
const WORD_NUMBERS: Record<string, number> = { one: 1, two: 2, three: 3, six: 6, twelve: 12 };

function listFiles(dir: string): string[] {
  const entries: Dirent[] = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((e) => (e.isDirectory() ? listFiles(join(dir, e.name)) : [join(dir, e.name)]));
}

/** Every string in an exported value, with its path. */
function leaves(value: unknown, path: string): Text[] {
  if (typeof value === 'string') return [{ where: path, text: value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => leaves(v, `${path}.${k}`));
  return [];
}

const FILES = listFiles(SRC).filter((f) => TEXT_FILE.test(f)).sort();
const WRITTEN: Text[] = FILES.flatMap((file) =>
  readFileSync(file, 'utf8')
    .split('\n')
    .map((text, i) => ({ where: `${relative(WEB_ROOT, file)}:${i + 1}`, text })),
);
const RENDERED: Text[] = Object.entries(siteModule).flatMap(([name, value]) => leaves(value, `site.ts (rendered):${name}`));
const ALL: Text[] = [...WRITTEN, ...RENDERED];

/** Every match of `re` (global) in `items`, with where it was found. */
function matches(items: Text[], re: RegExp): { where: string; match: string; groups: string[] }[] {
  return items.flatMap((t) => [...t.text.matchAll(re)].map((m) => ({ where: t.where, match: m[0], groups: m.slice(1) })));
}
const found = (hits: { where: string; match: string }[]) => hits.map((h) => `${h.where}: ${h.match}`);

const DOLLARS = /\$\d[\d,]*(?:\.\d+)?/g;
const TRIAL_BEFORE = /\b(\d+|one|two|three|six|twelve)[\s-]+months?[\s-]+free\b/gi;
const TRIAL_AFTER = /\bfree(?:\s+trial)?\s+(?:of|for)\s+(\d+|one|two|three|six|twelve)\s+months?\b/gi;
const trialMentions = (items: Text[]) => [...matches(items, TRIAL_BEFORE), ...matches(items, TRIAL_AFTER)];
const asMonths = (word: string) => (/^\d+$/.test(word) ? Number(word) : WORD_NUMBERS[word.toLowerCase()]);

const plans = Object.values(plusPricing);
const PRICES: string[] = plans.map((p) => p.price);
const TRIALS: number[] = plans.map((p) => p.trialMonths);

describe('what is being checked', () => {
  // RULE: the founder's final figures (Oct 2026). A change here is a pricing decision, not a copy edit.
  it('the constants are $4.99 a month with a 1-month free trial and $49.99 a year with a 2-month free trial', () => {
    expect(plusPricing).toEqual({ monthly: { price: '$4.99', trialMonths: 1 }, annual: { price: '$49.99', trialMonths: 2 } });
  });

  // RULE: the scan sees the files and the pricing sentence (a silent miss would make every rule below pass for nothing).
  it('reads every text file under src and the rendered pricing sentence', () => {
    expect(FILES.length).toBeGreaterThan(100);
    expect(FILES.some((f) => f.endsWith(join('src', 'content', 'site.ts')))).toBe(true);
    const sentence = RENDERED.filter((t) => t.where === 'site.ts (rendered):site.scenes.s10.support');
    expect(matches(sentence, DOLLARS).map((m) => m.match)).toEqual(PRICES);
    expect(trialMentions(sentence).map((m) => asMonths(m.groups[0]))).toEqual(TRIALS);
  });
});

describe('every string under src, as written and as rendered', () => {
  // RULE: the old prices never come back, with or without a dollar sign.
  it('never states the old prices (3.99 or 29.99)', () => {
    expect(found(matches(ALL, /\b(?:3\.99|29\.99)\b/g))).toEqual([]);
  });

  // RULE: a dollar amount anywhere is one of the constants.
  it('states no dollar amount other than the constants', () => {
    expect(found(matches(ALL, DOLLARS).filter((m) => !PRICES.includes(m.match)))).toEqual([]);
  });

  // RULE: a free-trial length anywhere ("1-month free trial", "two months free", "free for 2 months") is one of the constants.
  it('states no free-trial length other than the constants', () => {
    expect(found(trialMentions(ALL).filter((m) => !TRIALS.includes(asMonths(m.groups[0]))))).toEqual([]);
  });
});

describe('the pricing sentence (s10)', () => {
  // RULE: each price sits next to its own trial, both read from the constants, in the founder's wording.
  it('states both plans from the constants', () => {
    const { monthly, annual } = plusPricing;
    expect(siteModule.site.scenes.s10.support).toContain(
      `${monthly.price} a month with a ${monthly.trialMonths}-month free trial, or ${annual.price} a year with a ${annual.trialMonths}-month free trial.`,
    );
  });
});
