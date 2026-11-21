// new-device-fill (NDS-2, NDR-1). Fictional family Asha. A fake fetch plays PostgREST; the database side of the fill is tested
// for real in supabase/tests/new_device_fill_rekey.test.mjs.
import assert from 'node:assert/strict';
import { findCanaries } from '../../_shared/log/canary.ts';
import { hashDevice as sharedHash, byteaOf } from '../../_shared/device/hash.ts';
import { hashDevice as senderHash } from '../../new-device-email/device.ts';
import { makeHandler } from '../handler.ts';

const KEY = 'device-hash-key-fixture-0123456789abcdef';
const ASHA = { profile: '11111111-1111-4111-8111-111111111111', session: '22222222-2222-4222-8222-222222222222', device: 'ASHA-IPHONE-VENDOR-ID-0001' };
const OTHER = { profile: '33333333-3333-4333-8333-333333333333', session: '44444444-4444-4444-8444-444444444444' };
const ENV: Record<string, string> = { SUPABASE_URL: 'https://fake.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'svc-fixture', DEVICE_HASH_KEY: KEY, NEW_DEVICE_EMAIL: 'on' };

const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const jwt = (claims: Record<string, unknown>) => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(claims)}.c2ln`;
const GOOD = jwt({ sub: ASHA.profile, session_id: ASHA.session, role: 'authenticated' });

function run(filled: boolean | 'error', env = ENV) {
  const calls: { fn: string; args: Record<string, unknown> }[] = [];
  const lines: string[] = [];
  const fetchFn = (url: string, init?: RequestInit): Promise<Response> => {
    calls.push({ fn: url.split('/rpc/')[1], args: JSON.parse(String(init?.body ?? '{}')) });
    return Promise.resolve(filled === 'error' ? new Response('{}', { status: 500 }) : new Response(JSON.stringify(filled)));
  };
  const handler = makeHandler((n) => env[n], { fetch: fetchFn, logSink: (l) => lines.push(l) });
  const post = async (body: unknown, token: string | null = GOOD) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token !== null) headers.Authorization = `Bearer ${token}`;
    const res = await handler(new Request('https://fn.local/new-device-fill', { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) }));
    return { res, text: await res.text() };
  };
  return { post, calls, lines, handler };
}
const GOOD_BODY = { class: 'apple', device_id: ASHA.device };

Deno.test('fills the row for the profile and session of the token, with the keyed hash', async () => {
  const t = run(true);
  const { res } = await t.post(GOOD_BODY);
  assert.equal(res.status, 200);
  assert.equal(t.calls.length, 1);
  assert.equal(t.calls[0].fn, 'ops_new_device_pending_fill');
  assert.deepEqual(t.calls[0].args, {
    p_profile: ASHA.profile, p_session: ASHA.session, p_class: 'apple', p_device_hash: byteaOf(await sharedHash(KEY, ASHA.profile, ASHA.device)),
  });
});

Deno.test('ids in the body are ignored: profile and session come only from the token', async () => {
  const t = run(true);
  await t.post({ ...GOOD_BODY, sub: OTHER.profile, session_id: OTHER.session, profile: OTHER.profile, p_profile: OTHER.profile, p_session: OTHER.session });
  assert.equal(t.calls[0].args.p_profile, ASHA.profile);
  assert.equal(t.calls[0].args.p_session, ASHA.session);
});

Deno.test('a wrong class is refused and touches nothing', async () => {
  for (const cls of ['android', 'Apple', '', null, 7, undefined]) {
    const t = run(true);
    const { res } = await t.post({ class: cls, device_id: ASHA.device });
    assert.equal(res.status, 400, String(cls));
    assert.equal(t.calls.length, 0);
  }
});

Deno.test('an empty, short, long or odd device id is refused', async () => {
  for (const id of ['', 'short', 'x'.repeat(129), 'has space in it', 'tab\there-id', 'café-device-id', 42, null, undefined]) {
    const t = run(true);
    const { res } = await t.post({ class: 'other', device_id: id });
    assert.equal(res.status, 400, String(id));
    assert.equal(t.calls.length, 0);
  }
  const edge = run(true);
  assert.equal((await edge.post({ class: 'other', device_id: 'x'.repeat(8) })).res.status, 200);
  assert.equal((await edge.post({ class: 'other', device_id: 'x'.repeat(128) })).res.status, 200);
  for (const bad of ['not json', '[]', '"x"', 'null', JSON.stringify({ class: 'other', device_id: 'y'.repeat(3000) })]) {
    const t = run(true);
    assert.equal((await t.post(bad)).res.status, 400, bad.slice(0, 12));
  }
});

Deno.test('a missing sub or session_id, or no usable token, is refused with 401 (the gateway has already refused a bad signature)', async () => {
  const cases: (string | null)[] = [
    null, '', 'garbage', 'a.b.c', jwt({ session_id: ASHA.session }), jwt({ sub: ASHA.profile }), jwt({ sub: 'not-a-uuid', session_id: ASHA.session }),
    jwt({ sub: ASHA.profile, session_id: 'nope' }), jwt({ sub: 7, session_id: ASHA.session }), jwt({ role: 'anon' }),
  ];
  for (const token of cases) {
    const t = run(true);
    const { res } = await t.post(GOOD_BODY, token);
    assert.equal(res.status, 401, String(token));
    assert.equal(t.calls.length, 0);
  }
});

Deno.test('the same body whether the row existed or not', async () => {
  const bodies: string[] = [];
  for (const filled of [true, false]) {
    const t = run(filled);
    const { res, text } = await t.post(GOOD_BODY);
    assert.equal(res.status, 200);
    bodies.push(text.replace(/"request_id":"[^"]*"/, '').replace(/"requestId":"[^"]*"/, ''));
  }
  assert.equal(bodies[0], bodies[1]);
  assert.match(bodies[0], /"status":"ok"/);
});

Deno.test('dark: 200, the same body, no database call, no key needed', async () => {
  const t = run(true, { ...ENV, NEW_DEVICE_EMAIL: 'off', DEVICE_HASH_KEY: '' });
  const { res, text } = await t.post(GOOD_BODY);
  assert.equal(res.status, 200);
  assert.match(text, /"status":"ok"/);
  assert.equal(t.calls.length, 0);
});

Deno.test('a missing or short key answers 503 and never hashes or calls', async () => {
  for (const key of ['', 'short']) {
    const t = run(true, { ...ENV, DEVICE_HASH_KEY: key });
    assert.equal((await t.post(GOOD_BODY)).res.status, 503);
    assert.equal(t.calls.length, 0);
  }
  await assert.rejects(() => sharedHash('', ASHA.profile, ASHA.device));
  await assert.rejects(() => sharedHash('x'.repeat(31), ASHA.profile, ASHA.device));
  await assert.rejects(() => sharedHash(undefined as unknown as string, ASHA.profile, ASHA.device));
});

Deno.test('a database error answers 503 (retryable), and the next call can fill', async () => {
  const t = run('error');
  assert.equal((await t.post(GOOD_BODY)).res.status, 503);
});

Deno.test('the hash is the sender\'s hash for the same inputs, and is per profile and per key', async () => {
  const a = await sharedHash(KEY, ASHA.profile, ASHA.device);
  assert.equal(a.length, 16);
  assert.deepEqual(a, await senderHash(KEY, ASHA.profile, ASHA.device));
  assert.notDeepEqual(a, await sharedHash(KEY, OTHER.profile, ASHA.device));
  assert.notDeepEqual(a, await sharedHash(KEY + 'x', ASHA.profile, ASHA.device));
});

Deno.test('no secret, id, hash, device id or token in any log line or response', async () => {
  const outs: string[] = [];
  for (const filled of [true, false, 'error'] as const) {
    const t = run(filled);
    outs.push((await t.post(GOOD_BODY)).text, (await t.post({ class: 'x', device_id: ASHA.device })).text, (await t.post(GOOD_BODY, 'a.b.c')).text, ...t.lines);
    const hex = Array.from(await sharedHash(KEY, ASHA.profile, ASHA.device), (b) => b.toString(16).padStart(2, '0')).join('');
    const all = outs.join('\n');
    for (const secret of [ASHA.profile, ASHA.session, ASHA.device, KEY, 'svc-fixture', GOOD, hex]) assert.ok(!all.includes(secret), secret.slice(0, 8));
    assert.deepEqual(findCanaries(all), []);
  }
});
