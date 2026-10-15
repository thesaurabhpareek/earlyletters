/**
 * The strings the 4 Oct 2026 pull requests added (#92 quiet days, #93
 * resilience, #94 child editing, #96 membership, #98 recently deleted) are
 * all under a root that rules.test.ts scans, so every voice rule applies to
 * them. One root those PRs added, `pricing.ts`, is not in that scan: the
 * rules that matter most are applied to it here. If a test here fails, fix
 * the copy, not the test (CLAUDE.md).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en, features, PLUS_PRICE, PLUS_TRIAL, plusPriceLine, site, storeListing } from '../src';

type Leaf = { path: string; text: string };
function leaves(value: unknown, path = ''): Leaf[] {
  if (typeof value === 'string') return [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  return [];
}
const at = (root: unknown, path: string): unknown => path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), root);

const RULES_TEST = readFileSync(join(__dirname, 'rules.test.ts'), 'utf8');

/** Key paths each PR added, by root. A path must resolve to a string, or an object of strings. */
const ADDED: Record<string, { root: unknown; paths: string[] }> = {
  '#92 quiet days (D-084)': { root: en, paths: ['notMuch.button', 'notMuch.confirmBody', 'notMuch.savedToast', 'notMuch.undo', 'book.quietDay.label', 'book.quietDay.a11y', 'book.quietDay.remove', 'book.quietDay.removedToast'] },
  '#93 resilience (J19, J20)': { root: en, paths: ['errors.crash.title', 'errors.crash.body', 'errors.crash.tryAgainButton', 'errors.notFoundPage.title', 'errors.notFoundPage.body', 'errors.notFoundPage.button', 'errors.launch.title', 'errors.launch.body', 'errors.launch.exportButton', 'errors.launch.readme'] },
  '#94 child editing': { root: en, paths: ['childrenExtra.edit', 'childrenExtra.edit.born'] },
  '#96 membership (D-082, D-083)': { root: features, paths: ['billing.keepGate.body', 'billing.keepGate.heldNote', 'billing.keepGate.holdButton', 'billing.keepGate.lapsedBody', 'billing.keepGate.offline', 'billing.keepGate.secondFreeNote', 'billing.keepGate.plusIsOn', 'billing.plan.off', 'billing.plan.retry', 'billing.plan.redeem'] },
  '#96 Plus promise': { root: en, paths: ['plus.promise', 'plus.legal'] },
  '#98 recently deleted (D-085)': { root: en, paths: ['settings.delete'] },
};

describe('every 4 Oct string sits under a root the rules test scans', () => {
  it('rules.test.ts builds its string set from en, features, store, site, pages, stories, prompts, emails and the app copy files', () => {
    for (const root of ['leaves(en,', 'leaves(features,', 'leaves(storeListing,', 'leaves(site,', 'leaves(pages,', 'leaves(permissions,', 'PROMPTS.map', 'onboardingStories', 'APP_COPY']) {
      expect(RULES_TEST, root).toContain(root);
    }
    expect(RULES_TEST).toMatch(/const EVERY: Leaf\[\] = \[\.\.\.ALL, \.\.\.EMAIL, \.\.\.APP_COPY\]/);
  });

  it.each(Object.entries(ADDED))('%s', (_pr, { root, paths }) => {
    for (const p of paths) {
      const v = at(root, p);
      expect(v, p).toBeDefined();
      const strings = leaves(v, p);
      expect(strings.length, p).toBeGreaterThan(0);
      for (const l of strings) expect(l.text.trim().length, l.path).toBeGreaterThan(0);
    }
  });

  it('the feature-local book copy (#92) is a file the rules test scans by name', () => {
    const COPY_FILE = /^(copy|.+[.-]copy)\.ts$/; // the same pattern rules.test.ts uses
    expect(RULES_TEST).toContain(String(COPY_FILE).replace(/^\/|\/$/g, ''));
    expect(COPY_FILE.test('copy.ts')).toBe(true);
    const bookCopy = readFileSync(join(__dirname, '..', '..', '..', 'apps', 'mobile', 'src', 'components', 'book', 'copy.ts'), 'utf8');
    expect(bookCopy).toContain('nobodySpoke');
  });
});

describe('pricing.ts (#96): public price and trial wording, not scanned by rules.test.ts', () => {
  const PRICING: Leaf[] = [...leaves(PLUS_PRICE, 'PLUS_PRICE'), ...leaves(PLUS_TRIAL, 'PLUS_TRIAL'), ...leaves(plusPriceLine, 'plusPriceLine')];
  const offenders = (re: RegExp) => PRICING.filter((l) => re.test(l.text)).map((l) => `${l.path}: ${l.text}`);

  it('is indeed outside the rules scan (so this file is the one that checks it)', () => {
    expect(RULES_TEST).not.toMatch(/\bplusPriceLine\b|\bPLUS_PRICE\b|\bPLUS_TRIAL\b/);
  });

  it('has no em dashes, en dashes, curly quotes, ellipsis characters or emoji', () => {
    expect(offenders(/[—–‘’“”…]/)).toEqual([]);
    expect(offenders(/\p{Extended_Pictographic}/u)).toEqual([]);
  });

  it('never uses fear, guilt or loss language, AI-writing words, or a gendered pronoun', () => {
    expect(offenders(/\b(too late|don'?t miss|you haven'?t|you forgot|streaks?|lost forever|regrets?|never get back|die|dies|died|dying|death|dead)\b/i)).toEqual([]);
    expect(offenders(/\b(AI|artificial intelligence|smart|magic(al)?|generat(e|es|ed|ing)|polish(ed|es|ing)?|perfect(ed|s)?|enhanc(e|ed|es|ing))\b/)).toEqual([]);
    expect(offenders(/\b(she|he|her|him|his|hers)\b/i)).toEqual([]);
  });

  it('[D-082] names the founder prices and trials once, and the price lines are built from them', () => {
    expect(PLUS_PRICE).toEqual({ monthly: '$4.99', yearly: '$49.99' });
    expect(PLUS_TRIAL.monthly).toMatch(/free/);
    expect(PLUS_TRIAL.yearly).toMatch(/free/);
    expect(plusPriceLine.line).toContain(PLUS_PRICE.monthly);
    expect(plusPriceLine.line).toContain(PLUS_PRICE.yearly);
    expect(plusPriceLine.monthly).toContain(PLUS_TRIAL.monthly);
    expect(plusPriceLine.annual).toContain(PLUS_TRIAL.yearly);
  });

  it('[D-083] no in-app string types a price: the app shows Apple\'s own sheet', () => {
    const inApp = [...leaves(en, 'en'), ...leaves(features, 'features')];
    expect(inApp.filter((l) => /\$\d/.test(l.text)).map((l) => l.path)).toEqual([]);
  });

  it('the public copy that quotes a price quotes these exact values', () => {
    const publicCopy = [...leaves(site, 'site'), ...leaves(storeListing, 'store')];
    const priced = publicCopy.filter((l) => /\$\d/.test(l.text));
    for (const l of priced) {
      const amounts = l.text.match(/\$\d+(?:\.\d{2})?/g) ?? [];
      for (const a of amounts) expect([PLUS_PRICE.monthly, PLUS_PRICE.yearly], `${l.path}: ${a}`).toContain(a);
    }
  });
});
