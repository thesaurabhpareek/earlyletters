/// <reference types="node" />
/**
 * [BL-603] What the app puts in an address, and the read-back the founder owes (SEC-10).
 * The sign-in email link sends a one-time token hash to Supabase in a GET query string (verifyUrl).
 * That is the only place the app does so; the 6-digit code goes in a body. Staging's log fields,
 * retention and readers are read by the founder (docs/ops/runbooks/supabase-logs-readback.md) and
 * recorded in docs/legal/evidence/. A value nobody read says NOT RUN.
 * These tests cannot read a hosted project; they pin the inventory and the paperwork.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { verifyUrl } from '../src/lib/auth/email-link.logic';

const APP = join(__dirname, '..');
const REPO = join(APP, '..', '..');
const read = (p: string) => readFileSync(join(REPO, p), 'utf8');

function sources(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) sources(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

describe('[BL-603] the token in a query string', () => {
  it('the email link verify call carries the token hash in the query string, and says so', () => {
    const u = verifyUrl('https://x.supabase.co/', 'abc', 'email', 'https://earlyletters.com/auth/callback');
    expect(u.startsWith('https://x.supabase.co/auth/v1/verify?token=abc&type=email&redirect_to=')).toBe(true);
  });
  it('no other app source builds an address with token= or token_hash= in its query string', () => {
    const hits = sources(join(APP, 'src'))
      .filter((f) => /[?&]token(_hash)?=/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(APP, f));
    expect(hits.filter((f) => !f.endsWith('email-link.logic.ts') && !f.endsWith('links.logic.ts') && !f.endsWith('+native-intent.tsx') && !f.endsWith('email.ts'))).toEqual([]);
  });
  it('the 6-digit code path sends the code to verifyOtp (a body), not into an address', () => {
    const email = readFileSync(join(APP, 'src/lib/auth/email.ts'), 'utf8');
    expect(email).toMatch(/verifyOtp\(\{ email: email\.trim\(\), token: code, type: 'email' \}\)/);
  });
});

describe('[BL-603] the read-back paperwork exists and says NOT RUN until the founder reads it', () => {
  const runbook = 'docs/ops/runbooks/supabase-logs-readback.md';
  const template = 'docs/legal/evidence/TEMPLATE-supabase-logs-staging.md';
  it('has the runbook, the evidence folder README and the template', () => {
    for (const f of [runbook, template, 'docs/legal/evidence/README.md']) expect(existsSync(join(REPO, f)), f).toBe(true);
  });
  it('the template asks for every field, the retention and the readers, and ships unfilled', () => {
    const t = read(template);
    for (const need of ['Query string recorded', 'Source IP address recorded', 'User agent recorded', 'Retention shown in the dashboard', 'Any agent session or connector', 'Log drains']) {
      expect(t, need).toContain(need);
    }
    expect(t).not.toMatch(/\b(yes|no)\s*\|/i); // no cell is answered in the template
    expect(t).toContain('NOT RUN');
  });
  it('the runbook names its sources with URLs and does not claim a result', () => {
    const r = read(runbook);
    expect(r).toContain('https://supabase.com/docs/guides/observability/log-field-reference');
    expect(r).toContain('**NOT RUN**');
    expect(r).toContain('BL-603');
  });
  it('no evidence file other than the template and README claims a read-back without a date', () => {
    const files = readdirSync(join(REPO, 'docs/legal/evidence')).filter((f) => f.startsWith('supabase-logs-staging-'));
    for (const f of files) expect(read(`docs/legal/evidence/${f}`)).toMatch(/Date read \(UTC\): \d{4}-\d{2}-\d{2}/);
  });
});
