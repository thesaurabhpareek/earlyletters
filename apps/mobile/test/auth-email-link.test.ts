/**
 * BL-347 email links: the pending-request rule (link-guard.logic.ts), the
 * link shapes (links.logic.ts), and Send and open through email.ts with the
 * real supabase-js client in PKCE mode against a fake Auth server.
 * Fixtures: the fictional family Asha only.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterEach, describe, expect, it } from 'vitest';
import { publishAuth } from '../src/lib/auth/auth-store';
import { exchangeEmailLinkCode, openEmailLink, sendEmailLink, verifyEmailCode, verifyEmailLink } from '../src/lib/auth/email';
import { decideEmailLink, LINK_REQUEST_TTL_MS, LinkRefusedError, linkRequestIdFrom, parseLinkRequest } from '../src/lib/auth/link-guard.logic';
import { authCallbackUrl, classifyIncomingUrl } from '../src/lib/auth/links.logic';
import { initialAuthState } from '../src/lib/auth/machine.logic';
import { beginLinkRequest, clearLinkRequestForTests, getLinkRequest, LINK_REQUEST_KEY, setLinkRequestStorage } from '../src/lib/auth/pending';

const CFG = { origin: 'https://earlyletters.com', scheme: 'scribe' };
const ASHA_EMAIL = 'asha.parent@example.invalid';
const ASHA_PARENT = '11111111-1111-4111-8111-111111111111';
const RID = 'a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5';
const OTHER_RID = 'b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6';
const HASH = 'pkce_9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d';
const CODE = '6f1c2d3e-4a5b-4c6d-8e7f-0a1b2c3d4e5f';
const T0 = 1_760_000_000_000;

function memoryStorage() {
  const m = new Map<string, string>();
  return {
    map: m,
    getItem: async (k: string) => m.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      m.set(k, v);
    },
    removeItem: async (k: string) => {
      m.delete(k);
    },
  };
}

/** supabase-js against a fake Auth server; records every request. */
function realClient(storage = memoryStorage()) {
  const requests: { url: string; body: Record<string, unknown> | null }[] = [];
  const session = {
    access_token: 'access-fixture',
    refresh_token: 'refresh-fixture',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: ASHA_PARENT, aud: 'authenticated', email: ASHA_EMAIL, app_metadata: { provider: 'email' }, user_metadata: {}, created_at: '2026-10-01T00:00:00Z' },
  };
  const fetchFn = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : null;
    requests.push({ url, body });
    if (url.includes('/auth/v1/otp')) return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    if (url.includes('/auth/v1/verify') || url.includes('/auth/v1/token?grant_type=pkce')) {
      return new Response(JSON.stringify({ ...session, user: session.user }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('{}', { status: 404 });
  };
  const sb = createClient('https://asha-fixture.supabase.co', 'publishable-fixture', {
    auth: { storage, storageKey: 'scribe.auth', persistSession: true, autoRefreshToken: false, detectSessionInUrl: false, flowType: 'pkce' },
    global: { fetch: fetchFn as typeof fetch },
  });
  return { sb, requests, storage };
}

afterEach(() => {
  publishAuth(initialAuthState);
  publishAuth({ status: 'signedOut' });
  setLinkRequestStorage(null);
  clearLinkRequestForTests();
});

describe('link-guard.logic: when an opened link may be used', () => {
  const pending = { id: RID, at: T0 };

  it('[F02-REQ-018] accepted only with this phone pending request and a matching rid', () => {
    expect(decideEmailLink({ linkRequestId: RID, pending, signedInUserId: null, now: T0 + 60_000 })).toEqual({ ok: true });
    expect(decideEmailLink({ linkRequestId: RID, pending: null, signedInUserId: null, now: T0 })).toEqual({ ok: false, reason: 'not_requested' });
    expect(decideEmailLink({ linkRequestId: OTHER_RID, pending, signedInUserId: null, now: T0 })).toEqual({ ok: false, reason: 'other_request' });
    expect(decideEmailLink({ linkRequestId: undefined, pending, signedInUserId: null, now: T0 })).toEqual({ ok: false, reason: 'other_request' });
  });

  it('[F02-REQ-018] a request older than its lifetime, or from the future, is no request', () => {
    expect(decideEmailLink({ linkRequestId: RID, pending, signedInUserId: null, now: T0 + LINK_REQUEST_TTL_MS + 1 })).toEqual({ ok: false, reason: 'not_requested' });
    expect(decideEmailLink({ linkRequestId: RID, pending, signedInUserId: null, now: T0 - 10 * 60_000 })).toEqual({ ok: false, reason: 'not_requested' });
  });

  it('[F02-REQ-020] refused whenever an account is signed in, even with a matching request', () => {
    expect(decideEmailLink({ linkRequestId: RID, pending, signedInUserId: ASHA_PARENT, now: T0 })).toEqual({ ok: false, reason: 'signed_in' });
  });

  it('request ids are 32 hex characters from 16 random bytes; stored values are validated', () => {
    expect(linkRequestIdFrom(new Uint8Array(16).fill(0xa5))).toBe(RID);
    expect(() => linkRequestIdFrom(new Uint8Array(8))).toThrow();
    expect(parseLinkRequest(JSON.stringify({ id: RID, at: T0 }))).toEqual({ id: RID, at: T0 });
    expect(parseLinkRequest(JSON.stringify({ id: 'short', at: T0 }))).toBeNull();
    expect(parseLinkRequest('not json')).toBeNull();
    expect(parseLinkRequest(null)).toBeNull();
  });
});

describe('links.logic: link shapes with the request id', () => {
  it('[A-REQ-018] the redirect carries the request id; the parsed link returns it', () => {
    expect(authCallbackUrl('https://earlyletters.com/', RID)).toBe(`https://earlyletters.com/auth/callback?rid=${RID}`);
    expect(authCallbackUrl('https://earlyletters.com')).toBe('https://earlyletters.com/auth/callback');
    expect(authCallbackUrl('https://earlyletters.com', 'not-hex')).toBe('https://earlyletters.com/auth/callback');
    expect(classifyIncomingUrl(`https://earlyletters.com/auth/callback?rid=${RID}#token_hash=${HASH}&type=email`, CFG)).toEqual({
      kind: 'auth-link',
      tokenHash: HASH,
      type: 'email',
      requestId: RID,
    });
  });

  it('[A-REQ-018] the PKCE redirect shape (?code=) is a sign-in link too', () => {
    expect(classifyIncomingUrl(`https://earlyletters.com/auth/callback?rid=${RID}&code=${CODE}`, CFG)).toEqual({
      kind: 'auth-link',
      code: CODE,
      type: 'email',
      requestId: RID,
    });
    // A malformed rid is dropped (the link is then refused by the guard), never passed on.
    expect(classifyIncomingUrl(`https://earlyletters.com/auth/callback?rid=<x>&code=${CODE}`, CFG)).toEqual({ kind: 'auth-link', code: CODE, type: 'email' });
    // Supabase's error redirect (expired link) has no secret: type the code.
    expect(classifyIncomingUrl('https://earlyletters.com/auth/callback#error=access_denied&error_code=otp_expired', CFG)).toEqual({ kind: 'auth-code' });
    // [F02-REQ-011] never from the custom scheme
    expect(classifyIncomingUrl(`scribe://auth/callback?rid=${RID}&code=${CODE}`, CFG)).toEqual({ kind: 'auth-code' });
  });
});

describe('email.ts with supabase-js in PKCE mode', () => {
  it('[A-REQ-018] Send records the request in the Keychain first, sends a PKCE challenge and the rid redirect', async () => {
    const keychain = memoryStorage();
    setLinkRequestStorage(keychain);
    const { sb, requests } = realClient();
    await sendEmailLink(sb, ` ${ASHA_EMAIL} `, { requestId: RID, now: T0 });
    const otp = requests.find((r) => r.url.includes('/auth/v1/otp'))!;
    expect(otp.body?.email).toBe(ASHA_EMAIL);
    expect(otp.body?.create_user).toBe(true);
    expect(typeof otp.body?.code_challenge).toBe('string');
    expect(otp.body?.code_challenge_method).toBe('s256');
    expect(decodeURIComponent(otp.url)).toContain(`redirect_to=https://earlyletters.com/auth/callback?rid=${RID}`);
    expect(JSON.parse(keychain.map.get(LINK_REQUEST_KEY)!)).toEqual({ id: RID, at: T0 });
    // [F02-REQ-003] the request holds no address and no token
    expect(keychain.map.get(LINK_REQUEST_KEY)).not.toContain('@');
  });

  it('[F02-REQ-018] the pending request survives the app being closed (read back from the Keychain)', async () => {
    const keychain = memoryStorage();
    setLinkRequestStorage(keychain);
    await beginLinkRequest({ id: RID, at: T0 });
    clearLinkRequestForTests(); // a cold start: memory is empty
    expect(await getLinkRequest()).toEqual({ id: RID, at: T0 });
  });

  it('[A-REQ-018] the matching link on the phone that asked signs in once, then the request is spent', async () => {
    setLinkRequestStorage(memoryStorage());
    const { sb, requests } = realClient();
    await beginLinkRequest({ id: RID, at: Date.now() });
    expect(await verifyEmailLink(sb, HASH, 'email', { requestId: RID })).toBe(ASHA_PARENT);
    expect(requests.filter((r) => r.url.includes('/auth/v1/verify'))).toHaveLength(1);
    // A second tap on the same link finds no pending request.
    await expect(verifyEmailLink(sb, HASH, 'email', { requestId: RID, signedInUserId: null })).rejects.toBeInstanceOf(LinkRefusedError);
  });

  it('[F02-REQ-018] a link from an older email or another person is refused before any request to Supabase', async () => {
    setLinkRequestStorage(memoryStorage());
    const { sb, requests } = realClient();
    await beginLinkRequest({ id: RID, at: Date.now() });
    const e = await openEmailLink(sb, { tokenHash: HASH, type: 'email', requestId: OTHER_RID }).catch((x: unknown) => x);
    expect(e).toBeInstanceOf(LinkRefusedError);
    expect((e as LinkRefusedError).reason).toBe('other_request');
    expect(requests).toHaveLength(0);
  });

  it('[F02-REQ-018] a PKCE code link exchanges only with this install verifier', async () => {
    const keychain = memoryStorage();
    setLinkRequestStorage(keychain);
    const phoneA = realClient(keychain);
    await sendEmailLink(phoneA.sb, ASHA_EMAIL, { requestId: RID, now: Date.now() });
    expect(await exchangeEmailLinkCode(phoneA.sb, CODE, { requestId: RID })).toBe(ASHA_PARENT);
    const exchange = phoneA.requests.find((r) => r.url.includes('grant_type=pkce'))!;
    expect(typeof exchange.body?.code_verifier).toBe('string');
    expect((exchange.body?.code_verifier as string).length).toBeGreaterThan(40);

    // Phone B (no verifier): even past the app's own check, supabase-js refuses without a request.
    const phoneB = realClient();
    const { error } = await phoneB.sb.auth.exchangeCodeForSession(CODE);
    expect(error?.name).toBe('AuthPKCECodeVerifierMissingError');
    expect(phoneB.requests).toHaveLength(0);
  });

  it('[A-REQ-018] the typed code works on any phone, with or without a pending request, and spends it', async () => {
    const keychain = memoryStorage();
    setLinkRequestStorage(keychain);
    const { sb } = realClient();
    expect(await verifyEmailCode(sb as SupabaseClient, ASHA_EMAIL, '12345678')).toBe(ASHA_PARENT);
    await beginLinkRequest({ id: RID, at: Date.now() });
    expect(await verifyEmailCode(sb as SupabaseClient, ASHA_EMAIL, '12345678')).toBe(ASHA_PARENT);
    expect(keychain.map.has(LINK_REQUEST_KEY)).toBe(false);
  });

  it('[F02-REQ-020] a signed-in session only in the Keychain at launch also refuses the link', async () => {
    setLinkRequestStorage(memoryStorage());
    const { sb, requests } = realClient();
    await beginLinkRequest({ id: RID, at: Date.now() });
    await expect(verifyEmailLink(sb, HASH, 'email', { requestId: RID, signedInUserId: ASHA_PARENT })).rejects.toMatchObject({ reason: 'signed_in' });
    expect(requests).toHaveLength(0);
  });

  it('a failed Send leaves no pending request behind', async () => {
    const keychain = memoryStorage();
    setLinkRequestStorage(keychain);
    const sb = { auth: { signInWithOtp: async () => ({ error: Object.assign(new Error('rate'), { status: 429 }) }) } } as unknown as SupabaseClient;
    await expect(sendEmailLink(sb, ASHA_EMAIL, { requestId: RID, now: T0 })).rejects.toBeTruthy();
    expect(keychain.map.has(LINK_REQUEST_KEY)).toBe(false);
    expect(await getLinkRequest()).toBeNull();
  });
});
