// invite-redeem (WP-F11-02): code redemption with a failure gate and a global brake.
// Run: npm run test:functions (Deno). Fixtures are the fictional Asha family.
import assert from 'node:assert/strict';
import { REQUEST_ID_RE } from '../../../packages/api/src/envelope.ts';
import { CANARY, findCanaries } from '../_shared/log/canary.ts';
import { codeHmac } from '../_shared/http/http.ts';
import { makeRedeemHandler, MAX_BODY_BYTES } from './handler.ts';

const SUPA = 'https://fake-project.supabase.co';
const PEPPER = 'p'.repeat(40);
const ENV: Record<string, string> = {
  SUPABASE_URL: SUPA, SUPABASE_ANON_KEY: 'anon-key', SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  INVITE_CODE_PEPPER: PEPPER, RATE_SUBJECT_SECRET: 's'.repeat(40),
};
const ROUTE = 'https://fn.local/invite-redeem/v1';
const CODE = '7K3M9QXZ';
const DEVICE = '0192e000-0000-7000-8000-0000000000d1';

interface WorldOpts {
  env?: Record<string, string>;
  userStatus?: number;
  user?: unknown;
  gate?: { allowed: boolean; scope: string | null } | 'down';
  /** The code that exists (by HMAC); anything else is SCINV not_found. */
  liveCode?: string;
  acceptError?: { code: string; details?: string; status?: number };
}

async function world(o: WorldOpts = {}) {
  const calls: { url: string; init: RequestInit }[] = [];
  const lines: string[] = [];
  let failures = 0;
  const live = `\\x${await codeHmac(PEPPER, o.liveCode ?? CODE)}`;
  const fetch = async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    const body = init.body ? JSON.parse(String(init.body)) : {};
    if (url === `${SUPA}/auth/v1/user`) {
      return new Response(JSON.stringify(o.user ?? { id: CANARY.profileId, email: CANARY.parentEmail, is_anonymous: false }), { status: o.userStatus ?? 200 });
    }
    if (url.endsWith('/rpc/invite_redeem_gate')) {
      if (o.gate === 'down') return new Response('{}', { status: 500 });
      return new Response(JSON.stringify(o.gate ?? { allowed: true, scope: null }));
    }
    if (url.endsWith('/rpc/invite_redeem_fail')) {
      failures++;
      return new Response(null, { status: 204 });
    }
    if (url.endsWith('/rpc/peek_invite_by_code')) {
      if (body.p_code_hash !== live) return new Response(JSON.stringify({ code: 'SCINV', details: 'expired', message: `invite for ${CANARY.childName} expired` }), { status: 400 });
      return new Response(JSON.stringify({ inviter: 'Papa', role: 'parent' }));
    }
    if (url.endsWith('/rpc/accept_child_invite_by_code')) {
      if (o.acceptError) return new Response(JSON.stringify({ code: o.acceptError.code, details: o.acceptError.details ?? null, message: CANARY.letterText }), { status: o.acceptError.status ?? 400 });
      if (body.p_code_hash !== live) return new Response(JSON.stringify({ code: 'SCINV', details: 'not_found', message: 'invite not found' }), { status: 400 });
      return new Response(JSON.stringify(CANARY.childId));
    }
    return new Response(null, { status: 404 });
  };
  const handler = makeRedeemHandler((n) => (o.env ?? ENV)[n], { fetch, logSink: (l) => lines.push(l), now: () => new Date('2026-10-15T12:00:00Z') });
  return { handler, calls, lines, failures: () => failures };
}

const req = (body: unknown, headers: Record<string, string> = {}, url = ROUTE, method = 'POST') =>
  new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CANARY.sessionJwt}`, 'x-forwarded-for': '203.0.113.7', ...headers },
    body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });

Deno.test('[F11-REQ-007] peek shows only the sign-off name; accept joins and returns the book id', async () => {
  const w = await world();
  const peek = await w.handler(req({ code: CODE, mode: 'peek', device: DEVICE }, { 'x-request-id': '0123456789ab' }));
  assert.equal(peek.status, 200);
  const p = await peek.json();
  assert.deepEqual(p, { ok: true, data: { mode: 'peek', inviter: 'Papa', role: 'parent' }, requestId: '0123456789ab' });
  assert.equal(peek.headers.get('x-request-id'), '0123456789ab');
  assert.equal(peek.headers.get('cache-control'), 'no-store');
  const acc = await w.handler(req({ code: CODE, mode: 'accept', device: DEVICE }));
  assert.equal(acc.status, 200);
  const a = await acc.json();
  assert.deepEqual(a.data, { mode: 'accept', child_id: CANARY.childId, role: 'parent' });
  assert.match(a.requestId, REQUEST_ID_RE);
  const call = w.calls.find((c) => c.url.endsWith('accept_child_invite_by_code'))!;
  const args = JSON.parse(String(call.init.body));
  assert.equal(args.p_user, CANARY.profileId);
  assert.equal(args.p_code_hash, `\\x${await codeHmac(PEPPER, CODE)}`);
  assert.equal(String(call.init.body).includes(CODE), false, 'the code never leaves the function in clear');
});

Deno.test('[B-NFR-004] a wrong code is counted as a failure and reads as not_found, whatever the reason', async () => {
  const w = await world();
  const res = await w.handler(req({ code: 'ZZZZZZZZ', mode: 'peek', device: DEVICE }));
  assert.equal(res.status, 409);
  assert.deepEqual((await res.json()).error, { code: 'invite_unusable', retryable: false, detail: 'not_found' });
  assert.equal(w.failures(), 1);
});

Deno.test('[B-NFR-004] the 11th failure in an hour from one device is refused before any lookup', async () => {
  const w = await world({ gate: { allowed: false, scope: 'device' } });
  const res = await w.handler(req({ code: CODE, mode: 'accept', device: DEVICE }));
  assert.equal(res.status, 429);
  assert.equal(res.headers.get('retry-after'), '3600');
  assert.deepEqual((await res.json()).error, { code: 'rate_limited', retryable: true });
  assert.ok(!w.calls.some((c) => c.url.includes('by_code')));
});

Deno.test('[F11-REQ-007] global brake: every code answers codes_paused and an alert line is written', async () => {
  const w = await world({ gate: { allowed: false, scope: 'global' } });
  const res = await w.handler(req({ code: CODE, mode: 'peek', device: DEVICE }));
  assert.equal(res.status, 429);
  assert.deepEqual((await res.json()).error, { code: 'rate_limited', retryable: true, detail: 'codes_paused' });
  const brake = w.lines.map((l) => JSON.parse(l)).find((l) => l.event === 'redeem.brake');
  assert.equal(brake.level, 'error');
  assert.equal(brake.code, 'brake');
});

Deno.test('the gate hashes the device and the IP; neither reaches the database in clear', async () => {
  const w = await world();
  await w.handler(req({ code: CODE, mode: 'peek', device: DEVICE }));
  const gate = w.calls.find((c) => c.url.endsWith('invite_redeem_gate'))!;
  const args = JSON.parse(String(gate.init.body));
  assert.match(args.p_device_hash, /^[0-9a-f]{32}$/);
  assert.match(args.p_ip_hash, /^[0-9a-f]{32}$/);
  const all = w.calls.map((c) => String(c.init.body ?? '')).join('\n');
  assert.equal(all.includes(DEVICE), false);
  assert.equal(all.includes('203.0.113.7'), false);
});

Deno.test('[F11-REQ-026] a full book answers parents_full (never counted as a guess); consent and membership keep their meaning', async () => {
  const full = await world({ acceptError: { code: 'SCCAP', details: '2' } });
  const body = await (await full.handler(req({ code: CODE, mode: 'accept', device: DEVICE }))).json();
  assert.deepEqual(body.error, { code: 'parents_full', retryable: false });
  assert.equal(full.failures(), 0, 'a full book is not a wrong guess');
  const consent = await world({ acceptError: { code: 'SCCON', details: 'sensitive-data' } });
  const c = await (await consent.handler(req({ code: CODE, mode: 'accept', device: DEVICE }))).json();
  assert.deepEqual(c.error, { code: 'consent_required', retryable: false, detail: 'sensitive-data' });
  const member = await world({ acceptError: { code: 'SCINV', details: 'already_member' } });
  const m = await (await member.handler(req({ code: CODE, mode: 'accept', device: DEVICE }))).json();
  assert.deepEqual(m.error, { code: 'invite_unusable', retryable: false, detail: 'already_member' });
});

Deno.test('[ADR-0016] the invites kill switch pauses the function before anything is read', async () => {
  const w = await world({ env: { ...ENV, KILL_SWITCHES: 'statusReport, invites' } });
  const res = await w.handler(req({ code: CODE, mode: 'peek', device: DEVICE }));
  assert.equal(res.status, 503);
  assert.equal(res.headers.get('retry-after'), '300');
  assert.deepEqual((await res.json()).error, { code: 'paused', retryable: true, detail: 'invites' });
  assert.equal(w.calls.length, 0);
});

Deno.test('[BL-334] fails closed without the pepper or the subject secret', async () => {
  for (const missing of ['INVITE_CODE_PEPPER', 'RATE_SUBJECT_SECRET', 'SUPABASE_SERVICE_ROLE_KEY']) {
    const env = { ...ENV };
    delete env[missing];
    const w = await world({ env });
    const res = await w.handler(req({ code: CODE, mode: 'peek', device: DEVICE }));
    assert.equal(res.status, 503, missing);
    assert.equal(w.calls.length, 0, missing);
  }
  const short = await world({ env: { ...ENV, INVITE_CODE_PEPPER: 'short' } });
  assert.equal((await short.handler(req({ code: CODE, mode: 'peek', device: DEVICE }))).status, 503);
});

Deno.test('input is checked before the session or the database is asked', async () => {
  const w = await world();
  const bad = [
    {}, { code: CODE, mode: 'peek' }, { code: '7k3m9qxz', mode: 'peek', device: DEVICE }, { code: CODE, mode: 'join', device: DEVICE },
    { code: CODE, mode: 'peek', device: DEVICE, child_id: CANARY.childId }, { code: CODE, mode: 'peek', device: 'phone' },
  ];
  for (const b of bad) assert.equal((await w.handler(req(b))).status, 400, JSON.stringify(b));
  assert.equal((await w.handler(req('{'))).status, 400);
  assert.equal((await w.handler(req('x'.repeat(MAX_BODY_BYTES + 1)))).status, 413);
  assert.equal((await w.handler(req({ code: CODE, mode: 'peek', device: DEVICE }, { 'Idempotency-Key': 'nope' }))).status, 400);
  assert.equal((await w.handler(req(null, {}, ROUTE, 'GET'))).status, 405);
  assert.equal((await w.handler(req({ code: CODE, mode: 'peek', device: DEVICE }, {}, 'https://fn.local/invite-redeem/v2'))).status, 404);
  assert.equal(w.calls.length, 0);
});

Deno.test('no session, a bad session or an anonymous session is refused; auth down is retryable', async () => {
  assert.equal((await (await world()).handler(req({ code: CODE, mode: 'peek', device: DEVICE }, { Authorization: '' }))).status, 401);
  assert.equal((await (await world({ userStatus: 401 })).handler(req({ code: CODE, mode: 'peek', device: DEVICE }))).status, 401);
  const anon = await world({ user: { id: CANARY.profileId, is_anonymous: true } });
  assert.equal((await anon.handler(req({ code: CODE, mode: 'peek', device: DEVICE }))).status, 403);
  assert.ok(!anon.calls.some((c) => c.url.includes('/rpc/')));
  const down = await world({ userStatus: 500 });
  const r = await down.handler(req({ code: CODE, mode: 'peek', device: DEVICE }));
  assert.equal(r.status, 503);
  assert.deepEqual((await r.json()).error, { code: 'unavailable', retryable: true });
  assert.equal((await (await world({ gate: 'down' })).handler(req({ code: CODE, mode: 'peek', device: DEVICE }))).status, 503);
});

Deno.test('[LEGAL-REQ-014] canary: no code, token, device, IP, id, email or text in any log line', async () => {
  const lines: string[] = [];
  for (const o of [{}, { gate: { allowed: false, scope: 'global' } }, { acceptError: { code: 'SCCAP', details: '2' } }, { userStatus: 500 }] as WorldOpts[]) {
    const w = await world(o);
    for (const mode of ['peek', 'accept']) {
      await w.handler(req({ code: CODE, mode, device: DEVICE }, { 'x-request-id': CANARY.requestId }));
      await w.handler(req({ code: 'ZZZZZZZZ', mode, device: DEVICE }));
    }
    lines.push(...w.lines);
  }
  const text = lines.join('\n');
  assert.ok(lines.length >= 16);
  assert.deepEqual(findCanaries(text), []);
  for (const s of [CODE, 'ZZZZZZZZ', DEVICE, '203.0.113.7', 'Papa']) assert.equal(text.includes(s), false, s);
});
