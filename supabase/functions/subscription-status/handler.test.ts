// subscription-status (WP-F14-15c shell, D-080, D-081): validation against the contract,
// least privilege (the caller's JWT, no service key), kill switch, envelope.
// Run: npm run test:functions (Deno). Fixtures are the fictional Asha family.
import assert from 'node:assert/strict';
import { CANARY, findCanaries } from '../_shared/log/canary.ts';
import { makeStatusHandler } from './handler.ts';

const SUPA = 'https://fake-project.supabase.co';
const ENV: Record<string, string> = { SUPABASE_URL: SUPA, SUPABASE_ANON_KEY: 'anon-key' };
const BASE = 'https://fn.local/subscription-status/v1';
const KEY = '0192e000-0000-7000-8000-000000000123';
const SALT = 'A'.repeat(43);

const report = {
  schema_version: 1,
  sub_ref: 'a'.repeat(64),
  environment: 'sandbox',
  plan: 'annual',
  trial_end: '2026-10-22T19:00:00.000Z',
  renewal_date: '2026-10-22T19:00:00.000Z',
  cancelled: false,
  free_period_days: 7,
  reported_at: '2026-10-15T19:00:00.000Z',
  consent: { product_id: 'plus.annual', offer_type: 'introductory', terms_version: '1.4.0', shown_at: '2026-10-15T18:59:00.000Z' },
};

function world(o: { env?: Record<string, string>; rpcStatus?: number; rpcBody?: unknown; user?: unknown; userStatus?: number } = {}) {
  const calls: { url: string; init: RequestInit }[] = [];
  const lines: string[] = [];
  const fetch = async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    if (url === `${SUPA}/auth/v1/user`) {
      return new Response(JSON.stringify(o.user ?? { id: CANARY.profileId, email: CANARY.parentEmail, is_anonymous: false }), { status: o.userStatus ?? 200 });
    }
    if (url.endsWith('/rpc/status_report_store')) {
      return new Response(JSON.stringify(o.rpcBody ?? { stored: 'created', consent: 'recorded' }), { status: o.rpcStatus ?? 200 });
    }
    if (url.endsWith('/rpc/status_salt')) return new Response(JSON.stringify(o.rpcBody ?? SALT), { status: o.rpcStatus ?? 200 });
    return new Response(null, { status: 404 });
  };
  const handler = makeStatusHandler((n) => (o.env ?? ENV)[n], { fetch, logSink: (l) => lines.push(l) });
  return { handler, calls, lines };
}

const post = (body: unknown, headers: Record<string, string> = { 'Idempotency-Key': KEY }) =>
  new Request(`${BASE}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CANARY.sessionJwt}`, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

Deno.test('[F14-REQ-032] a valid report is stored through the RPC with the caller JWT and the idempotency key', async () => {
  const w = world();
  const res = await w.handler(post(report, { 'Idempotency-Key': KEY, 'x-request-id': '0123456789ab' }));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, data: { stored: 'created', consent: 'recorded' }, requestId: '0123456789ab' });
  const call = w.calls.find((c) => c.url.includes('/rpc/'))!;
  assert.equal(call.url, `${SUPA}/rest/v1/rpc/status_report_store`);
  const h = new Headers(call.init.headers);
  assert.equal(h.get('Authorization'), `Bearer ${CANARY.sessionJwt}`);
  assert.equal(h.get('apikey'), 'anon-key');
  assert.equal(h.get('idempotency-key'), KEY);
  assert.equal(h.get('x-request-id'), '0123456789ab');
  const args = JSON.parse(String(call.init.body));
  assert.deepEqual(args.p_report, report);
  assert.equal(args.p_fingerprint, 'sandbox|annual|2026-10-22T19:00:00.000Z|2026-10-22T19:00:00.000Z|0|7');
});

Deno.test('[F14-REQ-014] purchase data in the body is refused before anything is called', async () => {
  const w = world();
  for (const extra of [{ original_transaction_id: '2000000123456789' }, { price: 49.99 }, { receipt: 'MIIT' }, { signed_transaction: 'eyJ' }]) {
    const res = await w.handler(post({ ...report, ...extra }));
    assert.equal(res.status, 400, Object.keys(extra)[0]);
    assert.deepEqual((await res.json()).error, { code: 'bad_request', retryable: false });
  }
  assert.equal(w.calls.length, 0);
});

Deno.test('[ADR-0017] the idempotency key is required and must be a UUID; the body is capped', async () => {
  const w = world();
  assert.equal((await w.handler(post(report, {}))).status, 400);
  assert.equal((await w.handler(post(report, { 'Idempotency-Key': 'again' }))).status, 400);
  assert.equal((await w.handler(post('x'.repeat(3000)))).status, 413);
  assert.equal((await w.handler(post('{'))).status, 400);
  assert.equal((await w.handler(post({ ...report, environment: 'staging' }))).status, 400);
  assert.equal(w.calls.length, 0);
});

Deno.test('[ADR-0016] the statusReport kill switch pauses reports and salts', async () => {
  const w = world({ env: { ...ENV, KILL_SWITCHES: 'statusReport' } });
  const res = await w.handler(post(report));
  assert.equal(res.status, 503);
  assert.equal(res.headers.get('retry-after'), '300');
  assert.deepEqual((await res.json()).error, { code: 'paused', retryable: true, detail: 'statusReport' });
  assert.equal((await w.handler(new Request(`${BASE}/salt`, { headers: { Authorization: 'Bearer x' } }))).status, 503);
  assert.equal(w.calls.length, 0);
});

Deno.test('[F14-REQ-032] anonymous sessions are refused by the function itself, before any RPC', async () => {
  for (const user of [{ id: CANARY.profileId, is_anonymous: true }, { id: CANARY.profileId }]) {
    const w = world({ user });
    assert.equal((await w.handler(post(report))).status, 403, JSON.stringify(user));
    assert.equal((await w.handler(new Request(`${BASE}/salt`, { headers: { Authorization: 'Bearer x' } }))).status, 403);
    assert.ok(!w.calls.some((c) => c.url.includes('/rpc/')));
  }
  assert.equal((await world({ userStatus: 401 }).handler(post(report))).status, 401);
  assert.equal((await world({ userStatus: 502 }).handler(post(report))).status, 503);
});

Deno.test('[F14-REQ-043] until the SQL exists (PostgREST 404) the answer is retryable, so the phone keeps the report', async () => {
  const w = world({ rpcStatus: 404, rpcBody: { code: 'PGRST202', message: 'function not found' } });
  const res = await w.handler(post(report));
  assert.equal(res.status, 503);
  assert.deepEqual((await res.json()).error, { code: 'unavailable', retryable: true });
});

Deno.test('SQL errors map to the envelope: SCRAT, SCANO, 22023 idempotency conflict, 401', async () => {
  const cases: [number, unknown, number, unknown][] = [
    [400, { code: 'SCRAT' }, 429, { code: 'rate_limited', retryable: true }],
    [400, { code: 'SCANO' }, 403, { code: 'anonymous_refused', retryable: false }],
    [400, { code: '22023', details: 'idempotency', message: 'idempotency key reused' }, 422, { code: 'idempotency_conflict', retryable: false }],
    [400, { code: '22023', message: 'bad date' }, 400, { code: 'bad_request', retryable: false }],
    [401, { code: 'PGRST301' }, 401, { code: 'unauthorized', retryable: false }],
    [500, { code: 'XX000' }, 503, { code: 'unavailable', retryable: true }],
  ];
  for (const [rpcStatus, rpcBody, status, error] of cases) {
    const res = await world({ rpcStatus, rpcBody }).handler(post(report));
    assert.equal(res.status, status, JSON.stringify(rpcBody));
    assert.deepEqual((await res.json()).error, error);
  }
  assert.equal((await world({ rpcBody: { stored: 'maybe', consent: 'none' } }).handler(post(report))).status, 503);
});

Deno.test('the salt route returns the per-account salt and refuses a malformed one', async () => {
  const w = world();
  const res = await w.handler(new Request(`${BASE}/salt`, { headers: { Authorization: `Bearer ${CANARY.sessionJwt}` } }));
  assert.equal(res.status, 200);
  assert.deepEqual((await res.json()).data, { salt: SALT });
  assert.equal((await world({ rpcBody: 'short' }).handler(new Request(`${BASE}/salt`, { headers: { Authorization: 'Bearer x' } }))).status, 503);
  assert.equal((await w.handler(new Request(`${BASE}/salt`, { method: 'POST', headers: { Authorization: 'Bearer x' } }))).status, 405);
});

Deno.test('routes, methods and a missing session are refused before any call', async () => {
  const w = world();
  assert.equal((await w.handler(new Request(`${BASE}/report`))).status, 405);
  assert.equal((await w.handler(new Request('https://fn.local/subscription-status/v2/report', { method: 'POST' }))).status, 404);
  assert.equal((await w.handler(post(report, { 'Idempotency-Key': KEY, Authorization: '' }))).status, 401);
  assert.equal((await world({ env: { SUPABASE_URL: SUPA } }).handler(post(report))).status, 503);
  assert.equal(w.calls.length, 0);
});

Deno.test('[LEGAL-REQ-014] canary: nothing from the body, the salt or the session reaches a log line', async () => {
  const lines: string[] = [];
  for (const o of [{}, { rpcStatus: 400, rpcBody: { code: 'SCRAT' } }, { rpcStatus: 500, rpcBody: { message: CANARY.parentEmail } }]) {
    const w = world(o);
    await w.handler(post({ ...report, sub_ref: 'f'.repeat(64) }, { 'Idempotency-Key': KEY, 'x-request-id': CANARY.requestId }));
    await w.handler(post({ ...report, note: CANARY.letterText }));
    await w.handler(new Request(`${BASE}/salt`, { headers: { Authorization: `Bearer ${CANARY.sessionJwt}` } }));
    lines.push(...w.lines);
  }
  const text = lines.join('\n');
  assert.ok(lines.length >= 9);
  assert.deepEqual(findCanaries(text), []);
  for (const s of ['f'.repeat(64), SALT, 'plus.annual', KEY]) assert.equal(text.includes(s), false, s);
});
