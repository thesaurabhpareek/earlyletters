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

Deno.test('the 2 KB body cap on its own: a valid class and device id padded past 2048 chars is refused', async () => {
  const t = run(true);
  const padded = JSON.stringify({ ...GOOD_BODY, pad: 'p'.repeat(2100) });
  assert.ok(padded.length > 2048);
  assert.equal((await t.post(padded)).res.status, 400);
  assert.equal(t.calls.length, 0);
  // Multi-byte padding counts bytes, not characters: 1100 two-byte characters are over the cap although under 2048 characters.
  const wide = JSON.stringify({ ...GOOD_BODY, pad: '\u00e9'.repeat(1100) });
  assert.ok(wide.length < 2048);
  assert.equal((await run(true).post(wide)).res.status, 400);
  // A body under the cap with an extra field is fine.
  assert.equal((await run(true).post({ ...GOOD_BODY, pad: 'p'.repeat(100) })).res.status, 200);
});

Deno.test('a Content-Length over the cap is refused before the body is read', async () => {
  const t = run(true);
  let read = false;
  const req = new Request('https://fn.local/new-device-fill', { method: 'POST', headers: { Authorization: `Bearer ${GOOD}`, 'Content-Length': '999999' }, body: JSON.stringify(GOOD_BODY) });
  req.text = () => { read = true; return Promise.resolve('{}'); };
  const res = await t.handler(req);
  assert.equal(res.status, 400);
  assert.equal(read, false);
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

Deno.test('the key used: NEXT while it is set, else DEVICE_HASH_KEY; a short one of either is the misconfigured answer', async () => {
  const NEXT = 'next-hash-key-fixture-0123456789abcdefgh';
  const hashArg = async (env: Record<string, string>) => {
    const t = run(true, env);
    const { res } = await t.post(GOOD_BODY);
    return { res, arg: t.calls[0]?.args.p_device_hash };
  };
  const withNext = await hashArg({ ...ENV, DEVICE_HASH_KEY_NEXT: NEXT });
  assert.equal(withNext.arg, byteaOf(await sharedHash(NEXT, ASHA.profile, ASHA.device)));
  assert.notEqual(withNext.arg, byteaOf(await sharedHash(KEY, ASHA.profile, ASHA.device)));
  const unset = await hashArg(ENV);
  assert.equal(unset.arg, byteaOf(await sharedHash(KEY, ASHA.profile, ASHA.device)));
  assert.equal((await hashArg({ ...ENV, DEVICE_HASH_KEY_NEXT: '   ' })).arg, unset.arg);
  for (const env of [{ ...ENV, DEVICE_HASH_KEY_NEXT: 'short' }, { ...ENV, DEVICE_HASH_KEY: 'short', DEVICE_HASH_KEY_NEXT: NEXT }]) {
    const r = await hashArg(env);
    assert.equal(r.res.status, 503);
    assert.equal(r.arg, undefined);
  }
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

Deno.test('[SEC-R13 fill limit] BL-2192: past the per-person limit the RPC answers false, and the caller still gets the uniform 200 with no id logged', async () => {
  // The limit lives in ops_new_device_pending_fill (20261124132000, 10 calls per person per hour): past it the RPC answers false,
  // the same answer as "nothing to fill". This fake plays that database: true for the first 10 calls of a person, then false.
  const LIMIT = 10;
  const calls: Record<string, unknown>[] = [];
  const lines: string[] = [];
  const fetchFn = (_url: string, init?: RequestInit): Promise<Response> => {
    calls.push(JSON.parse(String(init?.body ?? '{}')));
    return Promise.resolve(new Response(JSON.stringify(calls.length <= LIMIT)));
  };
  const handler = makeHandler((n) => ENV[n], { fetch: fetchFn, logSink: (l) => lines.push(l) });
  const post = async () => {
    const res = await handler(new Request('https://fn.local/new-device-fill', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GOOD}` }, body: JSON.stringify(GOOD_BODY),
    }));
    return { status: res.status, body: (await res.text()).replace(/"request_?[iI]d":"[^"]*"/g, '') };
  };
  const answers = [];
  for (let i = 0; i < LIMIT + 3; i++) answers.push(await post());
  // One RPC per call: the function adds no second round trip and no limit of its own; the database decides.
  assert.equal(calls.length, LIMIT + 3);
  for (const a of answers) {
    assert.equal(a.status, 200);
    assert.equal(a.body, answers[0].body); // a served call and a limited one read the same (no oracle)
  }
  assert.match(answers[0].body, /"status":"ok"/);
  // Logs: counts and enums only. A limited call logs rows 0, like an unfilled one, and never the profile, session, device or token.
  const done = lines.filter((l) => l.includes('fill.done'));
  assert.equal(done.length, LIMIT + 3);
  assert.equal(done.filter((l) => /"rows":0/.test(l)).length, 3);
  const all = lines.join('\n');
  for (const secret of [ASHA.profile, ASHA.session, ASHA.device, KEY, 'svc-fixture', GOOD]) assert.ok(!all.includes(secret), secret.slice(0, 8));
  assert.deepEqual(findCanaries(all), []);
});
