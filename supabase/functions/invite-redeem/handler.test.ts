// invite-redeem (WP-F11-02): code redemption through one atomic gate-lookup-count RPC.
// Run: npm run test:functions (Deno). Fixtures are the fictional Asha family.
// The fake database below implements the `invite_redeem_by_code` contract
// (packages/api/src/server/family.ts RedeemByCodeArgs, RedeemRpcResultSchema):
// limits per person, device and IP, the global brake, failures counted with the lookup.
import assert from 'node:assert/strict';
import { REQUEST_ID_RE } from '../../../packages/api/src/envelope.ts';
import {
  REDEEM_FAILURES_GLOBAL_HOUR, REDEEM_FAILURES_PER_DEVICE_HOUR, REDEEM_FAILURES_PER_IP_HOUR, REDEEM_FAILURES_PER_USER_HOUR,
} from '../../../packages/api/src/server/family.ts';
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
  /** An answer the fake database gives instead of running the contract. */
  rpc?: { status?: number; body: unknown } | 'down';
  /** Pre-existing failures for the global counter. */
  globalFailures?: number;
  refusal?: { sqlstate: string; detail?: string };
  joined?: boolean;
}

async function world(o: WorldOpts = {}) {
  const calls: { url: string; init: RequestInit }[] = [];
  const lines: string[] = [];
  const failures = new Map<string, number>();
  let global = o.globalFailures ?? 0;
  const live = `\\x${await codeHmac(PEPPER, CODE)}`;
  const count = (hashes: string[]) => hashes.reduce((n, h) => n + (failures.get(h) ?? 0), 0);
  const fetch = async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    if (url === `${SUPA}/auth/v1/user`) {
      return new Response(JSON.stringify(o.user ?? { id: CANARY.profileId, email: CANARY.parentEmail, is_anonymous: false }), { status: o.userStatus ?? 200 });
    }
    if (url.endsWith('/rpc/invite_redeem_by_code')) {
      if (o.rpc === 'down') return new Response('{"code":"57014"}', { status: 500 });
      if (o.rpc) return new Response(JSON.stringify(o.rpc.body), { status: o.rpc.status ?? 200 });
      const a = JSON.parse(String(init.body));
      // The contract, as one transaction: gate, look up, count.
      if (global >= REDEEM_FAILURES_GLOBAL_HOUR) return Response.json({ outcome: 'limited', scope: 'global' });
      if (count(a.p_user_subjects) >= REDEEM_FAILURES_PER_USER_HOUR) return Response.json({ outcome: 'limited', scope: 'user' });
      if (count(a.p_device_subjects) >= REDEEM_FAILURES_PER_DEVICE_HOUR) return Response.json({ outcome: 'limited', scope: 'device' });
      if (a.p_ip_subjects.length && count(a.p_ip_subjects) >= REDEEM_FAILURES_PER_IP_HOUR) return Response.json({ outcome: 'limited', scope: 'ip' });
      if (a.p_code_hash !== live) {
        global++;
        for (const list of [a.p_user_subjects, a.p_device_subjects, a.p_ip_subjects]) if (list[0]) failures.set(list[0], (failures.get(list[0]) ?? 0) + 1);
        return Response.json({ outcome: 'unusable', detail: 'expired' });
      }
      if (o.refusal) return Response.json({ outcome: 'refused', ...o.refusal });
      if (a.p_mode === 'peek') return Response.json({ outcome: 'peek', inviter: 'Papa', role: 'parent', ...(o.joined ? { joined: true } : {}) });
      return Response.json({ outcome: 'accepted', child_id: CANARY.childId, role: 'parent' });
    }
    return new Response(null, { status: 404 });
  };
  const handler = makeRedeemHandler((n) => (o.env ?? ENV)[n], { fetch, logSink: (l) => lines.push(l), now: () => new Date('2026-10-15T12:00:00Z') });
  return { handler, calls, lines, rpcArgs: () => calls.filter((c) => c.url.endsWith('invite_redeem_by_code')).map((c) => JSON.parse(String(c.init.body))) };
}

const req = (body: unknown, headers: Record<string, string> = {}, url = ROUTE, method = 'POST') =>
  new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CANARY.sessionJwt}`, 'cf-connecting-ip': '203.0.113.7', ...headers },
    body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });
const guess = (code: string, device = DEVICE, headers: Record<string, string> = {}) => req({ code, mode: 'peek', device }, headers);

Deno.test('[F11-REQ-007] peek shows only the sign-off name; accept joins and returns the book id', async () => {
  const w = await world();
  const peek = await w.handler(req({ code: CODE, mode: 'peek', device: DEVICE }, { 'x-request-id': '0123456789ab' }));
  assert.equal(peek.status, 200);
  assert.deepEqual(await peek.json(), { ok: true, data: { mode: 'peek', inviter: 'Papa', role: 'parent' }, requestId: '0123456789ab' });
  assert.equal(peek.headers.get('x-request-id'), '0123456789ab');
  assert.equal(peek.headers.get('cache-control'), 'no-store');
  const acc = await w.handler(req({ code: CODE, mode: 'accept', device: DEVICE.toUpperCase() }));
  assert.equal(acc.status, 200);
  const a = await acc.json();
  assert.deepEqual(a.data, { mode: 'accept', child_id: CANARY.childId, role: 'parent' });
  assert.match(a.requestId, REQUEST_ID_RE);
  const args = w.rpcArgs()[1];
  assert.equal(args.p_user, CANARY.profileId);
  assert.equal(args.p_mode, 'accept');
  assert.equal(args.p_code_hash, `\\x${await codeHmac(PEPPER, CODE)}`);
  assert.deepEqual(w.rpcArgs()[0].p_device_subjects, args.p_device_subjects, 'device ids are read as lowercase');
  const all = w.calls.map((c) => String(c.init.body ?? '')).join('\n');
  for (const s of [CODE, DEVICE, '203.0.113.7']) assert.equal(all.includes(s), false, `${s} never leaves the function in clear`);
});

Deno.test('[F11-REQ-007] one RPC per redemption: gate, lookup and count are a single call', async () => {
  const w = await world();
  await w.handler(guess('ZZZZZZZZ'));
  const rpcs = w.calls.filter((c) => c.url.includes('/rpc/'));
  assert.equal(rpcs.length, 1);
  assert.ok(rpcs[0].url.endsWith('/rpc/invite_redeem_by_code'));
  assert.equal(new Headers(rpcs[0].init.headers).get('apikey'), 'service-key');
});

Deno.test('[B-NFR-004] a wrong code reads as not_found whatever the reason, and the 11th failure is refused', async () => {
  const w = await world();
  for (let i = 0; i < 10; i++) {
    const res = await w.handler(guess('ZZZZZZZZ'));
    assert.equal(res.status, 409);
    assert.deepEqual((await res.json()).error, { code: 'invite_unusable', retryable: false, detail: 'not_found' });
  }
  const eleventh = await w.handler(guess(CODE));
  assert.equal(eleventh.status, 429);
  assert.equal(eleventh.headers.get('retry-after'), '3600');
  assert.deepEqual((await eleventh.json()).error, { code: 'rate_limited', retryable: true });
});

Deno.test('[B-NFR-004] inventing a new device id per guess does not reset the count: the person is counted too', async () => {
  const w = await world();
  for (let i = 0; i < 10; i++) await w.handler(guess('ZZZZZZZZ', crypto.randomUUID(), { 'cf-connecting-ip': `198.51.100.${i}` }));
  const res = await w.handler(guess(CODE, crypto.randomUUID(), { 'cf-connecting-ip': '198.51.100.200' }));
  assert.equal(res.status, 429);
  const subjects = new Set(w.rpcArgs().map((a) => a.p_user_subjects[0]));
  assert.equal(subjects.size, 1, 'the same person hashes to the same subject');
});

Deno.test('a client-supplied X-Forwarded-For is never trusted; without a trusted address the IP limit is skipped, not shared', async () => {
  const w = await world();
  await w.handler(guess('ZZZZZZZZ', DEVICE, { 'cf-connecting-ip': '', 'x-forwarded-for': '198.51.100.1' }));
  assert.deepEqual(w.rpcArgs()[0].p_ip_subjects, []);
  await w.handler(guess('ZZZZZZZZ', DEVICE, { 'cf-connecting-ip': '2001:db8:1:2:aaaa::1' }));
  await w.handler(guess('ZZZZZZZZ', DEVICE, { 'cf-connecting-ip': '2001:db8:1:2:bbbb::9' }));
  const [a, b] = w.rpcArgs().slice(1).map((x) => x.p_ip_subjects[0]);
  assert.equal(a, b, 'one IPv6 /64 is one subject');
  assert.match(a, /^[0-9a-f]{32}$/);
});

Deno.test('[F11-REQ-007] global brake: every code answers codes_paused and an error line is written', async () => {
  const w = await world({ globalFailures: 1_000 });
  const res = await w.handler(guess(CODE));
  assert.equal(res.status, 429);
  assert.deepEqual((await res.json()).error, { code: 'rate_limited', retryable: true, detail: 'codes_paused' });
  const brake = w.lines.map((l) => JSON.parse(l)).find((l) => l.event === 'redeem.brake');
  assert.equal(brake.level, 'error');
  assert.equal(brake.code, 'brake');
});

Deno.test('[F11-REQ-026] a full book answers parents_full; consent and membership keep their meaning; joined is passed on', async () => {
  const full = await world({ refusal: { sqlstate: 'SCCAP', detail: '2' } });
  const body = await (await full.handler(req({ code: CODE, mode: 'accept', device: DEVICE }))).json();
  assert.deepEqual(body.error, { code: 'parents_full', retryable: false });
  const consent = await world({ refusal: { sqlstate: 'SCCON', detail: 'sensitive-data' } });
  const c = await (await consent.handler(req({ code: CODE, mode: 'accept', device: DEVICE }))).json();
  assert.deepEqual(c.error, { code: 'consent_required', retryable: false, detail: 'sensitive-data' });
  const member = await world({ rpc: { body: { outcome: 'unusable', detail: 'already_member' } } });
  const m = await (await member.handler(req({ code: CODE, mode: 'accept', device: DEVICE }))).json();
  assert.deepEqual(m.error, { code: 'invite_unusable', retryable: false, detail: 'already_member' });
  const joined = await world({ joined: true });
  assert.deepEqual((await (await joined.handler(guess(CODE))).json()).data, { mode: 'peek', inviter: 'Papa', role: 'parent', joined: true });
});

Deno.test('[ADR-0016] the invites kill switch pauses the function before anything is read', async () => {
  const w = await world({ env: { ...ENV, KILL_SWITCHES: 'statusReport, invites' } });
  const res = await w.handler(guess(CODE));
  assert.equal(res.status, 503);
  assert.equal(res.headers.get('retry-after'), '300');
  assert.deepEqual((await res.json()).error, { code: 'paused', retryable: true, detail: 'invites' });
  assert.equal(w.calls.length, 0);
});

Deno.test('[BL-334] fails closed without the pepper or the subject secret', async () => {
  for (const missing of ['INVITE_CODE_PEPPER', 'RATE_SUBJECT_SECRET', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY']) {
    const env = { ...ENV };
    delete env[missing];
    const w = await world({ env });
    assert.equal((await w.handler(guess(CODE))).status, 503, missing);
    assert.equal(w.calls.length, 0, missing);
  }
  const short = await world({ env: { ...ENV, INVITE_CODE_PEPPER: 'short' } });
  assert.equal((await short.handler(guess(CODE))).status, 503);
});

Deno.test('input is checked before the session or the database is asked; a chunked body over the cap is cut off', async () => {
  const w = await world();
  const bad = [
    {}, { code: CODE, mode: 'peek' }, { code: '7k3m9qxz', mode: 'peek', device: DEVICE }, { code: CODE, mode: 'join', device: DEVICE },
    { code: CODE, mode: 'peek', device: DEVICE, child_id: CANARY.childId }, { code: CODE, mode: 'peek', device: 'phone' },
  ];
  for (const b of bad) assert.equal((await w.handler(req(b))).status, 400, JSON.stringify(b));
  assert.equal((await w.handler(req('{'))).status, 400);
  assert.equal((await w.handler(req('x'.repeat(MAX_BODY_BYTES + 1)))).status, 413);
  let pulled = 0;
  const endless = new ReadableStream<Uint8Array>({ pull(c) { pulled++; c.enqueue(new Uint8Array(512)); } });
  const chunked = new Request(ROUTE, { method: 'POST', body: endless, headers: { Authorization: `Bearer ${CANARY.sessionJwt}` }, duplex: 'half' } as RequestInit);
  assert.equal((await w.handler(chunked)).status, 413);
  assert.ok(pulled <= 4, `read ${pulled} chunks of 512 bytes`);
  assert.equal((await w.handler(req({ code: CODE, mode: 'peek', device: DEVICE }, { 'Idempotency-Key': 'nope' }))).status, 400);
  assert.equal((await w.handler(req(null, {}, ROUTE, 'GET'))).status, 405);
  assert.equal((await w.handler(req({ code: CODE, mode: 'peek', device: DEVICE }, {}, 'https://fn.local/invite-redeem/v2'))).status, 404);
  assert.equal(w.calls.length, 0);
});

Deno.test('no session, a bad session, an anonymous one or one without is_anonymous is refused; upstream trouble is retryable', async () => {
  assert.equal((await (await world()).handler(guess(CODE, DEVICE, { Authorization: '' }))).status, 401);
  assert.equal((await (await world({ userStatus: 401 })).handler(guess(CODE))).status, 401);
  for (const user of [{ id: CANARY.profileId, is_anonymous: true }, { id: CANARY.profileId }]) {
    const anon = await world({ user });
    assert.equal((await anon.handler(guess(CODE))).status, 403, JSON.stringify(user));
    assert.ok(!anon.calls.some((c) => c.url.includes('/rpc/')));
  }
  const down = await world({ userStatus: 500 });
  const r = await down.handler(guess(CODE));
  assert.equal(r.status, 503);
  assert.deepEqual((await r.json()).error, { code: 'unavailable', retryable: true });
  assert.equal((await (await world({ rpc: 'down' })).handler(guess(CODE))).status, 503);
  assert.equal((await (await world({ rpc: { body: { outcome: 'maybe' } } })).handler(guess(CODE))).status, 503);
});

Deno.test('[LEGAL-REQ-014] canary: no code, token, device, IP, id, email or text in any log line', async () => {
  const lines: string[] = [];
  for (const o of [{}, { globalFailures: 1_000 }, { refusal: { sqlstate: 'SCCAP', detail: '2' } }, { userStatus: 500 }, { rpc: 'down' as const }] as WorldOpts[]) {
    const w = await world(o);
    for (const mode of ['peek', 'accept']) {
      await w.handler(req({ code: CODE, mode, device: DEVICE }, { 'x-request-id': CANARY.requestId }));
      await w.handler(req({ code: 'ZZZZZZZZ', mode, device: DEVICE }));
    }
    lines.push(...w.lines);
  }
  const text = lines.join('\n');
  assert.ok(lines.length >= 20);
  assert.deepEqual(findCanaries(text), []);
  for (const s of [CODE, 'ZZZZZZZZ', DEVICE, '203.0.113.7', 'Papa']) assert.equal(text.includes(s), false, s);
});
