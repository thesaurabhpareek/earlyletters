// BL-584 (DATA-03, CR-209): the purge and retention watch. Run: npm run test:functions
import assert from 'node:assert/strict';
import { watchMain, type FetchFn } from '../lib/purge-watch.ts';

const URL_ = 'https://abcdefghijklmnopqrst.supabase.co/functions/v1/ops-health';
const TOKEN = 'watch-token-0123456789abcdef0123456789abcdef';
const ENV = { OPS_HEALTH_URL: URL_, OPS_HEALTH_TOKEN: TOKEN };
const answer = (age: number | null, failed: number) =>
  new Response(JSON.stringify({ ok: true, data: { purge_run_age_minutes: age, failed_cron_runs: failed }, requestId: '0123456789ab' }), { status: 200 });

function stub(res: Response | (() => Response), calls: { url: string; init: RequestInit }[] = []): FetchFn {
  return async (url, init) => {
    calls.push({ url, init });
    return typeof res === 'function' ? res() : res.clone();
  };
}
const text = (r: { lines: string[] }) => r.lines.join('\n');

Deno.test('[BL-584] a stubbed stale last purge_run exits non-zero', async () => {
  const r = await watchMain([], ENV, stub(answer(121, 0)));
  assert.equal(r.code, 1);
  assert.match(text(r), /FAIL purge_run recent: newest purge_run is 121 minutes old \(limit 120\)/);
});

Deno.test('[BL-584] exactly 120 minutes is still inside the limit; a healthy run exits 0', async () => {
  assert.equal((await watchMain([], ENV, stub(answer(120, 0)))).code, 0);
  const r = await watchMain([], ENV, stub(answer(14, 0)));
  assert.equal(r.code, 0);
  assert.equal(r.lines.at(-1), 'purge watch: ok');
});

Deno.test('[BL-584] no purge_run row at all fires', async () => {
  const r = await watchMain([], ENV, stub(answer(null, 0)));
  assert.equal(r.code, 1);
  assert.match(text(r), /no purge_run audit row has ever been written/);
});

Deno.test('[BL-584] a failed scribe-* run counted by the function fires', async () => {
  const r = await watchMain([], ENV, stub(answer(14, 2)));
  assert.equal(r.code, 1);
  assert.match(text(r), /FAIL scribe-\* cron runs: 2 failed run\(s\) in the last 120 minutes/);
});

Deno.test('[BL-584] one GET with the bearer token, and nothing else is sent', async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  await watchMain([], ENV, stub(answer(14, 0), calls));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, URL_);
  assert.equal(calls[0].init.method, 'GET');
  assert.equal((calls[0].init.headers as Record<string, string>).authorization, `Bearer ${TOKEN}`);
  assert.equal(calls[0].init.body, undefined);
  assert.equal(calls[0].init.redirect, 'error', 'a redirect must never carry the bearer token to another place');
});

Deno.test('[BL-584] not knowing is a failure with a fixed reason: unreachable, refused, not deployed, unavailable, odd status, wrong shape', async () => {
  const down: FetchFn = async () => { throw new Error(`connect to ${URL_} with ${TOKEN}`); };
  const cases: [FetchFn, RegExp][] = [
    [down, /did not answer/],
    [stub(new Response('{}', { status: 401 })), /refused the token/],
    [stub(new Response('{}', { status: 404 })), /not deployed/],
    [stub(new Response('{}', { status: 503 })), /could not read the project/],
    [stub(new Response('{}', { status: 500 })), /unexpected status/],
    [stub(new Response('<html>', { status: 200 })), /not the expected shape/],
    [stub(new Response(JSON.stringify({ ok: false }), { status: 200 })), /not the expected shape/],
    [stub(new Response(JSON.stringify({ ok: true, data: { purge_run_age_minutes: 'soon', failed_cron_runs: 0 } }), { status: 200 })), /not the expected shape/],
    [stub(new Response(JSON.stringify({ ok: true, data: { purge_run_age_minutes: 5, failed_cron_runs: 'none' } }), { status: 200 })), /not the expected shape/],
    [stub(new Response(JSON.stringify({ ok: true, data: { purge_run_age_minutes: 5, failed_cron_runs: -1 } }), { status: 200 })), /not the expected shape/],
  ];
  for (const [f, re] of cases) {
    const r = await watchMain([], ENV, f);
    assert.equal(r.code, 1);
    assert.match(text(r), re);
    for (const secret of [TOKEN, 'abcdefghij', 'supabase.co', 'connect to']) assert.ok(!text(r).includes(secret), `output leaks ${secret}`);
  }
});

Deno.test('[BL-584] a body the function never sends is never printed', async () => {
  const r = await watchMain([], ENV, stub(new Response(JSON.stringify({ ok: true, data: { purge_run_age_minutes: 5, failed_cron_runs: 1, note: 'Asha entries' } }), { status: 200 })));
  assert.equal(r.code, 1);
  assert.ok(!text(r).includes('Asha'));
});

Deno.test('[BL-584] usage errors exit 2 and print no secret; the URL must be the function on a supabase.co project over https', async () => {
  const f = stub(answer(1, 0));
  for (const env of [{ OPS_HEALTH_URL: URL_ }, { OPS_HEALTH_TOKEN: TOKEN }, { ...ENV, OPS_HEALTH_URL: URL_.replace('https', 'http') },
    { ...ENV, OPS_HEALTH_URL: 'https://evil.example/functions/v1/ops-health' }, { ...ENV, OPS_HEALTH_URL: 'https://abcdefghijklmnopqrst.supabase.co/rest/v1/' },
    { ...ENV, OPS_HEALTH_URL: `${URL_}?x=1` }, { ...ENV, OPS_HEALTH_URL: 'https://a.supabase.co.evil.example/functions/v1/ops-health' }]) {
    const r = await watchMain([], env, f);
    assert.equal(r.code, 2, JSON.stringify(env));
    assert.ok(!text(r).includes(TOKEN));
  }
  assert.equal((await watchMain(['--max-age-minutes', '0'], ENV, f)).code, 2);
  assert.equal((await watchMain(['--purge-only'], ENV, f)).code, 2);
  assert.equal((await watchMain(['--max-age-minutes', '30'], ENV, stub(answer(45, 0)))).code, 1);
});
