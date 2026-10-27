// Access tokens from the MAIN project, checked against its JWKS, and the 10-minute step-up (F08 6.5 C1).
import assert from 'node:assert/strict';
import { JwksCache, JwtError, recentSignIn, verifyAccessToken } from '../jwt.ts';
import { ASHA, tokenMinter } from './fakes.ts';

const nowSec = () => Math.floor(Date.now() / 1000);
const setup = async () => {
  const t = await tokenMinter();
  const jwks = new JwksCache(ASHA.mainUrl, t.fetchFn);
  const verify = (tok: string, at = nowSec()) => verifyAccessToken(tok, { mainUrl: ASHA.mainUrl, jwks, nowSec: at });
  return { ...t, jwks, verify };
};
const refused = (e: unknown) => e instanceof JwtError && e.code === 'unauthorized';

Deno.test('a valid ES256 token from the main project gives the user, email and last sign-in time', async () => {
  const { mint, verify } = await setup();
  const u = await verify(await mint());
  assert.equal(u.sub, ASHA.profile);
  assert.equal(u.email, ASHA.email);
  assert.ok(u.authAt > 0);
});

Deno.test('[F08-REQ-029] step-up: a sign-in within 10 minutes passes; older, or none in the token, does not', async () => {
  const { mint, verify } = await setup();
  const now = nowSec();
  assert.equal(recentSignIn(await verify(await mint({ amr: [{ method: 'otp', timestamp: now - 599 }] })), now), true);
  assert.equal(recentSignIn(await verify(await mint({ amr: [{ method: 'otp', timestamp: now - 601 }] })), now), false);
  assert.equal(recentSignIn(await verify(await mint({ amr: undefined })), now), false);
  // A refreshed token has a new iat but keeps the old sign-in time: still refused.
  assert.equal(recentSignIn(await verify(await mint({ iat: now, amr: [{ method: 'oauth', timestamp: now - 3600 }] })), now), false);
});

Deno.test('tokens from another issuer, audience or role, expired, anonymous or without a uuid subject are refused', async () => {
  const { mint, verify } = await setup();
  for (const claims of [
    { iss: 'https://other.supabase.co/auth/v1' }, { aud: 'anon' }, { role: 'service_role' }, { exp: nowSec() - 1 },
    { is_anonymous: true }, { sub: 'not-a-uuid' }, { iat: nowSec() + 600 },
  ]) {
    await assert.rejects(async () => verify(await mint(claims)), refused, JSON.stringify(claims));
  }
});

Deno.test('only asymmetric signatures count: HS256, none, a wrong kid and a changed payload are refused', async () => {
  const { mint, verify, enc } = await setup();
  const good = await mint();
  const [h, p, s] = good.split('.');
  await assert.rejects(() => verify(`${enc({ alg: 'HS256', kid: 'kid-fixture-1' })}.${p}.${s}`), refused);
  await assert.rejects(() => verify(`${enc({ alg: 'none', kid: 'kid-fixture-1' })}.${p}.`), refused);
  await assert.rejects(async () => verify(await mint({}, { kid: 'unknown' })), refused);
  const forged = enc({ ...JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(p.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)))), sub: '22222222-2222-4222-8222-222222222222' });
  await assert.rejects(() => verify(`${h}.${forged}.${s}`), refused);
  await assert.rejects(() => verify('not.a.token'), refused);
});

Deno.test('the JWKS is cached and refetched at most once a minute for an unknown kid', async () => {
  const { mint, verify, jwksCalls } = await setup();
  await verify(await mint());
  await verify(await mint());
  assert.equal(jwksCalls(), 1);
  await assert.rejects(async () => verify(await mint({}, { kid: 'rotated' })), refused);
  assert.equal(jwksCalls(), 1, 'an unknown kid inside the minute does not refetch');
});

Deno.test('when the main project cannot be reached, the answer is unavailable (retry), never a pass', async () => {
  const t = await tokenMinter();
  const jwks = new JwksCache(ASHA.mainUrl, () => Promise.reject(new TypeError('network')));
  await assert.rejects(async () => verifyAccessToken(await t.mint(), { mainUrl: ASHA.mainUrl, jwks, nowSec: nowSec() }),
    (e) => e instanceof JwtError && e.code === 'unavailable');
});
