// analytics-ingest. Run: npx -y deno@2.9.6 test --no-prompt --allow-read --sloppy-imports supabase/functions/analytics-ingest
import assert from 'node:assert/strict';
import { makeIngestHandler, MAX_EVENTS } from './handler.ts';

const SUPA = 'https://fake-project.supabase.co';
const ENV: Record<string, string> = { SUPABASE_URL: SUPA, SUPABASE_SERVICE_ROLE_KEY: 'service-key' };
const ID = '9a9a9a9a-0000-4000-8000-0000000000aa';
const ROUTE = 'https://fn.local/analytics-ingest/v1';
const CANARIES = ['Asha', 'asha.parent@example.com', 'She laughed at the dog today'];

function world(rpc: () => Response = () => new Response('1', { status: 200 })) {
  const calls: { url: string; init: RequestInit }[] = [];
  const lines: string[] = [];
  const fetch = async (url: string, init: RequestInit = {}) => { calls.push({ url, init }); return rpc(); };
  return { handler: makeIngestHandler((n) => ENV[n], { fetch, log: (l) => lines.push(l) }), calls, lines };
}
const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request(ROUTE, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
const ok = { event: 'error_shown', props: { code: 'save_failed', schema_version: 1 }, ago_s: 5 };

Deno.test('stores a valid batch and answers 202', async () => {
  const w = world();
  const res = await w.handler(post({ id: ID, events: [ok] }));
  assert.equal(res.status, 202);
  const sent = JSON.parse(String(w.calls[0].init.body));
  assert.equal(sent.p_id, ID);
  assert.deepEqual(sent.p_events, [{ event: 'error_shown', props: { code: 'save_failed', schema_version: 1 }, ago_s: 5 }]);
});

Deno.test('drops events that fail the catalogue and refuses a batch with none', async () => {
  const w = world();
  const bad = [
    { event: 'letter_text', props: { text: CANARIES[2] } },
    { event: 'error_shown', props: { code: CANARIES[1], schema_version: 1 } },
  ];
  const res = await w.handler(post({ id: ID, events: bad }));
  assert.equal(res.status, 400);
  assert.equal(w.calls.length, 0);
  const stripped = { event: 'error_shown', props: { code: 'save_failed', schema_version: 1, note: CANARIES[2] } };
  const mixed = await w.handler(post({ id: ID, events: [...bad, stripped] }));
  assert.equal(mixed.status, 202);
  const sent = JSON.parse(String(w.calls[0].init.body));
  assert.equal(sent.p_events.length, 1);
  assert.deepEqual(sent.p_events[0].props, { code: 'save_failed', schema_version: 1 });
  assert.ok(!JSON.stringify(sent).includes(CANARIES[2]));
});

Deno.test('rejects a bad id, a bad shape, too many events and a big body', async () => {
  const w = world();
  assert.equal((await w.handler(post({ id: 'nope', events: [ok] }))).status, 400);
  assert.equal((await w.handler(post({ id: ID, events: [] }))).status, 400);
  assert.equal((await w.handler(post({ id: ID, events: Array(MAX_EVENTS + 1).fill(ok) }))).status, 400);
  assert.equal((await w.handler(post('{not json'))).status, 400);
  assert.equal((await w.handler(post({ id: ID, events: [ok], pad: 'x'.repeat(33 * 1024) }))).status, 413);
  assert.equal(w.calls.length, 0);
});

Deno.test('never reads the Authorization header and never forwards it', async () => {
  const w = world();
  await w.handler(post({ id: ID, events: [ok] }, { Authorization: 'Bearer user-session-token', 'X-Forwarded-For': '203.0.113.9' }));
  const h = new Headers(w.calls[0].init.headers);
  assert.equal(h.get('Authorization'), 'Bearer service-key');
  assert.ok(!JSON.stringify(w.calls).includes('user-session-token'));
  assert.ok(!JSON.stringify(w.calls).includes('203.0.113.9'));
});

Deno.test('the log line has counts and a status only', async () => {
  const w = world();
  await w.handler(post({ id: ID, events: [ok] }));
  const all = w.lines.join('\n');
  assert.ok(!all.includes(ID) && !all.includes('error_shown') && !all.includes('save_failed'));
});

Deno.test('daily cap becomes 429 and a store failure becomes 503', async () => {
  assert.equal((await world(() => new Response('-1')).handler(post({ id: ID, events: [ok] }))).status, 429);
  assert.equal((await world(() => new Response('x', { status: 500 })).handler(post({ id: ID, events: [ok] }))).status, 503);
});

Deno.test('GET is refused', async () => {
  assert.equal((await world().handler(new Request(ROUTE))).status, 405);
});
