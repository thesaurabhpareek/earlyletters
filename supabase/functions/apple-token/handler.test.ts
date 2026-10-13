// apple-token: capture Apple's refresh token at sign-in so deletion can revoke it (security review H3, G-03).
// Run: npx -y deno@2.9.6 test --no-prompt --allow-read supabase/functions/apple-token
import assert from 'node:assert/strict';
import { REQUEST_ID_RE } from '../../../packages/api/src/envelope.ts';
import { CANARY, findCanaries } from '../_shared/log/canary.ts';
import { toBase64, unwrapAppleToken } from '../purge-worker/lib/apple.ts';
import { APPLE_TOKEN_URL, appleSubjects, HOURLY_CALLS, jwtClaims, makeAppleTokenHandler, readAppleTokenConfig } from './handler.ts';

const SUPA = 'https://fake-project.supabase.co';
const ROUTE = 'https://fn.local/apple-token/v1';
const BUNDLE = 'com.earlyletters.scribe';
const APPLE_SUB = '001234.asha0fixture0apple0user.0567';
const CODE = 'c1a2b3c4d5e6f7a8b9c0.0.asha.authorization-code-fixture';
const KEK = toBase64(crypto.getRandomValues(new Uint8Array(32)));

async function p8(): Promise<string> {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const der = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
  return `-----BEGIN PRIVATE KEY-----\n${toBase64(der)}\n-----END PRIVATE KEY-----`;
}
const PEM = await p8();

function env(extra: Record<string, string> = {}): Record<string, string> {
  return {
    SUPABASE_URL: SUPA, SUPABASE_SERVICE_ROLE_KEY: 'service-key', APPLE_TEAM_ID: 'AB12CD34EF', APPLE_SIGNIN_KEY_ID: 'KEY1234567',
    APPLE_SIGNIN_PRIVATE_KEY: PEM, TOKEN_KEK_V1: toBase64(new Uint8Array(32)), TOKEN_KEK_V2: KEK, ...extra,
  };
}

const b64url = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const idToken = (claims: Record<string, unknown>) => `${b64url({ alg: 'RS256', kid: 'k' })}.${b64url(claims)}.sig`;

interface WorldOpts {
  user?: unknown;
  userStatus?: number;
  appleStatus?: number;
  appleBody?: unknown;
  putStatus?: number;
  env?: Record<string, string>;
  appleThrows?: boolean;
}

function world(o: WorldOpts = {}) {
  const calls: { url: string; init: RequestInit }[] = [];
  const lines: string[] = [];
  let clock = Date.parse('2026-10-05T09:00:00.000Z');
  const fetch = async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    if (url === `${SUPA}/auth/v1/user`) {
      return new Response(JSON.stringify(o.user ?? {
        id: CANARY.profileId, email: CANARY.parentEmail, is_anonymous: false,
        identities: [{ provider: 'apple', provider_id: APPLE_SUB, identity_data: { sub: APPLE_SUB, email: CANARY.parentEmail } }],
      }), { status: o.userStatus ?? 200 });
    }
    if (url === APPLE_TOKEN_URL) {
      if (o.appleThrows) throw new TypeError('network');
      return new Response(JSON.stringify(o.appleBody ?? {
        access_token: 'a.b.c', token_type: 'Bearer', expires_in: 3600, refresh_token: CANARY.appleRefreshToken,
        id_token: idToken({ iss: 'https://appleid.apple.com', aud: BUNDLE, sub: APPLE_SUB, email: CANARY.parentEmail }),
      }), { status: o.appleStatus ?? 200 });
    }
    if (url === `${SUPA}/rest/v1/rpc/ops_apple_token_put`) return new Response(null, { status: o.putStatus ?? 204 });
    return new Response(null, { status: 404 });
  };
  const handler = makeAppleTokenHandler((n) => (o.env ?? env())[n], { fetch, logSink: (l) => lines.push(l), now: () => clock });
  return { handler, calls, lines, tick: (ms: number) => (clock += ms) };
}

const req = (body: unknown, headers: Record<string, string> = { Authorization: `Bearer ${CANARY.sessionJwt}` }, url = ROUTE, method = 'POST') =>
  new Request(url, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined });

Deno.test('exchanges the code, wraps the refresh token under the newest key and stores it', async () => {
  const w = world();
  const res = await w.handler(req({ code: CODE, clientId: BUNDLE }));
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.deepEqual(body.data, { stored: true });
  assert.match(body.requestId, REQUEST_ID_RE);

  const apple = w.calls.find((c) => c.url === APPLE_TOKEN_URL)!;
  const form = new URLSearchParams(String(apple.init.body));
  assert.equal(form.get('grant_type'), 'authorization_code');
  assert.equal(form.get('code'), CODE);
  assert.equal(form.get('client_id'), BUNDLE);
  const secret = jwtClaims(form.get('client_secret'))!;
  assert.equal(secret.iss, 'AB12CD34EF');
  assert.equal(secret.sub, BUNDLE);
  assert.equal(secret.aud, 'https://appleid.apple.com');

  const put = w.calls.find((c) => c.url.endsWith('/ops_apple_token_put'))!;
  assert.equal((put.init.headers as Record<string, string>).Authorization, 'Bearer service-key');
  const args = JSON.parse(String(put.init.body));
  assert.equal(args.p_profile, CANARY.profileId);
  assert.equal(args.p_key_version, 2);
  assert.equal(args.p_client_id, BUNDLE);
  assert.ok(!String(put.init.body).includes(CANARY.appleRefreshToken), 'never stored in the clear');
  // The purge worker can unwrap it with the same key and profile id.
  assert.equal(await unwrapAppleToken(KEK, CANARY.profileId, args.p_ciphertext), CANARY.appleRefreshToken);
});

Deno.test('needs a session: no header, a bad JWT, an anonymous user or an account without Apple', async () => {
  assert.equal((await world().handler(req({ code: CODE }, {}))).status, 401);
  assert.equal((await world({ userStatus: 401 }).handler(req({ code: CODE }))).status, 401);
  assert.equal((await world({ user: { id: CANARY.profileId, is_anonymous: true, identities: [] } }).handler(req({ code: CODE }))).status, 403);
  const google = world({ user: { id: CANARY.profileId, identities: [{ provider: 'google', provider_id: '123' }] } });
  assert.equal((await google.handler(req({ code: CODE }))).status, 403);
  assert.equal(google.calls.some((c) => c.url === APPLE_TOKEN_URL), false, 'Apple is never called for a non-Apple account');
});

Deno.test('refuses a token for another Apple user or another client id (no storing someone else\'s token)', async () => {
  const other = world({ appleBody: { refresh_token: 'r.0.other-refresh-fixture', id_token: idToken({ iss: 'https://appleid.apple.com', aud: BUNDLE, sub: 'someone-else' }) } });
  assert.equal((await other.handler(req({ code: CODE }))).status, 403);
  assert.equal(other.calls.some((c) => c.url.endsWith('/ops_apple_token_put')), false);
  const aud = world({ appleBody: { refresh_token: 'r.0.other-refresh-fixture', id_token: idToken({ iss: 'https://appleid.apple.com', aud: 'com.example.other', sub: APPLE_SUB }) } });
  assert.equal((await aud.handler(req({ code: CODE }))).status, 403);
  // A client id the server does not list is refused before Apple is asked.
  const unknown = world();
  assert.equal((await unknown.handler(req({ code: CODE, clientId: 'com.example.other' }))).status, 403);
  assert.equal(unknown.calls.length, 0);
});

Deno.test('internal builds can be allowed by APPLE_EXTRA_CLIENT_IDS', async () => {
  const preview = `${BUNDLE}.preview`;
  const w = world({
    env: env({ APPLE_EXTRA_CLIENT_IDS: `${preview}, bad id with spaces` }),
    appleBody: { refresh_token: 'r.preview.x', id_token: idToken({ iss: 'https://appleid.apple.com', aud: preview, sub: APPLE_SUB }) },
  });
  assert.equal((await w.handler(req({ code: CODE, clientId: preview }))).status, 201);
  assert.deepEqual(readAppleTokenConfig((n) => env({ APPLE_EXTRA_CLIENT_IDS: `${preview}, bad id` })[n])!.clientIds, [BUNDLE, preview]);
});

Deno.test('a used or expired code is gone (410, not retried); Apple config errors and outages are 503', async () => {
  assert.equal((await world({ appleStatus: 400, appleBody: { error: 'invalid_grant' } }).handler(req({ code: CODE }))).status, 410);
  const cfg = await world({ appleStatus: 400, appleBody: { error: 'invalid_client' } }).handler(req({ code: CODE }));
  assert.equal(cfg.status, 503);
  assert.equal((await cfg.json()).error.retryable, false);
  const down = await world({ appleStatus: 502, appleBody: {} }).handler(req({ code: CODE }));
  assert.equal(down.status, 503);
  assert.equal((await down.json()).error.retryable, true);
  assert.equal((await world({ appleThrows: true }).handler(req({ code: CODE }))).status, 503);
  assert.equal((await world({ putStatus: 500 }).handler(req({ code: CODE }))).status, 503);
});

Deno.test('fails closed without its secrets', async () => {
  for (const missing of ['APPLE_TEAM_ID', 'APPLE_SIGNIN_KEY_ID', 'APPLE_SIGNIN_PRIVATE_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
    const e = env();
    delete e[missing];
    const w = world({ env: e });
    assert.equal((await w.handler(req({ code: CODE }))).status, 503, missing);
    assert.equal(w.calls.length, 0, missing);
  }
  const noKek = env();
  delete noKek.TOKEN_KEK_V1;
  delete noKek.TOKEN_KEK_V2;
  assert.equal((await world({ env: noKek }).handler(req({ code: CODE }))).status, 503);
});

Deno.test('validates the request: method, route, body shape and size', async () => {
  const w = world();
  assert.equal((await w.handler(req(null, undefined, ROUTE, 'GET'))).status, 405);
  assert.equal((await w.handler(req({ code: CODE }, undefined, 'https://fn.local/apple-token/v2'))).status, 404);
  assert.equal((await w.handler(req({}))).status, 400);
  assert.equal((await w.handler(req({ code: 'short' }))).status, 400);
  assert.equal((await w.handler(req('not json'))).status, 400);
  assert.equal((await w.handler(req({ code: 'x'.repeat(5000) }))).status, 413);
  assert.equal(w.calls.length, 0);
});

Deno.test(`rate limit: ${HOURLY_CALLS} calls per person per hour`, async () => {
  const w = world({ appleStatus: 400, appleBody: { error: 'invalid_grant' } });
  for (let i = 0; i < HOURLY_CALLS; i++) assert.equal((await w.handler(req({ code: CODE }))).status, 410);
  const limited = await w.handler(req({ code: CODE }));
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('retry-after'), '3600');
  w.tick(3_600_001);
  assert.equal((await w.handler(req({ code: CODE }))).status, 410);
});

Deno.test('canary: nothing it was sent or received reaches a log line', async () => {
  const lines: string[] = [];
  for (const o of [{}, { appleStatus: 400, appleBody: { error: 'invalid_grant', error_description: CANARY.parentEmail } }, { putStatus: 500 }, { userStatus: 500 }] as WorldOpts[]) {
    const w = world(o);
    await w.handler(req({ code: CODE, clientId: BUNDLE }));
    lines.push(...w.lines);
  }
  const text = lines.join('\n');
  assert.ok(lines.length >= 4);
  assert.deepEqual(findCanaries(text), []);
  for (const secret of [CODE, APPLE_SUB, CANARY.appleRefreshToken, 'service-key']) assert.ok(!text.includes(secret), secret);
});

Deno.test('helpers: Apple subjects and JWT claims', () => {
  assert.deepEqual(appleSubjects({ identities: [{ provider: 'apple', provider_id: 'p', identity_data: { sub: 's' } }, { provider: 'google', provider_id: 'g' }] }), ['s', 'p']);
  assert.equal(jwtClaims('a.b'), null);
  assert.equal(jwtClaims(42), null);
  assert.deepEqual(jwtClaims(idToken({ sub: 'x' })), { sub: 'x' });
});
