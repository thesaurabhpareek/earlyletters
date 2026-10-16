// RA-07-06 staging smoke: checks, the planted failure from the QA re-review,
// content-free output, and the health route contract with the real functions.
// Run: npx -y deno@2.9.6 test --no-prompt --allow-read --sloppy-imports scripts/ops
import assert from 'node:assert/strict';
import { CANARY, findCanaries } from '../../../supabase/functions/_shared/log/canary.ts';
import { healthResponse, isHealthPath, isHealthRequest } from '../../../supabase/functions/_shared/health/health.ts';
import { makeForgetHandler } from '../../../supabase/functions/analytics-forget/handler.ts';
import { makeConfigHandler } from '../../../supabase/functions/config/handler.ts';
import { makeContentHandler } from '../../../supabase/functions/content/handler.ts';
import { makeHandler as makePurgeWorker } from '../../../supabase/functions/purge-worker/handler.ts';
import {
  CRON_JOBS, CRON_SQL, DEFAULT_FUNCTIONS, isAnonymousKey, loggingRisk, PROBE_SQL, smokeMain,
  type Probe, type SmokeDeps, type SqlOutcome,
} from '../lib/smoke.ts';
import { dbTargetOf } from '../lib/target.ts';

const REF = 'abcdefghijklmnopqrst';
const BASE = `https://${REF}.supabase.co`;
const KEY = 'sb_publishable_smoke0fixture0key0only';
const DB_PASSWORD = 'pw-fixture-0f9e8d';
const DB_URL = `postgresql://postgres.${REF}:${DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`;
const ARGS = ['--project-ref', REF];
const NOW = new Date('2026-10-22T09:00:00Z');

type FunctionState = 'ready' | 'not_ready' | 'stopped' | 'deleted' | 'gateway_jwt' | 'no_route' | ((req: Request) => Promise<Response>);

interface StandIn {
  policyVersions: Record<string, unknown>[];
  policyStatus: number;
  functions: Record<string, FunctionState>;
  flaky: Record<string, number>;
  authHealth: number;
  settings: unknown;
  probe: Probe | SqlOutcome;
  cron: unknown[] | SqlOutcome;
}

const PROBE_OK: Probe = { pepper_ready: true, cron_installed: true, log_statement: 'none', log_min_duration_statement: '-1', pgaudit_log: null, log_overrides: [] };

/** A staging project after AF-13: everything the smoke expects is there. */
function seeded(): StandIn {
  return {
    policyVersions: [
      { document: 'terms', version: '1.0.0', effective_at: '2026-10-20T00:00:00Z' },
      { document: 'sensitive-data', version: '1.0.0', effective_at: '2026-10-20T00:00:00Z' },
    ],
    policyStatus: 200,
    functions: { config: 'ready', content: 'ready', 'purge-worker': 'ready', 'apple-token': 'gateway_jwt' },
    flaky: {},
    authHealth: 200,
    settings: { external: { email: true, apple: true, google: false }, disable_signup: false, mailer_autoconfirm: false },
    probe: PROBE_OK,
    cron: CRON_JOBS.map((j) => ({ name: j.name, schedule: j.schedule, active: true })),
  };
}

/** The QA re-review's plant: a scratch project with no policy versions and a stopped function. */
function scratchProject(): StandIn {
  const s = seeded();
  s.policyVersions = [];
  s.functions['purge-worker'] = 'stopped';
  return s;
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function world(s: StandIn) {
  const requests: { url: string; headers: Headers }[] = [];
  const sql: string[] = [];
  let slept = 0;
  const fetch = async (url: string, init: RequestInit): Promise<Response> => {
    const headers = new Headers(init.headers);
    requests.push({ url, headers });
    assert.ok(url.startsWith(`${BASE}/`), 'the smoke only talks to the project it was given');
    const u = new URL(url);
    if (u.pathname === '/rest/v1/policy_versions') return s.policyStatus === 200 ? json(s.policyVersions) : json({ message: 'denied' }, s.policyStatus);
    const fn = /^\/functions\/v1\/([a-z-]+)\/health$/.exec(u.pathname)?.[1];
    if (fn) {
      if (s.flaky[fn]) {
        s.flaky[fn]--;
        return json({ code: 'WORKER_LIMIT', message: 'busy' }, 546);
      }
      const state = s.functions[fn] ?? 'deleted';
      if (typeof state === 'function') return state(new Request(`https://edge.local/${fn}/health`, { method: 'GET' }));
      switch (state) {
        case 'ready': return json({ ok: true, data: { status: 'ready' }, requestId: '0123456789ab' });
        case 'not_ready': return json({ ok: false, error: { code: 'unavailable', retryable: true }, requestId: '0123456789ab' }, 503);
        case 'stopped': return json({ code: 'BOOT_ERROR', message: 'Function failed to start (please check logs)' }, 503);
        case 'deleted': return json({ code: 'NOT_FOUND', message: 'Requested function was not found' }, 404);
        case 'gateway_jwt': return json({ code: 'UNAUTHORIZED_NO_AUTH_HEADER', message: 'Missing authorization header' }, 401);
        case 'no_route': return json({ ok: false, error: { code: 'bad_request', retryable: false }, requestId: '0123456789ab' }, 405);
      }
    }
    if (u.pathname === '/auth/v1/health') return json({ version: 'v2', name: 'GoTrue' }, s.authHealth);
    if (u.pathname === '/auth/v1/settings') return json(s.settings);
    return json({ message: 'no route' }, 404);
  };
  const outcome = (v: unknown): SqlOutcome => (typeof v === 'object' && v !== null && 'ok' in v ? (v as SqlOutcome) : { ok: true, text: JSON.stringify(v) });
  const deps: SmokeDeps = {
    fetch,
    sql: (db) => {
      assert.equal(db.projectRef, REF);
      return async (q) => {
        sql.push(q);
        if (q === PROBE_SQL) return outcome(s.probe);
        if (q === CRON_SQL) return outcome(s.cron);
        throw new Error('unexpected SQL');
      };
    },
    now: () => NOW,
    sleep: async () => {
      slept++;
    },
  };
  return { deps, requests, sql, slept: () => slept };
}

const envOf = (vars: Record<string, string>) => (name: string) => vars[name] ?? '';
const ENV = envOf({ SUPABASE_URL: BASE, SUPABASE_PUBLISHABLE_KEY: KEY, SUPABASE_DB_URL: DB_URL });

async function run(s: StandIn, args: string[] = ARGS, env = ENV) {
  const w = world(s);
  const r = await smokeMain(args, env, w.deps);
  const byCheck = new Map<string, string>();
  for (const line of r.lines) {
    const m = /^(PASS|FAIL|NOT CHECKED)\s+([^:]+):/.exec(line);
    if (m) byCheck.set(m[2], m[1]);
  }
  return { ...r, ...w, byCheck, text: `${r.lines.join('\n')}\n${r.markdown ?? ''}` };
}

Deno.test('green: a seeded staging project passes every check, anonymously', async () => {
  const r = await run(seeded());
  assert.equal(r.code, 0, r.lines.join('\n'));
  assert.deepEqual([...r.byCheck.entries()].filter(([, v]) => v === 'FAIL'), []);
  for (const c of ['policy version terms', 'policy version sensitive-data', 'consent pepper', 'statement logging', 'function config', 'function content', 'function purge-worker', 'auth health', 'sign-up', 'sign-in providers', ...CRON_JOBS.map((j) => `cron ${j.name}`)]) {
    assert.equal(r.byCheck.get(c), 'PASS', c);
  }
  // apple-token has no health route yet (requested from S01): reported, not hidden, and not counted as green evidence.
  assert.equal(r.byCheck.get('function apple-token'), 'NOT CHECKED');
  assert.match(r.lines.at(-1)!, /^GREEN: 14 passed, 1 not checked/);
  // Anonymous: the publishable key as apikey, never an Authorization header; read-only SQL, two statements.
  assert.ok(r.requests.every((q) => q.headers.get('apikey') === KEY && !q.headers.has('authorization')));
  assert.deepEqual(r.sql, [PROBE_SQL, CRON_SQL]);
  const pv = r.requests.find((q) => q.url.includes('/rest/v1/policy_versions'))!;
  assert.equal(new URL(pv.url).searchParams.get('select'), 'document,version,effective_at');
  assert.deepEqual(DEFAULT_FUNCTIONS, ['config', 'content', 'purge-worker', 'apple-token']);
});

Deno.test('planted failure (QA re-review): a scratch project with no policy versions and a stopped function is red', async () => {
  const r = await run(scratchProject());
  assert.equal(r.code, 1);
  const failed = [...r.byCheck.entries()].filter(([, v]) => v === 'FAIL').map(([k]) => k).sort();
  assert.deepEqual(failed, ['function purge-worker', 'policy version sensitive-data', 'policy version terms']);
  assert.ok(r.lines.some((l) => l === 'FAIL        policy version terms: none published (supabase/APPLY.md step 8)'));
  assert.ok(r.lines.some((l) => l === 'FAIL        function purge-worker: did not start, or failed (503)'));
  assert.equal(r.lines.at(-1), 'RED: 3 of 15 checks failed');
  assert.match(r.markdown!, /^### Staging smoke \(RA-07-06\): RED: 3 of 15 checks failed/);
  assert.equal(r.slept(), 2, 'a 503 from the platform is retried before it counts');
  // The same run once the project is seeded and the function redeployed: green again.
  assert.equal((await run(seeded())).code, 0);
});

Deno.test('functions: deleted, unconfigured, behind the gateway, without the route, flaky', async () => {
  const s = seeded();
  s.functions = { config: 'deleted', content: 'gateway_jwt', 'purge-worker': 'not_ready', 'apple-token': 'deleted' };
  const r = await run(s);
  assert.equal(r.code, 1);
  const line = (c: string) => r.lines.find((l) => l.includes(` ${c}:`))!;
  assert.match(line('function config'), /not deployed, or deployed without the health route \(404\)/);
  assert.match(line('function content'), /refused by the gateway \(401\): deploy with --no-verify-jwt/);
  assert.match(line('function purge-worker'), /required secrets are not all set \(503/);
  assert.match(line('function apple-token'), /^FAIL .*\(404\)/, 'a requested route does not excuse a missing function');
  assert.equal(r.slept(), 0, 'our own 503 envelope is deterministic and not retried');

  const t = seeded();
  t.functions.config = 'no_route';
  t.functions['apple-token'] = 'no_route';
  t.flaky = { content: 2 };
  const r2 = await run(t);
  assert.match(r2.lines.find((l) => l.includes(' function config:'))!, /^FAIL .*without the health route \(405\)/);
  assert.match(r2.lines.find((l) => l.includes(' function apple-token:'))!, /^NOT CHECKED .*no health route yet \(405\); health route requested from S01/);
  assert.equal(r2.byCheck.get('function content'), 'PASS', 'two busy answers, then ready');
  t.flaky = { content: 1 };
  const r3 = await run(t, [...ARGS, '--attempts', '1', '--functions', 'content']);
  assert.equal(r3.byCheck.get('function content'), 'FAIL');
});

Deno.test('policy versions: refused, missing table, not yet in effect, newest effective version wins', async () => {
  const s = seeded();
  s.policyStatus = 401;
  assert.match((await run(s)).lines[1], /^FAIL\s+policy versions: anonymous read refused \(401\)/);
  s.policyStatus = 404;
  assert.match((await run(s)).lines[1], /policy_versions not found \(404\)/);
  const t = seeded();
  t.policyVersions = [
    { document: 'terms', version: '1.2.0', effective_at: '2026-10-01T00:00:00Z' },
    { document: 'terms', version: '1.10.0', effective_at: '2026-10-21T00:00:00Z' },
    { document: 'terms', version: '2.0.0', effective_at: '2026-12-01T00:00:00Z' },
    { document: 'sensitive-data', version: '1.0.0', effective_at: '2026-11-01T00:00:00Z' },
  ];
  const r = await run(t);
  assert.ok(r.lines.includes('PASS        policy version terms: 1.10.0 in effect (anonymous read)'));
  assert.ok(r.lines.includes('FAIL        policy version sensitive-data: published, but no version is in effect yet (effective_at is in the future)'));
});

Deno.test('database: pepper, pg_cron, each job, statement logging, connection and skip', async () => {
  const s = seeded();
  s.probe = { ...PROBE_OK, pepper_ready: false };
  assert.match((await run(s)).lines.find((l) => l.includes('consent pepper'))!, /^FAIL .*shorter than 32 characters \(supabase\/APPLY.md step 6\)/);

  s.probe = { ...PROBE_OK, cron_installed: false };
  const noCron = await run(s);
  assert.match(noCron.lines.find((l) => l.includes(' cron:'))!, /pg_cron is not enabled/);
  assert.deepEqual(noCron.sql, [PROBE_SQL]);

  s.probe = PROBE_OK;
  s.cron = [
    { name: 'scribe-purge-due', schedule: '17 * * * *', active: false },
    { name: 'scribe-purge-worker', schedule: '*/5 * * * *', active: true },
    { name: 'scribe-purge-worker-daily', schedule: '17 3 * * *', active: true },
    { name: 'scribe-extra', schedule: '0 0 * * *', active: true },
  ];
  const cron = await run(s);
  const line = (n: string) => cron.lines.find((l) => l.includes(`cron ${n}:`))!;
  assert.match(line('scribe-purge-due'), /^FAIL .*scheduled but not active/);
  assert.match(line('scribe-sync-housekeeping'), /^FAIL .*not scheduled \(supabase\/APPLY.md step 15\)/);
  assert.match(line('scribe-purge-worker'), /^FAIL .*runs on '\*\/5 \* \* \* \*', expected '\*\/15 \* \* \* \*'/);
  assert.match(line('scribe-purge-worker-daily'), /^PASS/);
  assert.ok(!cron.text.includes('scribe-extra'), 'jobs we do not expect are not listed');

  s.cron = CRON_JOBS.map((j) => ({ name: j.name, schedule: j.schedule, active: true }));
  s.probe = { ...PROBE_OK, log_statement: 'all', pgaudit_log: 'write, ddl', log_overrides: ['log_min_duration_statement=250ms', 'log_statement=ddl'] };
  const logging = (await run(s)).lines.find((l) => l.includes('statement logging'))!;
  assert.match(logging, /^FAIL .*log_statement is 'all'; pgaudit.log is 'write, ddl'; a role or database override: log_min_duration_statement is '250ms'/);
  assert.ok(!logging.includes('override: log_statement'), "an override to 'ddl' is fine");

  s.probe = { ok: false, kind: 'connect' };
  assert.match((await run(s)).lines.find((l) => l.includes('database'))!, /^FAIL .*could not connect/);
  s.probe = { ok: false, kind: 'sql', sqlstate: '42501' };
  assert.match((await run(s)).lines.find((l) => l.includes('database'))!, /SQLSTATE 42501/);
  s.probe = { ok: true, text: 'not json' };
  assert.match((await run(s)).lines.find((l) => l.includes('database'))!, /unexpected probe output/);

  const noUrl = await run(seeded(), ARGS, envOf({ SUPABASE_URL: BASE, SUPABASE_PUBLISHABLE_KEY: KEY }));
  assert.equal(noUrl.code, 1, 'a workflow that forgot the database URL is red, not quietly green');
  const skipped = await run(seeded(), [...ARGS, '--no-db'], envOf({ SUPABASE_URL: BASE, SUPABASE_PUBLISHABLE_KEY: KEY }));
  assert.equal(skipped.code, 0);
  assert.equal(skipped.byCheck.get('database (consent pepper, statement logging, cron)'), 'NOT CHECKED');
  assert.deepEqual(skipped.sql, []);
});

Deno.test('sign-up: Auth health, sign-ups on (or off for the staging stop), providers', async () => {
  const s = seeded();
  s.authHealth = 503;
  s.settings = { external: { email: true, apple: false }, disable_signup: true };
  const r = await run(s);
  assert.match(r.lines.find((l) => l.includes('auth health'))!, /^FAIL .*unexpected status 503/);
  assert.match(r.lines.find((l) => l.includes('sign-up:'))!, /^FAIL .*sign-ups are off/);
  assert.match(r.lines.find((l) => l.includes('sign-in providers'))!, /^FAIL\s+sign-in providers: email on, apple off/);
  const stop = await run({ ...seeded(), settings: { external: { email: true, apple: true }, disable_signup: true } }, [...ARGS, '--signups', 'closed']);
  assert.equal(stop.byCheck.get('sign-up'), 'PASS');
  assert.equal(stop.code, 0);
  assert.equal((await run(seeded(), [...ARGS, '--signups', 'closed'])).byCheck.get('sign-up'), 'FAIL');
});

Deno.test('usage: the target, the key and the database URL are checked before anything is sent', async () => {
  const jwt = (role: string) => `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ role })).replace(/=+$/, '')}.c2ln`;
  assert.equal(isAnonymousKey(KEY), true);
  assert.equal(isAnonymousKey(jwt('anon')), true);
  assert.equal(isAnonymousKey(jwt('service_role')), false);
  assert.equal(isAnonymousKey('sb_secret_abcdefghijklmnop'), false);
  const cases: [Record<string, string>, string[], RegExp][] = [
    [{ SUPABASE_URL: 'https://evil.example.com', SUPABASE_PUBLISHABLE_KEY: KEY }, ARGS, /SUPABASE_URL must be/],
    [{ SUPABASE_URL: BASE, SUPABASE_PUBLISHABLE_KEY: KEY }, ['--project-ref', 'zzzzzzzzzzzzzzzzzzzz'], /does not match/],
    [{ SUPABASE_URL: BASE, SUPABASE_PUBLISHABLE_KEY: jwt('service_role') }, ARGS, /secret and service-role keys are refused/],
    [{ SUPABASE_URL: BASE, SUPABASE_PUBLISHABLE_KEY: KEY, SUPABASE_DB_URL: DB_URL.replace(REF, 'zzzzzzzzzzzzzzzzzzzz') }, ARGS, /belongs to another project/],
    [{ SUPABASE_URL: BASE, SUPABASE_PUBLISHABLE_KEY: KEY, SUPABASE_DB_URL: 'postgresql://postgres:x@10.0.0.1:5432/postgres' }, ARGS, /direct .* or pooler/],
    [{ SUPABASE_URL: BASE, SUPABASE_PUBLISHABLE_KEY: KEY }, [...ARGS, '--functions', 'escrow'], /escrow lives in its own project/],
    [{ SUPABASE_URL: BASE, SUPABASE_PUBLISHABLE_KEY: KEY }, [...ARGS, '--providers', 'github'], /--providers/],
  ];
  for (const [vars, args, want] of cases) {
    const r = await run(seeded(), args, envOf(vars));
    assert.equal(r.code, 2, String(want));
    assert.match(r.lines.join('\n'), want);
    assert.equal(r.requests.length, 0);
    assert.ok(!r.text.includes(KEY) && !r.text.includes('evil.example.com') && !r.text.includes('zzzzzzzz'), 'problems never echo values');
  }
});

Deno.test('[LEGAL-REQ-014] content-free: Asha fixtures in every answer never reach the output', async () => {
  const s = seeded();
  s.policyVersions = [
    { document: 'terms', version: '1.0.0', effective_at: '2026-10-20T00:00:00Z', summary: CANARY.letterText, url: `https://x.invalid/${CANARY.childName}` },
    { document: 'terms', version: CANARY.childName, effective_at: '2026-10-20T00:00:00Z' },
    { document: CANARY.dictionaryWord, version: '9.9.9', effective_at: '2026-10-20T00:00:00Z' },
  ];
  s.functions.config = 'stopped';
  s.functions.content = async () => json({ ok: true, data: { status: CANARY.letterText }, requestId: CANARY.requestId });
  s.settings = { external: { email: true, apple: true, [CANARY.childName]: true }, disable_signup: false, site_url: `mailto:${CANARY.parentEmail}`, token: CANARY.sessionJwt };
  s.probe = { ...PROBE_OK, log_statement: CANARY.parentEmail, log_overrides: [`log_statement=${CANARY.letterText}`, `app.consent_pepper=${CANARY.inviteToken}`] };
  s.cron = [
    ...CRON_JOBS.slice(1).map((j) => ({ name: j.name, schedule: j.schedule, active: true, command: CANARY.letterText })),
    { name: 'scribe-purge-due', schedule: CANARY.coParentEmail, active: true },
    { name: `scribe-${CANARY.childName}`, schedule: '* * * * *', active: true },
  ];
  const r = await run(s, [...ARGS, '--summary', 'summary.md']);
  assert.equal(r.code, 1);
  assert.deepEqual(findCanaries(r.text), []);
  for (const secret of [BASE, REF, KEY, DB_PASSWORD, 'pooler.supabase.com', 'BOOT_ERROR', 'GoTrue']) assert.ok(!r.text.includes(secret), secret);
  assert.match(r.text, /an unexpected value/);
  assert.match(r.text, /an unexpected schedule/);
  assert.equal(r.summaryPath, 'summary.md');
});

Deno.test('the SQL reads catalog and settings only, and the pepper only as a length inside Postgres', () => {
  for (const q of [PROBE_SQL, CRON_SQL]) {
    assert.ok(!/\b(public|auth|storage|ops|insights|vault|net)\./.test(q), 'no application schema');
    assert.ok(!/\bselect\s+\*/i.test(q));
    assert.ok(!/\b(insert|update|delete|alter|create|drop|grant|truncate|copy)\b/i.test(q));
  }
  assert.equal(PROBE_SQL.match(/app\.consent_pepper/g)!.length, 1);
  assert.match(PROBE_SQL, /char_length\(btrim\(coalesce\(current_setting\('app\.consent_pepper', true\), ''\)\)\) >= 32/);
  assert.ok(!/\bcommand\b/.test(CRON_SQL), 'the job command is never read');
  assert.equal(loggingRisk('log_statement', 'ddl'), null);
  assert.equal(loggingRisk('log_statement', 'mod'), "log_statement is 'mod'");
  assert.equal(loggingRisk('pgaudit.log', 'none'), null);
  assert.equal(loggingRisk('log_min_duration_statement', '0'), "log_min_duration_statement is '0'");
});

Deno.test('database URL: direct and pooler URLs name their project; the password stays out of argv', () => {
  const pooled = dbTargetOf(DB_URL)!;
  assert.equal(pooled.projectRef, REF);
  assert.deepEqual(pooled.env, { PGHOST: 'aws-0-us-west-1.pooler.supabase.com', PGPORT: '5432', PGUSER: `postgres.${REF}`, PGPASSWORD: DB_PASSWORD, PGDATABASE: 'postgres', PGSSLMODE: 'require' });
  const direct = dbTargetOf(`postgres://postgres:p%40ss@db.${REF}.supabase.co:6543/postgres?sslmode=verify-full`)!;
  assert.equal(direct.projectRef, REF);
  assert.equal(direct.env.PGPASSWORD, 'p@ss');
  assert.equal(direct.env.PGSSLMODE, 'verify-full');
  assert.equal(dbTargetOf('https://db.x.supabase.co'), null);
  assert.equal(dbTargetOf('postgresql://postgres:pw@localhost/postgres')!.projectRef, null);
  assert.equal(dbTargetOf('postgresql://postgres:pw@localhost/postgres?sslmode=nope'), null);
});

// ─── The health route contract: the smoke against the real function handlers ───

const PURGE_ENV: Record<string, string> = { SUPABASE_URL: 'https://fake-project.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-key', PURGE_WORKER_SECRET: 'trigger-secret', RESEND_API_KEY: 're_fixture' };
const FORGET_ENV: Record<string, string> = { SUPABASE_URL: 'https://fake-project.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-key', POSTHOG_PERSONAL_API_KEY: 'phx_fixture', POSTHOG_PROJECT_ID: '12345' };
const noFetch = () => Promise.reject(new Error('health must not call out'));

Deno.test('health contract: config, content, purge-worker and analytics-forget answer the smoke as it expects', async () => {
  const logs: string[] = [];
  const s = seeded();
  s.functions = {
    config: makeConfigHandler({ remoteConfig: null, packManifest: null }, { logSink: (l) => logs.push(l) }),
    content: makeContentHandler({}, { logSink: (l) => logs.push(l) }),
    'purge-worker': makePurgeWorker((n) => PURGE_ENV[n], { fetch: noFetch, logSink: (l) => logs.push(l) }),
    'analytics-forget': makeForgetHandler((n) => FORGET_ENV[n], { fetch: noFetch, logSink: (l) => logs.push(l) }),
  };
  const r = await run(s, [...ARGS, '--functions', 'config,content,purge-worker,analytics-forget']);
  for (const f of ['config', 'content', 'purge-worker', 'analytics-forget']) assert.equal(r.byCheck.get(`function ${f}`), 'PASS', f);
  assert.equal(logs.length, 4);
  assert.ok(logs.every((l) => JSON.parse(l).event === 'request.done'));

  s.functions['purge-worker'] = makePurgeWorker((n) => (n === 'RESEND_API_KEY' ? undefined : PURGE_ENV[n]), { fetch: noFetch, logSink: () => {} });
  s.functions['analytics-forget'] = makeForgetHandler((n) => (n === 'POSTHOG_PROJECT_ID' ? undefined : FORGET_ENV[n]), { fetch: noFetch, logSink: () => {} });
  const missing = await run(s, [...ARGS, '--functions', 'purge-worker,analytics-forget']);
  assert.match(missing.lines.find((l) => l.includes(' function purge-worker:'))!, /^FAIL .*required secrets are not all set/);
  assert.match(missing.lines.find((l) => l.includes(' function analytics-forget:'))!, /^FAIL .*required secrets are not all set/);
});

Deno.test('health route: paths, methods, HEAD, no caching, and nothing about the setting that is missing', async () => {
  assert.equal(isHealthPath('/purge-worker/health', 'purge-worker'), true);
  assert.equal(isHealthPath('/functions/v1/purge-worker/health', 'purge-worker'), true);
  assert.equal(isHealthPath('/purge-worker/health/x', 'purge-worker'), false);
  assert.equal(isHealthPath('/purge-worker', 'purge-worker'), false);
  assert.equal(isHealthPath('/content/health', 'config'), false);
  assert.equal(isHealthRequest(new Request('https://e.local/purge-worker/health', { method: 'POST' }), 'purge-worker'), false);
  const head = healthResponse(new Request('https://e.local/config/health', { method: 'HEAD' }), true, '0123456789ab');
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  const down = healthResponse(new Request('https://e.local/config/health'), false, '0123456789ab');
  assert.equal(down.status, 503);
  assert.equal(down.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await down.json(), { ok: false, error: { code: 'unavailable', retryable: true }, requestId: '0123456789ab' });

  // A POST to the worker is still a run that needs the trigger secret; the health route starts nothing.
  const worker = makePurgeWorker((n) => PURGE_ENV[n], { fetch: noFetch, logSink: () => {} });
  assert.equal((await worker(new Request('https://e.local/purge-worker/health', { method: 'POST' }))).status, 401);
  assert.equal((await worker(new Request('https://e.local/purge-worker/v1', { method: 'GET' }))).status, 405);
});
