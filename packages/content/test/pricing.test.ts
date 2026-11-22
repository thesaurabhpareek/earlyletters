/**
 * Plus prices in public copy (D-082, D-083). `pricing.ts` is the one place the
 * website and the pages take prices and trial wording from; the app never
 * types a price (Apple's own sheet shows the storefront price). The voice
 * rules reach these strings through the website and pages copy that quotes
 * them, so the quoting itself is what is pinned here.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en, features, pages, PLUS_PRICE, PLUS_TRIAL, plusPriceLine, site, storeListing } from '../src';

type Leaf = { path: string; text: string };
function leaves(value: unknown, path = ''): Leaf[] {
  if (typeof value === 'string') return [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  return [];
}

const SITE = leaves(site, 'site');
const PAGES = leaves(pages, 'pages');
const STORE = leaves(storeListing, 'store');
const IN_APP = [...leaves(en, 'en'), ...leaves(features, 'features')];
const AMOUNT = /\$\d+(?:\.\d{2})?/g;

describe('Plus prices (D-082)', () => {
  it('[D-082] monthly is $4.99 with the first month free; yearly is $49.99 with the first 2 months free', () => {
    expect(PLUS_PRICE).toEqual({ monthly: '$4.99', yearly: '$49.99' });
    expect(PLUS_TRIAL).toEqual({ monthly: 'the first month free', yearly: 'the first 2 months free' });
  });

  it('[D-082] each price line is built from one price and its own trial, never the other plan\'s', () => {
    expect(plusPriceLine.monthly).toBe(`${PLUS_PRICE.monthly} a month, with ${PLUS_TRIAL.monthly}`);
    expect(plusPriceLine.annual).toBe(`${PLUS_PRICE.yearly} a year, with ${PLUS_TRIAL.yearly}`);
    expect(plusPriceLine.monthly).not.toContain(PLUS_PRICE.yearly);
    expect(plusPriceLine.annual).not.toContain(PLUS_PRICE.monthly);
  });

  it('[D-082] the website and the pages quote both price lines word for word, so the copy rules check them there', () => {
    for (const line of [plusPriceLine.monthly, plusPriceLine.annual]) {
      expect(SITE.some((l) => l.text.includes(line)), `site quotes "${line}"`).toBe(true);
      expect(PAGES.some((l) => l.text.includes(line)), `pages quote "${line}"`).toBe(true);
    }
  });

  it('[D-082] every amount the public copy names is one of the two prices', () => {
    const named = [...SITE, ...PAGES, ...STORE].flatMap((l) => [...l.text.matchAll(AMOUNT)].map((m) => `${l.path}: ${m[0]}`));
    expect(named.length).toBeGreaterThan(0);
    expect(named.filter((n) => !n.endsWith(PLUS_PRICE.monthly) && !n.endsWith(PLUS_PRICE.yearly))).toEqual([]);
  });

  it('[D-083] no in-app string names an amount: the app shows Apple\'s own sheet', () => {
    expect(IN_APP.filter((l) => /\$\d/.test(l.text)).map((l) => l.path)).toEqual([]);
  });
});

/**
 * Comms validation 31 Oct 2026 (SUB-01, SUB-02): the legal documents a buyer opens from Apple's sheet state the same
 * prices as pricing.ts and the same "What Plus adds" as the store sheet. Counsel notes, appendices and changelogs are
 * history and are not scanned.
 */
describe('[SUB-01, SUB-02] legal documents match the shipping prices and what Plus adds', () => {
  const LEGAL = join(__dirname, '..', '..', '..', 'docs', 'legal');
  const body = (file: string) =>
    readFileSync(join(LEGAL, file), 'utf8')
      .split(/\n## (?:Appendix|Changelog)/)[0]
      .split('\n')
      .filter((l) => !/^\s*(?:>\s*)?\*\*\[COUNSEL/.test(l));

  it.each(['terms-of-service.md', 'subscription-terms.md'])('%s states only the D-082 prices', (file) => {
    const amounts = body(file).flatMap((l) => [...l.matchAll(/\$\d+\.\d{2}/g)].map((m) => m[0]));
    expect(amounts.length, file).toBeGreaterThanOrEqual(2);
    expect(amounts.filter((a) => a !== PLUS_PRICE.monthly && a !== PLUS_PRICE.yearly), file).toEqual([]);
    expect(amounts).toContain(PLUS_PRICE.monthly);
    expect(amounts).toContain(PLUS_PRICE.yearly);
  });

  it('Subscription Terms "What Plus adds" equals billingCopy.store.features, word for word', () => {
    const text = readFileSync(join(LEGAL, 'subscription-terms.md'), 'utf8');
    const section = text.split('\n## What Plus adds\n')[1]?.split('\n## ')[0] ?? '';
    const bullets = section
      .split('\n')
      .filter((l) => l.startsWith('- '))
      .map((l) => l.slice(2).trim());
    expect(bullets).toEqual([...features.billing.store.features]);
  });
});
