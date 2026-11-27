/// <reference types="node" />
/**
 * BL-1893, the data half of linking (src/lib/auth/link-identity.logic.ts). No screen calls it yet: BL-1894 adds Me,
 * Ways to sign in, its words and `enable_manual_linking` in one change (NS-54-R19), so the titles that cite a row
 * carry [stand-in] (the row is partial until the screen's test). The Supabase client is a stand-in object, as in the
 * other auth logic tests; what the real server answers is the staging test in the PR's "Not verified".
 * Mutants run for the PR (each made, seen to fail, restored): `identity_already_exists` mapped to 'failed'; the
 * returned-account check removed (another account's answer reads as ok); the already-linked check removed; the
 * signed-in-user check removed; the provider's id put in the outcome.
 * Fictional family "Asha" only.
 */
import { describe, expect, it, vi } from 'vitest';
import { linkMethod, linkRefusalOf, type LinkAuth, type LinkRequest } from '../src/lib/auth/link-identity.logic';

const ASHA_PARENT = '0192f0aa-0000-7000-8000-0000000000a1';
const OTHER_ACCOUNT = '0192f0aa-0000-7000-8000-0000000000b2';
const GOOGLE_TOKEN = 'header.asha-google-id-token.signature';
const GOOGLE_SUB = '109876543210987654321';
const APPLE_RELAY = 'asha.relay@privaterelay.appleid.com';

const identity = (provider: string, id = `${provider}-identity`) => ({ id, identity_id: `${id}-row`, user_id: ASHA_PARENT, provider, identity_data: { sub: GOOGLE_SUB } });

/** An auth stand-in: signed in as `user` with `providers` linked; `link` is what linkIdentity answers. */
function fakeAuth(opts: { user?: string | null; providers?: string[]; link?: () => Promise<unknown> }) {
  const user = opts.user === undefined ? ASHA_PARENT : opts.user;
  const linkIdentity = vi.fn(opts.link ?? (async () => ({ data: { user: { id: ASHA_PARENT, email: APPLE_RELAY, identities: [identity('apple'), identity('google', GOOGLE_SUB)] }, session: {} }, error: null })));
  const getUserIdentities = vi.fn(async () => ({ data: { identities: (opts.providers ?? ['apple']).map((p) => identity(p)) }, error: null }));
  const auth = {
    getSession: vi.fn(async () => ({ data: { session: user ? { user: { id: user } } : null }, error: null })),
    getUserIdentities,
    linkIdentity,
  };
  return { auth: auth as unknown as LinkAuth, linkIdentity, getUserIdentities };
}

const authError = (code: string | undefined, status: number, name = 'AuthApiError') => Object.assign(new Error('refused'), { name, code, status, __isAuthError: true });
const GOOGLE: LinkRequest = { provider: 'google', token: GOOGLE_TOKEN };

describe('BL-1893 linking a second method to the signed-in account', () => {
  it('[NS-54-R18][stand-in] a method that belongs to another account is refused, and the account stays the same', async () => {
    const f = fakeAuth({ link: async () => ({ data: { user: null, session: null }, error: authError('identity_already_exists', 422) }) });
    await expect(linkMethod(f.auth, ASHA_PARENT, GOOGLE)).resolves.toEqual({ ok: false, provider: 'google', reason: 'belongs_to_another_account' });
    expect(f.linkIdentity).toHaveBeenCalledTimes(1); // one try, no retry, no second method
  });

  it('[NS-54-R18][stand-in] a 409 conflict reads the same; any other refusal is a plain failure, never a link', async () => {
    const conflict = fakeAuth({ link: async () => ({ data: { user: null, session: null }, error: authError(undefined, 409) }) });
    await expect(linkMethod(conflict.auth, ASHA_PARENT, GOOGLE)).resolves.toMatchObject({ ok: false, reason: 'belongs_to_another_account' });
    const other = fakeAuth({ link: async () => ({ data: { user: null, session: null }, error: authError('validation_failed', 400) }) });
    await expect(linkMethod(other.auth, ASHA_PARENT, GOOGLE)).resolves.toMatchObject({ ok: false, reason: 'failed' });
  });

  it('[NS-54-R18][stand-in] an answer for any other account is never a success (account_changed, for the caller to end that session)', async () => {
    const f = fakeAuth({ link: async () => ({ data: { user: { id: OTHER_ACCOUNT, identities: [identity('google')] }, session: {} }, error: null }) });
    await expect(linkMethod(f.auth, ASHA_PARENT, GOOGLE)).resolves.toEqual({ ok: false, provider: 'google', reason: 'account_changed' });
  });

  it('a method the server proves joins this same account', async () => {
    const f = fakeAuth({});
    await expect(linkMethod(f.auth, ASHA_PARENT, GOOGLE)).resolves.toEqual({ ok: true, provider: 'google' });
    expect(f.linkIdentity).toHaveBeenCalledWith({ provider: 'google', token: GOOGLE_TOKEN });
  });

  it('Apple passes its raw nonce with the token', async () => {
    const f = fakeAuth({ providers: ['google'], link: async () => ({ data: { user: { id: ASHA_PARENT, identities: [identity('google'), identity('apple')] }, session: {} }, error: null }) });
    await expect(linkMethod(f.auth, ASHA_PARENT, { provider: 'apple', token: 'apple-token', nonce: 'raw-nonce' })).resolves.toEqual({ ok: true, provider: 'apple' });
    expect(f.linkIdentity).toHaveBeenCalledWith({ provider: 'apple', token: 'apple-token', nonce: 'raw-nonce' });
  });

  it('an answer that does not hold the method is not counted as linked', async () => {
    const f = fakeAuth({ link: async () => ({ data: { user: { id: ASHA_PARENT, identities: [identity('apple')] }, session: {} }, error: null }) });
    await expect(linkMethod(f.auth, ASHA_PARENT, GOOGLE)).resolves.toMatchObject({ ok: false, reason: 'failed' });
  });

  it('a method this account already has is not sent to the server', async () => {
    const f = fakeAuth({ providers: ['apple', 'google'] });
    await expect(linkMethod(f.auth, ASHA_PARENT, GOOGLE)).resolves.toEqual({ ok: false, provider: 'google', reason: 'already_linked' });
    expect(f.linkIdentity).not.toHaveBeenCalled();
  });

  it('[NS-54-R18][stand-in] signed out, or signed in as someone other than the person asking: refused before any request', async () => {
    const out = fakeAuth({ user: null });
    await expect(linkMethod(out.auth, ASHA_PARENT, GOOGLE)).resolves.toMatchObject({ ok: false, reason: 'not_signed_in' });
    const other = fakeAuth({ user: OTHER_ACCOUNT });
    await expect(linkMethod(other.auth, ASHA_PARENT, GOOGLE)).resolves.toMatchObject({ ok: false, reason: 'not_signed_in' });
    expect(out.getUserIdentities).not.toHaveBeenCalled();
    expect(out.linkIdentity).not.toHaveBeenCalled();
    expect(other.linkIdentity).not.toHaveBeenCalled();
  });

  it('[NS-54-R19][stand-in] with manual linking off (it is, until BL-1894) the answer is linking_off', async () => {
    const f = fakeAuth({ link: async () => ({ data: { user: null, session: null }, error: authError('manual_linking_disabled', 404) }) });
    await expect(linkMethod(f.auth, ASHA_PARENT, GOOGLE)).resolves.toEqual({ ok: false, provider: 'google', reason: 'linking_off' });
  });

  it('a failed request, a rate limit and a thrown error each end in an outcome, never a throw', async () => {
    const offline = fakeAuth({ link: async () => ({ data: { user: null, session: null }, error: authError(undefined, 0, 'AuthRetryableFetchError') }) });
    await expect(linkMethod(offline.auth, ASHA_PARENT, GOOGLE)).resolves.toMatchObject({ reason: 'network' });
    const busy = fakeAuth({ link: async () => ({ data: { user: null, session: null }, error: authError('over_request_rate_limit', 429) }) });
    await expect(linkMethod(busy.auth, ASHA_PARENT, GOOGLE)).resolves.toMatchObject({ reason: 'rate_limited' });
    const thrown = fakeAuth({ link: async () => { throw new Error('boom'); } });
    await expect(linkMethod(thrown.auth, ASHA_PARENT, GOOGLE)).resolves.toMatchObject({ ok: false, reason: 'failed' });
  });

  it('[NS-54-R20][NS-54-R21][stand-in] no outcome holds a token, an identity id, an email or another account id', async () => {
    const outcomes = await Promise.all([
      linkMethod(fakeAuth({}).auth, ASHA_PARENT, GOOGLE),
      linkMethod(fakeAuth({ link: async () => ({ data: { user: null, session: null }, error: authError('identity_already_exists', 422) }) }).auth, ASHA_PARENT, GOOGLE),
      linkMethod(fakeAuth({ link: async () => ({ data: { user: { id: OTHER_ACCOUNT, email: APPLE_RELAY, identities: [identity('google', GOOGLE_SUB)] }, session: {} }, error: null }) }).auth, ASHA_PARENT, GOOGLE),
    ]);
    for (const o of outcomes) {
      expect(Object.keys(o).sort()).toEqual(o.ok ? ['ok', 'provider'] : ['ok', 'provider', 'reason']);
      const text = JSON.stringify(o);
      for (const secret of [GOOGLE_TOKEN, GOOGLE_SUB, APPLE_RELAY, OTHER_ACCOUNT, ASHA_PARENT, 'identity']) expect(text).not.toContain(secret);
    }
  });

  it('linkRefusalOf: a server error of 500 or more is not read as offline', () => {
    expect(linkRefusalOf(authError(undefined, 503, 'AuthRetryableFetchError'))).toBe('failed');
    expect(linkRefusalOf(authError('session_not_found', 403))).toBe('not_signed_in');
  });
});
