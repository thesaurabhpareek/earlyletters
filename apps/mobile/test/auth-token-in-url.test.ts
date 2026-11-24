/// <reference types="node" />
/**
 * [BL-603] What the app puts in an address, and the read-back the founder owes (SEC-10).
 * The sign-in email link sends a one-time token hash to Supabase in a GET query string (verifyUrl).
 * That is the only place the app does so; the 6-digit code goes in a body. What the hosted projects
 * log is read by the founder (docs/ops/runbooks/supabase-logs-readback.md) and recorded in
 * docs/legal/evidence/. These tests cannot read a hosted project; they pin only the app's inventory,
 * and nothing about the paperwork, so filling in the evidence never breaks them.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { verifyUrl } from '../src/lib/auth/email-link.logic';

const APP = join(__dirname, '..');

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
