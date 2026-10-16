/**
 * RA-07-06: the content-free staging smoke check, run after every staging
 * deploy (docs/release/AUTOMATION.md 2.2, runbook docs/ops/runbooks/staging-smoke.md).
 * Pure: scripts/ops/staging-smoke.ts injects fetch, the psql runner, the clock and sleep.
 *
 * What it proves, and how, without reading anyone's data:
 *  - policy versions: an anonymous Data API read of `policy_versions` (columns
 *    document, version, effective_at only) finds an effective version of each
 *    document the consent gate reads (`terms`, `sensitive-data`);
 *  - consent pepper: Postgres compares the pepper's length with 32; the value
 *    never leaves the database;
 *  - statement logging off: `log_statement`, `log_min_duration_statement` and
 *    `pgaudit.log`, and any per-role or per-database override of them, cannot
 *    copy letter text from RPC calls into Postgres logs;
 *  - cron: each `scribe-*` job is scheduled, active and on its documented schedule;
 *  - Edge Functions: each one's health route answers 200 with the health envelope;
 *  - sign-up reachable: Auth answers its health route, and its public settings say
 *    sign-ups are on with the expected providers. No account is created, no email sent.
 *
 * Output carries check names, PASS / FAIL / NOT CHECKED, HTTP statuses,
 * SQLSTATEs, and values that first match a closed shape (semver, cron schedule,
 * setting enums). Never a response body, URL, key, psql message or row. It
 * reads no person's data, so it writes no ops.audit_log row (lib/runbook.ts).
 */
import { parseArgs } from './cli.ts';
import { dbTargetOf, projectRefOf, type DbTarget } from './target.ts';

export type FetchFn = (url: string, init: RequestInit) => Promise<Response>;
export type SqlOutcome =
  | { ok: true; text: string }
  | { ok: false; kind: 'connect' | 'sql' | 'no_psql' | 'timeout' | 'error'; sqlstate?: string };
export type SqlRunner = (sql: string) => Promise<SqlOutcome>;

export interface SmokeDeps {
  fetch: FetchFn;
  /** Builds the read-only psql runner for a database (lib/psql.ts). */
  sql: (db: DbTarget) => SqlRunner;
  now: () => Date;
  sleep: (ms: number) => Promise<void>;
}

// ─── What staging must have (AUTOMATION.md AF-13; supabase/APPLY.md) ────────

/** The documents the server consent gate reads (APPLY.md step 8). */
export const POLICY_DOCUMENTS = ['terms', 'sensitive-data'] as const;

export interface CronExpectation {
  name: string;
  schedule: string;
  source: string;
}
export const CRON_JOBS: readonly CronExpectation[] = [
  { name: 'scribe-purge-due', schedule: '17 * * * *', source: 'supabase/APPLY.md step 7' },
  { name: 'scribe-sync-housekeeping', schedule: '43 * * * *', source: 'supabase/APPLY.md step 15' },
  { name: 'scribe-purge-worker', schedule: '*/15 * * * *', source: 'supabase/cron/purge-worker.sql' },
  { name: 'scribe-purge-worker-daily', schedule: '17 3 * * *', source: 'supabase/cron/purge-worker.sql' },
];

export interface FunctionSpec {
  name: string;
  owner: string;
  /** `route`: answers GET /<name>/health. `requested`: not yet; its owner was asked (RA-07-06 PR). */
  health: 'route' | 'requested';
}
export const FUNCTIONS: readonly FunctionSpec[] = [
  { name: 'config', owner: 'S07', health: 'route' },
  { name: 'content', owner: 'S07', health: 'route' },
  { name: 'purge-worker', owner: 'S07', health: 'route' },
  { name: 'apple-token', owner: 'S01', health: 'requested' },
  { name: 'analytics-forget', owner: 'S07', health: 'route' },
  { name: 'invite-redeem', owner: 'S07', health: 'requested' },
  { name: 'subscription-status', owner: 'S06', health: 'requested' },
];
/** AF-13 deploys these four to staging. `escrow` lives in its own project (D-102) and is never checked here. */
export const DEFAULT_FUNCTIONS = ['config', 'content', 'purge-worker', 'apple-token'] as const;

export const KNOWN_PROVIDERS = ['email', 'apple', 'google'] as const;
export const DEFAULT_PROVIDERS = ['email', 'apple'] as const;

/** Read-only and content-free by construction: catalog and settings only, the pepper reduced to a boolean in Postgres. */
export const PROBE_SQL = `select json_build_object(
  'pepper_ready', char_length(btrim(coalesce(current_setting('app.consent_pepper', true), ''))) >= 32,
  'cron_installed', to_regclass('cron.job') is not null,
  'log_statement', current_setting('log_statement'),
  'log_min_duration_statement', current_setting('log_min_duration_statement'),
  'pgaudit_log', current_setting('pgaudit.log', true),
  'log_overrides', (select coalesce(json_agg(c order by c), '[]'::json)
                      from pg_catalog.pg_db_role_setting s, unnest(s.setconfig) c
                     where split_part(c, '=', 1) in ('log_statement', 'log_min_duration_statement', 'pgaudit.log'))
)::text`;

/** Job name, schedule and active flag of our jobs only; never `command` or anyone else's jobs. */
export const CRON_SQL = `select coalesce(json_agg(json_build_object('name', jobname, 'schedule', schedule, 'active', active) order by jobname), '[]'::json)::text
  from cron.job where jobname like 'scribe-%'`;

const ATTEMPT_WAIT_MS = 2_000;
const TIMEOUT_MS = 10_000;
const BODY_CAP = 64 * 1024;

// ─── Configuration ─────────────────────────────────────────────────────────

export interface SmokeConfig {
  url: string;
  projectRef: string;
  key: string;
  db: DbTarget | null;
  skipDb: boolean;
  functions: FunctionSpec[];
  providers: string[];
  signups: 'open' | 'closed';
  attempts: number;
  summaryPath: string | null;
}

type Env = (name: string) => string;

const listFlag = (v: string | true | undefined): string[] | null =>
  typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : null;

function jwtRole(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))) as { role?: unknown };
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

/** The publishable key builds ship, or the legacy anon key. Secret and service-role keys are refused: the reads must be anonymous. */
export function isAnonymousKey(key: string): boolean {
  if (/^sb_publishable_[A-Za-z0-9_-]{8,200}$/.test(key)) return true;
  return /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key) && jwtRole(key) === 'anon';
}

export function resolveSmoke(argv: string[], env: Env): { cfg: SmokeConfig; problems: [] } | { cfg: null; problems: string[] } {
  const { flags } = parseArgs(argv);
  const problems: string[] = [];
  const url = env('SUPABASE_URL').trim().replace(/\/+$/, '');
  const ref = projectRefOf(url);
  if (!ref) problems.push('SUPABASE_URL must be https://<project-ref>.supabase.co');
  if (typeof flags['project-ref'] !== 'string') problems.push('--project-ref <ref> is required');
  else if (ref && flags['project-ref'] !== ref) problems.push('--project-ref does not match SUPABASE_URL');

  const key = env('SUPABASE_PUBLISHABLE_KEY') || env('SUPABASE_ANON_KEY');
  if (!key) problems.push('SUPABASE_PUBLISHABLE_KEY is not set (the publishable key the builds use, or the legacy anon key)');
  else if (!isAnonymousKey(key)) problems.push('SUPABASE_PUBLISHABLE_KEY must be a publishable key or the legacy anon key; secret and service-role keys are refused so every read stays anonymous');

  const skipDb = flags['no-db'] === true;
  let db: DbTarget | null = null;
  const dbUrl = env('SUPABASE_DB_URL');
  if (dbUrl && !skipDb) {
    db = dbTargetOf(dbUrl);
    if (!db) problems.push('SUPABASE_DB_URL is not a postgres:// URL');
    else if (!db.projectRef) problems.push("SUPABASE_DB_URL must be the project's direct (db.<ref>.supabase.co) or pooler (user postgres.<ref>) URL");
    else if (ref && db.projectRef !== ref) problems.push('SUPABASE_DB_URL belongs to another project than SUPABASE_URL');
  }

  const names = listFlag(flags.functions) ?? [...DEFAULT_FUNCTIONS];
  const functions: FunctionSpec[] = [];
  for (const n of names) {
    if (n === 'escrow') problems.push('--functions: escrow lives in its own project (D-102) and is not checked here');
    else {
      const spec = FUNCTIONS.find((f) => f.name === n);
      if (!spec) problems.push('--functions: unknown function name (see FUNCTIONS in scripts/ops/lib/smoke.ts)');
      else if (!functions.includes(spec)) functions.push(spec);
    }
  }
  const providers = listFlag(flags.providers) ?? [...DEFAULT_PROVIDERS];
  if (!providers.every((p) => (KNOWN_PROVIDERS as readonly string[]).includes(p))) problems.push(`--providers: one of ${KNOWN_PROVIDERS.join(', ')}`);
  const signups = flags.signups === undefined ? 'open' : flags.signups;
  if (signups !== 'open' && signups !== 'closed') problems.push('--signups open | closed');
  const attempts = flags.attempts === undefined ? 3 : Number(flags.attempts);
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 5) problems.push('--attempts 1 to 5');
  const summaryPath = typeof flags.summary === 'string' ? flags.summary : null;
  if (flags.summary !== undefined && !summaryPath) problems.push('--summary <file> needs a path');

  if (problems.length) return { cfg: null, problems };
  return {
    cfg: { url, projectRef: ref!, key, db, skipDb, functions, providers, signups: signups as 'open' | 'closed', attempts, summaryPath },
    problems: [],
  };
}

// ─── Checks ────────────────────────────────────────────────────────────────

export type CheckStatus = 'PASS' | 'FAIL' | 'NOT CHECKED';
export interface CheckResult {
  check: string;
  status: CheckStatus;
  detail: string;
}

const pass = (check: string, detail: string): CheckResult => ({ check, status: 'PASS', detail });
const fail = (check: string, detail: string): CheckResult => ({ check, status: 'FAIL', detail });
const notChecked = (check: string, detail: string): CheckResult => ({ check, status: 'NOT CHECKED', detail });

type HttpResult = { status: number; text: string | null } | { status: 0; error: 'timeout' | 'network' };

async function readCapped(res: Response): Promise<string | null> {
  if (!res.body) return '';
  const reader = res.body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > BODY_CAP) {
      await reader.cancel().catch(() => {});
      return null;
    }
    parts.push(value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const p of parts) {
    all.set(p, at);
    at += p.byteLength;
  }
  return new TextDecoder().decode(all);
}

/** One anonymous GET: only the `apikey` header, never an Authorization header or a session. */
async function get(deps: SmokeDeps, cfg: SmokeConfig, path: string): Promise<HttpResult> {
  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctrl.abort();
  }, TIMEOUT_MS);
  try {
    const res = await deps.fetch(`${cfg.url}${path}`, { method: 'GET', headers: { apikey: cfg.key, accept: 'application/json' }, signal: ctrl.signal, redirect: 'manual' });
    return { status: res.status, text: await readCapped(res) };
  } catch {
    return { status: 0, error: timedOut ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}

function json(text: string | null): unknown {
  if (text === null || text === '') return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const SEMVER_RE = /^(\d{1,6})\.(\d{1,6})\.(\d{1,6})$/;
const semverKey = (v: string) => (SEMVER_RE.exec(v) ?? []).slice(1).map((n) => n.padStart(6, '0')).join('.');
const noAnswer = (r: HttpResult) => ('error' in r ? `no answer (${r.error})` : `unexpected status ${r.status}`);

export async function checkPolicyVersions(deps: SmokeDeps, cfg: SmokeConfig): Promise<CheckResult[]> {
  const q = new URLSearchParams({ select: 'document,version,effective_at', document: `in.(${POLICY_DOCUMENTS.join(',')})`, limit: '500' });
  const r = await get(deps, cfg, `/rest/v1/policy_versions?${q}`);
  const name = 'policy versions';
  if (r.status === 401 || r.status === 403) return [fail(name, `anonymous read refused (${r.status}): check the publishable key and the policy_versions_read policy`)];
  if (r.status === 404) return [fail(name, 'policy_versions not found (404): migrations not applied, or the public schema is not exposed')];
  if (r.status !== 200 || 'error' in r) return [fail(name, noAnswer(r))];
  const rows = json(r.text);
  if (!Array.isArray(rows)) return [fail(name, 'the anonymous read did not answer a list')];
  const now = deps.now().getTime();
  return POLICY_DOCUMENTS.map((doc) => {
    const check = `policy version ${doc}`;
    const mine = rows.filter((x): x is { version: string; effective_at: string } =>
      isObject(x) && x.document === doc && typeof x.version === 'string' && SEMVER_RE.test(x.version) && typeof x.effective_at === 'string');
    const effective = mine.filter((x) => Date.parse(x.effective_at) <= now).sort((a, b) => semverKey(b.version).localeCompare(semverKey(a.version)));
    if (effective.length) return pass(check, `${effective[0].version} in effect (anonymous read)`);
    if (mine.length) return fail(check, 'published, but no version is in effect yet (effective_at is in the future)');
    return fail(check, 'none published (supabase/APPLY.md step 8)');
  });
}

function isEnvelope(v: unknown, ok: boolean): v is Record<string, unknown> {
  return isObject(v) && v.ok === ok && typeof v.requestId === 'string';
}

const RETRY_STATUSES = new Set([0, 502, 503, 504, 546]);

export async function checkFunction(deps: SmokeDeps, cfg: SmokeConfig, spec: FunctionSpec): Promise<CheckResult> {
  const check = `function ${spec.name}`;
  let r: HttpResult = { status: 0, error: 'network' };
  for (let attempt = 1; attempt <= cfg.attempts; attempt++) {
    r = await get(deps, cfg, `/functions/v1/${spec.name}/health`);
    const body = 'error' in r ? undefined : json(r.text);
    const deterministic = r.status === 503 && isEnvelope(body, false);
    if (!RETRY_STATUSES.has(r.status) || deterministic || attempt === cfg.attempts) break;
    await deps.sleep(ATTEMPT_WAIT_MS);
  }
  const body = 'error' in r ? undefined : json(r.text);
  if (r.status === 200 && isEnvelope(body, true) && isObject(body.data) && body.data.status === 'ready') return pass(check, 'health 200');
  if (r.status === 200) return fail(check, 'answered 200 without the health envelope');
  if (r.status === 404) return fail(check, 'not deployed, or deployed without the health route (404)');
  if (r.status === 503 && isEnvelope(body, false)) return fail(check, 'deployed, but its required secrets are not all set (503; docs/ops/SECURITY.md)');
  if (spec.health === 'requested' && (r.status === 401 || r.status === 403 || r.status === 405)) {
    const why = r.status === 405 ? 'deployed, no health route yet (405)' : `behind gateway JWT verification (${r.status})`;
    return notChecked(check, `${why}; health route requested from ${spec.owner}`);
  }
  if (r.status === 401 || r.status === 403) return fail(check, `refused by the gateway (${r.status}): deploy with --no-verify-jwt so the health route is reachable`);
  if (r.status === 405) return fail(check, 'deployed without the health route (405): redeploy from develop');
  if (r.status >= 500) return fail(check, `did not start, or failed (${r.status})`);
  return fail(check, noAnswer(r));
}

export async function checkAuth(deps: SmokeDeps, cfg: SmokeConfig): Promise<CheckResult[]> {
  const out: CheckResult[] = [];
  const h = await get(deps, cfg, '/auth/v1/health');
  out.push(h.status === 200 ? pass('auth health', 'health 200') : fail('auth health', noAnswer(h)));
  const s = await get(deps, cfg, '/auth/v1/settings');
  const settings = 'error' in s ? undefined : json(s.text);
  if (s.status !== 200 || !isObject(settings)) {
    out.push(fail('sign-up', s.status === 200 ? 'Auth settings did not answer an object' : `Auth settings: ${noAnswer(s)}`));
    return out;
  }
  const disabled = settings.disable_signup;
  if (typeof disabled !== 'boolean') out.push(fail('sign-up', 'Auth settings do not say whether sign-ups are on'));
  else if (cfg.signups === 'open') out.push(disabled ? fail('sign-up', 'sign-ups are off (Authentication settings)') : pass('sign-up', 'sign-ups on; no account created'));
  else out.push(disabled ? pass('sign-up', 'sign-ups off, as asked with --signups closed') : fail('sign-up', 'sign-ups are on, but --signups closed was asked (the staging stop)'));
  const external = isObject(settings.external) ? settings.external : {};
  const states = cfg.providers.map((p) => ({ p, on: external[p] === true }));
  const detail = states.map(({ p, on }) => `${p} ${on ? 'on' : 'off'}`).join(', ');
  out.push(states.every((x) => x.on) ? pass('sign-in providers', detail) : fail('sign-in providers', `${detail} (Authentication > Sign In / Providers)`));
  return out;
}

// ─── Database facts ────────────────────────────────────────────────────────

export interface Probe {
  pepper_ready: boolean;
  cron_installed: boolean;
  log_statement: string;
  log_min_duration_statement: string;
  pgaudit_log: string | null;
  log_overrides: string[];
}

export function parseProbe(text: string): Probe | null {
  const v = json(text);
  if (!isObject(v)) return null;
  const { pepper_ready, cron_installed, log_statement, log_min_duration_statement, pgaudit_log, log_overrides } = v;
  if (typeof pepper_ready !== 'boolean' || typeof cron_installed !== 'boolean') return null;
  if (typeof log_statement !== 'string' || typeof log_min_duration_statement !== 'string') return null;
  if (pgaudit_log !== null && typeof pgaudit_log !== 'string') return null;
  if (!Array.isArray(log_overrides) || !log_overrides.every((x) => typeof x === 'string')) return null;
  return { pepper_ready, cron_installed, log_statement, log_min_duration_statement, pgaudit_log, log_overrides: log_overrides as string[] };
}

/** Values are shown only when they match the setting's own closed shape (Postgres and pgaudit validate them too). */
const LOG_SHAPES: Record<string, RegExp> = {
  log_statement: /^(none|ddl|mod|all)$/,
  log_min_duration_statement: /^-?[0-9]{1,9}(us|ms|s|min|h|d)?$/,
  'pgaudit.log': /^(-?(none|read|write|function|role|ddl|misc|misc_set|all))(, ?-?(none|read|write|function|role|ddl|misc|misc_set|all))*$/,
};

/** Why a logging setting could copy statement text (and so letter text) into Postgres logs; null when it cannot. */
export function loggingRisk(name: string, value: string): string | null {
  const shape = LOG_SHAPES[name];
  if (!shape) return 'an unexpected setting';
  const v = value.trim().toLowerCase();
  const shown = shape.test(v) ? `'${v}'` : 'an unexpected value';
  if (name === 'log_statement') return v === 'none' || v === 'ddl' ? null : `log_statement is ${shown}`;
  if (name === 'log_min_duration_statement') return v === '-1' ? null : `log_min_duration_statement is ${shown}`;
  const classes = v.split(',').map((c) => c.trim()).filter(Boolean);
  return classes.every((c) => c === 'none' || c === 'ddl' || c === 'role') ? null : `pgaudit.log is ${shown}`;
}

export function checkLogging(p: Probe): CheckResult {
  const risks = [
    loggingRisk('log_statement', p.log_statement),
    loggingRisk('log_min_duration_statement', p.log_min_duration_statement),
    p.pgaudit_log === null ? null : loggingRisk('pgaudit.log', p.pgaudit_log),
    ...p.log_overrides.map((o) => {
      const i = o.indexOf('=');
      const risk = i > 0 ? loggingRisk(o.slice(0, i), o.slice(i + 1)) : 'an unreadable override';
      return risk ? `a role or database override: ${risk}` : null;
    }),
  ].filter((x): x is string => x !== null);
  return risks.length
    ? fail('statement logging', `${risks.join('; ')}: letter text sent to RPCs could reach Postgres logs (docs/ops/SECURITY.md section 4)`)
    : pass('statement logging', 'off (log_statement, log_min_duration_statement, pgaudit.log and overrides)');
}

const CRON_SHAPE = /^[0-9*/,\- ]{1,40}$|^@[a-z]{3,10}$|^[0-9]{1,3} seconds$/;

export function checkCron(jobs: unknown): CheckResult[] {
  if (!Array.isArray(jobs)) return [fail('cron', 'unexpected answer from cron.job')];
  const byName = new Map<string, { schedule: unknown; active: unknown }>();
  for (const j of jobs) if (isObject(j) && typeof j.name === 'string') byName.set(j.name, { schedule: j.schedule, active: j.active });
  return CRON_JOBS.map((want) => {
    const check = `cron ${want.name}`;
    const got = byName.get(want.name);
    if (!got) return fail(check, `not scheduled (${want.source})`);
    if (got.active !== true) return fail(check, `scheduled but not active (${want.source})`);
    if (got.schedule !== want.schedule) {
      const was = typeof got.schedule === 'string' && CRON_SHAPE.test(got.schedule) ? `'${got.schedule}'` : 'an unexpected schedule';
      return fail(check, `runs on ${was}, expected '${want.schedule}' (${want.source})`);
    }
    return pass(check, `'${want.schedule}', active`);
  });
}

function sqlProblem(o: Exclude<SqlOutcome, { ok: true }>): string {
  switch (o.kind) {
    case 'connect': return 'could not connect (check SUPABASE_DB_URL)';
    case 'no_psql': return 'psql not found (install the PostgreSQL client)';
    case 'timeout': return 'the read-only probe timed out';
    case 'sql': return o.sqlstate && /^[0-9A-Z]{5}$/.test(o.sqlstate) ? `the read-only probe failed (SQLSTATE ${o.sqlstate})` : 'the read-only probe failed';
    default: return 'the read-only probe failed';
  }
}

export async function checkDatabase(deps: SmokeDeps, cfg: SmokeConfig): Promise<CheckResult[]> {
  const name = 'database (consent pepper, statement logging, cron)';
  if (cfg.skipDb) return [notChecked(name, 'skipped with --no-db')];
  if (!cfg.db) return [fail(name, 'SUPABASE_DB_URL is not set (pass --no-db to skip these on purpose)')];
  const run = deps.sql(cfg.db);
  const o = await run(PROBE_SQL);
  if (!o.ok) return [fail(name, sqlProblem(o))];
  const p = parseProbe(o.text);
  if (!p) return [fail(name, 'unexpected probe output')];
  const out: CheckResult[] = [
    p.pepper_ready
      ? pass('consent pepper', 'set (only its length is compared, inside Postgres)')
      : fail('consent pepper', 'missing or shorter than 32 characters (supabase/APPLY.md step 6)'),
    checkLogging(p),
  ];
  if (!p.cron_installed) {
    out.push(fail('cron', 'pg_cron is not enabled (supabase/APPLY.md step 7)'));
    return out;
  }
  const c = await run(CRON_SQL);
  if (!c.ok) out.push(fail('cron', sqlProblem(c)));
  else out.push(...checkCron(json(c.text)));
  return out;
}

// ─── Report ────────────────────────────────────────────────────────────────

export interface Report {
  at: string;
  checks: CheckResult[];
  failed: number;
  notChecked: number;
  green: boolean;
}

export async function runSmoke(deps: SmokeDeps, cfg: SmokeConfig): Promise<Report> {
  const checks: CheckResult[] = [];
  checks.push(...(await checkPolicyVersions(deps, cfg)));
  checks.push(...(await checkDatabase(deps, cfg)));
  for (const f of cfg.functions) checks.push(await checkFunction(deps, cfg, f));
  checks.push(...(await checkAuth(deps, cfg)));
  const failed = checks.filter((c) => c.status === 'FAIL').length;
  return { at: deps.now().toISOString(), checks, failed, notChecked: checks.filter((c) => c.status === 'NOT CHECKED').length, green: failed === 0 };
}

export function verdictLine(r: Report): string {
  if (!r.green) return `RED: ${r.failed} of ${r.checks.length} checks failed`;
  return r.notChecked ? `GREEN: ${r.checks.length - r.notChecked} passed, ${r.notChecked} not checked (listed above)` : `GREEN: all ${r.checks.length} checks passed`;
}

export function reportLines(r: Report): string[] {
  return [
    `Staging smoke (RA-07-06) at ${r.at}. Project matched --project-ref; anonymous reads only.`,
    ...r.checks.map((c) => `${c.status.padEnd(11)} ${c.check}: ${c.detail}`),
    verdictLine(r),
  ];
}

export function reportMarkdown(r: Report): string {
  const cell = (s: string) => s.replace(/\|/g, '\\|');
  return [
    `### Staging smoke (RA-07-06): ${verdictLine(r)}`,
    '',
    '| Check | Result | Detail |',
    '|---|---|---|',
    ...r.checks.map((c) => `| ${cell(c.check)} | ${c.status} | ${cell(c.detail)} |`),
    '',
    `Run at ${r.at}. Content-free: statuses and closed values only (scripts/ops/lib/smoke.ts).`,
    '',
  ].join('\n');
}

export const USAGE = [
  'Usage (docs/ops/runbooks/staging-smoke.md):',
  '  SUPABASE_URL=https://<ref>.supabase.co SUPABASE_PUBLISHABLE_KEY=<publishable key> SUPABASE_DB_URL=<postgres URL> \\',
  '  node scripts/ops/staging-smoke.ts --project-ref <ref> [--functions a,b] [--providers email,apple]',
  '    [--signups open|closed] [--no-db] [--attempts 3] [--summary "$GITHUB_STEP_SUMMARY"]',
  'Exit 0 green, 1 red, 2 usage.',
];

/** The whole run: exit code 0 green, 1 red, 2 usage. Lines are content-free; the CLI prints them. */
export async function smokeMain(argv: string[], env: Env, deps: SmokeDeps): Promise<{ code: 0 | 1 | 2; lines: string[]; markdown: string | null; summaryPath: string | null }> {
  if (argv.includes('--help')) return { code: 0, lines: USAGE, markdown: null, summaryPath: null };
  const r = resolveSmoke(argv, env);
  if (!r.cfg) return { code: 2, lines: [...r.problems, ...USAGE], markdown: null, summaryPath: null };
  const report = await runSmoke(deps, r.cfg);
  return { code: report.green ? 0 : 1, lines: reportLines(report), markdown: reportMarkdown(report), summaryPath: r.cfg.summaryPath };
}
