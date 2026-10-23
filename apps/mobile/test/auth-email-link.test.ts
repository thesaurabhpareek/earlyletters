/// <reference types="node" />
/**
 * BL-347 (security review H1) unit tests: the pending-request note, the link
 * decision, the GET /verify redirect reader, the PKCE link opener, the claim
 * rule and the masked email. The five-step attack itself is
 * test/auth-h1.test.ts. Fictional family "Asha" only; no real address, token
 * or name.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { maskEmail, needsAccountClaim } from '../src/lib/auth/account-claim.logic';
import {
  decideEmailLink,
  decodePendingRequest,
  encodePendingRequest,
  openEmailLink,
  parseVerifyRedirect,
  PENDING_REQUEST_TTL_MS,
  verifyTypesFor,
  verifyUrl,
} from '../src/lib/auth/email-link.logic';
import { authErrorKind } from '../src/lib/auth/errors.logic';
import { setServerFeaturesForTests } from '../src/lib/capabilities';

vi.mock('expo/fetch', () => ({ fetch: vi.fn(() => Promise.reject(new Error('no network in tests'))) }));

const APP = join(__dirname, '..');
const NOW = Date.parse('2026-10-15T20:00:00.000Z');
const HASH = 'pkce_7b1c0f3e9a2d4c6b8e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b';
const U = '0192f0aa-0000-7000-8000-000000000001';
const OTHER = '0192f0aa-0000-7000-8000-000000000002';

describe('[F02-REQ-018] the pending-request note: a time, nothing else, for at most an hour', () => {
  it('round-trips and stores only the time (no address)', () => {
    const raw = encodePendingRequest({ at: NOW });
    expect(JSON.parse(raw)).toEqual({ at: NOW });
    expect(decodePendingRequest(raw, NOW + 1000)).toEqual({ at: NOW });
  });

  it('expires after the longest code life a project can set', () => {
    expect(decodePendingRequest(encodePendingRequest({ at: NOW }), NOW + PENDING_REQUEST_TTL_MS)).toEqual({ at: NOW });
    expect(decodePendingRequest(encodePendingRequest({ at: NOW }), NOW + PENDING_REQUEST_TTL_MS + 1)).toBeNull();
  });

  it('refuses damaged, empty and future notes (a clock moved back by more than a minute)', () => {
    for (const raw of [null, undefined, '', 'not json', '{}', '{"at":"soon"}', '{"at":null}', '[1]']) expect(decodePendingRequest(raw, NOW), String(raw)).toBeNull();
    expect(decodePendingRequest(encodePendingRequest({ at: NOW + 59_000 }), NOW)).toEqual({ at: NOW + 59_000 });
    expect(decodePendingRequest(encodePendingRequest({ at: NOW + 61_000 }), NOW)).toBeNull();
    expect(decodePendingRequest('{"at":1e400}', NOW)).toBeNull();
  });
});

describe('[F02-REQ-018] [F02-REQ-020] when an opened link may be used', () => {
  it('signed in: never, whatever the note says; signed out: only with a note', () => {
    expect(decideEmailLink({ pending: { at: NOW }, signedIn: true })).toBe('signed_in');
    expect(decideEmailLink({ pending: null, signedIn: true })).toBe('signed_in');
    expect(decideEmailLink({ pending: null, signedIn: false })).toBe('not_this_phone');
    expect(decideEmailLink({ pending: { at: NOW }, signedIn: false })).toBe('verify');
  });

  it('openEmailLink: a refusal makes no request; a use spends the note; a failed exchange keeps it', async () => {
    const exchange = vi.fn(async () => U);
    const clearPending = vi.fn(async () => {});
    const deps = (pending: { at: number } | null, signedIn = false) => ({ readPending: async () => pending, signedIn: () => signedIn, exchange, clearPending });

    expect(await openEmailLink({ tokenHash: HASH, type: 'email' }, deps(null))).toEqual({ ok: false, error: 'other_phone' });
    expect(await openEmailLink({ tokenHash: HASH, type: 'email' }, deps({ at: NOW }, true))).toEqual({ ok: false, error: 'already_signed_in' });
    expect(exchange).not.toHaveBeenCalled();
    expect(clearPending).not.toHaveBeenCalled();

    expect(await openEmailLink({ tokenHash: HASH, type: 'email' }, deps({ at: NOW }))).toEqual({ ok: true, userId: U });
    expect(exchange).toHaveBeenCalledWith(HASH, 'email');
    expect(clearPending).toHaveBeenCalledTimes(1);

    exchange.mockRejectedValueOnce(Object.assign(new Error('bad_code_verifier'), { code: 'bad_code_verifier' }));
    await expect(openEmailLink({ tokenHash: HASH, type: 'email' }, deps({ at: NOW }))).rejects.toMatchObject({ code: 'bad_code_verifier' });
    expect(clearPending).toHaveBeenCalledTimes(1);
  });
});

describe('[F02-REQ-018] GET /auth/v1/verify: the URL and the redirect it answers with', () => {
  it('a link that says type=email is tried as a magic link, then as a signup; GET /verify never sees "email"', () => {
    expect(verifyTypesFor('email')).toEqual(['magiclink', 'signup']);
    expect(verifyTypesFor('magiclink')).toEqual(['magiclink']);
    expect(verifyTypesFor('signup')).toEqual(['signup']);
  });

  it('builds the URL with the token hash escaped and our callback as the redirect', () => {
    const url = verifyUrl('https://asha-fixture.supabase.co/', 'pkce_a+b/c', 'magiclink', 'https://earlyletters.com/auth/callback');
    expect(url).toBe('https://asha-fixture.supabase.co/auth/v1/verify?token=pkce_a%2Bb%2Fc&type=magiclink&redirect_to=https%3A%2F%2Fearlyletters.com%2Fauth%2Fcallback');
  });

  it('reads the PKCE auth code from the query', () => {
    expect(parseVerifyRedirect('https://earlyletters.com/auth/callback?code=34e770dd-9ff9-416c-87fa-43b31d7ef225')).toEqual({
      kind: 'code',
      code: '34e770dd-9ff9-416c-87fa-43b31d7ef225',
    });
  });

  it('refuses any redirect that carries tokens (the implicit-flow shape H1 relied on), in the query or the fragment', () => {
    expect(parseVerifyRedirect('https://earlyletters.com/auth/callback#access_token=x&refresh_token=y&type=magiclink')).toEqual({ kind: 'refused' });
    expect(parseVerifyRedirect('https://earlyletters.com/auth/callback?code=34e770dd9ff9&access_token=x')).toEqual({ kind: 'refused' });
  });

  it('maps errors: expired, used or unknown tokens read as expired; anything else as unknown', () => {
    expect(parseVerifyRedirect('https://earlyletters.com/auth/callback#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid')).toEqual({ kind: 'error', error: 'expired' });
    expect(parseVerifyRedirect('https://earlyletters.com/auth/callback?error=server_error&error_code=unexpected_failure')).toEqual({ kind: 'error', error: 'unknown' });
    for (const bad of [null, undefined, '', 'https://earlyletters.com/auth/callback', 'https://earlyletters.com/auth/callback?code=<script>', 'https://earlyletters.com/auth/callback?code=%E0%A4%A']) {
      expect(parseVerifyRedirect(bad), String(bad)).toEqual({ kind: 'error', error: 'unknown' });
    }
  });

  it('[A-REQ-031] PKCE failures read as "this link was asked for on another phone"', () => {
    for (const code of ['pkce_code_verifier_not_found', 'bad_code_verifier', 'flow_state_not_found']) expect(authErrorKind({ code }, 'link'), code).toBe('other_phone');
    expect(authErrorKind({ code: 'flow_state_expired' }, 'link')).toBe('expired');
  });
});

describe('[F02-REQ-018] verifyEmailLinkPkce: GET /verify without following the redirect, then the PKCE exchange', () => {
  type Call = { url: string; init: { method: string; redirect: string; headers: Record<string, string> } };
  const fetchWith = (locations: (string | null)[], status = 303) => {
    const calls: Call[] = [];
    const fn = vi.fn(async (url: string, init: Call['init']) => {
      calls.push({ url, init });
      const loc = locations[Math.min(calls.length - 1, locations.length - 1)];
      return { status, headers: { get: (name: string) => (name.toLowerCase() === 'location' ? loc : null) } };
    });
    return { fn, calls };
  };
  const sbWith = (result: { data: unknown; error: unknown }) => {
    const exchangeCodeForSession = vi.fn(async () => result);
    const verifyOtp = vi.fn();
    return { sb: { auth: { exchangeCodeForSession, verifyOtp } } as never, exchangeCodeForSession, verifyOtp };
  };

  beforeEach(() => {
    setServerFeaturesForTests(true);
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://asha-fixture.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_asha_fixture';
  });
  afterEach(() => {
    setServerFeaturesForTests(null);
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  it('a known address: one GET as a magic link, the code exchanged with this phone\'s verifier, never verifyOtp', async () => {
    const { verifyEmailLinkPkce } = await import('../src/lib/auth/email');
    const f = fetchWith(['https://earlyletters.com/auth/callback?code=asha-flow-code-0001']);
    const s = sbWith({ data: { user: { id: U }, session: { user: { id: U } } }, error: null });
    expect(await verifyEmailLinkPkce(s.sb, HASH, 'email', f.fn)).toBe(U);
    expect(f.calls).toHaveLength(1);
    expect(f.calls[0].url).toContain('/auth/v1/verify?token=pkce_');
    expect(f.calls[0].url).toContain('&type=magiclink&');
    expect(f.calls[0].init).toEqual({ method: 'GET', redirect: 'manual', headers: { apikey: 'sb_publishable_asha_fixture' } });
    expect(s.exchangeCodeForSession).toHaveBeenCalledWith('asha-flow-code-0001');
    expect(s.verifyOtp).not.toHaveBeenCalled();
  });

  it('a new address (Confirm signup template): the magic-link miss is followed by a signup try', async () => {
    const { verifyEmailLinkPkce } = await import('../src/lib/auth/email');
    const f = fetchWith(['https://earlyletters.com/auth/callback#error=access_denied&error_code=otp_expired', 'https://earlyletters.com/auth/callback?code=asha-flow-code-0002']);
    const s = sbWith({ data: { user: { id: U }, session: null }, error: null });
    expect(await verifyEmailLinkPkce(s.sb, HASH, 'email', f.fn)).toBe(U);
    expect(f.calls.map((c) => new URL(c.url).searchParams.get('type'))).toEqual(['magiclink', 'signup']);
  });

  it('expired under both types: "expired" (A-REQ-024 offers a resend); tokens in the answer: refused, no exchange', async () => {
    const { verifyEmailLinkPkce } = await import('../src/lib/auth/email');
    const gone = fetchWith(['https://earlyletters.com/auth/callback#error_code=otp_expired']);
    const s1 = sbWith({ data: {}, error: null });
    expect(authErrorKind(await verifyEmailLinkPkce(s1.sb, HASH, 'email', gone.fn).catch((e) => e), 'link')).toBe('expired');
    expect(s1.exchangeCodeForSession).not.toHaveBeenCalled();

    const implicit = fetchWith(['https://earlyletters.com/auth/callback#access_token=a&refresh_token=b']);
    const s2 = sbWith({ data: {}, error: null });
    expect(authErrorKind(await verifyEmailLinkPkce(s2.sb, HASH, 'magiclink', implicit.fn).catch((e) => e), 'link')).toBe('other_phone');
    expect(s2.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('a verifier from another flow: the exchange fails and the person is offered the code', async () => {
    const { verifyEmailLinkPkce } = await import('../src/lib/auth/email');
    const f = fetchWith(['https://earlyletters.com/auth/callback?code=asha-flow-code-0003']);
    const s = sbWith({ data: { user: null, session: null }, error: Object.assign(new Error('x'), { code: 'pkce_code_verifier_not_found', status: 400 }) });
    expect(authErrorKind(await verifyEmailLinkPkce(s.sb, HASH, 'magiclink', f.fn).catch((e) => e), 'link')).toBe('other_phone');
  });

  it('Supabase rate limit on /verify reads as rate limited', async () => {
    const { verifyEmailLinkPkce } = await import('../src/lib/auth/email');
    const f = fetchWith([null], 429);
    expect(authErrorKind(await verifyEmailLinkPkce(sbWith({ data: {}, error: null }).sb, HASH, 'magiclink', f.fn).catch((e) => e), 'link')).toBe('rate_limited');
  });

  it('email.ts never verifies a link with verifyOtp({ token_hash }) (that accepts a link from anyone)', () => {
    const src = readFileSync(join(APP, 'src/lib/auth/email.ts'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(src).not.toMatch(/token_hash/);
    expect(src.match(/verifyOtp\(/g)).toHaveLength(1); // the typed code only
  });

  it('the Supabase client runs the PKCE flow', () => {
    expect(readFileSync(join(APP, 'src/lib/supabase/client.ts'), 'utf8')).toMatch(/flowType: 'pkce'/);
  });

  const provider = () => readFileSync(join(APP, 'src/lib/auth/session-provider.tsx'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  it('[F02-REQ-020] the signed-in refusal also reads the Keychain, so a cold start from the link (state still restoring) is refused too', () => {
    expect(provider()).toMatch(/signedInNow = isSignedIn\(stateRef\.current\) \|\| \(await sessionSavedOnPhone\(SESSION_STORAGE_KEY\)\)/);
  });

  it('any sign-in (Apple, Google, passkey too) and every sign-out spend the pending email request', () => {
    const src = provider();
    expect(src).toMatch(/remember\(method\);\s*await clearPendingEmailRequest\(\);\s*dispatch\(\{ type: 'SIGNED_IN'/);
    expect(src).toMatch(/await forgetAppleUser\(\);\s*await clearPendingEmailRequest\(\);\s*dispatch\(\{ type: 'SIGNED_OUT' \}\)/);
    // A sign-out Supabase makes itself, and the under-18 stop, drop it too (review 3, finding 1).
    expect(src).toMatch(/event === 'SIGNED_OUT'\) \{\s*void clearPendingEmailRequest\(\);\s*dispatch\(\{ type: 'SIGNED_OUT' \}\)/);
    expect(src).toMatch(/await forgetAppleUser\(\);\s*await clearPendingEmailRequest\(\);\s*onUnder18\?\.\(\);/);
  });
});

describe('[F02-REQ-019] the claim screen: who sees it', () => {
  const none = new Set<string>();
  it('a phone whose letters belong to no account, with letters on it: yes, until confirmed', () => {
    expect(needsAccountClaim({ userId: U, owner: null, hasLocalData: true, confirmed: none })).toBe(true);
    expect(needsAccountClaim({ userId: U, owner: null, hasLocalData: true, confirmed: new Set([U]) })).toBe(false);
    expect(needsAccountClaim({ userId: U, owner: null, hasLocalData: true, confirmed: new Set([OTHER]) })).toBe(true);
  });
  it('an unreadable store asks first; a phone with nothing on it, or already owned by anyone, does not ask', () => {
    expect(needsAccountClaim({ userId: U, owner: null, hasLocalData: null, confirmed: none })).toBe(true);
    expect(needsAccountClaim({ userId: U, owner: null, hasLocalData: false, confirmed: none })).toBe(false);
    expect(needsAccountClaim({ userId: U, owner: U, hasLocalData: true, confirmed: none })).toBe(false);
    expect(needsAccountClaim({ userId: U, owner: OTHER, hasLocalData: true, confirmed: none })).toBe(false); // sync stops on the mismatch; nothing moves
    expect(needsAccountClaim({ userId: null, owner: null, hasLocalData: true, confirmed: none })).toBe(false);
  });
});

describe('[F02-REQ-019] the masked email on the claim screen (F02 6.2 step 6)', () => {
  it('first character, three stars, the domain', () => {
    expect(maskEmail('asha.parent@example.invalid')).toBe('a***@example.invalid');
    expect(maskEmail('  b@example.com ')).toBe('b***@example.com');
    expect(maskEmail('asha.coparent+book@privaterelay.appleid.com')).toBe('a***@privaterelay.appleid.com');
  });
  it('a name in any script keeps its first character whole (code points, not UTF-16 halves)', () => {
    expect(maskEmail('आशा@example.in')).toBe('आ***@example.in');
    expect(maskEmail('\u{1D49C}sha@example.com')).toBe('\u{1D49C}***@example.com');
  });
  it('nothing for no address or a malformed one', () => {
    for (const e of [null, undefined, '', 'no-at-sign', '@example.com', 'asha@']) expect(maskEmail(e), String(e)).toBeNull();
  });
});
