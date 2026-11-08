// Free plan operations for scribe-prod: the daily keep-alive read and the weekly usage check.
// fetch and psql are stubbed, as in smoke.test.ts. Run: npx -y deno@2.9.6 test --no-prompt --allow-read --sloppy-imports scripts/ops
import assert from 'node:assert/strict';
import { judge, KEEPALIVE_PATH, runKeepalive, type KeepaliveDeps } from '../lib/keepalive.ts';
import { LIMITS, METRIC_SQL, METRICS, readingOf, refOfDbTarget, reportLines, runFreeLimits, type FreeLimitsDeps } from '../lib/free-limits.ts';
import type { SqlOutcome } from '../lib/smoke.ts';
import { dbTargetOf } from '../lib/target.ts';

const REF = 'abcdefghijklmnopqrst';
const URL_OK = `https://${REF}.supabase.co`;
const PUB = 'sb_publishable_fixtureKeyAsha1234';
const jwt = (role: string) => `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ role })).replace(/=+$/, '')}.c2ln`;

function server(answers: Array<{ status: number; body?: string } | 'network'>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const sleeps: number[] = [];
  let i = 0;
  const deps: KeepaliveDeps = {
    fetch: (url, init) => {
      calls.push({ url, init });
      const a = answers[Math.min(i++, answers.length - 1)];
      if (a === 'network') return Promise.reject(new Error(`boom ${PUB}`));
      return Promise.resolve(new Response(a.body ?? '', { status: a.status }));
    },
    sleep: (ms) => {
      sleeps.push(ms);
      return Promise.resolve();
    },
  };
  return { deps, calls, sleeps };
}

async function keep(args: string[], vars: Record<string, string>, deps: KeepaliveDeps) {
  const out: string[] = [];
  const code = await runKeepalive(args, (k) => vars[k] ?? '', deps, { print: (l) => out.push(l) });
  return { code, out: out.join('\n') };
}
const VARS = { SUPABASE_URL: URL_OK, SUPABASE_PUBLISHABLE_KEY: PUB };

Deno.test('[free-tier] keep-alive: one anonymous Data API read, 200 with a row passes, prints no URL, key or body', async () => {
  const s = server([{ status: 200, body: '[{"document":"terms"}]' }]);
  const r = await keep(['--project-ref', REF], VARS, s.deps);
  assert.equal(r.code, 0);
  assert.equal(s.calls.length, 1);
  assert.equal(s.calls[0].url, `${URL_OK}${KEEPALIVE_PATH}`);
  const headers = s.calls[0].init.headers as Record<string, string>;
  assert.equal(headers.apikey, PUB);
  assert.equal(headers.authorization ?? headers.Authorization, undefined, 'no Authorization header: the read stays anonymous');
  assert.equal(s.calls[0].init.redirect, 'manual');
  assert.match(r.out, /attempt 1: HTTP 200, 1 row/);
  assert.match(r.out, /PASS/);
  for (const secretish of [PUB, REF, 'terms']) assert.ok(!r.out.includes(secretish), `never prints ${secretish}`);
});

Deno.test('[free-tier] keep-alive: a paused or failing project fails after the retries, and a later success passes', async () => {
  const down = server([{ status: 540 }, 'network', { status: 503 }]);
  const r = await keep(['--project-ref', REF, '--attempts', '3', '--wait-ms', '5'], VARS, down.deps);
  assert.equal(r.code, 1);
  assert.equal(down.calls.length, 3);
  assert.deepEqual(down.sleeps, [5, 5]);
  assert.match(r.out, /HTTP 540: unexpected answer/);
  assert.match(r.out, /no answer \(network\)/);
  assert.match(r.out, /FAIL: production did not answer/);
  assert.ok(!r.out.includes('boom'), 'never an error message');

  const flaky = server([{ status: 502 }, { status: 200, body: '[{"document":"terms"}]' }]);
  assert.equal((await keep(['--project-ref', REF, '--wait-ms', '0'], VARS, flaky.deps)).code, 0);
});

Deno.test('[free-tier] keep-alive: 200 with no rows, refused keys and 404 are failures with a reason', () => {
  assert.equal(judge({ status: 200, rows: 0 }).pass, false);
  assert.match(judge({ status: 200, rows: 0 }).line, /no policy version is published/);
  assert.match(judge({ status: 200, rows: null }).line, /not a list/);
  assert.match(judge({ status: 401, rows: null }).line, /publishable key was refused/);
  assert.match(judge({ status: 404, rows: null }).line, /policy_versions not found/);
  assert.match(judge({ status: 0, rows: null, error: 'timeout' }).line, /paused/);
});

Deno.test('[free-tier] keep-alive: refuses secret and service-role keys, a mismatched ref and a non-Supabase URL, before any call', async () => {
  for (const [vars, args, why] of [
    [{ ...VARS, SUPABASE_PUBLISHABLE_KEY: 'sb_secret_abcdefghijklmnop' }, ['--project-ref', REF], /secret and service-role keys are refused/],
    [{ ...VARS, SUPABASE_PUBLISHABLE_KEY: jwt('service_role') }, ['--project-ref', REF], /secret and service-role keys are refused/],
    [VARS, ['--project-ref', 'zzzzzzzzzzzzzzzzzzzz'], /does not match/],
    [VARS, [], /--project-ref <ref> is required/],
    [{ ...VARS, SUPABASE_URL: 'https://example.org' }, ['--project-ref', REF], /must be https:\/\/<project-ref>\.supabase\.co/],
    [VARS, ['--project-ref', REF, '--attempts', '9'], /--attempts must be 1 to 5/],
  ] as const) {
    const s = server([{ status: 200, body: '[{}]' }]);
    const r = await keep([...args], vars, s.deps);
    assert.equal(r.code, 2);
    assert.match(r.out, why);
    assert.equal(s.calls.length, 0, 'nothing is sent');
  }
  const legacy = server([{ status: 200, body: '[{}]' }]);
  assert.equal((await keep(['--project-ref', REF], { ...VARS, SUPABASE_PUBLISHABLE_KEY: jwt('anon') }, legacy.deps)).code, 0, 'the legacy anon key is accepted');
});

// ---- weekly usage check ----

const PW = 'pw-limits-fixture-3b9e';
const POOLED = `postgresql://scribe_backup.${REF}:${PW}@aws-0-us-west-1.pooler.supabase.com:5432/postgres?sslmode=require`;
const num = (n: number): SqlOutcome => ({ ok: true, text: String(n) });

function db(answers: Partial<Record<string, SqlOutcome>>) {
  const asked: string[] = [];
  const summaries: string[] = [];
  const deps: FreeLimitsDeps = {
    sql: () => (sql) => {
      asked.push(sql);
      const m = METRICS.find((k) => METRIC_SQL[k] === sql);
      return Promise.resolve(m && answers[m] ? answers[m]! : { ok: false, kind: 'sql', sqlstate: '42501' });
    },
    appendSummary: (_p, t) => summaries.push(t),
  };
  return { deps, asked, summaries };
}
async function limits(args: string[], vars: Record<string, string>, deps: FreeLimitsDeps) {
  const out: string[] = [];
  const code = await runFreeLimits(args, (k) => vars[k] ?? '', deps, { print: (l) => out.push(l) });
  return { code, out: out.join('\n') };
}
const LVARS = { LIMITS_DB_URL: POOLED };

Deno.test('[free-tier] limits: under 80% everywhere is OK, numbers only, egress says NOT CHECKED', async () => {
  const w = db({ database: num(120_000_000), storage: num(0), mau: num(240) });
  const r = await limits(['--project-ref', REF, '--summary', 'sum.md'], LVARS, w.deps);
  assert.equal(r.code, 0);
  assert.deepEqual(w.asked, METRICS.map((m) => METRIC_SQL[m]));
  assert.match(r.out, /OK {7}database size \(limit 500 MB\): 120\.0 MB, 24%/);
  assert.match(r.out, /file storage \(limit 1 GB\): 0\.0 MB, 0%/);
  assert.match(r.out, /accounts signed in, last 30 days \(limit 50,000 MAU\): 240, 0\.5%/);
  assert.match(r.out, /NOT CHECKED {2}egress/);
  assert.match(r.out, /\nOK: every number is under the alert line$/);
  assert.equal(w.summaries.length, 1);
  assert.ok(!r.out.includes(PW) && !r.out.includes('pooler'), 'never the URL or password');
});

Deno.test('[free-tier] limits: 80% of any limit alerts (exit 1), and the threshold can be lowered', async () => {
  const atLine = await limits(['--project-ref', REF], LVARS, db({ database: num(400_000_000), storage: num(10), mau: num(1) }).deps);
  assert.equal(atLine.code, 1);
  assert.match(atLine.out, /ALERT {4}database size/);
  assert.match(atLine.out, /ALERT: database at or above 80%/);

  const storage = await limits(['--project-ref', REF, '--alert-percent', '50'], LVARS, db({ database: num(1), storage: num(600_000_000), mau: num(1) }).deps);
  assert.equal(storage.code, 1);
  assert.match(storage.out, /ALERT: storage at or above 50%/);
});

Deno.test('[free-tier] limits: an unreadable number or no connection is exit 2, never silently OK', async () => {
  const denied = await limits(['--project-ref', REF], LVARS, db({ database: num(1), mau: num(1) }).deps);
  assert.equal(denied.code, 2);
  assert.match(denied.out, /UNREAD {3}file storage \(limit 1 GB\): could not be read \(SQLSTATE 42501\)/);

  const gone: FreeLimitsDeps = { sql: () => () => Promise.resolve({ ok: false, kind: 'connect' }) };
  const r = await limits(['--project-ref', REF], LVARS, gone);
  assert.equal(r.code, 2);
  assert.match(r.out, /Could not connect/);
});

Deno.test('[free-tier] limits: refuses a URL for another project, a missing ref, plain text and a bad threshold', async () => {
  for (const [vars, args, why] of [
    [LVARS, ['--project-ref', 'zzzzzzzzzzzzzzzzzzzz'], /does not match the project/],
    [LVARS, [], /--project-ref <ref> is required/],
    [{ LIMITS_DB_URL: POOLED.replace('sslmode=require', 'sslmode=disable') }, ['--project-ref', REF], /must use TLS/],
    [{}, ['--project-ref', REF], /LIMITS_DB_URL is not set/],
    [LVARS, ['--project-ref', REF, '--alert-percent', '0'], /--alert-percent must be/],
  ] as const) {
    const w = db({ database: num(1), storage: num(1), mau: num(1) });
    const r = await limits([...args], vars, w.deps);
    assert.equal(r.code, 2);
    assert.match(r.out, why);
    assert.equal(w.asked.length, 0, 'nothing is queried');
  }
});

Deno.test('[free-tier] limits: the project ref is read from the backup role pooler user, and the limits are the 8 Nov Free plan numbers', () => {
  const t = dbTargetOf(POOLED).target!;
  assert.equal(refOfDbTarget(t), REF);
  assert.equal(refOfDbTarget(dbTargetOf(`postgresql://u:p@db.${REF}.supabase.co:5432/postgres`).target!), REF);
  assert.equal(refOfDbTarget(dbTargetOf('postgresql://u.x:p@example.org:5432/postgres').target!), null);
  assert.deepEqual([LIMITS.database.limit, LIMITS.storage.limit, LIMITS.mau.limit], [500_000_000, 1_000_000_000, 50_000]);
  assert.deepEqual(readingOf('mau', { ok: true, text: 'abc' }), { metric: 'mau', value: null, sqlstate: undefined });
  assert.equal(reportLines([{ metric: 'database', value: 499_999_999, percent: 100 }], 80).over[0], 'database');
});
