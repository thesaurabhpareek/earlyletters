/**
 * The test versions (0.9.0) of the app's Terms and Privacy Policy, published for family testers before the second
 * TestFlight build signs anyone in (BL-565; POLICY_VERSIONING 2.4). Source of truth: docs/legal/beta/.
 *
 * A published version is immutable (POLICY_VERSIONING 2.4 and 9.2): the `policy_versions` row stores the sha256 of
 * the served text, and the website serves these files byte for byte. If the hash test fails, you changed a published
 * text. Do not update the hash: publish 0.9.1 (or 1.0.0) as a new file instead. Before the founder merges and the
 * website publishes, the founder may still change the text, and then updates the hash here and in the PR.
 *
 * The other checks are the published-page rules of legal-docs.test.ts, applied to these two files, plus what a test
 * version must say. If one fails, fix the document, not the test (CLAUDE.md).
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const BETA = join(__dirname, '..', '..', '..', 'docs', 'legal', 'beta');

const FILES = {
  terms: { file: 'terms-0.9.0.md', sha256: '8da3bd2c3704df292302fc4ad42eb26712b142bb87e5cde3e2ad6e656c5b0af1' },
  privacy: { file: 'privacy-0.9.0.md', sha256: 'bcfd060320c89e46feda4f10dc7cc4cdc7905898e72c4ce51c5ce1247bbfd284' },
} as const;

const raw = (file: string) => readFileSync(join(BETA, file));
const text = (file: string) => raw(file).toString('utf8');
const frontmatter = (t: string) => t.split(/\n---\n/)[0];
const body = (t: string) => t.slice(frontmatter(t).length + 5);
const field = (t: string, key: string) => new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(frontmatter(t))?.[1].trim();
const offenders = (t: string, re: RegExp) =>
  t
    .split('\n')
    .map((l, i) => ({ l, n: i + 1 }))
    .filter(({ l }) => re.test(l))
    .map(({ l, n }) => `${n}: ${l.trim()}`);

describe('beta legal texts 0.9.0 (BL-565)', () => {
  for (const [key, { file, sha256 }] of Object.entries(FILES)) {
    describe(key, () => {
      const t = text(file);
      const b = body(t);

      it(`[BL-565] ${file} is version 0.9.0 of "${key}", marked for counsel, at its permanent URL`, () => {
        expect(field(t, 'document')).toBe(key);
        expect(field(t, 'version')).toBe('0.9.0');
        expect(field(t, 'status')).toBe('draft-for-counsel');
        expect(field(t, 'review')).toMatch(/counsel to confirm/);
        expect(field(t, 'url')).toBe(`https://earlyletters.com/legal/${key}/0.9.0`);
        expect(/\bVersion (\d+\.\d+\.\d+)\b/.exec(b)?.[1]).toBe('0.9.0');
        expect(/##\s+Changelog[\s\S]*?\n\|\s*(\d+\.\d+\.\d+)\s*\|/.exec(t)?.[1]).toBe('0.9.0');
      });

      it('[BL-565] opens by saying it is a test version for family testers that a reviewed version will replace', () => {
        const top = b.split('\n## ')[0];
        expect(top).toMatch(/This is a test version of our/);
        expect(top).toMatch(/family members testing the Early Letters app through Apple's TestFlight/);
        expect(top).toMatch(/A reviewed version will replace it/);
      });

      it('[BL-565] the published body reads as legal text: no internal ids, no blanks, no braces', () => {
        const INTERNAL =
          /\b(?:D|BL|WP|FT|CR|DR|Q)-\d{2,3}\b|\b(?:LEGAL|DATA)-REQ\b|\bF\d{2}(?:-REQ)?\b|\bADR\b|\bPRD\b|\bPR #\d+|\bpull request\b|\bcounsel\b|\bTODO\b|\bdraft\b|\bbuild 2\b|\bEXPO_PUBLIC/i;
        expect(offenders(b, INTERNAL)).toEqual([]);
        // A published test version carries no founder blank: the hash is of the served text.
        expect(offenders(b, /\[[^\]]+\](?!\()/)).toEqual([]);
        expect(offenders(b, /\{[^}]+\}/)).toEqual([]);
      });

      it('[BL-565] is ASCII: no dashes, curly quotes, ellipsis characters or emoji', () => {
        expect(offenders(t, /[^\x00-\x7F]/)).toEqual([]);
      });

      it('[BL-565] names no product the test build does not use and no feature it does not have', () => {
        const NOT_USED = /\b(?:PostHog|Sentry|Crashlytics|Firebase|Mixpanel|Amplitude|Segment|RevenueCat|PowerSync|Stripe|Lulu|Groq|DeepInfra|OpenAI|Anthropic|Google)\b/i;
        expect(offenders(b, NOT_USED)).toEqual([]);
        const NOT_BUILT =
          /\bnotification token\b|\bpush notification|\bnew device signs in\b|\bstatus report\b|\breminder emails?\b|\bpasskey|\brecovery key\b|\bescrow\b|\bDB-IP\b|\bfree trial\b|\brenews?\b/i;
        expect(offenders(b, NOT_BUILT)).toEqual([]);
        expect(b).toContain('Recording backup is not available yet.');
        // No price: Plus is not offered in the test. The only amount is the liability floor.
        expect([...b.matchAll(/\$\d+(?:\.\d{2})?/g)].map((m) => m[0]).filter((a) => a !== '$50')).toEqual([]);
      });

      it('[BL-565] every shutdown line gives 90 days', () => {
        const lines = offenders(b, /\bclose Early Letters\b/i).filter((l) => !/^\d+: #/.test(l));
        expect(lines.length).toBeGreaterThanOrEqual(1);
        for (const l of lines) expect(l).toMatch(/\b90 days\b/);
      });

      it('[BL-565] the served text is the one recorded in policy_versions (immutable once published)', () => {
        expect(createHash('sha256').update(raw(file)).digest('hex')).toBe(sha256);
      });
    });
  }

  it('[BL-565] the Privacy Policy names every service that handles a tester\'s information', () => {
    const b = body(text(FILES.privacy.file));
    for (const name of ['Supabase', 'GitHub', 'Cloudflare R2', 'Resend', 'Vercel', 'Apple', 'Hugging Face', 'TestFlight']) {
      expect(b, name).toContain(name);
    }
  });

  it('[BL-565] the Terms point at the versioned Privacy Policy, not the floating page', () => {
    const b = body(text(FILES.terms.file));
    expect(b).toContain('https://earlyletters.com/legal/privacy/0.9.0');
    expect(b).not.toMatch(/https:\/\/earlyletters\.com\/privacy\b/);
  });
});
