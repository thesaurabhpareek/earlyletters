/**
 * The legal documents describe the build we ship, in words a family can read (LEGAL-REQ-064,
 * ENGINEERING_REQUIREMENTS 1.3.0).
 *
 * Option B (founder, 15 Oct 2026) ships accounts, sync, co-parent sharing, encrypted recording backup with a
 * recovery key we hold, and the subscription status report. The on-device drafts of pull request #81 said the
 * opposite, and the 3 Oct drafts carried prices that D-082 replaced. The founder's direction of 15 Oct also asks
 * that published pages carry no internal references, name only services the build uses, and never read as a
 * decision log. This test holds both. If it fails, fix the document, not the test (CLAUDE.md).
 *
 * What is exempt, and why:
 * - Changelog sections of internal documents: they record what earlier versions said.
 * - The history sections of app-store-privacy-labels.md: they explain why the earlier label answer no longer holds.
 * - docs/legal/memos/: dated review records (2 and 3 Oct 2026), kept as written and checked only for characters.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PLUS_PRICE } from '../src/pricing';

const REPO = join(__dirname, '..', '..', '..');
const LEGAL = join(REPO, 'docs', 'legal');

function markdownFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return markdownFiles(full);
    return name.endsWith('.md') ? [full] : [];
  });
}

const ALL = markdownFiles(LEGAL).map((full) => ({ path: relative(LEGAL, full), text: readFileSync(full, 'utf8') }));
const isMemo = (path: string) => path.startsWith('memos/');
const DOCS = ALL.filter((d) => !isMemo(d.path));

/** The documents people read on the website or in the app. */
const PUBLISHED = ['privacy-policy.md', 'terms-of-service.md', 'subscription-terms.md', 'subprocessors.md', 'delete-account-page.md'];
const doc = (path: string) => {
  const found = ALL.find((d) => d.path === path);
  if (!found) throw new Error(`docs/legal/${path} is missing`);
  return found;
};

type Line = { path: string; n: number; text: string; section: string };

/** Every line with the level 1 or 2 heading it sits under. Frontmatter lines sit under "frontmatter". */
function lines(d: { path: string; text: string }): Line[] {
  let section = '';
  let frontmatter = d.text.startsWith('---');
  let fences = 0;
  return d.text.split('\n').map((text, i) => {
    if (frontmatter) {
      if (text === '---') fences += 1;
      if (fences === 2) frontmatter = false;
      return { path: d.path, n: i + 1, text, section: 'frontmatter' };
    }
    const heading = /^#{1,2}\s+(.*)$/.exec(text);
    if (heading) section = heading[1];
    return { path: d.path, n: i + 1, text, section };
  });
}

const isChangelog = (l: Line) => /changelog/i.test(l.section);
const isLabelHistory = (l: Line) => l.path === 'app-store-privacy-labels.md' && /history/i.test(l.section);
const offenders = (items: Line[], re: RegExp) => items.filter((l) => re.test(l.text)).map((l) => `${l.path}:${l.n}: ${l.text.trim()}`);

const CURRENT: Line[] = DOCS.flatMap(lines).filter((l) => !isChangelog(l));
/** Everything a reader of a published page sees: the body, its changelog included; not the frontmatter. */
const PUBLISHED_BODY: Line[] = DOCS.filter((d) => PUBLISHED.includes(d.path)).flatMap(lines).filter((l) => l.section !== 'frontmatter');

/** The only blanks a published draft may hold. Each is a fact only the founder can give. */
const FOUNDER_BLANKS = new Set(['legal name', 'mailing address', 'county', 'effective date', 'phone number']);

describe('legal documents: no superseded prices (D-082)', () => {
  it('[LEGAL-REQ-064] finds the documents it checks', () => {
    for (const p of PUBLISHED) expect(ALL.map((d) => d.path)).toContain(p);
    expect(PUBLISHED_BODY.length).toBeGreaterThan(200);
  });

  it('[LEGAL-REQ-064] no document outside a changelog names the 3 Oct Plus prices', () => {
    expect(offenders(CURRENT, /\$\s?3\.99|\$\s?29\.99|\b3\.99 (?:a|per) month|\b29\.99 (?:a|per) year/i)).toEqual([]);
  });

  it('[LEGAL-REQ-064] every dollar amount in a published document is a current Plus price or the $50 liability floor', () => {
    const allowed = new Set([PLUS_PRICE.monthly, PLUS_PRICE.yearly, '$50']);
    const found = PUBLISHED_BODY.flatMap((l) => [...l.text.matchAll(/\$\d+(?:\.\d{2})?/g)].map((m) => ({ l, amount: m[0] })));
    expect(found.filter((f) => !allowed.has(f.amount)).map((f) => `${f.l.path}:${f.l.n}: ${f.amount}`)).toEqual([]);
  });

  it('[LEGAL-REQ-064] the Terms and the Subscription Terms state the prices in packages/content/src/pricing.ts', () => {
    for (const p of ['terms-of-service.md', 'subscription-terms.md']) {
      expect(doc(p).text, p).toContain(`US ${PLUS_PRICE.monthly}`);
      expect(doc(p).text, p).toContain(`US ${PLUS_PRICE.yearly}`);
    }
  });
});

describe('legal documents: no on-device claims from the earlier drafts (option B)', () => {
  it('[LEGAL-REQ-064] "Data Not Collected" appears only in the history of app-store-privacy-labels.md', () => {
    const NO_DATA = /data not collected/i;
    expect(offenders(CURRENT.filter((l) => !isLabelHistory(l)), NO_DATA)).toEqual([]);
    // The history keeps the earlier answer on record, so the scan is not blind to it.
    expect(lines(doc('app-store-privacy-labels.md')).filter((l) => isLabelHistory(l) && NO_DATA.test(l.text)).length).toBeGreaterThan(0);
  });

  it('[LEGAL-REQ-064] no document says the app collects nothing', () => {
    expect(offenders(CURRENT, /\bcollects? nothing\b|\bwe (?:do not|don't) collect any(?:thing| data)\b/i)).toEqual([]);
  });

  it('[LEGAL-REQ-064] no published document says there is no account', () => {
    expect(offenders(PUBLISHED_BODY, /\bno accounts?\b|\bwithout (?:an )?account or sync\b/i)).toEqual([]);
  });

  it('[LEGAL-REQ-064] published documents follow the D-091 backup wording rules', () => {
    // Never "only your family's keys"; never a claim that we cannot read letters or listen to recordings.
    const D091 = /only (?:your|the) family'?s keys|only you can (?:play|hear|open)|\bwe (?:cannot|can't|can not) (?:listen|read|hear|open)\b|recordings never leave/i;
    expect(offenders(PUBLISHED_BODY, D091)).toEqual([]);
  });

  it('[LEGAL-REQ-064] the claim patterns catch the earlier wording and let the option B wording pass', () => {
    const D091 = /only (?:your|the) family'?s keys|only you can (?:play|hear|open)|\bwe (?:cannot|can't|can not) (?:listen|read|hear|open)\b/i;
    expect(/\bno accounts?\b/i.test('There is no account. You do not sign in.')).toBe(true);
    expect(D091.test('Your recordings stay on your phone, so we cannot listen to them.')).toBe(true);
    expect(D091.test("An encrypted backup only your family's keys can open.")).toBe(true);
    for (const s of [
      'We use it only to restore your recordings to your own phone, to replace the key, or when the law requires it.',
      'Letters already on their phone, or in an export, stay with them. We cannot reach those copies.',
      'You can write and keep letters on your phone without an account.',
    ]) {
      expect(D091.test(s) || /\bno accounts?\b/i.test(s), s).toBe(false);
    }
  });
});

describe('published documents read as legal text, not as working notes (founder, 15 Oct 2026)', () => {
  it('[LEGAL-REQ-064] carry no decision, ADR, backlog, requirement or pull request ids, TODOs or notes for counsel', () => {
    const INTERNAL =
      /\b(?:D|BL|WP|FT|CR|DR|Q)-\d{2,3}\b|\b(?:LEGAL|DATA)-REQ\b|\bF\d{2}(?:-REQ)?\b|\bADR\b|\bPRD\b|\bPR #\d+|\bpull request\b|\bcounsel\b|\bTODO\b|\boption B\b|\bdraft\b/i;
    expect(offenders(PUBLISHED_BODY, INTERNAL)).toEqual([]);
  });

  it('[LEGAL-REQ-064] hold no placeholder except the founder blanks, and no brace placeholders', () => {
    const bad = PUBLISHED_BODY.flatMap((l) =>
      [...l.text.matchAll(/\[([^\]]+)\](?!\()/g)].filter((m) => !FOUNDER_BLANKS.has(m[1])).map((m) => `${l.path}:${l.n}: [${m[1]}]`),
    );
    expect(bad).toEqual([]);
    // The delete-account copy names the website's own fields ({brand.name}, {contact}); nothing else uses braces.
    const braces = PUBLISHED_BODY.filter((l) => l.path !== 'delete-account-page.md');
    expect(offenders(braces, /\{[^}]+\}/)).toEqual([]);
  });

  it('[LEGAL-REQ-064] never name a product the build does not use', () => {
    // v1.0 has no analytics, crash reporting, billing SDK or AI provider. Sign in with Google is in the code but
    // shows only when a build sets its client IDs; the texts name it only once a release build offers it, and this
    // list changes in the same pull request.
    const NOT_USED = /\b(?:PostHog|Sentry|Crashlytics|Firebase|Mixpanel|Amplitude|Segment|RevenueCat|PowerSync|Stripe|Lulu|Groq|DeepInfra|OpenAI|Anthropic|Google)\b|Google Analytics/i;
    expect(offenders(PUBLISHED_BODY, NOT_USED)).toEqual([]);
  });

  it('[LEGAL-REQ-064] the Privacy Policy and the service providers page name the services the build uses', () => {
    for (const p of ['privacy-policy.md', 'subprocessors.md']) {
      for (const name of ['Supabase', 'Cloudflare R2', 'Resend', 'Vercel', 'Apple', 'Hugging Face']) expect(doc(p).text, `${p}: ${name}`).toContain(name);
    }
  });

  it('[LEGAL-REQ-064] there is no separate consumer health data notice until counsel asks for one', () => {
    expect(ALL.map((d) => d.path)).not.toContain('consumer-health-data-notice.md');
    expect(doc('privacy-policy.md').text).toMatch(/^## \d+\. Health details$/m);
  });
});

describe('legal documents: versions and status (POLICY_VERSIONING 2.4)', () => {
  const frontmatter = (text: string, key: string) => new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(text.split(/\n---\n/)[0])?.[1].trim();
  const VERSIONED = [...PUBLISHED, 'in-app-disclosures.md', 'app-store-privacy-labels.md', 'COUNSEL_PACKET.md', 'BENCHMARK.md'];

  it('[LEGAL-REQ-064] frontmatter version, body version line and newest changelog row agree', () => {
    const bad: string[] = [];
    for (const p of VERSIONED) {
      const d = doc(p);
      const version = frontmatter(d.text, 'version');
      const newest = /##\s+Changelog[\s\S]*?\n\|\s*(\d+\.\d+\.\d+)\s*\|/.exec(d.text)?.[1];
      const body = /\bVersion (\d+\.\d+\.\d+)\b/.exec(d.text.split(/##\s+Changelog/)[0])?.[1];
      if (!version || version !== newest) bad.push(`${p}: frontmatter ${version}, changelog ${newest}`);
      if (body && body !== version) bad.push(`${p}: body ${body}, frontmatter ${version}`);
    }
    expect(bad).toEqual([]);
  });

  it('[LEGAL-REQ-064] published documents stay marked for counsel until signed, and a signed one has no blanks left', () => {
    for (const p of PUBLISHED) {
      const d = doc(p);
      const status = frontmatter(d.text, 'status');
      expect(['draft-for-counsel', 'counsel-approved'], p).toContain(status);
      if (status === 'counsel-approved') {
        for (const blank of FOUNDER_BLANKS) expect(d.text, `${p}: [${blank}]`).not.toContain(`[${blank}]`);
      }
    }
  });
});

describe('legal documents: characters (content rules)', () => {
  it('[LEGAL-REQ-064] every file in docs/legal is ASCII: no dashes, curly quotes, ellipsis characters or emoji', () => {
    const bad = ALL.flatMap(lines).filter((l) => /[^\x00-\x7F]/.test(l.text)).map((l) => `${l.path}:${l.n}`);
    expect(bad).toEqual([]);
  });
});
