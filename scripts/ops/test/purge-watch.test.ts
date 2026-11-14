// BL-584 (DATA-03): the purge and retention watch. Run: npm run test:functions
import assert from 'node:assert/strict';
import { watchMain, type FetchFn } from '../lib/purge-watch.ts';

const URL_ = 'https://abcdefghijklmnopqrst.supabase.co';
const KEY = 'sb_secret_watch0fixture0only';
const ENV = { SUPABASE_URL: URL_, SUPABASE_SERVICE_ROLE_KEY: KEY };
const ok = (v: unknown) => new Response(JSON.stringify(v), { status: 200 });

function stub(sla: unknown, cron: unknown, calls: string[] = []): FetchFn {
  return async (url, init) => {
    calls.push(url);
    assert.equal((init.headers as Record<string, string>).authorization, `Bearer ${KEY}`);
    if (url.endsWith('/ops_deletion_sla')) return sla instanceof Response ? sla : ok(sla);
    if (url.endsWith('/ops_cron_health')) return cron instanceof Response ? cron : ok(cron);
    throw new Error('unexpected url');
  };
}
const healthy = { purge_run_age_minutes: 14 };
const quiet = { failed_runs: 0, failed_jobs: [] };

Deno.test('[BL-584] a stubbed stale last purge_run exits non-zero', async () => {
  const r = await watchMain([], ENV, stub({ purge_run_age_minutes: 121 }, quiet));
  assert.equal(r.code, 1);
  assert.match(r.lines.join('\n'), /FAIL purge_run recent: newest purge_run is 121 minutes old \(limit 120\)/);
});

Deno.test('[BL-584] exactly 120 minutes is still inside the limit; a healthy run exits 0', async () => {
  assert.equal((await watchMain([], ENV, stub({ purge_run_age_minutes: 120 }, quiet))).code, 0);
  const r = await watchMain([], ENV, stub(healthy, quiet));
  assert.equal(r.code, 0);
  assert.equal(r.lines.at(-1), 'purge watch: ok');
});

Deno.test('[BL-584] no purge_run row at all fires', async () => {
  const r = await watchMain([], ENV, stub({ purge_run_age_minutes: null }, quiet));
  assert.equal(r.code, 1);
  assert.match(r.lines.join('\n'), /no purge_run audit row has ever been written/);
});

Deno.test('[BL-584] a failed scribe-* run in cron.job_run_details fires and names the job', async () => {
  const r = await watchMain([], ENV, stub(healthy, { failed_runs: 2, failed_jobs: ['scribe-purge-worker', 'scribe-purge-worker'] }));
  assert.equal(r.code, 1);
  assert.match(r.lines.join('\n'), /2 failed run\(s\) in the last 120 minutes: scribe-purge-worker/);
});

Deno.test('[BL-584] a job name that is not a scribe-* name is never printed', async () => {
  const r = await watchMain([], ENV, stub(healthy, { failed_runs: 1, failed_jobs: ['select * from entries', 'scribe-ok'] }));
  const text = r.lines.join('\n');
  assert.equal(r.code, 1);
  assert.ok(!text.includes('entries'));
  assert.match(text, /scribe-ok/);
});

Deno.test('[BL-584] not knowing is a failure: unreachable, refused, missing RPC, wrong shape', async () => {
  const down: FetchFn = async () => { throw new Error(`connect to ${URL_} with ${KEY}`); };
  const a = await watchMain([], ENV, down);
  assert.equal(a.code, 1);
  assert.ok(!a.lines.join('\n').includes(KEY) && !a.lines.join('\n').includes('abcdefghij'));
  assert.equal((await watchMain([], ENV, stub(new Response('{}', { status: 401 }), quiet))).code, 1);
  const missing = await watchMain([], ENV, stub(healthy, new Response('{}', { status: 404 })));
  assert.equal(missing.code, 1);
  assert.match(missing.lines.join('\n'), /not installed/);
  assert.equal((await watchMain([], ENV, stub({ purge_run_age_minutes: 'soon' }, quiet))).code, 1);
  assert.equal((await watchMain([], ENV, stub(healthy, { failed_runs: 'none', failed_jobs: [] }))).code, 1);
});

Deno.test('[BL-584] --purge-only never reports a full pass, and does not call the cron RPC', async () => {
  const calls: string[] = [];
  const r = await watchMain(['--purge-only'], ENV, stub(healthy, quiet, calls));
  assert.equal(r.code, 1);
  assert.equal(calls.length, 1);
});

Deno.test('[BL-584] usage errors exit 2 and print no secret', async () => {
  assert.equal((await watchMain([], { SUPABASE_URL: URL_ }, stub(healthy, quiet))).code, 2);
  assert.equal((await watchMain([], { ...ENV, SUPABASE_URL: 'http://abcdefghijklmnopqrst.supabase.co' }, stub(healthy, quiet))).code, 2);
  assert.equal((await watchMain(['--max-age-minutes', '0'], ENV, stub(healthy, quiet))).code, 2);
  assert.equal((await watchMain(['--nope'], ENV, stub(healthy, quiet))).code, 2);
  const custom = await watchMain(['--max-age-minutes', '30'], ENV, stub({ purge_run_age_minutes: 45 }, quiet));
  assert.equal(custom.code, 1);
});
