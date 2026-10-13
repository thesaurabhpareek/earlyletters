/**
 * The home page makes no claim that is not true for v1.0, and its prices are arithmetic, not guesses.
 * Sources: the founder's final pricing (Monthly $4.99 with a 1-month free trial, Yearly $49.99 with a 2-month
 * free trial) and decisions D-082 to D-088 (docs/DECISIONS.md on docs/decisions-4-oct): backup through our own
 * service is not in v1.0 (D-085), Plus gates adding letters and Read together is free for letters that exist
 * (D-082, D-083), co-parent only and invite flows hidden (D-055, D-087). If a test here fails, fix the copy.
 */
import { describe, expect, it } from 'vitest';
import { site } from '../src/content/site';

/** Every string the home page can show, from site.ts (hero, scenes, sign-up, nudge, share). */
function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}
const HOME = [site.comingSoon, site.nudge, site.scenes, site.cta, site.notify].flatMap(strings);
const ALL = strings(site);

const s10 = site.scenes.s10;

describe('no stale claims on the page', () => {
  const STALE: [string, RegExp][] = [
    ['backs up / backup (D-085: not in v1.0)', /\bback(s|ed)?[ -]?ups?\b|\bbacks? up\b|\bbacked up\b/i],
    ['whole family (D-055: co-parent only)', /whole family|every family member|family adding/i],
    ['Read together after the free sessions (D-082 supersedes)', /after the free sessions|free sessions/i],
    ['both parents write in the same book (not verifiable on a device)', /both parents (write|can add)|same book/i],
    ['shared only with the people you invite (invite flows hidden, D-087)', /people you invite|shared only with/i],
    ['old prices', /\$3\.99|\$29\.99/],
    ['the unrecomputed monthly figure', /\$2\.50/],
    ['grandparents or wider family (D-055)', /grandparent|grandma|grandpa/i],
  ];
  for (const [name, re] of STALE) {
    it(`says nothing about: ${name}`, () => {
      expect(ALL.filter((t) => re.test(t))).toEqual([]);
    });
  }
});

describe('pricing', () => {
  const dollars = (t: string) => Number(t.replace('$', ''));
  const [monthly, yearly] = s10.plans;

  it('shows exactly two plans, with the founder prices and trials', () => {
    expect(s10.plans.map((p) => [p.name, p.price, p.period, p.trial])).toEqual([
      ['Monthly', '$4.99', 'a month', '1-month free trial'],
      ['Yearly', '$49.99', 'a year', '2-month free trial'],
    ]);
  });

  it('gives both plans the same shape and no emphasis (no badge, no saving, no ranking words)', () => {
    expect(Object.keys(monthly)).toEqual(Object.keys(yearly));
    const pricingText = strings({ ...s10, plans: s10.plans }).join(' ');
    expect(pricingText).not.toMatch(/\b(best|popular|save|saving|saves|discount|off|deal|recommended|most)\b|%/i);
  });

  it('is consistent with the arithmetic: yearly is about ten months of monthly, about two months free', () => {
    const m = dollars(monthly.price);
    const y = dollars(yearly.price);
    expect(+(12 * m).toFixed(2)).toBe(59.88);
    expect(+(12 * m - y).toFixed(2)).toBe(9.89);
    expect(Math.abs((12 * m - y) / m - 2)).toBeLessThan(0.05); // 9.89 / 4.99 = 1.98 months
    expect(+(y / 12).toFixed(2)).toBe(4.17);
  });

  it('writes a per-month figure for yearly only if it is the recomputed one', () => {
    for (const t of ALL) {
      for (const m of t.matchAll(/about \$(\d+(?:\.\d+)?) a month/gi)) expect(m[1]).toBe('4.17');
    }
  });

  it('keeps the benefits to what v1.0 does: adding letters and one membership for every book', () => {
    expect(s10.includes).toEqual(['Keep adding letters', "Cover every child's book with one membership"]);
    expect(s10.reassurance).toBe('Every letter you have made stays yours to read, play and export, even if you stop.');
  });

  it('has the short neutral Apple billing line near the price (counsel signs it)', () => {
    expect(s10.fine).toBe('Billed by Apple. Cancel any time in your Apple account settings.');
  });

  it('keeps every block short: no pricing text is a paragraph', () => {
    for (const t of [s10.support, s10.reassurance, s10.fine, ...s10.includes]) expect(t.split(/\s+/).length).toBeLessThanOrEqual(20);
  });
});

describe('the rest of the restructure', () => {
  it('labels the month cards as an example and does not say who wrote them', () => {
    const b = site.scenes.s06;
    expect(b.exampleLabel).toMatch(/\bexample\b/i);
    expect(strings(b.chapters).join(' ')).not.toMatch(/Papa|Mama|from /);
  });

  it('shortens the hero to one line and three short promises', () => {
    expect(site.comingSoon.line.split(/\s+/).length).toBeLessThanOrEqual(10);
    expect(site.comingSoon.promises).toHaveLength(3);
    for (const p of site.comingSoon.promises) expect(p.split(/\s+/).length).toBeLessThanOrEqual(4);
  });

  it('says in the share text that it is coming soon, and nothing it cannot back', () => {
    expect(site.comingSoon.shareText).toMatch(/^Coming soon to iPhone/);
    expect(site.comingSoon.shareText).not.toMatch(/download|available|on the app store|free|private|price/i);
    expect(site.comingSoon.shareButton).toBe('Share with a fellow parent');
    expect(site.nudge.label).toBe('Early access');
    // WCAG 2.5.3: the accessible name contains the visible label.
    expect(site.nudge.aria.toLowerCase()).toContain(site.nudge.label.toLowerCase());
  });

  it('keeps the three private lines to what is true on a device', () => {
    expect(site.scenes.s09.points).toEqual([
      'Your letters stay on your phone.',
      'No ads. We never sell your data, and never use your letters to train models.',
      'Yours to export or delete, any time.',
    ]);
  });

  it('is shorter than before: the home page words are fewer than the 360 the audit counted', () => {
    const s = site.scenes;
    const words = [
      site.comingSoon.line, ...site.comingSoon.promises,
      s.s01.headline, s.s01.support, s.s02.headline, s.s02.support, s.s03.headline, s.s03.support,
      s.s04.headline, ...s.s04.lines, s.s04.promise, s.s05.headline, s.s05.support, s.s07.headline, s.s07.support,
      s.s06.headline, ...s.s06.lines, s.s08.headline, s.s08.support, s.s09.headline, ...s.s09.points,
      s.s10.headline, s.s10.support, s.s10.includesLabel, ...s.s10.includes, s.s10.reassurance,
      s.s11.headline, s.s11.supportPrelaunch,
    ].join(' ').split(/\s+/).length;
    expect(words).toBeLessThan(360);
  });
});

describe('what the page shows is what site.ts holds', () => {
  it('has at least the strings the page needs', () => {
    expect(HOME.length).toBeGreaterThan(50);
  });
});
