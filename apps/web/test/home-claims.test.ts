/**
 * The home page, the sign-up and the welcome email make no claim that is not true for v1.0 under option B, and the
 * prices are the constants in src/content/pricing.ts, not guesses.
 *
 * Sources: the founder's decisions of 13 and 14 Oct 2026 (docs/DECISIONS.md on PR #128, D-089 to D-093, being
 * renumbered D-100 to D-105): server features ship in v1.0, sign-in, sync, co-parent sharing (two parents per
 * book, D-069) and encrypted recording backup (D-089); backup copy says recordings are encrypted, that we hold a
 * recovery key under strict, logged access, and that they are never read, sold or used to train models, never
 * "only your family's keys" (D-091); backup is free, not a Plus feature (D-093). Plus gates adding letters after the
 * first two, Read together is free for letters that exist (D-082, D-083). Co-parent only, nobody else (D-055).
 * Apple's rules for the price and the trial come from the saved research of 15 Oct 2026 (one introductory offer per
 * customer per subscription group; the renewal price and auto-renewal stated with the trial; nothing verified says
 * Apple or we send a reminder). If a test here fails, fix the copy.
 */
import { brand } from '@scribe/brand';
import { describe, expect, it } from 'vitest';
import { plusPricing } from '../src/content/pricing';
import { site } from '../src/content/site';

/** Every string in a value, in order. */
function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}
/** Every string the home page can show, from site.ts (hero, scenes, sign-up, nudge, share). */
const HOME = [site.comingSoon, site.nudge, site.scenes, site.cta, site.notify].flatMap(strings);
const ALL = strings(site);
const PAGE = HOME.join(' ');

const s = site.scenes;
const s10 = site.scenes.s10;
const words = (t: string) => t.trim().split(/\s+/).length;

describe('no stale claims anywhere in site.ts', () => {
  const STALE: [string, RegExp][] = [
    ['the whole family or wider family adding letters (D-055: co-parent only)', /whole family|every family member|family adding/i],
    ['Read together after the free sessions (D-082 supersedes)', /after the free sessions|free sessions/i],
    ['"people you invite" (co-parent only: it is the other parent you invite)', /people you invite/i],
    ['"only your family" or "only your family\'s keys" (D-091: we hold a recovery key)', /only your family/i],
    ['the old prices, with or without a dollar sign', /\b(?:3\.99|29\.99)\b/],
    ['the unrecomputed monthly figure', /\$2\.50/],
    ['grandparents or wider family (D-055)', /grandparent|grandma|grandpa/i],
    ['"Private by design" (the audit: it is "Private by default")', /private by design/i],
    ['"Private on your phone" (under option B letters sync and recordings are backed up)', /private on your phone/i],
    ['the old transcription line that did not say what runs', /runs on your phone/i],
    ['"What we are building" (the welcome email list is gone)', /what we are building/i],
    ['a reminder before the trial ends, from Apple or from us (nothing verified says so)', /\bremind/i],
    ['the old hero filler', /treasure every milestone/i],
    ['"Your letters stay on your phone" (option B: they sync to the other parent; the live page still says it)', /letters stay on your phone/i],
    ['Plus "backs up every recording" (D-093: backup is free; and it may not be on by default, PRD V2 F08 Q2)', /backs up every recording|every recording is backed up/i],
    ['Plus "opens Read together" (D-083: Read together is free for letters that exist)', /opens Read together/i],
  ];
  for (const [name, re] of STALE) {
    it(`says nothing about: ${name}`, () => {
      expect(ALL.filter((t) => re.test(t))).toEqual([]);
    });
  }
});

describe('backup (D-089, D-091, D-093)', () => {
  it('says recordings can be backed up encrypted, in the voice line and the private section (not "are": the default is open)', () => {
    expect(s.s05.support).toMatch(/can be backed up encrypted/);
    expect(s.s09.points[1]).toMatch(/^Recordings can be backed up encrypted, free for everyone,/);
  });

  it('uses the D-091 words: a recovery key we hold under strict, logged access; never read, sold or used to train models', () => {
    const privacy = s.s09.points.join(' ');
    expect(privacy).toMatch(/We hold a recovery key under strict, logged access/);
    expect(privacy).toMatch(/never read, sold or used to train models/);
    expect(privacy).not.toMatch(/only your family|end[- ]to[- ]end|nobody else can|no one else can|we cannot (read|open)/i);
  });

  it('is free and not in the Plus list (D-093)', () => {
    expect(s10.free).toMatch(/^Encrypted backup of your recordings is free for everyone, with or without Plus\.$/);
    expect(s10.includes.join(' ')).not.toMatch(/back(ed)? ?up|recording/i);
  });
});

describe('co-parent sharing (D-089, D-069, D-055)', () => {
  it('says both parents write in the same book, and nobody else', () => {
    expect(s.s06.lines).toContain('Both parents write in the same book.');
    expect(s.s06.support).toContain('Both parents write in the same book.');
    expect(PAGE).not.toMatch(/\b(three|3) parents\b|whole family|family members/i);
  });

  it('says letters are on your phone, sync after sign-in, and are shared only with the one other parent (two per book)', () => {
    expect(s.s09.points[0]).toBe('Your letters are on your phone. Sign in and they sync, shared only with the one other parent you invite.');
  });

  it('never says the other parent can hear your recordings (sharing of audio is v1.1, D-073)', () => {
    expect(PAGE).not.toMatch(/(parent|family) can (hear|listen|play)/i);
  });
});

describe('the audit items', () => {
  it('hero: one short line and three promises of at most three words, the first of them "Private by default"', () => {
    expect(words(site.comingSoon.line)).toBeLessThanOrEqual(10);
    expect(site.comingSoon.promises).toEqual(['Private by default', 'Word for word', 'Never rewritten']);
    for (const p of site.comingSoon.promises) expect(words(p)).toBeLessThanOrEqual(3);
  });

  it('meta description: one sentence pair under 155 characters, naming the product', () => {
    expect(site.meta.description.length).toBeLessThanOrEqual(155);
    expect(site.meta.description).toContain(brand.name);
    expect(site.meta.description).not.toMatch(/[—–…]/);
  });

  it('"Private by default", never "by design"', () => {
    expect(s.s09.headline).toBe('Private by default.');
    expect(ALL.some((t) => /private by design/i.test(t))).toBe(false);
  });

  it('the transcription line says it happens on the phone', () => {
    expect(s.s04.lines[0]).toBe('Transcription happens on your phone.');
    expect(s.s04.support.startsWith('Transcription happens on your phone.')).toBe(true);
  });

  it('one shared sentence about the launch email, in the sign-up, its thank-you and the welcome email', () => {
    const shared = 'we will write once, when it is ready';
    expect(s.s11.supportPrelaunch).toContain(shared);
    expect(site.notify.success).toContain(shared);
    expect(site.welcomeEmail.intro).toContain(shared);
    expect(ALL.filter((t) => /write once more/i.test(t))).toEqual([]);
  });

  it('welcome email: signs off "Warmly," then the brand name, has no list, and says "You are on the list" once, in the subject', () => {
    const w = site.welcomeEmail;
    expect(w.signoff).toBe('Warmly,');
    expect(w.signoffName).toBe(brand.name);
    expect('promises' in w).toBe(false);
    expect('promisesTitle' in w).toBe(false);
    const onTheList = strings(w).filter((t) => /you are on the list/i.test(t));
    expect(onTheList).toEqual([w.subject]);
  });

  it('thanks page: the body does not repeat the title\'s thank you', () => {
    expect(site.notify.thanksTitle).toBe('Thank you.');
    expect(site.notify.success).not.toMatch(/thank/i);
  });

  it('sorry page: the bodies do not repeat the title', () => {
    for (const body of [site.notify.sorryInvalid, site.notify.rateLimited, site.notify.sorryServer]) {
      expect(body).not.toContain(site.notify.sorryTitle);
      expect(body).not.toMatch(/did not go through/i);
    }
  });

  it('unsubscribe page: nothing is stated as done before the button is pressed', () => {
    expect(site.unsubscribe.body).toMatch(/^Confirm below/);
    expect(site.unsubscribe.body).not.toMatch(/^We will not|you are unsubscribed|has been removed/i);
    expect(site.unsubscribe.doneTitle).toBe('You are unsubscribed.');
    expect((site.unsubscribe.doneBody.match(/thank you/gi) ?? []).length).toBeLessThanOrEqual(1);
  });

  // The footer and the legal pages belong to the legal gate (fix/web-legal-live-gate); this file does not test them.
  it('the sign-up has a Privacy link under the field, to /privacy', () => {
    expect(site.notify.privacy).toEqual({ href: '/privacy', label: 'Privacy' });
  });
});

describe('pricing', () => {
  const dollars = (t: string) => Number(t.replace('$', ''));
  const [monthly, yearly] = s10.plans;

  it('reads both plans from src/content/pricing.ts: $4.99 a month with a 1-month free trial, $49.99 a year with a 2-month free trial', () => {
    expect(plusPricing).toEqual({ monthly: { price: '$4.99', trialMonths: 1 }, annual: { price: '$49.99', trialMonths: 2 } });
    expect(s10.plans.map((p) => [p.name, p.price, p.period, p.trial])).toEqual([
      ['Monthly', plusPricing.monthly.price, 'a month', `${plusPricing.monthly.trialMonths}-month free trial`],
      ['Yearly', plusPricing.annual.price, 'a year', `${plusPricing.annual.trialMonths}-month free trial`],
    ]);
  });

  it('states no dollar amount or trial length other than the constants, anywhere in site.ts', () => {
    const prices = [plusPricing.monthly.price, plusPricing.annual.price];
    const trials = [plusPricing.monthly.trialMonths, plusPricing.annual.trialMonths];
    for (const t of ALL) {
      for (const m of t.matchAll(/\$\d[\d,]*(?:\.\d+)?/g)) expect(prices, `${m[0]} in: ${t}`).toContain(m[0]);
      for (const m of t.matchAll(/\b(\d+)-month free trial\b/g)) expect(trials, `${m[0]} in: ${t}`).toContain(Number(m[1]));
    }
  });

  it('gives both plans the same shape and no emphasis (no badge, no saving, no ranking words)', () => {
    expect(Object.keys(monthly)).toEqual(Object.keys(yearly));
    const pricingText = strings(s10).join(' ');
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

  it('keeps the Plus list to what Plus gates: adding letters, one membership for every book (D-082, D-083)', () => {
    expect(s10.includes).toEqual(['Keep adding letters', "Cover every child's book with one membership"]);
    expect(s10.reassurance).toBe('Every letter you have made stays yours to read, play and export, even if you stop.');
    expect(strings(s10).join(' ')).not.toMatch(/read together/i);
  });

  describe("Apple's rules near the price (the saved research of 15 Oct 2026, sections 2 to 4 and the mismatches)", () => {
    const terms = s10.terms.join(' ');

    it('says the trial is for new subscribers, one per customer', () => {
      expect(terms).toMatch(/for new subscribers/);
      expect(terms).toMatch(/one per customer/);
    });

    it('says the plan renews automatically at the stated price after the trial unless cancelled', () => {
      expect(terms).toMatch(/After the trial, the plan renews automatically at the price shown, unless you cancel/);
    });

    it('says Apple bills and where to cancel, and that access runs to the end of the paid period', () => {
      expect(terms).toMatch(/Billed by Apple\./);
      expect(terms).toMatch(/Cancel any time in your Apple account settings\./);
      expect(terms).toMatch(/runs to the end of the paid period\./);
    });

    it('promises no reminder from Apple or from us, and no refund', () => {
      expect(terms).not.toMatch(/remind|email you|let you know|refund/i);
    });

    it('is three short lines in the order Apple lists them, and the film summary says the same', () => {
      expect(s10.terms).toHaveLength(3);
      expect(s10.terms.map((t) => /new subscribers/.test(t) ? 'trial' : /renews/.test(t) ? 'renewal' : /Billed by Apple/.test(t) ? 'billing' : '?')).toEqual(['trial', 'renewal', 'billing']);
      expect(s10.summary).toMatch(/renews at that price unless you cancel\. Billed by Apple\.$/);
    });
  });

  it('keeps every block short: no pricing text is a paragraph', () => {
    for (const t of [s10.support, s10.reassurance, s10.free, ...s10.includes, ...s10.terms]) expect(words(t), t).toBeLessThanOrEqual(20);
  });
});

describe('the rest of the restructure', () => {
  it('labels the month cards as an example and does not say who wrote them', () => {
    const b = s.s06;
    expect(b.exampleLabel).toMatch(/\bexample\b/i);
    expect(strings(b.chapters).join(' ')).not.toMatch(/Papa|Mama|from /);
  });

  it('says in the share text that it is coming soon, and nothing it cannot back', () => {
    expect(site.comingSoon.shareText).toMatch(/^Coming soon to iPhone/);
    expect(site.comingSoon.shareText).not.toMatch(/download|available|on the app store|free|private|price/i);
    expect(site.comingSoon.shareButton).toBe('Share with a fellow parent');
    expect(site.nudge.label).toBe('Early access');
    // WCAG 2.5.3: the accessible name contains the visible label.
    expect(site.nudge.aria.toLowerCase()).toContain(site.nudge.label.toLowerCase());
  });

  it('keeps the private section to five short lines, each under 20 words', () => {
    expect(s.s09.points).toHaveLength(5);
    for (const p of s.s09.points) expect(words(p), p).toBeLessThanOrEqual(20);
  });

  it('is still short: the home page words stay under 420 (the audit counted 360 before option B added its claims)', () => {
    const count = [
      site.comingSoon.line, ...site.comingSoon.promises,
      s.s01.headline, s.s01.support, s.s02.headline, s.s02.support, s.s03.headline, s.s03.support,
      s.s04.headline, ...s.s04.lines, s.s04.promise, s.s05.headline, s.s05.support, s.s07.headline, s.s07.support,
      s.s06.headline, ...s.s06.lines, s.s08.headline, s.s08.support, s.s09.headline, ...s.s09.points,
      s.s10.headline, s.s10.support, s.s10.includesLabel, ...s.s10.includes, s.s10.free, s.s10.reassurance, ...s.s10.terms,
      s.s11.headline, s.s11.supportPrelaunch,
    ].join(' ').split(/\s+/).length;
    expect(count).toBeLessThan(420);
  });
});

describe('what the page shows is what site.ts holds', () => {
  it('has at least the strings the page needs', () => {
    expect(HOME.length).toBeGreaterThan(50);
  });
});
