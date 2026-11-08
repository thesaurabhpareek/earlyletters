/**
 * /terms and /privacy, and the permanent pages /legal/<doc>/0.9.0: the 0.9.0 texts (BL-565), nothing written in code.
 * The words are checked where they live (content/legal/<doc>/0.9.0.md, test/legal-served.test.ts pins their bytes); here the
 * claims the code can prove are checked against the code itself, so a change that makes a sentence untrue fails here first.
 * Characters and voice are checked by copy-rules.test.ts for the copy files; this file checks the texts' characters too.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import { site } from '../src/content/site';
import { analyticsEnabled } from '../src/lib/analytics';
import { currentVersion, legalDocs, readLegalSource, renderLegalHtml, splitFrontmatter } from '../src/lib/legal/documents';
import { siteOrigin } from '../src/lib/legal/origin';
import { legalPage, legalSlugs } from '../src/lib/legal/pages';

const WEB = fileURLToPath(new URL('..', import.meta.url));
const read = (path: string) => readFileSync(join(WEB, path), 'utf8');

const sources = { privacy: readLegalSource('privacy'), terms: readLegalSource('terms') };
const body = { privacy: sources.privacy.body, terms: sources.terms.body };
const pages = { privacy: legalPage('privacy'), terms: legalPage('terms') };
const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

describe('the texts', () => {
  it('there are two documents at version 0.9.0, and the floating pages show that version', () => {
    expect([...legalDocs].sort()).toEqual(['privacy', 'terms']);
    expect([...legalSlugs].sort()).toEqual(['privacy', 'terms']);
    expect(currentVersion).toBe('0.9.0');
    for (const slug of legalSlugs) {
      expect(sources[slug].meta.document).toBe(slug);
      expect(sources[slug].meta.version).toBe('0.9.0');
      expect(sources[slug].meta.url).toBe(`${siteOrigin}/legal/${slug}/0.9.0`);
      expect(pages[slug].versionHref).toBe(`/legal/${slug}/0.9.0`);
      expect(pages[slug].rawHref).toBe(`/legal/${slug}/0.9.0.md`);
    }
  });

  // RULE (BL-565, step 4): the page a tester opens from the app (/terms, /privacy) is the 0.9.0 text, the same as its permanent page.
  it('[BL-565] /terms and /privacy render the same 0.9.0 text as /legal/<doc>/0.9.0', () => {
    for (const slug of legalSlugs) {
      expect(legalPage(slug).html).toBe(legalPage(slug, '0.9.0').html);
      expect(legalPage(slug).html).toBe(renderLegalHtml(body[slug]));
      expect(pages[slug].href).toBe(`/${slug}`);
    }
  });

  // RULE (BL-565, step 3): the frontmatter is not shown, and "Version 0.9.0, a test version." is the first line under the title.
  it('[BL-565] the page has the title, then the line "Version 0.9.0, a test version.", and no frontmatter', () => {
    for (const slug of legalSlugs) {
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
    for (const slug of legalSlugs) expect(pages[slug].html, 'raw HTML and scripts never pass').not.toMatch(/<script|onerror=|javascript:/i);
  });

  it('[BL-565] each page is a permanent page of its own version, dated by the version\'s changelog row', () => {
    for (const slug of legalSlugs) {
      expect(pages[slug].published).toBe('2026-11-08');
      expect(body[slug]).toMatch(/\| 0\.9\.0 \| 2026-11-08 \| First published version/);
    }
  });

  // RULE: content rules (CLAUDE.md): ASCII only, so no dashes, curly quotes, ellipsis characters or emoji.
  it('is plain ASCII, with Unix line endings and one final newline', () => {
    for (const slug of legalSlugs) {
      const text = sources[slug].raw.toString('utf8');
      expect(text, slug).toMatch(/^[\x0a\x20-\x7e]*$/);
      expect(text.endsWith('\n') && !text.endsWith('\n\n'), `${slug}: one final newline`).toBe(true);
    }
  });

  // RULE: no internal decision ids, ADR numbers, backlog ids, counsel notes, TODOs or placeholders in the published body.
  it('has no internal references, placeholders or bracketed blanks in what a reader sees', () => {
    const internal = [/\bD-\d{2,3}\b/, /\bADR\b/, /\bBL-\d+/, /\b[A-Z]+-REQ-\d+/, /\b(CN|HN)-\d/, /\bTODO\b/, /\{[A-Za-z_]+\}/, /\[[A-Z][^\]]*\]/];
    for (const slug of legalSlugs) for (const pattern of internal) expect(body[slug], `${slug}: ${pattern}`).not.toMatch(pattern);
  });

  it('reads as a test version: the top says so, and it names no Plus price', () => {
    for (const slug of legalSlugs) {
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
    for (const slug of legalSlugs) expect(body[slug]).toContain('Early Letters is run by its founder, an individual based in California');
    const before = legalPage('terms').html;
    process.env.PUBLISHER_LEGAL_NAME = 'Asha Example';
    try {
      expect(legalPage('terms').html).toBe(before);
      expect(legalPage('privacy').html).not.toContain('Asha Example');
    } finally {
      delete process.env.PUBLISHER_LEGAL_NAME;
    }
    expect(sourceFiles().filter((file) => /PUBLISHER_LEGAL_NAME/.test(readFileSync(file, 'utf8')))).toEqual([]);
  });
});

describe('the home page sign-up note', () => {
  // RULE: the note matches Privacy and the code: a welcome email on sign-up, one more at launch (provider.ts sendWelcome),
  // and Resend stores the address, so "we never share it" would be untrue.
  it('names both emails and promises no selling and no advertising, not "never share"', () => {
    expect(site.notify.note).toBe(
      `You will get a short hello, then one email when ${site.brand.name} is ready. We never sell your address or share it for advertising. Every email has an unsubscribe link.`,
    );
    expect(site.notify.note).not.toMatch(/never share|^One email/i);
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

  it('the footer links land on the pages that show the 0.9.0 text', () => {
    expect(legalSlugs.map((slug) => legalPage(slug).href).sort()).toEqual(site.footer.links.slice(0, 2).map((l) => l.href).sort());
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
  // RULE: "We do not use cookies", and the only thing kept in the browser is the sound choice.
  // The sound button remembers a single value, "on" or "off", in localStorage on the visitor's own device. It is never
  // sent anywhere and is not a cookie. The Privacy page says so (one sentence, approved by the founder; counsel must
  // confirm). Any other file using browser storage still fails here, and the next test pins the sentence to the code.
  const STORAGE_ALLOWED = new Set(['src/film/sound/AmbientSound.tsx']);
  it('no code sets a cookie or uses browser storage', () => {
    const offenders = sourceFiles()
      .filter((file) => !STORAGE_ALLOWED.has(file.slice(file.indexOf('src/')).replaceAll('\\', '/')))
      .filter((file) => /document\.cookie|\bcookies\(\)|set-cookie|localStorage|sessionStorage|indexedDB/i.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
  it('the sound button stores only its one on/off value', () => {
    const src = readFileSync(join(WEB, 'src/film/sound/AmbientSound.tsx'), 'utf8');
    expect(src.match(/localStorage/g)?.length).toBe(1);
    expect(src).not.toMatch(/document\.cookie|sessionStorage|indexedDB/);
    expect(read('src/film/sound/ambient-map.ts')).toMatch(/v === 'on' \? true : v === 'off' \? false : null/);
  });

  it('the Privacy text says what the code does: the sound choice is written only when the button is pressed', () => {
    const sentence = 'If you press its sound button, your browser remembers whether sound is on; that stays in your browser.';
    expect(body.privacy).toContain(sentence);
    const src = readFileSync(join(WEB, 'src/film/sound/AmbientSound.tsx'), 'utf8');
    // Writes happen in exactly two places, both inside the button handler; reading on load never writes.
    expect(src.match(/writeChoice\(/g)?.length).toBe(2);
    const toggle = src.slice(src.indexOf('onToggle'));
    expect(toggle.match(/writeChoice\(storage\(\), (true|false)\)/g)?.length).toBe(2);
    expect(src.slice(0, src.indexOf('onToggle'))).not.toMatch(/writeChoice\(storage\(\)/);
    // Nothing is sent: the stored value never reaches fetch, sendBeacon, a form or a URL.
    expect(src).not.toMatch(/\bfetch\(|sendBeacon|XMLHttpRequest|WebSocket/);
    // No part of either text claims the opposite.
    for (const slug of legalSlugs) expect(body[slug]).not.toMatch(/no browser storage|nothing (is )?(stored|kept) in your browser/i);
  });

  // RULE (BL-565): the texts describe the email list; every sentence about it is true to the code (apps/web/src/lib/notify).
  it('the email list: what Privacy says about joining, the emails, unsubscribing and the IP address is what the code does', () => {
    const privacy = body.privacy;
    // Joining stores the address as a Resend contact in one segment; nothing else is sent or asked.
    expect(privacy).toContain('If you join the list on our website to hear when the app is ready, we keep your email address.');
    expect(read('src/lib/notify/provider.ts')).toMatch(/contacts\.create\(\{ email, segments: \[\{ id: config\.segmentId \}\] \}/);
    expect(privacy).toContain('Resend | Sends our emails, receives mail sent to our address, and stores our email list');
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
    // Every email has an unsubscribe link and the one-click header.
    expect(read('src/lib/notify/provider.ts')).toMatch(/List-Unsubscribe-Post/);
    // Removing an address entirely is by email, as the text says; there is no delete route on the site.
    expect(privacy).toContain('To have your email address removed from our list, email us from that address.');
    // The IP address: held in memory for 10 minutes at most when joining or leaving, never saved.
    expect(privacy).toContain('the website holds your IP address in memory for up to 10 minutes to block automated requests, and does not save it.');
    // No cookies, no analytics, nothing from other sites.
    expect(privacy).toContain('The website uses no cookies and no analytics, and loads nothing from other sites.');
  });

  // RULE: "We do not use analytics". Turning analytics on means changing the Privacy page first.
  it('analytics is off: not mounted, and off unless NEXT_PUBLIC_ANALYTICS=vercel', () => {
    expect(read('src/app/layout.tsx'), 'mounting WebAnalytics makes the Privacy text untrue; publish a new version first').not.toMatch(/WebAnalytics|@vercel\/analytics/);
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

/** A CSS rule with the @media query it sits in (null at top level). Comments are stripped; one level of nesting. */
type CssRule = { media: string | null; selector: string; decls: Record<string, string> };
function parseCss(source: string): CssRule[] {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules: CssRule[] = [];
  const decls = (body: string) =>
    Object.fromEntries(
      body
        .split(';')
        .map((d) => d.trim())
        .filter((d) => d.includes(':'))
        .map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()]),
    );
  let i = 0;
  let media: string | null = null;
  let depth = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    const close = css.indexOf('}', i);
    if (close === -1) break;
    if (open !== -1 && open < close) {
      const head = css.slice(i, open).trim();
      if (head.startsWith('@media')) {
        media = head.replace(/^@media\s*/, '').replace(/\s+/g, ' ');
        depth = 1;
        i = open + 1;
        continue;
      }
      const end = css.indexOf('}', open);
      rules.push({ media, selector: head.replace(/\s+/g, ' '), decls: decls(css.slice(open + 1, end)) });
      i = end + 1;
      continue;
    }
    // A bare closing brace ends the @media block.
    if (depth === 1) {
      media = null;
      depth = 0;
    }
    i = close + 1;
  }
  return rules;
}

describe('theme (the pages follow the phone: paper in light, night in dark; print stays light)', () => {
  const css = read('src/components/site/Legal.module.css');
  const rules = parseCss(css);
  const globals = read('src/app/globals.css');
  const layout = read('src/app/(legal)/layout.tsx');
  const token = (name: string) => {
    const m = globals.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
    if (!m) throw new Error(`no token --${name}`);
    return m[1].toLowerCase();
  };
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const v = parseInt(hex.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a: string, b: string) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const ROLES = ['bg', 'ink', 'muted', 'link', 'focus'] as const;
  /** The .frame rule in one media context, as role -> token name. */
  const frame = (media: string | null) => {
    const found = rules.filter((r) => r.selector === '.frame' && r.media === media);
    expect(found, `.frame rule in ${media ?? 'top level'}`).toHaveLength(1);
    const { decls } = found[0];
    const roles = Object.fromEntries(
      ROLES.map((role) => [role, decls[`--legal-${role}`]?.match(/^var\(--([\w-]+)\)$/)?.[1]]),
    ) as Record<(typeof ROLES)[number], string | undefined>;
    return { decls, roles };
  };
  const light = frame(null);
  const dark = frame('(prefers-color-scheme: dark)');
  const print = frame('print');

  it('does not force a light colour scheme on screen, and hardcodes no colour', () => {
    expect(light.decls['color-scheme']).toBe('light dark');
    for (const r of rules.filter((r) => r.media !== 'print')) expect(r.decls['color-scheme'] ?? 'light dark').not.toBe('light');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(/);
  });

  it('maps every role in each theme: paper tokens in light, night tokens in dark', () => {
    for (const role of ROLES) {
      expect(light.roles[role], `light ${role}`).toMatch(/^(?!night)/);
      expect(dark.roles[role], `dark ${role}`).toMatch(/^night/);
    }
  });

  it('prints in the light tokens whatever the phone theme', () => {
    expect(print.decls['color-scheme']).toBe('light');
    for (const role of ROLES) {
      expect(print.roles[role], `print ${role}`).toBeDefined();
      expect(print.roles[role], `print ${role}`).not.toMatch(/^night/);
    }
    // The print block must come after the dark block (same specificity, so the later one wins).
    expect(css.lastIndexOf('@media print')).toBeGreaterThan(css.indexOf('@media (prefers-color-scheme: dark)'));
  });

  it('body, muted text and links pass 4.5:1, and the focus ring 3:1, on screen in both themes and in print', () => {
    for (const [name, { roles }] of [['light', light], ['dark', dark], ['print', print]] as const) {
      const bg = token(roles.bg!);
      for (const role of ['ink', 'muted', 'link'] as const) {
        expect(contrast(token(roles[role]!), bg), `${name} ${role}`).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrast(token(roles.focus!), bg), `${name} focus`).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps links underlined, so colour is never the only signal', () => {
    const links = rules.filter((r) => /\.prose a\b/.test(r.selector));
    expect(links.length).toBeGreaterThan(0);
    for (const r of links) expect(r.decls['text-decoration'] ?? '').not.toMatch(/none/);
  });

  it('gives the browser bar the page colour for each scheme', () => {
    expect(layout).toMatch(/prefers-color-scheme: light\)', color: brand\.colors\.paper \}/);
    expect(layout).toMatch(/prefers-color-scheme: dark\)', color: brand\.colors\.paperDark \}/);
    // The bar colours are brand values; pin them to the page backgrounds so they cannot drift apart.
    expect(brand.colors.paper.toLowerCase()).toBe(token(light.roles.bg!));
    expect(brand.colors.paperDark.toLowerCase()).toBe(token(dark.roles.bg!));
  });
});
