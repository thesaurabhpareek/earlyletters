/**
 * /privacy and /terms: short pages that say only what is true today. Owner: E1 (web platform).
 * The words are checked here (length, sections, no internal references, no service the code does not use); the claims
 * the code can prove are checked against the code itself, so a change that makes a sentence untrue fails here first.
 * Characters and voice are checked by copy-rules.test.ts, which reads the same copy files.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { site } from '../src/content/site';
import { analyticsEnabled } from '../src/lib/analytics';
import { legalCopy } from '../src/lib/legal/legal-copy';
import { formatDate, legalPage, legalSlugs, splitLinks } from '../src/lib/legal/pages';
import { serviceProviders } from '../src/lib/legal/privacy-copy';
import { resolvePublisherName } from '../src/lib/legal/publisher';
import type { LegalBlock, LegalPageCopy } from '../src/lib/legal/types';

const WEB = fileURLToPath(new URL('..', import.meta.url));
const read = (path: string) => readFileSync(join(WEB, path), 'utf8');

const blockText = (block: LegalBlock) => (typeof block === 'string' ? block : block.list.join('\n'));
/** Everything a visitor reads on the page, in order. */
function pageText(page: LegalPageCopy): string {
  return [
    page.title,
    `${legalCopy.lastUpdated} ${formatDate(page.lastUpdated)}`,
    ...page.intro.map(blockText),
    ...page.sections.flatMap((s) => [s.heading, ...s.blocks.map(blockText)]),
  ].join('\n');
}
const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

const privacy = legalPage('privacy', {});
const terms = legalPage('terms', {});
const pages = [privacy, terms];

describe('length and shape', () => {
  // RULE: Privacy reads in under three minutes (at 200 words a minute, under 600 words); Terms stays as short.
  it('Privacy is under 600 words and Terms under 650', () => {
    expect(words(pageText(privacy))).toBeLessThan(600);
    expect(words(pageText(terms))).toBeLessThan(650);
  });

  it('has the sections a reader and the publisher need, in order', () => {
    expect(privacy.sections.map((s) => s.id)).toEqual([
      'who-runs-this',
      'what-we-collect',
      'what-we-do-not-do',
      'who-helps',
      'how-long',
      'your-choices',
      'children',
      'changes',
      'contact',
    ]);
    expect(terms.sections.map((s) => s.id)).toEqual([
      'who-runs-this',
      'the-website',
      'the-list',
      'using-the-website',
      'our-content',
      'no-warranty',
      'liability',
      'changes',
      'contact',
    ]);
  });

  // RULE: the page carries only a "Last updated" date; git history is the change log.
  it('carries one date, shown as a reader writes it', () => {
    for (const page of pages) {
      expect(page.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(pageText(page)).not.toMatch(/\bversion \d|effective date|change ?log/i);
    }
    expect(formatDate('2026-10-15')).toBe('October 15, 2026');
  });
});

describe('what the pages promise', () => {
  const text = { privacy: pageText(privacy), terms: pageText(terms) };

  it('Privacy covers who, what and why, how long, how to leave or be deleted, and where to write', () => {
    for (const phrase of [
      'Your email address, if you join the list',
      'one short welcome email now and one email when the app is ready',
      'We do not use cookies.',
      'until you ask us to delete it',
      'unsubscribe link',
      'To have your address deleted',
      'for adults',
      'It will have its own privacy policy when it launches.',
      `Questions about this policy: ${site.footer.contact}.`,
    ]) {
      expect(text.privacy, phrase).toContain(phrase);
    }
  });

  it('Terms covers the website, the list, no warranty, a liability limit with its carve-outs, and the app terms to come', () => {
    for (const phrase of [
      'nothing on the website is an offer',
      'Joining the list is free.',
      'as they are and as available',
      'we give no warranties',
      'limited to 50 US dollars',
      'Nothing in these terms limits our liability for fraud, gross negligence or willful misconduct, or for anything else the law does not allow us to limit.',
      'It will have its own terms when it launches',
      `Questions about these terms: ${site.footer.contact}.`,
    ]) {
      expect(text.terms, phrase).toContain(phrase);
    }
  });

  // RULE: no governing-law clause until the founder says which state; none may name a state meanwhile.
  it('Terms names no state and has no governing-law section yet', () => {
    expect(terms.sections.some((s) => /governing/i.test(s.id + s.heading))).toBe(false);
    expect(text.terms).not.toMatch(/California|governed by|laws of the State/i);
  });

  // RULE: no internal decision ids, ADR numbers, backlog ids, counsel notes, TODOs or drafting reasoning in published text.
  it('has no internal references, counsel notes, placeholders in braces or drafting words', () => {
    const internal = [/\bD-\d{2,3}\b/, /\bADR\b/i, /\bBL-\d+/, /\b[A-Z]+-REQ-\d+/, /\b(CN|HN)-\d/, /counsel/i, /\bTODO\b/, /\bdraft/i, /appendix/i, /\{[A-Za-z_]+\}/, /\bunverified\b/i];
    for (const [name, value] of Object.entries(text)) {
      for (const pattern of internal) expect(value, `${name}: ${pattern}`).not.toMatch(pattern);
    }
  });

  // RULE: name no service the code does not use.
  it('names exactly the two services the code uses, and no other', () => {
    expect(serviceProviders.map((p) => p.name)).toEqual(['Vercel', 'Resend']);
    const helps = privacy.sections.find((s) => s.id === 'who-helps')!;
    expect(helps.blocks.find((b) => typeof b !== 'string')).toEqual({ list: ['Vercel hosts the website.', 'Resend stores the list and sends our emails.'] });
    const notUsed = /\b(PostHog|Sentry|RevenueCat|AWS|Amazon|Google|Anthropic|Stripe|Supabase|PowerSync|Groq|DeepInfra|Cloudflare|Apple|Mailchimp|Segment)\b/;
    for (const [name, value] of Object.entries(text)) expect(value, name).not.toMatch(notUsed);
  });
});

describe('the publisher', () => {
  // RULE: the legal name never goes in code (D-004); it comes from PUBLISHER_LEGAL_NAME at build. No placeholder ever renders.
  const noBrackets = (text: string) => expect(text, 'a bracketed placeholder').not.toMatch(/[[\]{}]/);

  it('unset: "run by its founder, an individual", and "we" means that person, on both pages', () => {
    expect(resolvePublisherName({})).toEqual({ name: legalCopy.publisherFallback, isFallback: true });
    expect(pageText(privacy)).toContain('Early Letters is run by its founder, an individual. In this policy, "we" and "us" mean that person.');
    expect(pageText(terms)).toContain('Early Letters is run by its founder, an individual. In these terms, "we" and "us" mean that person.');
    for (const page of pages) noBrackets(pageText(page));
  });

  it('set: the name from the build, and "we" means that person, on both pages', () => {
    const env = { PUBLISHER_LEGAL_NAME: '  Asha   Example  ' };
    expect(resolvePublisherName(env)).toEqual({ name: 'Asha Example', isFallback: false });
    expect(pageText(legalPage('privacy', env))).toContain('Early Letters is run by Asha Example, an individual. In this policy, "we" and "us" mean that person.');
    expect(pageText(legalPage('terms', env))).toContain('Early Letters is run by Asha Example, an individual. In these terms, "we" and "us" mean that person.');
    for (const slug of legalSlugs) {
      expect(pageText(legalPage(slug, env))).not.toContain(legalCopy.publisherFallback);
      noBrackets(pageText(legalPage(slug, env)));
    }
  });

  it('a value that is not a plain name falls back to "its founder", never to the value itself', () => {
    for (const value of ['', '   ', '{PUBLISHER_LEGAL_NAME}', '[Publisher legal name]', '<b>x</b>', 'x'.repeat(121), 'a\u0000b']) {
      const resolved = resolvePublisherName({ PUBLISHER_LEGAL_NAME: value });
      expect(resolved, JSON.stringify(value)).toEqual({ name: legalCopy.publisherFallback, isFallback: true });
      for (const slug of legalSlugs) noBrackets(pageText(legalPage(slug, { PUBLISHER_LEGAL_NAME: value })));
    }
  });
});

describe('links', () => {
  // RULE: the footer is Privacy, Terms, Contact. Nothing else.
  it('the footer has Privacy, Terms and Contact, and Contact writes to the site address', () => {
    expect(site.footer.links.map((l) => [l.label, l.href])).toEqual([
      ['Privacy', '/privacy'],
      ['Terms', '/terms'],
      ['Contact', `mailto:${site.footer.contact}`],
    ]);
  });

  it('the contact address and, on Terms, the Privacy Policy become links', () => {
    expect(splitLinks(`Questions: ${site.footer.contact}.`, privacy.links)).toEqual([
      'Questions: ',
      { text: site.footer.contact, href: `mailto:${site.footer.contact}` },
      '.',
    ]);
    expect(splitLinks('Our Privacy Policy explains it.', terms.links)).toEqual(['Our ', { text: 'Privacy Policy', href: '/privacy' }, ' explains it.']);
    expect(legalSlugs.map((slug) => legalPage(slug, {}).href)).toEqual(['/privacy', '/terms']);
  });
});

/** Every runtime source file of the site (tests excluded). */
function sourceFiles(dir = join(WEB, 'src')): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

describe('the claims hold in the code', () => {
  // RULE: "We do not use cookies" and nothing is kept in the browser.
  it('no code sets a cookie or uses browser storage', () => {
    const offenders = sourceFiles().filter((file) =>
      /document\.cookie|\bcookies\(\)|set-cookie|localStorage|sessionStorage|indexedDB/i.test(readFileSync(file, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });

  // RULE: "We do not use analytics". Turning analytics on means changing the Privacy page first.
  it('analytics is off: not mounted, and off unless NEXT_PUBLIC_ANALYTICS=vercel', () => {
    expect(read('src/app/layout.tsx'), 'mounting WebAnalytics makes the Privacy page untrue; update it first').not.toMatch(/WebAnalytics|@vercel\/analytics/);
    expect(analyticsEnabled).toBe(false);
  });

  // RULE: the only outside services the site's code talks to are Resend (and Vercel, which runs it).
  it('depends on no other service SDK', () => {
    const deps = Object.keys((JSON.parse(read('package.json')) as { dependencies: Record<string, string> }).dependencies);
    expect(deps.filter((d) => /posthog|sentry|stripe|revenuecat|aws-sdk|@aws|google|anthropic|segment|mixpanel|amplitude|hotjar|intercom|supabase|firebase/i.test(d))).toEqual([]);
    expect(deps).toContain('resend');
  });

  // RULE: "loads nothing from other companies": the Content-Security-Policy allows the site's own origin only.
  it('the Content-Security-Policy names no other origin', () => {
    const csp = /const csp = \[([\s\S]*?)\]\.join/.exec(read('next.config.ts'))?.[1] ?? '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toMatch(/https?:\/\//);
  });

  // RULE: "holds your IP address in memory for up to 10 minutes. It is not saved."
  it('every rate-limit window is 10 minutes or less, and the limiter keeps keys in memory only', () => {
    for (const file of ['src/lib/notify/handler.ts', 'src/lib/notify/unsubscribe-handler.ts']) {
      const windows = [...read(file).matchAll(/windowMs:\s*([\d\s*]+)/g)].map((m) => m[1].split('*').reduce((a, b) => a * Number(b), 1));
      expect(windows.length, file).toBeGreaterThan(0);
      for (const ms of windows) expect(ms, file).toBeLessThanOrEqual(10 * 60 * 1000);
    }
    expect(read('src/lib/notify/rate-limit.ts')).toMatch(/new Map/);
  });

  // RULE: "We do not ask for your name or anything else": only the address goes to Resend.
  it('the sign-up sends Resend the address and the segment, nothing else', () => {
    expect(read('src/lib/notify/provider.ts')).toMatch(/contacts\.create\(\{ email, segments: \[\{ id: config\.segmentId \}\] \}/);
  });
});
