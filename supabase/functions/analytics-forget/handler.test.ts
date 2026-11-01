// analytics-forget: stateless PostHog person deletion (TDD 05 X-02 and 7.4).
// Run: npx -y deno@2.9.6 test --no-prompt --allow-read supabase/functions/analytics-forget
import assert from 'node:assert/strict';
import { REQUEST_ID_RE } from '../../../packages/api/src/envelope.ts';
import { CANARY, findCanaries } from '../_shared/log/canary.ts';
import { makeForgetHandler, MAX_IDS } from './handler.ts';

const SUPA = 'https://fake-project.supabase.co';
const ENV: Record<string, string> = {
  SUPABASE_URL: SUPA, SUPABASE_SERVICE_ROLE_KEY: 'service-key', POSTHOG_PERSONAL_API_KEY: 'phx_fixture', POSTHOG_PROJECT_ID: '12345',
};
const ROUTE = 'https://fn.local/analytics-forget/v1';
const ID2 = '9a9a9a9a-0000-4000-8000-0000000000bb';

function world(opts: { user?: unknown; userStatus?: number; quota?: boolean; phStatus?: number; env?: Record<string, string> } = {}) {
  const calls: { url: string; init: RequestInit }[] = [];
  const lines: string[] = [];
  let quotaCalls = 0;
  const fetch = async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    if (url === `${SUPA}/auth/v1/user`) {
      const status = opts.userStatus ?? 200;
      return new Response(JSON.stringify(opts.user ?? { id: CANARY.profileId, email: CANARY.parentEmail, is_anonymous: false }), { status });
    }
    if (url === `${SUPA}/rest/v1/rpc/ops_consume_forget_quota`) {
      quotaCalls++;
      return new Response(JSON.stringify(opts.quota ?? true), { status: 200 });
    }
    if (url === 'https://us.posthog.com/api/projects/12345/persons/bulk_delete/') {
      return new Response(null, { status: opts.phStatus ?? 202 });
    }
    return new Response(null, { status: 404 });
  };
  const handler = makeForgetHandler((n) => (opts.env ?? ENV)[n], { fetch, logSink: (l) => lines.push(l) });
  return { handler, calls, lines, quotaCalls: () => quotaCalls };
}

const req = (body: unknown, headers: Record<string, string> = { Authorization: `Bearer ${CANARY.sessionJwt}` }, url = ROUTE) =>
  new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });

Deno.test('deletes the persons for the ids sent, with their events, and answers 202', async () => {
  const w = world();
  const res = await w.handler(req({ ids: [CANARY.analyticsId, ID2.toUpperCase(), CANARY.analyticsId], reason: 'account_deletion' }));
  assert.equal(res.status, 202);
  const body = await res.json();
  assert.deepEqual(body.data, { accepted: 2 });
  assert.equal(body.requestId, res.headers.get('x-request-id'));
  assert.match(body.requestId, REQUEST_ID_RE);
  const ph = w.calls.find((c) => c.url.includes('posthog.com'))!;
  assert.deepEqual(JSON.parse(String(ph.init.body)), { distinct_ids: [CANARY.analyticsId, ID2], delete_events: true });
  assert.equal(new Headers(ph.init.headers).get('Authorization'), 'Bearer phx_fixture');
});

Deno.test('the ids are never logged and never sent to Supabase', async () => {
  const w = world();
  await w.handler(req({ ids: [CANARY.analyticsId], reason: 'device_after_deletion' }));
  assert.deepEqual(findCanaries(w.lines.join('\n')), []);
  const toSupabase = w.calls.filter((c) => c.url.startsWith(SUPA)).map((c) => c.url + String(c.init.body ?? ''));
  assert.ok(toSupabase.every((t) => !t.includes(CANARY.analyticsId)));
  const quota = w.calls.find((c) => c.url.endsWith('ops_consume_forget_quota'))!;
  assert.deepEqual(JSON.parse(String(quota.init.body)), { p_profile: CANARY.profileId, p_limit: 5 });
  const done = JSON.parse(w.lines.find((l) => l.includes('forget.accepted'))!);
  assert.deepEqual(done.counts, { ids: 1 });
  assert.equal(done.reason, 'device_after_deletion');
});

Deno.test('input is checked before anything is called', async () => {
  const w = world();
  const bad = [
    {}, { ids: [], reason: 'account_deletion' }, { ids: ['not-a-uuid'], reason: 'account_deletion' },
    { ids: [CANARY.analyticsId], reason: 'because' }, { ids: Array.from({ length: MAX_IDS + 1 }, () => CANARY.analyticsId), reason: 'account_deletion' },
  ];
  for (const b of bad) assert.equal((await w.handler(req(b))).status, 400, JSON.stringify(b).slice(0, 40));
  assert.equal((await w.handler(req('{'))).status, 400);
  assert.equal((await w.handler(req('x'.repeat(5000)))).status, 413);
  assert.equal((await w.handler(req({ ids: [CANARY.analyticsId], reason: 'account_deletion' }, { Authorization: `Bearer ${CANARY.sessionJwt}`, 'Idempotency-Key': 'nope' }))).status, 400);
  assert.equal((await w.handler(new Request(ROUTE))).status, 405);
  assert.equal((await w.handler(req({ ids: [CANARY.analyticsId], reason: 'account_deletion' }, undefined, 'https://fn.local/analytics-forget/v2'))).status, 404);
  assert.equal(w.calls.length, 0);
});

Deno.test('a valid idempotency key is accepted', async () => {
  const w = world();
  const res = await w.handler(req({ ids: [CANARY.analyticsId], reason: 'account_deletion' }, { Authorization: `Bearer ${CANARY.sessionJwt}`, 'Idempotency-Key': '0192e000-0000-7000-8000-000000000123' }));
  assert.equal(res.status, 202);
});

Deno.test('no session, a bad session or an anonymous session is refused', async () => {
  assert.equal((await world().handler(req({ ids: [CANARY.analyticsId], reason: 'account_deletion' }, {}))).status, 401);
  assert.equal((await world({ userStatus: 401 }).handler(req({ ids: [CANARY.analyticsId], reason: 'account_deletion' }))).status, 401);
  const anon = world({ user: { id: CANARY.profileId, is_anonymous: true } });
  assert.equal((await anon.handler(req({ ids: [CANARY.analyticsId], reason: 'account_deletion' }))).status, 403);
  assert.equal(anon.quotaCalls(), 0);
});

Deno.test('more than 5 calls a day is rate limited, and PostHog is not called', async () => {
  const w = world({ quota: false });
  const res = await w.handler(req({ ids: [CANARY.analyticsId], reason: 'account_deletion' }));
  assert.equal(res.status, 429);
  assert.equal(res.headers.get('Retry-After'), '3600');
  assert.deepEqual((await res.json()).error, { code: 'rate_limited', retryable: true });
  assert.ok(!w.calls.some((c) => c.url.includes('posthog')));
});

Deno.test('PostHog or config failures are retryable for the device', async () => {
  const down = world({ phStatus: 500 });
  const res = await down.handler(req({ ids: [CANARY.analyticsId], reason: 'account_deletion' }));
  assert.equal(res.status, 502);
  assert.deepEqual((await res.json()).error, { code: 'unavailable', retryable: true });
  assert.deepEqual(findCanaries(down.lines.join('\n')), []);
  const noConfig = world({ env: { SUPABASE_URL: SUPA, SUPABASE_SERVICE_ROLE_KEY: 'k' } });
  assert.equal((await noConfig.handler(req({ ids: [CANARY.analyticsId], reason: 'account_deletion' }))).status, 503);
});
