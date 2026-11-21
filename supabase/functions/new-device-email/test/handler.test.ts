// new-device-email sender (NS-08-R21, E83). Fictional family Asha. The database side of the three functions is tested for real
// in supabase/tests/new_device_sender.test.mjs; here a fake fetch plays PostgREST, Auth and Resend.
import assert from 'node:assert/strict';
import { findCanaries } from '../../_shared/log/canary.ts';
import { makeHandler } from '../handler.ts';
import { b64url, hashDevice, newToken } from '../device.ts';
import { composeEmail } from '../mail.ts';

const SECRET = 'sender-secret-fixture-0123456789abcdef';
const KEY = 'device-hash-key-fixture-0123456789abcdef';
const ASHA = { profile: '11111111-1111-4111-8111-111111111111', session: '22222222-2222-4222-8222-222222222222', email: 'asha.family@example.com' };
const ENV: Record<string, string> = {
  SUPABASE_URL: 'https://fake.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'svc', RESEND_API_KEY: 're_x', NEW_DEVICE_SENDER_SECRET: SECRET,
  DEVICE_HASH_KEY: KEY, NEW_DEVICE_EMAIL: 'on',
};

interface World {
  pending: Record<string, unknown>[]; verdict: string; rekey: string; mintNull: boolean; mintThrows: boolean; resend: number[];
  calls: { fn: string; args: Record<string, unknown> }[]; sent: Record<string, unknown>[]; events: Record<string, unknown>[]; eventsFail: boolean;
}
const world = (over: Partial<World> = {}): World => ({
  pending: [{ session_id: ASHA.session, profile_id: ASHA.profile, class: 'apple', device_hash: '' }], verdict: 'new', rekey: 'rekeyed', mintNull: false, mintThrows: false,
  resend: [200], calls: [], sent: [], events: [], eventsFail: false, ...over,
});

function run(w: World, env = ENV) {
  const lines: string[] = [];
  const fetchFn = (url: string, init?: RequestInit): Promise<Response> => {
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    if (url.includes('/auth/v1/admin/users/')) return Promise.resolve(new Response(JSON.stringify({ id: ASHA.profile, email: ASHA.email })));
    if (url.endsWith('/emails')) {
      const status = w.resend.shift() ?? 200;
      if (status === 200) w.sent.push({ ...body, key: (init!.headers as Record<string, string>)['Idempotency-Key'] });
      return Promise.resolve(new Response('{}', { status }));
    }
    const fn = url.split('/rpc/')[1];
    w.calls.push({ fn, args: body });
    if (fn === 'ops_new_device_pending_take') return Promise.resolve(new Response(JSON.stringify(w.pending.splice(0, 1))));
    if (fn === 'ops_new_device_rekey') return Promise.resolve(new Response(JSON.stringify(w.rekey)));
    if (fn === 'ops_new_device_record') return Promise.resolve(new Response(JSON.stringify(w.verdict)));
    if (fn === 'ops_new_device_token_mint') return Promise.resolve(w.mintThrows ? new Response('{}', { status: 500 }) : new Response(JSON.stringify(w.mintNull ? null : '2026-11-23T00:00:00Z')));
    if (fn === 'ops_security_event_write') {
      if (w.eventsFail) return Promise.resolve(new Response('{}', { status: 500 }));
      w.events.push(body);
      return Promise.resolve(new Response('1'));
    }
    return Promise.resolve(new Response('{}', { status: 404 }));
  };
  const handler = makeHandler((n) => env[n], { fetch: fetchFn, logSink: (l) => lines.push(l), now: () => new Date('2026-11-21T21:14:00Z') });
  const go = async () => {
    const res = await handler(new Request('https://fn.local/new-device-email', { method: 'POST', headers: { Authorization: `Bearer ${SECRET}` } }));
    return { res, text: await res.text(), lines };
  };
  return { go, lines };
}
const link = (w: World) => (String(w.sent[0]?.text).match(/not-you#token=([A-Za-z0-9_-]+)/) ?? [])[1];

Deno.test('a new device: one email with the not-you link, token stored only as its SHA-256', async () => {
  const w = world();
  const { go } = run(w);
  const { res } = await go();
  assert.equal(res.status, 200);
  assert.equal(w.sent.length, 1);
  assert.deepEqual(w.sent[0].to, [ASHA.email]);
  assert.match(String(w.sent[0].text), /an iPhone or iPad/);
  const plain = link(w);
  const stored = String(w.calls.find((c) => c.fn === 'ops_new_device_token_mint')!.args.p_token_hash);
  const raw = Uint8Array.from(atob(plain.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (plain.length % 4)) % 4)), (c) => c.charCodeAt(0));
  assert.equal(raw.length, 32);
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', raw)), (b) => b.toString(16).padStart(2, '0')).join('');
  assert.equal(stored, `\\x${digest}`);
  assert.ok(!JSON.stringify(w.calls).includes(plain), 'the plain token never reaches the database');
});

Deno.test('(d) tokens are 32 random bytes, different every time', async () => {
  const a = await newToken();
  const b = await newToken();
  assert.equal(a.hash.length, 32);
  assert.notEqual(a.plain, b.plain);
  assert.equal(b64url(new Uint8Array(32)).length, 43);
  assert.equal(a.plain.length, 43);
});

Deno.test('(d)(e) the plain token, hash, address and ids are in no log line and no return value', async () => {
  const w = world();
  const { go } = run(w);
  const { text, lines } = await go();
  const plain = link(w);
  const mintHash = String(w.calls.find((c) => c.fn === 'ops_new_device_token_mint')!.args.p_token_hash).slice(2);
  const everything = text + lines.join('\n');
  for (const secret of [plain, mintHash, ASHA.email, ASHA.profile, ASHA.session, KEY, SECRET]) assert.ok(!everything.includes(secret));
  assert.deepEqual(findCanaries(everything, { emails: [] }), []);
  assert.ok(lines.length >= 2);
});

Deno.test('first and known devices send nothing and mint nothing', async () => {
  for (const verdict of ['first', 'known']) {
    const w = world({ verdict });
    await run(w).go();
    assert.equal(w.sent.length, 0);
    assert.ok(!w.calls.some((c) => c.fn === 'ops_new_device_token_mint'));
    assert.equal(w.events.length, 0);
  }
});

Deno.test('(c) the 21st token of a day: a null mint still sends the email, without the link', async () => {
  const w = world({ mintNull: true });
  await run(w).go();
  assert.equal(w.sent.length, 1);
  assert.ok(!/not-you|token=|\{notYouUrl\}/.test(String(w.sent[0].text)));
  assert.match(String(w.sent[0].text), /Sign out other devices/);
  assert.equal(w.events.length, 0, 'the database already counted the ceiling');
});

Deno.test('(c) a mint that fails also still sends, and is counted', async () => {
  const w = world({ mintThrows: true });
  await run(w).go();
  assert.equal(w.sent.length, 1);
  assert.equal(w.events.length, 1);
});

Deno.test('(a)(b) a crash between record and send is COUNTED in ops, not only logged', async () => {
  const w = world({ resend: [400] });
  const { go, lines } = run(w);
  const { res, text } = await go();
  assert.equal(w.sent.length, 0);
  assert.equal(w.events.length, 1);
  assert.deepEqual(w.events[0], { p_kind: 'new_device_hook_failed', p_n: 1, p_subject_hash: null, p_request_id: JSON.parse(text).requestId, p_detail: { sender: true, stage: 6 } });
  assert.equal(JSON.parse(text).data.failed, 1);
  assert.equal(res.status, 200);
  assert.ok(lines.some((l) => l.includes('device.failed')));
});

Deno.test('(a)(b) a failure before record (no address) is counted too, and a transient send error is retried once', async () => {
  const w = world({ resend: [503, 200] });
  await run(w).go();
  assert.equal(w.sent.length, 1, 'one retry, one email');
  assert.equal(w.events.length, 0);
  const w2 = world({ resend: [503, 503] });
  await run(w2).go();
  assert.equal(w2.sent.length, 0);
  assert.equal(w2.events.length, 1);
});

Deno.test('(b) when even the counter cannot be written the run answers 503 so the cron history shows it', async () => {
  const w = world({ resend: [400], eventsFail: true });
  const { res } = await run(w).go();
  assert.equal(res.status, 503);
});

Deno.test('rows are taken one at a time; a row with no app id is hashed with the key, so it is never "known" by accident', async () => {
  const w = world({ pending: [0, 1].map((n) => ({ session_id: `2222222${n}-2222-4222-8222-222222222222`, profile_id: ASHA.profile, class: 'other', device_hash: '' })) });
  await run(w).go();
  const takes = w.calls.filter((c) => c.fn === 'ops_new_device_pending_take');
  assert.ok(takes.length >= 3 && takes.every((c) => c.args.p_limit === 1));
  const hashes = w.calls.filter((c) => c.fn === 'ops_new_device_record').map((c) => String(c.args.p_device_hash));
  assert.equal(hashes.length, 2);
  assert.notEqual(hashes[0], hashes[1]);
  assert.match(hashes[0], /^\\x[0-9a-f]{32}$/);
  assert.match(String(w.sent[0].text), /a new device/);
});

Deno.test('the device hash: 16 bytes, keyed, per profile; no key or a short key throws', async () => {
  const a = await hashDevice(KEY, ASHA.profile, 'id-1');
  assert.equal(a.length, 16);
  assert.notDeepEqual(a, await hashDevice(KEY, ASHA.profile, 'id-2'));
  assert.notDeepEqual(a, await hashDevice(KEY, '33333333-3333-4333-8333-333333333333', 'id-1'));
  assert.notDeepEqual(a, await hashDevice(KEY + 'x', ASHA.profile, 'id-1'));
  for (const bad of ['', 'short']) await assert.rejects(hashDevice(bad, ASHA.profile, 'id-1'));
});

Deno.test('dark by default, bearer required, missing key sends nothing', async () => {
  const w = world();
  const dark = await run(w, { ...ENV, NEW_DEVICE_EMAIL: '' }).go();
  assert.equal(dark.res.status, 200);
  assert.equal(w.calls.length, 0, 'dark takes no rows');
  const noKey = await run(w, { ...ENV, DEVICE_HASH_KEY: '' }).go();
  assert.equal(noKey.res.status, 503);
  assert.equal(w.calls.length, 0);
  const h = makeHandler((n) => ENV[n], { fetch: () => Promise.reject(new Error('no')), logSink: () => {} });
  assert.equal((await h(new Request('https://fn.local/x', { method: 'POST', headers: { Authorization: 'Bearer wrong' } }))).status, 401);
  assert.equal((await h(new Request('https://fn.local/x', { method: 'GET' }))).status, 405);
});

Deno.test('the words come from packages/content: no link paragraph without a url, no held E78 line', () => {
  const withUrl = composeEmail({ deviceClass: 'apple', at: new Date('2026-11-21T21:14:00Z'), url: 'https://example.test/not-you#token=abc' });
  assert.match(withUrl.text, /Saturday, November 21, 2026 at 9:14 pm UTC/);
  assert.match(withUrl.text, /Opening it changes nothing by itself/);
  assert.ok(!/signed out\. Nothing is signed out/.test(withUrl.text));
  assert.ok(!/em dash|—|–/.test(withUrl.text));
});

const NEXT = 'device-hash-next-fixture-0123456789abcdef';
const go2 = (w: World, env: Record<string, string>, auth: string | null = `Bearer ${SECRET}`) => {
  const h = makeHandler((n) => env[n], { fetch: () => Promise.reject(new Error('no')), logSink: () => {} });
  void w;
  return h(new Request('https://fn.local/x', { method: 'POST', headers: auth === null ? {} : { Authorization: auth } }));
};

Deno.test('(a) a short key (current or next) answers misconfigured BEFORE any row is taken', async () => {
  for (const env of [{ ...ENV, DEVICE_HASH_KEY: 'short-key' }, { ...ENV, DEVICE_HASH_KEY_NEXT: 'short-next' }]) {
    const w = world();
    const { res } = await run(w, env).go();
    assert.equal(res.status, 503);
    assert.equal(w.calls.length, 0, 'no take, so no row is lost');
    assert.equal(w.pending.length, 1);
  }
});

Deno.test('(c) no secret always answers 401, whatever the config; the config answer needs the secret', async () => {
  const broken = { ...ENV, DEVICE_HASH_KEY: '', RESEND_API_KEY: '' };
  for (const auth of [null, 'Bearer wrong', 'Bearer ']) assert.equal((await go2(world(), broken, auth)).status, 401);
  assert.equal((await go2(world(), { ...ENV, NEW_DEVICE_SENDER_SECRET: '' }, 'Bearer ')).status, 401);
  assert.equal((await go2(world(), broken)).status, 503);
});

Deno.test('(b) with a next key: rekey(old, new) runs BEFORE record, and record uses the new-key hash', async () => {
  const w = world();
  await run(w, { ...ENV, DEVICE_HASH_KEY_NEXT: NEXT }).go();
  const names = w.calls.map((c) => c.fn);
  assert.ok(names.indexOf('ops_new_device_rekey') > 0 && names.indexOf('ops_new_device_rekey') < names.indexOf('ops_new_device_record'));
  const rk = w.calls.find((c) => c.fn === 'ops_new_device_rekey')!.args;
  const rec = w.calls.find((c) => c.fn === 'ops_new_device_record')!.args;
  const hexOf = (k: string) => hashDevice(k, ASHA.profile, `session:${ASHA.session}`).then((b) => `\\x${Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')}`);
  assert.equal(rk.p_old_hash, await hexOf(KEY));
  assert.equal(rk.p_new_hash, await hexOf(NEXT));
  assert.equal(rec.p_device_hash, rk.p_new_hash);
  assert.notEqual(rk.p_old_hash, rk.p_new_hash);
  assert.ok(!names.some((n) => /delete|forget|purge/.test(n)), 'no delete path');
});

Deno.test('(b) without a next key there is no rekey call and record uses the current-key hash', async () => {
  const w = world();
  await run(w).go();
  assert.ok(!w.calls.some((c) => c.fn === 'ops_new_device_rekey'));
  assert.equal(w.calls.find((c) => c.fn === 'ops_new_device_record')!.args.p_device_hash, `\\x${Array.from(await hashDevice(KEY, ASHA.profile, `session:${ASHA.session}`), (x) => x.toString(16).padStart(2, '0')).join('')}`);
});

Deno.test('(b) a rekey that fails is counted and nothing is recorded or sent', async () => {
  const w = world({ rekey: '' });
  const failing = (n: string) => ({ ...ENV, DEVICE_HASH_KEY_NEXT: NEXT })[n];
  const calls: string[] = [];
  const h = makeHandler(failing, {
    fetch: (url: string, init?: RequestInit) => {
      const fn = String(url).split('/rpc/')[1];
      if (fn) calls.push(fn);
      if (String(url).includes('/auth/v1/')) return Promise.resolve(new Response(JSON.stringify({ id: ASHA.profile, email: ASHA.email })));
      if (fn === 'ops_new_device_pending_take') return Promise.resolve(new Response(JSON.stringify(w.pending.splice(0, 1))));
      if (fn === 'ops_new_device_rekey') return Promise.resolve(new Response('{}', { status: 500 }));
      void init;
      return Promise.resolve(new Response('1'));
    },
    logSink: () => {},
  });
  await h(new Request('https://fn.local/x', { method: 'POST', headers: { Authorization: `Bearer ${SECRET}` } }));
  assert.ok(!calls.includes('ops_new_device_record'));
  assert.ok(calls.includes('ops_security_event_write'));
});

// Mutants: the order of the three guards is a property of the source. Moving the config gate after the take, the bearer
// check after the config gate, or record before rekey fails here even if a behaviour test were weakened.
Deno.test('mutants: bearer check, then config gate, then take; rekey before record', async () => {
  const src = await Deno.readTextFile(new URL('../handler.ts', import.meta.url));
  const at = (needle: string) => { const i = src.indexOf(needle); assert.ok(i > 0, needle); return i; };
  assert.ok(at('safeEqual(auth') < at('const badKey'));
  assert.ok(at('const badKey') < at("'ops_new_device_pending_take'"));
  assert.ok(at('MIN_KEY_CHARS') < at("'ops_new_device_pending_take'"));
  assert.ok(at("'ops_new_device_rekey'") < at("'ops_new_device_record'"));
});
