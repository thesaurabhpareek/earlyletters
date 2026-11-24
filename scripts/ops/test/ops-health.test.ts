// BL-584 (CR-209): the ops-health Edge Function. Run: npm run test:functions
// (the test sits here because scripts/ops is a test:functions root and supabase/functions/ops-health is not listed in it).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeOpsHealthHandler, CRON_WINDOW_MINUTES } from '../../../supabase/functions/ops-health/handler.ts';

const SUPA = 'https://fake-project.supabase.co';
const TOKEN = 'watch-token-0123456789abcdef0123456789abcdef';
const SERVICE_KEY = 'sb_secret_ashafictional0000';
const ENV: Record<string, string> = { OPS_HEALTH_TOKEN: TOKEN, SUPABASE_URL: SUPA, SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY };
const get = (token: string | null = TOKEN, method = 'GET') =>
  new Request('https://fn.local/ops-health', { method, headers: token === null ? {} : { authorization: `Bearer ${token}` } });

function world(opts: { sla?: unknown; cron?: unknown; slaStatus?: number; cronStatus?: number; down?: boolean; env?: Record<string, string> } = {}) {
  const calls: { url: string; init: RequestInit }[] = [];
  const lines: string[] = [];
  const fetch = async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    if (opts.down) throw new Error(`connect to ${SUPA} with ${SERVICE_KEY}`);
    if (url === `${SUPA}/rest/v1/rpc/ops_deletion_sla`) {
      return new Response(JSON.stringify(opts.sla ?? { purge_run_age_minutes: 14, tombstones_overdue: 3, steps_failed: 1 }), { status: opts.slaStatus ?? 200 });
    }
    if (url === `${SUPA}/rest/v1/rpc/ops_cron_health`) {
      return new Response(JSON.stringify(opts.cron ?? { failed_runs: 0, failed_jobs: [], window_minutes: 120 }), { status: opts.cronStatus ?? 200 });
    }
    throw new Error('unexpected url');
  };
  const handler = makeOpsHealthHandler((n) => (opts.env ?? ENV)[n], { fetch, logSink: (l) => lines.push(l) });
  return { handler, calls, lines };
}

Deno.test('[BL-584] no token, a wrong token, a wrong-length token and a short configured token all get 401 and touch nothing', async () => {
  for (const [token, env] of [[null, ENV], ['wrong', ENV], [TOKEN.replace(/.$/, 'x'), ENV], [TOKEN + 'x', ENV], ['short', { ...ENV, OPS_HEALTH_TOKEN: 'short' }], ['', { ...ENV, OPS_HEALTH_TOKEN: '' }]] as const) {
    const w = world({ env: { ...env } });
    const res = await w.handler(get(token));
    assert.equal(res.status, 401, String(token));
    assert.equal((await res.json()).error.code, 'unauthorized');
    assert.equal(w.calls.length, 0, 'no database call before the token is proved');
  }
});

Deno.test('[BL-584] the token is checked before configuration: a caller without it learns nothing about missing settings', async () => {
  const w = world({ env: { OPS_HEALTH_TOKEN: TOKEN } });
  assert.equal((await w.handler(get('nope'))).status, 401);
  const ok = await w.handler(get());
  assert.equal(ok.status, 503);
  assert.equal(w.calls.length, 0);
});

Deno.test('[BL-584] only GET is answered', async () => {
  for (const m of ['POST', 'PUT', 'DELETE']) {
    const w = world();
    const res = await w.handler(new Request('https://fn.local/ops-health', { method: m, headers: { authorization: `Bearer ${TOKEN}` }, body: m === 'DELETE' ? undefined : '{}' }));
    assert.equal(res.status, 405);
    assert.equal(w.calls.length, 0);
  }
});

Deno.test('[BL-584] the right token returns exactly two numbers and nothing the reads also held', async () => {
  const w = world({ cron: { failed_runs: 2, failed_jobs: ['scribe-purge-worker'], window_minutes: 120 } });
  const res = await w.handler(get());
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.match(res.headers.get('x-request-id') ?? '', /^[0-9a-f]{12}$/);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.deepEqual(body.data, { purge_run_age_minutes: 14, failed_cron_runs: 2 });
  const text = JSON.stringify(body);
  assert.ok(!text.includes('scribe-purge-worker') && !text.includes('tombstones') && !text.includes(SUPA));
});

Deno.test('[BL-584] the reads go to the two named functions with the service key, and the watch token never leaves the function', async () => {
  const w = world();
  await w.handler(get());
  assert.deepEqual(w.calls.map((c) => c.url), [`${SUPA}/rest/v1/rpc/ops_deletion_sla`, `${SUPA}/rest/v1/rpc/ops_cron_health`]);
  assert.deepEqual(JSON.parse(String(w.calls[1].init.body)), { p_window_minutes: CRON_WINDOW_MINUTES });
  for (const c of w.calls) {
    const h = JSON.stringify(c.init.headers);
    assert.ok(h.includes(SERVICE_KEY) && !h.includes(TOKEN));
  }
});

Deno.test('[BL-584] no purge_run row yet is null, which the watch treats as a failure', async () => {
  const res = await world({ sla: { purge_run_age_minutes: null } }).handler(get());
  assert.equal(res.status, 200);
  assert.equal((await res.json()).data.purge_run_age_minutes, null);
});

Deno.test('[BL-584] not knowing is 503 with no detail: refused read, missing function, wrong shape, unreachable project', async () => {
  const cases = [
    world({ slaStatus: 401 }), world({ cronStatus: 404 }), world({ sla: { purge_run_age_minutes: 'soon' } }), world({ sla: [] }),
    world({ cron: { failed_runs: 'none' } }), world({ cron: { failed_runs: -1 } }), world({ cron: { failed_runs: 1.5 } }), world({ down: true }),
  ];
  for (const w of cases) {
    const res = await w.handler(get());
    assert.equal(res.status, 503);
    const body = await res.json();
    const text = JSON.stringify(body);
    assert.deepEqual(body, { ok: false, error: { code: 'unavailable', retryable: true }, requestId: res.headers.get('x-request-id') });
    for (const secret of [SERVICE_KEY, TOKEN, SUPA, 'fake-project']) assert.ok(!text.includes(secret), `reply leaks ${secret}`);
  }
});

Deno.test('[BL-584] a missing Supabase setting (config) is the same full 503 envelope, with no setting named', async () => {
  const res = await world({ env: { OPS_HEALTH_TOKEN: TOKEN } }).handler(get());
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { ok: false, error: { code: 'unavailable', retryable: true }, requestId: res.headers.get('x-request-id') });
});

Deno.test('[BL-584] source pin: the token is compared with safeEqual and never with === or !==', () => {
  const src = readFileSync(new URL('../../../supabase/functions/ops-health/handler.ts', import.meta.url), 'utf8')
    .split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
  assert.match(src, /import \{[^}]*\bsafeEqual\b[^}]*\} from '\.\.\/purge-worker\/lib\/http\.ts'/);
  assert.match(src, /!safeEqual\([\s\S]*?,\s*token\)/);
  assert.ok(!/[!=]==\s*token\b|\btoken\s*[!=]==/.test(src), 'a plain compare of the token');
  assert.ok(!/[!=]==\s*auth\b|\bauth\s*[!=]==/.test(src), 'a plain compare of the header');
});

Deno.test('[BL-584] the log carries no token, key, URL or number from the reads beyond a count', async () => {
  const good = world();
  await good.handler(get());
  await good.handler(get('wrong'));
  const bad = world({ down: true });
  await bad.handler(get());
  const text = [...good.lines, ...bad.lines].join('\n');
  assert.ok(text.includes('"fn":"ops-health"'));
  for (const secret of [SERVICE_KEY, TOKEN, SUPA, 'fake-project', 'Bearer', 'scribe-']) assert.ok(!text.includes(secret), `log leaks ${secret}`);
});
