/**
 * Fixes from the email validation of 31 Oct 2026 (docs/reviews/2026-10-31: email-templates.md, signin.md,
 * subscriptions.md, language.md). Each block names the finding it holds closed.
 */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { accountEmails, authEmails, billingEmails, emailsById, familyEmails, lifecycleEmails, type EmailCopy } from '@scribe/content/src/emails';
import { STOP_TOKEN_RE } from '../../api/src/server/recovery-key';
import { renderEmail } from '../src/components/render';
import { CopyEmail } from '../src/templates/CopyEmail';
import { previewValues, templatesById } from '../src/templates';
import { fill, placeholders } from '../src/templates/fill';
import { linkFor, supabaseMappings } from '../src/templates/supabase';
import { DEFAULT_LINKS, SITE_ROUTES, linkStatus, neededRoute } from '../src/links';

const render = (id: string) => renderEmail(createElement(templatesById[id]!.Component, { values: previewValues }));
const URL_RE = /(?:https?:\/\/|mailto:)[^\s"'<>)]+/g;

describe('TPL-01: long words and URLs wrap on a 375px phone', () => {
  it('every text element and both sheet cells carry overflow-wrap:anywhere and word-break:break-word', async () => {
    for (const id of Object.keys(templatesById)) {
      const html = await render(id);
      const tags = [...html.matchAll(/<(p|h1)\b[^>]*>/g)].map((m) => m[0]);
      expect(tags.length, id).toBeGreaterThan(0);
      for (const t of tags) {
        expect(t, `${id}: ${t.slice(0, 80)}`).toContain('overflow-wrap:anywhere');
        expect(t, `${id}: ${t.slice(0, 80)}`).toContain('word-break:break-word');
      }
      expect([...html.matchAll(/<td class="el-pad"[^>]*>/g)].map((m) => m[0]).every((t) => t.includes('overflow-wrap:anywhere')), id).toBe(true);
    }
  });

  it('wraps a raw URL that sits in a paragraph (the style is on the element that holds it)', async () => {
    const long = `https://example.com/${'a'.repeat(80)}`;
    const html = await renderEmail(
      createElement(CopyEmail, { copy: { ...accountEmails['policy-update'], body: [`See ${long} for more.`] }, values: previewValues }),
    );
    const p = html.match(new RegExp(`<p[^>]*>See ${long}`))![0];
    expect(p).toContain('overflow-wrap:anywhere');
  });

  it('keeps raw URLs out of body paragraphs: a link belongs in the button (policy-update no longer prints two)', () => {
    const urlInBody = Object.values(emailsById).flatMap((e) => e.body.filter((b) => /\{(documentUrl|changesUrl|signInUrl|appUrl|exportUrl|stopUrl|confirmDeleteUrl|inviteUrl|verifyUrl|confirmUrl)\}/.test(b)).map((b) => `${e.id}: ${b}`));
    expect(urlInBody).toEqual([]);
    expect(placeholders([...accountEmails['policy-update'].body])).not.toContain('changesUrl');
  });
});

describe('TPL-06: every link points at a page that exists, or at one listed as still needed', () => {
  it('classifies routes', () => {
    expect(linkStatus('https://earlyletters.com/privacy')).toBe('built');
    expect(linkStatus('https://earlyletters.com/auth/callback#token_hash=x&type=email')).toBe('built');
    expect(linkStatus('https://earlyletters.com/open')).toBe('needed');
    expect(linkStatus('https://earlyletters.com/open/export/abc')).toBe('needed');
    expect(neededRoute('https://earlyletters.com/open/export/abc')).toBe('/open/export');
    expect(linkStatus('https://earlyletters.com/contact')).toBe('unknown');
    expect(linkStatus('https://earlyletters.com/privacy/changes')).toBe('unknown');
    expect(linkStatus('https://evil.example/privacy')).toBe('unknown');
    expect(linkStatus('mailto:hello@earlyletters.com')).toBe('mailto');
  });

  it('no rendered email or fixture links to a path outside the route contract, and no needed entry is stale', async () => {
    const used = new Set<string>();
    const bad: string[] = [];
    const check = (where: string, url: string) => {
      const s = linkStatus(url);
      if (s === 'unknown') bad.push(`${where}: ${url}`);
      const n = neededRoute(url);
      if (n) used.add(n);
    };
    for (const [k, v] of Object.entries(previewValues)) if (v && /^(https?:|mailto:)/.test(v)) check(`fixture ${k}`, v);
    for (const id of Object.keys(templatesById)) {
      const full = (await render(id)).replace(/&amp;/g, '&');
      const html = full.slice(full.indexOf('<body'));
      for (const m of html.matchAll(/href="([^"]+)"/g)) check(id, m[1]!);
      for (const m of html.replace(/<wbr\s*\/?>/g, '').matchAll(URL_RE)) if (!m[0].startsWith('https://earlyletters.com/email/')) check(`${id} text`, m[0].replace(/[.,]$/, ''));
    }
    expect(bad).toEqual([]);
    expect([...used].sort()).toEqual(Object.keys(SITE_ROUTES.needed).sort());
  });

  it('the footer Help link writes to the support mailbox (no /contact page exists)', async () => {
    const html = await render('welcome');
    expect(DEFAULT_LINKS.helpUrl).toMatch(/^mailto:/);
    expect(html).toContain(`href="${DEFAULT_LINKS.helpUrl}"`);
    expect(html).not.toContain('/contact');
  });
});

describe('TPL-09 and LNG-19: preheaders', () => {
  it('stay at 90 characters or less with real preview values filled in', () => {
    const long = Object.values(emailsById)
      .map((e) => ({ id: e.id, p: fill(e.preheader, previewValues) }))
      .filter((x) => x.p.length > 90)
      .map((x) => `${x.id} (${x.p.length}): ${x.p}`);
    expect(long).toEqual([]);
  });

  it('are never shared by two emails, and never repeat a body line word for word', () => {
    const all = Object.values(emailsById);
    const seen = new Map<string, string>();
    for (const e of all) {
      expect(seen.get(e.preheader), `${e.id} repeats ${seen.get(e.preheader)}`).toBeUndefined();
      seen.set(e.preheader, e.id);
      expect(e.body, e.id).not.toContain(e.preheader);
    }
  });
});

describe('TPL-11: fixture stop link has the sender shape', () => {
  it('is /stop# plus a 43-character token, as the escrow function and packages/api send it', () => {
    const u = new URL(previewValues.stopUrl!);
    expect(u.pathname).toBe('/stop');
    expect(u.hash.slice(1)).toMatch(STOP_TOKEN_RE);
  });
});

describe('SIGN: email side of sign-in', () => {
  it('every Supabase link template and fixture uses /auth/callback with the token hash in the fragment', () => {
    for (const m of supabaseMappings) if (m.otpType) expect(linkFor('token-hash', m.otpType), m.type).toMatch(/^\{\{ \.SiteURL \}\}\/auth\/callback#token_hash=\{\{ \.TokenHash \}\}&type=email(_change)?$/);
    for (const k of ['signInUrl', 'verifyUrl', 'confirmUrl']) {
      const u = new URL(previewValues[k]!);
      expect(u.pathname, k).toBe('/auth/callback');
      expect(u.search, k).toBe('');
      expect(u.hash, k).toMatch(/^#token_hash=/);
    }
  });

  it('SIGN-07: the link is for the phone that asked, whatever the app is doing', () => {
    for (const e of [authEmails['sign-in-link'], authEmails['sign-in-trouble']]) {
      const words = [e.preheader, ...e.body].join(' ');
      expect(words, e.id).not.toMatch(/where the app is open/);
      expect(words, e.id).toMatch(/phone you asked from/);
    }
  });
});

describe('SUB-03: every billing notice names the plan and the amount (COMPLIANCE.md 5.2, Terms 14.6)', () => {
  const text = (id: string) => {
    const e: EmailCopy = billingEmails[id as keyof typeof billingEmails];
    return [e.subject, e.preheader, e.heading, ...e.body, ...(e.facts ?? []).map((f) => `${f.label} ${f.value}`)].join('\n');
  };
  // D-022 rows and the acknowledgments: plan (A1), price and period (A3, A5), date (A6), cancel-by (A7) where it matters.
  const reminders = ['trial-started', 'plus-started', 'trial-ending-week', 'trial-ending-long', 'trial-ending-final', 'annual-renewal-long', 'annual-renewal-short', 'anniversary-reminder'];

  it('reminders and acknowledgments carry {planName}, {price} with its period, a date and how to cancel', () => {
    for (const id of reminders) {
      const t = text(id);
      expect(t, id).toContain('{planName}');
      expect(t, id).toMatch(/\{price\}( \{billingPeriod\}| for another year| on \{trialEndDate\})/);
      expect(t, id).toMatch(/\{(renewalDate|trialEndDate)\}/);
      expect(t, id).toMatch(/renews automatically|Plus renews/);
      expect(t, id).toContain('Settings, tap your name, then Subscriptions');
      expect((billingEmails[id as keyof typeof billingEmails] as EmailCopy).cta?.urlVar, id).toBe('{manageUrl}');
    }
    for (const id of reminders.filter((i) => i !== 'anniversary-reminder')) expect(text(id), id).toContain('{cancelByDate}');
  });

  it('the price-change notice gives both amounts and the date; cancellations and endings name the plan', () => {
    expect(text('price-increase')).toMatch(/\{oldPrice\}[\s\S]*\{newPrice\}[\s\S]*\{effectiveDate\}/);
    for (const id of ['plus-cancelled', 'plus-ended', 'plus-quiet']) expect(text(id), id).toContain('{planName}');
  });

  it('fills to real amounts with the preview values, and manage goes to Apple', () => {
    expect(fill(text('annual-renewal-long'), previewValues)).toContain('$49.99 a year');
    expect(previewValues.manageUrl).toBe('https://apps.apple.com/account/subscriptions');
  });
});

describe('LNG: email copy reads as written by a person', () => {
  const every = Object.values(emailsById).map((e) => ({ id: e.id, t: [e.subject, e.preheader, e.heading, ...e.body].join('\n') }));
  it('has no template signposts or stock phrases flagged by the language review', () => {
    const banned = [/\bHere is\b/, /Let's get you/, /^Good news/m, /Thank you for (choosing|being part of)/, /Thank you, we have/, /A quiet word/, /\bseasons?\b/i, /at your pace/i, /Just letting you know/];
    const hits = every.flatMap(({ id, t }) => banned.filter((b) => b.test(t)).map((b) => `${id}: ${b}`));
    expect(hits).toEqual([]);
  });

  it('calls what a person makes a letter, never a story (LNG-25)', () => {
    expect(every.filter(({ t }) => /\bstor(y|ies)\b/i.test(t)).map((x) => x.id)).toEqual([]);
    expect(lifecycleEmails['welcome-family'].heading).toBe('Your letters belong in this book');
  });

  it('family-book-restored leads with the fact (LNG-22)', () => {
    expect(familyEmails['family-book-restored'].subject).toBe('The book is staying');
  });
});
