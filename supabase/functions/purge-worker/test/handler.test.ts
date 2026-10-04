// HTTP layer of the purge worker: method, trigger secret, body, envelope and request id.
import assert from 'node:assert/strict';
import { REQUEST_ID_RE } from '../../../../packages/api/src/envelope.ts';
import { findCanaries } from '../../_shared/log/canary.ts';
import { makeHandler } from '../handler.ts';
import { createServiceClient } from '../lib/service.ts';
import { FakeWorld, SUPA } from './fake.ts';

const SECRET = 'trigger-secret-fixture-0123456789';
const ENV: Record<string, string> = { SUPABASE_URL: SUPA, SUPABASE_SERVICE_ROLE_KEY: 'service-key', PURGE_WORKER_SECRET: SECRET, RESEND_API_KEY: 're_x' };

function setup(env = ENV) {
  const w = new FakeWorld();
  const lines: string[] = [];
  const background: Promise<unknown>[] = [];
  const handler = makeHandler((n) => env[n], {
    fetch: w.fetch,
    client: createServiceClient({ url: SUPA, serviceKey: 'service-key', fetch: w.fetch }),
    logSink: (l) => lines.push(l),
    now: () => w.now,
  });
  const bgHandler = makeHandler((n) => env[n], {
    fetch: w.fetch,
    client: createServiceClient({ url: SUPA, serviceKey: 'service-key', fetch: w.fetch }),
    logSink: (l) => lines.push(l),
    now: () => w.now,
    runInBackground: (p) => background.push(p),
  });
  return { w, lines, handler, bgHandler, background };
}

const post = (body?: string, secret = SECRET) =>
  new Request('https://fn.local/purge-worker', { method: 'POST', headers: { Authorization: `Bearer ${secret}` }, body });

Deno.test('only POST with the trigger secret starts a run', async () => {
  const { handler, w } = setup();
  const get = await handler(new Request('https://fn.local/purge-worker'));
  assert.equal(get.status, 405);
  const wrong = await handler(post(undefined, 'service-key'));
  assert.equal(wrong.status, 401);
  const body = await wrong.json();
  assert.deepEqual(body.error, { code: 'unauthorized', retryable: false });
  assert.match(wrong.headers.get('x-request-id')!, REQUEST_ID_RE);
  assert.equal(w.purgeCalls, 0);
});

Deno.test('missing secrets answer 500 and name nothing', async () => {
  const { handler, lines } = setup({ SUPABASE_URL: SUPA });
  const res = await handler(post());
  assert.equal(res.status, 500);
  assert.equal((await res.json()).error.code, 'internal');
  assert.deepEqual(findCanaries(lines.join('\n')), []);
  assert.ok(!lines.join('\n').includes('PURGE_WORKER_SECRET'));
});

Deno.test('a run answers 200 with counts in the envelope; bad bodies are refused', async () => {
  const { handler, w } = setup();
  const res = await handler(post('{"task":"run"}'));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.data.task, 'run');
  assert.equal(body.requestId, res.headers.get('x-request-id'));
  assert.equal(w.purgeCalls, 1);
  assert.equal((await handler(post('{"task":"everything"}'))).status, 400);
  assert.equal((await handler(post('not json'))).status, 400);
  assert.equal((await handler(post('x'.repeat(2000)))).status, 413);
});

Deno.test('in production the run continues in the background after a 202', async () => {
  const { bgHandler, background, w } = setup();
  const res = await bgHandler(post('{"task":"daily"}'));
  assert.equal(res.status, 202);
  assert.deepEqual((await res.json()).data, { accepted: true, task: 'daily' });
  await Promise.all(background);
  assert.equal(w.retentionCalls, 1);
});
