/**
 * The permanent pages of the versioned legal texts, /legal/<doc>/0.9.0 (BL-565), and the founder decision of 8 Nov 2026:
 * the texts are published ONLY at their versioned addresses, and /terms and /privacy stay the website's own pages.
 * The words are checked where they live (content/legal/<doc>/0.9.0.md and packages/content/test/legal-beta.test.ts);
 * test/legal-served.test.ts pins their bytes. Here: how they are rendered, that /terms and /privacy do not read them,
 * and the claims about the website that the texts make, checked against the code, so a change that makes a sentence
 * untrue fails here first (and the text then needs a new version, never an edit).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { site } from '../src/content/site';
import { legalDocs, readLegalSource, splitFrontmatter } from '../src/lib/legal/documents';
import { siteOrigin } from '../src/lib/legal/origin';
import { legalPage, legalSlugs } from '../src/lib/legal/pages';
import { legalVersionPage } from '../src/lib/legal/versions';

const WEB = fileURLToPath(new URL('..', import.meta.url));
const read = (path: string) => readFileSync(join(WEB, path), 'utf8');

const sources = { privacy: readLegalSource('privacy', '0.9.0'), terms: readLegalSource('terms', '0.9.0') };
const body = { privacy: sources.privacy.body, terms: sources.terms.body };
const pages = { privacy: legalVersionPage('privacy', '0.9.0'), terms: legalVersionPage('terms', '0.9.0') };
const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

describe('the versioned texts', () => {
  it('there are two documents at version 0.9.0, each at its permanent address and raw address', () => {
    expect([...legalDocs].sort()).toEqual(['privacy', 'terms']);
    for (const slug of legalDocs) {
      expect(sources[slug].meta.document).toBe(slug);
      expect(sources[slug].meta.version).toBe('0.9.0');
      expect(sources[slug].meta.url).toBe(`${siteOrigin}/legal/${slug}/0.9.0`);
      expect(pages[slug].href).toBe(`/legal/${slug}/0.9.0`);
      expect(pages[slug].rawHref).toBe(`/legal/${slug}/0.9.0.md`);
    }
  });

  // RULE (founder decision, 8 Nov 2026): the live /terms and /privacy are the website's own pages. They read none of this.
  it('[BL-565] /terms and /privacy do not read the versioned texts: their pages and data files never import them', () => {
    const floating = [
      'src/components/site/LegalPage.tsx',
      'src/lib/legal/pages.ts',
      'src/lib/legal/terms-copy.ts',
      'src/lib/legal/privacy-copy.ts',
      'src/app/(legal)/terms/page.tsx',
      'src/app/(legal)/privacy/page.tsx',
    ];
    for (const file of floating) expect(read(file), file).not.toMatch(/legal\/documents|legal\/versions|\.\/documents|\.\/versions|LegalDocument|content\/legal/);
    for (const slug of legalSlugs) {
      expect(legalPage(slug, {}).href).toBe(`/${slug}`);
      expect(legalPage(slug, {}).lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    // And the footer, which every visitor sees, still points at them.
    expect(site.footer.links.slice(0, 2).map((l) => l.href)).toEqual(['/privacy', '/terms']);
  });

  // RULE (BL-565, step 3): the frontmatter is not shown, and "Version 0.9.0, a test version." is the first line under the title.
  it('[BL-565] the page has the title, then the line "Version 0.9.0, a test version.", and no frontmatter', () => {
    for (const slug of legalDocs) {
      const { html } = pages[slug];
      expect(html).toMatch(/^<h1[^>]*>[^<]+<\/h1>\n<p>Version 0\.9\.0, a test version\.<\/p>/);
      expect(html.match(/<h1\b/g)).toHaveLength(1);
      for (const key of ['status:', 'review:', 'source:', 'draft-for-counsel', 'document: ']) expect(html, `${slug}: ${key}`).not.toContain(key);
      expect(body[slug].startsWith('# ')).toBe(true);
      expect(splitFrontmatter(sources[slug].raw.toString('utf8')).body).toBe(body[slug]);
    }
  });

  it('keeps tables as tables and turns the contact address and web links into links', () => {
    expect(pages.privacy.html).toContain('<table>');
    expect(pages.privacy.html).toContain('<a href="mailto:hello@earlyletters.com">hello@earlyletters.com</a>');
    // A link to our own address stays on the origin that serves it; the text shows the full address.
    expect(pages.terms.html).toContain('<a href="/legal/privacy/0.9.0">https://earlyletters.com/legal/privacy/0.9.0</a>');
    for (const slug of legalDocs) expect(pages[slug].html, 'raw HTML and scripts never pass').not.toMatch(/<script|onerror=|javascript:/i);
  });

  it('[BL-565] each page is a permanent page of its own version, dated by the version\'s changelog row', () => {
    for (const slug of legalDocs) {
      expect(pages[slug].published).toBe('2026-11-08');
      expect(body[slug]).toMatch(/\| 0\.9\.0 \| 2026-11-08 \| First published version/);
    }
  });

  // RULE: content rules (CLAUDE.md): ASCII only, so no dashes, curly quotes, ellipsis characters or emoji.
  it('is plain ASCII, with Unix line endings and one final newline', () => {
    for (const slug of legalDocs) {
      const text = sources[slug].raw.toString('utf8');
      expect(text, slug).toMatch(/^[\x0a\x20-\x7e]*$/);
      expect(text.endsWith('\n') && !text.endsWith('\n\n'), `${slug}: one final newline`).toBe(true);
    }
  });

  // RULE: no internal decision ids, ADR numbers, backlog ids, counsel notes, TODOs or placeholders in the published body.
  it('has no internal references, placeholders or bracketed blanks in what a reader sees', () => {
    const internal = [/\bD-\d{2,3}\b/, /\bADR\b/, /\bBL-\d+/, /\b[A-Z]+-REQ-\d+/, /\b(CN|HN)-\d/, /\bTODO\b/, /\{[A-Za-z_]+\}/, /\[[A-Z][^\]]*\]/];
    for (const slug of legalDocs) for (const pattern of internal) expect(body[slug], `${slug}: ${pattern}`).not.toMatch(pattern);
  });

  it('reads as a test version: the top says so, and it names no Plus price', () => {
    for (const slug of legalDocs) {
      expect(body[slug]).toContain('test version');
      expect(body[slug]).toContain('has not had a full legal review');
      expect(body[slug]).not.toMatch(/\$\d+(\.\d\d)?\s*(\/|a |per )(month|year)/i);
    }
    expect(words(body.terms)).toBeGreaterThan(500);
    expect(words(body.privacy)).toBeGreaterThan(500);
  });
});

describe('the publisher', () => {
  // RULE: the legal name never goes in code or in git (D-004). The 0.9.0 text says "its founder" and is served unchanged, so
  // a build variable cannot change it; naming the publisher is a new version.
  it('the texts say "its founder", and no build variable can put a name into them', () => {
    for (const slug of legalDocs) expect(body[slug]).toContain('Early Letters is run by its founder ("we", "us").');
    const before = legalVersionPage('terms', '0.9.0').html;
    process.env.PUBLISHER_LEGAL_NAME = 'Asha Example';
    try {
      expect(legalVersionPage('terms', '0.9.0').html).toBe(before);
      expect(legalVersionPage('privacy', '0.9.0').html).not.toContain('Asha Example');
    } finally {
      delete process.env.PUBLISHER_LEGAL_NAME;
    }
  });
});

describe('the website claims in the versioned Privacy Policy hold in the code', () => {
  it('the sound choice: the text says what the code does', () => {
    const sentence = 'If you press its sound button, your browser remembers whether sound is on; that stays in your browser.';
    expect(body.privacy).toContain(sentence);
    const src = read('src/film/sound/AmbientSound.tsx');
    // Writes happen in exactly two places, both inside the button handler; reading on load never writes.
    expect(src.match(/writeChoice\(/g)?.length).toBe(2);
    const toggle = src.slice(src.indexOf('onToggle'));
    expect(toggle.match(/writeChoice\(storage\(\), (true|false)\)/g)?.length).toBe(2);
    expect(src.slice(0, src.indexOf('onToggle'))).not.toMatch(/writeChoice\(storage\(\)/);
    // Nothing is sent: the stored value never reaches fetch, sendBeacon, a form or a URL.
    expect(src).not.toMatch(/\bfetch\(|sendBeacon|XMLHttpRequest|WebSocket/);
    for (const slug of legalDocs) expect(body[slug]).not.toMatch(/no browser storage|nothing (is )?(stored|kept) in your browser/i);
  });

  // RULE (BL-565): the texts describe the email list; every sentence about it is true to the code (apps/web/src/lib/notify).
  it('the email list: what the text says about joining, the emails, unsubscribing and the IP address is what the code does', () => {
    const privacy = body.privacy;
    // Joining stores the address as a Resend contact in one segment; nothing else is sent or asked.
    expect(privacy).toContain('If you join the list on our website to hear when the app is ready, we keep your email address.');
    expect(read('src/lib/notify/provider.ts')).toMatch(/contacts\.create\(\{ email, segments: \[\{ id: config\.segmentId \}\] \}/);
    expect(privacy).toContain('Resend | Sends our emails, may receive mail sent to our address, and stores our email list');
    expect(privacy).toContain('Vercel | Hosts our website');
    // A welcome email at sign-up (sendWelcome) and one more when the app is ready (the welcome email promises it).
    expect(privacy).toContain('we use your address to send a welcome email and one email when the app is ready');
    expect(read('src/lib/notify/provider.ts')).toMatch(/export async function sendWelcome/);
    expect(site.welcomeEmail.intro).toContain('You will hear from us once more, at launch.');
    // Unsubscribing marks the contact unsubscribed and keeps it; it never removes it.
    expect(privacy).toContain('If you unsubscribe, we keep the address marked as unsubscribed, only so that we never email you again.');
    const unsubscribe = read('src/lib/notify/unsubscribe.ts');
    expect(unsubscribe).toMatch(/unsubscribed: true/);
    expect(unsubscribe).not.toMatch(/contacts\.remove|\.delete\(/);
    // Removing an address entirely is by email, as the text says; there is no delete route on the site.
    expect(privacy).toContain('To have your email address removed from our list, email us from that address.');
    // The IP address: held in memory for 10 minutes at most when joining or leaving, never saved.
    expect(privacy).toContain('the website holds your IP address in memory for up to 10 minutes to block automated requests, and does not save it.');
    // No cookies, no analytics, nothing from other sites.
    expect(privacy).toContain('The website uses no cookies and no analytics, and loads nothing from other sites.');
  });
});
