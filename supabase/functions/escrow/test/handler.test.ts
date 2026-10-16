// The escrow function's HTTP surface (handler.ts; ADR 0017): envelope, request ids, switches,
// configuration that fails closed, token checks, error mapping, the founder alert on limits, and a
// log canary over every path. Fictional family "Asha" only (CLAUDE.md).
import assert from 'node:assert/strict';
import { encodeBase64 } from '../bytes.ts';
import { generateKeyPair } from '../hpke.ts';
import { makeHandler } from '../handler.ts';
import { PgError } from '../pg.ts';
import { ASHA, FakeDb, FakeMailer, phone, tokenMinter } from './fakes.ts';

async function setup(over: Record<string, string | undefined> = {}) {
  const escrow = await generateKeyPair();
  const t = await tokenMinter();
  const db = new FakeDb();
  const mailer = new FakeMailer();
  const lines: string[] = [];
  const env: Record<string, string | undefined> = {
    ESCROW_SWITCH: 'on',
    MAIN_SUPABASE_URL: ASHA.mainUrl,
    ESCROW_DB_URL: 'postgresql://escrow_svc.ref:pw-fixture@pooler.example:5432/postgres',
    RESEND_API_KEY: 're_fixture',
    ESCROW_PRIVATE_KEY_V1: encodeBase64(escrow.sk),
    ESCROW_DB_CA: '-----BEGIN CERTIFICATE-----\nMIIfixture\n-----END CERTIFICATE-----\n',
    ...over,
  };
  const handler = makeHandler((n) => env[n], { fetch: t.fetchFn, openDb: async () => db, mailer: () => mailer, logSink: (l) => lines.push(l) });
  const call = async (body: unknown, opts: { token?: string; path?: string; method?: string; rid?: string } = {}) => {
    const r = await handler(new Request(`https://escrow.example${opts.path ?? '/escrow/v1/restore-requests'}`, {
      method: opts.method ?? 'POST',
      headers: { authorization: `Bearer ${opts.token ?? await t.mint()}`, ...(opts.rid ? { 'x-request-id': opts.rid } : {}) },
      body: opts.method === 'GET' ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    }));
    return { status: r.status, rid: r.headers.get('x-request-id'), json: await r.json() };
  };
  return { escrow, t, db, mailer, lines, env, call };
}

Deno.test('a restore call answers in the ADR 0017 envelope, under a request id the function made (never the caller\'s)', async () => {
  const s = await setup();
  const p = await phone(s.db, s.escrow.pk);
  const r = await s.call({ device_id: p.device }, { rid: 'abcdef012345' });
  assert.equal(r.status, 200);
  assert.match(r.rid!, /^[0-9a-f]{12}$/);
  assert.notEqual(r.rid, 'abcdef012345', 'a client-chosen id never reaches the log or the request row');
  assert.equal(r.json.requestId, r.rid);
  assert.notEqual(s.db.calls.find((c) => c.fn === 'openRequest')!.args[3], 'abcdef012345');
  assert.deepEqual(Object.keys(r.json).sort(), ['data', 'ok', 'requestId']);
  assert.deepEqual(Object.keys(r.json.data).sort(), ['hold_until', 'is_this_device', 'request_id', 'state']);
  assert.equal(r.json.data.state, 'requested');
  // Poll release until the hold passes, then the sealed keys.
  const rel = `/escrow/v1/restore-requests/${r.json.data.request_id}/release`;
  assert.equal((await s.call({ device_id: p.device }, { path: rel })).json.data.state, 'requested');
  s.db.requests[0].hold_until = Date.now() - 1000;
  const done = await s.call({ device_id: p.device }, { path: rel });
  assert.equal(done.json.data.state, 'released');
  assert.deepEqual(Object.keys(done.json.data.keys[0]).sort(), ['child_id', 'key_version', 'sealed']);
  assert.deepEqual(Object.keys(done.json.data.keys[0].sealed).sort(), ['ct', 'enc', 'suite']);
  assert.ok(s.db.calls.some((c) => c.fn === 'close'), 'the database connection is closed after each call');
});

Deno.test('[F08-REQ-041] the escrow project\'s own switch off: 503 paused (escrow), retryable, nothing opened', async () => {
  const s = await setup({ ESCROW_SWITCH: 'off' });
  const r = await s.call({ device_id: ASHA.newPhone });
  assert.equal(r.status, 503);
  assert.deepEqual(r.json.error, { code: 'paused', retryable: true, detail: 'escrow' });
  assert.equal(s.db.calls.length, 0);
});

Deno.test('missing or malformed configuration fails closed', async () => {
  for (const over of [{ ESCROW_PRIVATE_KEY_V1: undefined }, { ESCROW_PRIVATE_KEY_V1: 'c2hvcnQ=' }, { ESCROW_DB_URL: 'postgresql://postgres:pw@db.example:5432/postgres' },
    { MAIN_SUPABASE_URL: 'http://insecure.example' }, { RESEND_API_KEY: undefined }, { ESCROW_DB_CA: undefined }, { ESCROW_DB_CA: 'not a pem' }]) {
    const s = await setup(over);
    assert.equal((await s.call({ device_id: ASHA.newPhone })).status, 503, JSON.stringify(over));
  }
});

Deno.test('only POST, only known routes, small JSON bodies with exactly a device id', async () => {
  const s = await setup();
  assert.equal((await s.call(null, { method: 'GET' })).status, 405);
  assert.equal((await s.call({ device_id: ASHA.newPhone }, { path: '/escrow/v1/other' })).status, 404);
  assert.equal((await s.call({ device_id: ASHA.newPhone }, { path: '/escrow/v1/restore-requests/not-a-uuid/release' })).status, 404);
  for (const p of ['/escrow/v1/restore-requests/pending', `/escrow/v1/restore-requests/${ASHA.newPhone}/decision`, `/escrow/v1/restore-requests/${ASHA.newPhone}/cancel`]) {
    assert.equal((await s.call({ device_id: ASHA.newPhone }, { path: p })).status, 404, `${p}: approvals and cancels are main-project RPCs`);
  }
  assert.equal((await s.call({ deviceId: ASHA.newPhone })).status, 400, 'the body field is device_id');
  assert.equal((await s.call({ device_id: ASHA.newPhone }, { path: '/escrow/v1/rotate' })).status, 404, 'no rotate route unless a rotation is configured');
  assert.equal((await s.call('x'.repeat(2000))).status, 413);
  assert.equal((await s.call('{not json')).status, 400);
  assert.equal((await s.call({ device_id: 'not-a-uuid' })).status, 400);
  assert.equal((await s.call({ device_id: ASHA.newPhone, extra: 1 })).status, 400);
});

Deno.test('a bad token is 401; a stale sign-in for a new request is 401 reauth_required', async () => {
  const s = await setup();
  const p = await phone(s.db, s.escrow.pk);
  assert.equal((await s.call({ device_id: p.device }, { token: 'x.y.z' })).json.error.code, 'unauthorized');
  const stale = await s.t.mint({ amr: [{ method: 'otp', timestamp: Math.floor(Date.now() / 1000) - 3600 }] });
  const r = await s.call({ device_id: p.device }, { token: stale });
  assert.equal(r.status, 401);
  assert.deepEqual(r.json.error, { code: 'reauth_required', retryable: false, detail: 'step_up_required' });
});

Deno.test('a token whose session the stop link ended is 401 unauthorized session_ended', async () => {
  const s = await setup();
  const p = await phone(s.db, s.escrow.pk);
  s.db.sessions.clear();
  const r = await s.call({ device_id: p.device });
  assert.equal(r.status, 401);
  assert.deepEqual(r.json.error, { code: 'unauthorized', retryable: false, sqlstate: '28000', detail: 'session_ended' });
  const noSession = await s.call({ device_id: p.device }, { token: await s.t.mint({ session_id: undefined }) });
  assert.deepEqual(noSession.json.error, { code: 'unauthorized', retryable: false, detail: 'session_ended' });
});

Deno.test('the decoded escrow private keys are zeroed when a call ends', async () => {
  const escrow = await generateKeyPair();
  const seen: Uint8Array[] = [];
  const env: Record<string, string> = {
    ESCROW_SWITCH: 'on', MAIN_SUPABASE_URL: ASHA.mainUrl, ESCROW_DB_URL: 'postgresql://escrow_svc.ref:pw-fixture@pooler.example:5432/postgres',
    RESEND_API_KEY: 're_fixture', ESCROW_PRIVATE_KEY_V1: encodeBase64(escrow.sk), ESCROW_DB_CA: '-----BEGIN CERTIFICATE-----\nx\n-----END CERTIFICATE-----',
  };
  const t = await tokenMinter();
  const handler = makeHandler((n) => env[n], { fetch: t.fetchFn, openDb: async (cfg) => { seen.push(...Object.values(cfg.keys)); return new FakeDb(); }, mailer: () => new FakeMailer(), logSink: () => {} });
  await handler(new Request('https://escrow.example/escrow/v1/restore-requests', { method: 'POST', headers: { authorization: `Bearer ${await t.mint()}` }, body: JSON.stringify({ device_id: ASHA.newPhone }) }));
  assert.equal(seen.length, 1);
  assert.ok(seen[0].every((b) => b === 0));
});

Deno.test('[F08-REQ-029] over a limit: 429 rate_limited, and the founder gets one content-free alert', async () => {
  const s = await setup();
  const p = await phone(s.db, s.escrow.pk);
  s.db.openRequest = () => Promise.reject(new PgError('SCRAT', 'too many', 'limit_restores'));
  const r = await s.call({ device_id: p.device });
  assert.equal(r.status, 429);
  assert.deepEqual(r.json.error, { code: 'rate_limited', retryable: false, sqlstate: 'SCRAT', detail: 'limit_restores' });
  const alert = s.mailer.sent.find((m) => m.subject.startsWith('Escrow alert'));
  assert.ok(alert);
  assert.equal(alert!.to, 'hello@earlyletters.com');
  assert.ok(!alert!.text.includes(ASHA.profile) && !alert!.text.includes(ASHA.email) && !alert!.text.includes(p.device));
});

Deno.test('database switch off (SCBKO) is 503 retryable; a pending deletion is 409; an unknown device is 404', async () => {
  const s = await setup();
  const p = await phone(s.db, s.escrow.pk);
  s.db.context = () => Promise.reject(new PgError('SCBKO', 'off', 'escrow'));
  assert.deepEqual((await s.call({ device_id: p.device })).json.error, { code: 'paused', retryable: true, sqlstate: 'SCBKO', detail: 'escrow' });
  const s2 = await setup();
  const unknown = await s2.call({ device_id: ASHA.newPhone });
  assert.equal(unknown.status, 404, 'a device this account never registered');
  assert.equal(unknown.json.error.detail, 'device_unknown');
  const s3 = await setup();
  const p3 = await phone(s3.db, s3.escrow.pk);
  s3.db.deleting = true;
  assert.equal((await s3.call({ device_id: p3.device })).status, 409);
});

Deno.test('rotation runs only with its task secret, and only while configured', async () => {
  const v2 = await generateKeyPair();
  const secret = 'task-secret-fixture-0123456789abcdef';
  const s = await setup({ ESCROW_TASK_SECRET: secret, ESCROW_ROTATE_FROM: '1', ESCROW_ROTATE_TO: '2', ESCROW_PRIVATE_KEY_V2: encodeBase64(v2.sk) });
  await phone(s.db, s.escrow.pk);
  assert.equal((await s.call({}, { path: '/escrow/v1/rotate', token: 'wrong' })).status, 401);
  const r = await s.call({}, { path: '/escrow/v1/rotate', token: secret });
  assert.equal(r.status, 200);
  assert.equal(r.json.data.rewrapped, 1);
  assert.equal(r.json.data.notices_pending, 0);
});

Deno.test('canary: no log line carries an id, an email, a token or a key, through success and failure', async () => {
  const s = await setup();
  const p = await phone(s.db, s.escrow.pk);
  const token = await s.t.mint();
  const created = await s.call({ device_id: p.device }, { token });
  s.db.requests[0].hold_until = Date.now() - 1000;
  await s.call({ device_id: p.device }, { token, path: `/escrow/v1/restore-requests/${created.json.data.request_id}/release` });
  await s.call({ device_id: p.device }, { token: 'x.y.z' });
  s.db.loadWraps = () => Promise.reject(new PgError('XX000', `boom ${ASHA.email} ${ASHA.profile}`));
  await s.call({ device_id: p.device }, { token, path: `/escrow/v1/restore-requests/${created.json.data.request_id}/release` });
  const logs = s.lines.join('\n');
  assert.ok(s.lines.length >= 8);
  for (const needle of [ASHA.profile, ASHA.email, p.device, ASHA.child, token.slice(0, 40), s.env.ESCROW_PRIVATE_KEY_V1!, s.db.requests[0].id, 'boom']) {
    assert.ok(!logs.includes(needle), `leaked ${needle.slice(0, 10)}`);
  }
  for (const l of s.lines) assert.equal(JSON.parse(l).fn, 'escrow');
});
