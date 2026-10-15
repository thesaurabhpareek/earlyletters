// apple-token (BL-330, security review H3): Deno tests with fake keys and a fake Apple,
// Auth and PostgREST. Fixtures: the fictional family Asha (CANARY).
import assert from 'node:assert/strict';
import { bundleId } from '../../../packages/brand/index.ts';
import { CANARY, findCanaries } from '../_shared/log/canary.ts';
import { toBase64, unwrapAppleToken } from '../purge-worker/lib/apple.ts';
import { appleTestKey, KEK } from '../purge-worker/test/helpers.ts';
import { APPLE_TOKEN_URL, makeAppleTokenHandler, RATE_MAX, readAppleTokenConfig } from './handler.ts';

const SUPA = 'https://asha-fixture.supabase.co';
const SERVICE = 'service-key-fixture';
const APPLE_SUB = '001234.a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5.0420';
const CODE = 'c0a5a.0.asha-apple-authorization-code-fixture';
const KEK2 = toBase64(new Uint8Array(32).map((_, i) => (i * 11 + 5) & 0xff));

const b64url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const idToken = (claims: Record<string, unknown>) => `${b64url(JSON.stringify({ alg: 'RS256', kid: 'x' }))}.${b64url(JSON.stringify(claims))}.c2ln`;

interface World {
  user: Record<string, unknown> | null;
  userStatus: number;
  apple: { status: number; body: unknown };
  putStatus: number;
  stored: Record<string, unknown>[];
  appleForms: URLSearchParams[];
  revoked: URLSearchParams[];
  calls: string[];
}

function world(over: Partial<World> = {}): World {
  return {
    user: {
      id: CANARY.profileId,
      email: CANARY.parentEmail,
      is_anonymous: false,
      identities: [{ provider: 'apple', id: APPLE_SUB, identity_data: { sub: APPLE_SUB, email: CANARY.parentEmail } }],
    },
    userStatus: 200,
    apple: { status: 200, body: { access_token: 'a', token_type: 'Bearer', expires_in: 3600, refresh_token: CANARY.appleRefreshToken, id_token: idToken({ sub: APPLE_SUB, aud: bundleId(), iss: 'https://appleid.apple.com' }) } },
    putStatus: 200,
    stored: [],
    appleForms: [],
    revoked: [],
    calls: [],
    ...over,
  };
}

function fakeFetch(w: World) {
  return async (input: string, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    w.calls.push(url.replace(/\?.*$/, ''));
    if (url === `${SUPA}/auth/v1/user`) {
      const auth = new Headers(init?.headers).get('authorization');
      if (auth !== `Bearer ${CANARY.sessionJwt}`) return new Response('{}', { status: 401 });
      return new Response(JSON.stringify(w.user), { status: w.userStatus });
    }
    if (url === APPLE_TOKEN_URL) {
      w.appleForms.push(new URLSearchParams(String(init?.body)));
      return new Response(JSON.stringify(w.apple.body), { status: w.apple.status, headers: { 'Content-Type': 'application/json' } });
    }
    if (url === 'https://appleid.apple.com/auth/revoke') {
      w.revoked.push(new URLSearchParams(String(init?.body)));
      return new Response(null, { status: 200 });
    }
    if (url === `${SUPA}/rest/v1/rpc/ops_apple_token_put`) {
      assert.equal(new Headers(init?.headers).get('authorization'), `Bearer ${SERVICE}`);
      w.stored.push(JSON.parse(String(init?.body)));
      return new Response(null, { status: w.putStatus });
    }
    return new Response('{}', { status: 404 });
  };
}

async function setup(over: Partial<World> = {}, envOver: Record<string, string | undefined> = {}) {
  const key = await appleTestKey();
  const env: Record<string, string | undefined> = {
    SUPABASE_URL: SUPA,
    SUPABASE_SERVICE_ROLE_KEY: SERVICE,
    APPLE_TEAM_ID: 'TEAM123456',
    APPLE_SIGNIN_KEY_ID: 'KEY1234567',
    APPLE_SIGNIN_PRIVATE_KEY: key.pem,
    TOKEN_KEK_V1: KEK,
    ...envOver,
  };
  const w = world(over);
  const lines: string[] = [];
  let t = 1_760_000_000_000;
  const handler = makeAppleTokenHandler((n) => env[n], { fetch: fakeFetch(w), logSink: (l) => lines.push(l), now: () => t });
  const call = (body: unknown = { code: CODE }, init: { method?: string; path?: string; auth?: string | null } = {}) =>
    handler(new Request(`${SUPA}/functions/v1${init.path ?? '/apple-token/v1'}`, {
      method: init.method ?? 'POST',
      headers: init.auth === null ? {} : { Authorization: `Bearer ${init.auth ?? CANARY.sessionJwt}`, 'Content-Type': 'application/json' },
      body: (init.method ?? 'POST') === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    }));
  return { w, call, lines, key, advance: (ms: number) => (t += ms) };
}

/** No code, token, id, email or JWT in what leaves the function. */
function assertClean(text: string) {
  assert.deepEqual(findCanaries(text), []);
  assert.ok(!text.includes(CODE));
  assert.ok(!text.includes(APPLE_SUB));
}

Deno.test('[F02-REQ-004] stores the refresh token encrypted for the caller and returns 204 with nothing echoed', async () => {
  const { w, call, lines, key } = await setup();
  const res = await call();
  assert.equal(res.status, 204);
  const body = await res.text();
  assert.equal(body, '');
  assert.match(res.headers.get('x-request-id') ?? '', /^[0-9a-f]{12}$/);

  // Apple was asked with the authorization_code grant and a valid ES256 client secret for our bundle id.
  assert.equal(w.appleForms.length, 1);
  const f = w.appleForms[0];
  assert.equal(f.get('grant_type'), 'authorization_code');
  assert.equal(f.get('code'), CODE);
  assert.equal(f.get('client_id'), bundleId());
  const [h, c, s] = f.get('client_secret')!.split('.');
  const dec = (p: string) => JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (p.length % 4)) % 4)));
  assert.deepEqual(dec(h), { alg: 'ES256', kid: 'KEY1234567' });
  assert.equal(dec(c).iss, 'TEAM123456');
  assert.equal(dec(c).sub, bundleId());
  assert.equal(dec(c).aud, 'https://appleid.apple.com');
  assert.ok(dec(c).exp - dec(c).iat <= 600);
  const sig = Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (x) => x.charCodeAt(0));
  assert.ok(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key.publicKey, sig, new TextEncoder().encode(`${h}.${c}`)));

  // Stored wrapped, bound to the profile id, never in clear.
  assert.equal(w.stored.length, 1);
  const row = w.stored[0];
  assert.equal(row.p_profile, CANARY.profileId);
  assert.equal(row.p_key_version, 1);
  assert.equal(row.p_client_id, bundleId());
  assert.ok(!String(row.p_ciphertext).includes(CANARY.appleRefreshToken));
  assert.equal(await unwrapAppleToken(KEK, CANARY.profileId, String(row.p_ciphertext)), CANARY.appleRefreshToken);

  // Logs: one content-free line.
  assertClean(lines.join('\n'));
  const done = lines.map((l) => JSON.parse(l)).find((l) => l.event === 'request.done');
  assert.equal(done?.status, 204);
});

Deno.test('[F02-REQ-004] wraps under the newest TOKEN_KEK version present', async () => {
  const { w, call } = await setup({}, { TOKEN_KEK_V2: KEK2 });
  assert.equal((await call()).status, 204);
  assert.equal(w.stored[0].p_key_version, 2);
  assert.equal(await unwrapAppleToken(KEK2, CANARY.profileId, String(w.stored[0].p_ciphertext)), CANARY.appleRefreshToken);
});

Deno.test('[F02-REQ-022] no session, a rejected session, or an anonymous one: refused before Apple is called', async () => {
  for (const [init, expected] of [[{ auth: null }, 401], [{ auth: 'eyJhbGciOiJIUzI1NiJ9.bad.sig' }, 401]] as const) {
    const { w, call } = await setup();
    const res = await call(undefined, init);
    assert.equal(res.status, expected);
    assert.equal(w.appleForms.length, 0);
    assert.equal(w.stored.length, 0);
  }
  const anon = await setup({ user: { id: CANARY.profileId, is_anonymous: true, identities: [] } });
  assert.equal((await anon.call()).status, 403);
  assert.equal(anon.w.appleForms.length, 0);
});

Deno.test('[F02-REQ-022] an account without an Apple identity is refused (403), nothing stored', async () => {
  const { w, call, lines } = await setup({ user: { id: CANARY.profileId, identities: [{ provider: 'email', id: CANARY.profileId }] } });
  const res = await call();
  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.equal(body.error.code, 'forbidden');
  assert.equal(w.appleForms.length, 0);
  assertClean(lines.join('\n') + JSON.stringify(body));
});

Deno.test('[F02-REQ-022] a used or expired code (invalid_grant) is a 400 that is not retried, nothing stored', async () => {
  const { w, call, lines } = await setup({ apple: { status: 400, body: { error: 'invalid_grant' } } });
  const res = await call();
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error.retryable, false);
  assert.equal(w.stored.length, 0);
  assert.ok(lines.some((l) => JSON.parse(l).code === 'invalid_grant'));
});

Deno.test('[F02-REQ-022] our Apple key or team is wrong (invalid_client): 503 and an error line for the alert', async () => {
  const { w, call, lines } = await setup({ apple: { status: 400, body: { error: 'invalid_client' } } });
  const res = await call();
  assert.equal(res.status, 503);
  assert.equal((await res.json()).error.retryable, true);
  assert.equal(w.stored.length, 0);
  const err = lines.map((l) => JSON.parse(l)).find((l) => l.level === 'error');
  assert.equal(err?.code, 'invalid_client');
  assert.equal(err?.provider, 'apple');
});

Deno.test('[F02-REQ-022] a token for another Apple user or another app is revoked at once and not stored', async () => {
  for (const claims of [{ sub: '000999.other.0001', aud: bundleId() }, { sub: APPLE_SUB, aud: 'com.example.other' }]) {
    const { w, call } = await setup({ apple: { status: 200, body: { refresh_token: CANARY.appleRefreshToken, id_token: idToken(claims) } } });
    const res = await call();
    assert.equal(res.status, 403);
    assert.equal(w.stored.length, 0);
    assert.equal(w.revoked.length, 1);
    assert.equal(w.revoked[0].get('token'), CANARY.appleRefreshToken);
    assert.equal(w.revoked[0].get('token_type_hint'), 'refresh_token');
  }
});

Deno.test('[F02-REQ-022] missing secrets: 503, no call to Auth, Apple or the database', async () => {
  for (const missing of ['APPLE_TEAM_ID', 'APPLE_SIGNIN_KEY_ID', 'APPLE_SIGNIN_PRIVATE_KEY', 'TOKEN_KEK_V1', 'SUPABASE_SERVICE_ROLE_KEY']) {
    const { w, call } = await setup({}, { [missing]: undefined });
    const res = await call();
    assert.equal(res.status, 503, missing);
    assert.deepEqual(w.calls, []);
  }
});

Deno.test('[F02-REQ-022] at most RATE_MAX calls per account per 10 minutes in one isolate', async () => {
  const { w, call, advance } = await setup();
  for (let i = 0; i < RATE_MAX; i++) assert.equal((await call()).status, 204);
  const limited = await call();
  assert.equal(limited.status, 429);
  assert.equal((await limited.json()).error.code, 'rate_limited');
  assert.equal(w.appleForms.length, RATE_MAX);
  advance(10 * 60_000 + 1);
  assert.equal((await call()).status, 204);
});

Deno.test('[F02-REQ-022] method, route and body are checked before anything else', async () => {
  const { w, call } = await setup();
  assert.equal((await call(undefined, { method: 'GET' })).status, 405);
  assert.equal((await call(undefined, { path: '/apple-token/v2' })).status, 404);
  assert.equal((await call({})).status, 400);
  assert.equal((await call({ code: 'has spaces in it' })).status, 400);
  assert.equal((await call('not json')).status, 400);
  assert.equal((await call({ code: 'x'.repeat(5000) })).status, 413);
  assert.deepEqual(w.calls, []);
});

Deno.test('[F02-REQ-022] the database refusing the write is a retryable 503, with nothing logged about the person', async () => {
  const { call, lines } = await setup({ putStatus: 500 });
  const res = await call();
  assert.equal(res.status, 503);
  assertClean(lines.join('\n'));
});

Deno.test('config reads the bundle id as the client id and refuses a partial setup', () => {
  const cfg = readAppleTokenConfig((n) => ({ SUPABASE_URL: `${SUPA}/`, SUPABASE_SERVICE_ROLE_KEY: SERVICE, APPLE_TEAM_ID: 'TEAM123456', APPLE_SIGNIN_KEY_ID: 'KEY1234567', APPLE_SIGNIN_PRIVATE_KEY: 'pem', TOKEN_KEK_V1: KEK } as Record<string, string>)[n]);
  assert.equal(cfg?.clientId, bundleId());
  assert.equal(cfg?.supabaseUrl, SUPA);
  assert.equal(readAppleTokenConfig(() => undefined), null);
});
