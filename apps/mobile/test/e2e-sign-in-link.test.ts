/// <reference types="node" />
/**
 * SIGN-03 (docs/reviews/2026-10-31/signin.md): E2E-12's link variant must use the link from the email the app
 * itself asked for (it carries this phone's PKCE challenge). Admin generate_link mints a non-PKCE token whose
 * link the app refuses by design, so that combination stops at once with the reason instead of failing late.
 * The script runs in Maestro's GraalJS; here it runs in a Node sandbox with Maestro's globals stubbed.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const E2E = join(__dirname, '..', 'e2e');
const script = readFileSync(join(E2E, 'scripts', 'fetch-otp.js'), 'utf8');
const flow = readFileSync(join(E2E, 'flows', 'E2E-12-sign-in-email.yaml'), 'utf8');

type Res = { ok: boolean; status: number; body: string };
function run(env: Record<string, string>, http: { get?: (u: string) => Res; post?: (u: string, o: unknown) => Res }) {
  const output: Record<string, unknown> = {
    e2e: {
      readVar: () => '',
      baseUrl: () => 'http://127.0.0.1:54321',
      adminHeaders: () => ({}),
      pause: () => {},
    },
  };
  runInNewContext(script, { ...env, output, http, json: (b: string) => JSON.parse(b) });
  return output;
}

const HASH = 'pkce_7b1c0f3e9a2d4c6b8e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b';
const mailpit = (html: string) => ({
  get: (u: string): Res =>
    u.includes('/messages')
      ? { ok: true, status: 200, body: JSON.stringify({ messages: [{ ID: 'm1', To: [{ Address: 'asha.parent@example.invalid' }] }] }) }
      : { ok: true, status: 200, body: JSON.stringify({ Text: 'Your code is 123456', HTML: html }) },
});

describe('[SIGN-03] E2E-12 link variant', () => {
  it('the flow asks for the link from the real email (mailpit by default) and says why', () => {
    const link = flow.slice(flow.indexOf('when:'));
    expect(link).toMatch(/OTP_SOURCE: \$\{OTP_SOURCE \|\| "mailpit"\}/);
    expect(link).toMatch(/OTP_PURPOSE: "link"/);
    expect(flow).toMatch(/PKCE challenge/);
  });

  it('LINK with OTP_SOURCE=admin stops before any request, naming the reason', () => {
    let posted = false;
    expect(() =>
      run({ E2E_EMAIL: 'asha.parent@example.invalid', OTP_SOURCE: 'admin', OTP_PURPOSE: 'link' }, { post: () => ((posted = true), { ok: true, status: 200, body: '{}' }) }),
    ).toThrow(/OTP_SOURCE=mailpit.*non-PKCE/s);
    expect(posted).toBe(false);
  });

  it('LINK with mailpit reads the token hash from our template', () => {
    const out = run(
      { E2E_EMAIL: 'asha.parent@example.invalid', OTP_SOURCE: 'mailpit', OTP_PURPOSE: 'link' },
      mailpit(`<a href="https://earlyletters.com/auth/callback#token_hash=${HASH}&amp;type=email">Sign in</a>`),
    );
    expect(out.otp).toBe('123456');
    expect(out.tokenHash).toBe(HASH);
  });

  it('LINK with mailpit and the default Supabase template (no token hash) fails with the reason', () => {
    expect(() =>
      run({ E2E_EMAIL: 'asha.parent@example.invalid', OTP_SOURCE: 'mailpit', OTP_PURPOSE: 'link' }, mailpit('<a href="http://127.0.0.1:54321/auth/v1/verify?token=x">Sign in</a>')),
    ).toThrow(/token_hash.*SIGN-02/s);
  });

  it('the code path keeps admin as its default and is unchanged', () => {
    const out = run(
      { E2E_EMAIL: 'asha.parent@example.invalid' },
      { post: () => ({ ok: true, status: 200, body: JSON.stringify({ properties: { email_otp: '654321', hashed_token: HASH }, user: { id: 'u1' } }) }) },
    );
    expect(out.otp).toBe('654321');
  });
});
