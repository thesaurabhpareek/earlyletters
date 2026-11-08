#!/usr/bin/env node
/**
 * DRAFT, UNVERIFIED against a real Supabase project. Backlog 08 rank 5 (hosted smoke).
 * Runs only after the founder decides F1, F2 and F4 and a hosted project exists.
 * Tested only against a local mock server (see the end of this header).
 *
 * Read-only checks against one hosted project, whose URL is the only argument:
 *   1. auth health         GET /auth/v1/health (and the public /auth/v1/settings, names only)
 *   2. RLS denies anon     HEAD on tables that hold people's data, with the publishable key only.
 *                          401, 403, 404 = denied. 200 with a count above 0 = RED (a leak).
 *                          200 with count 0 = "empty or hidden": not evidence on its own.
 *   3. edge functions      GET /functions/v1/<name>/health must answer 200 {ok:true,data:{status:"ready"}}
 *   4. migrations match    versions in supabase_migrations.schema_migrations (read only, through psql)
 *                          equal the file versions in supabase/migrations. Needs SUPABASE_DB_URL.
 *
 * Usage:
 *   SUPABASE_PUBLISHABLE_KEY=<the publishable key the builds use> \
 *   SUPABASE_DB_URL=<optional: read-only Postgres URL of the same project> \
 *   node scripts/release/hosted-smoke.draft.mjs https://<ref>.supabase.co \
 *     [--functions config,content,purge-worker] [--expect-unchecked apple-token] \
 *     [--migrations-dir supabase/migrations]
 *
 * Secrets: keys are read from the environment only. Nothing here prints a key, a URL, a response
 * body, a row or a psql message; output is check names, statuses and the project ref. A secret or
 * service-role key is refused (the reads must be anonymous). Only GET and HEAD are sent; no write.
 * Exit 0 green, 1 red, 2 usage mistake or unexpected stop (one fixed line).
 * "NOT CHECKED" lines are listed and are not evidence.
 *
 * Test-only flag: --allow-local accepts http://127.0.0.1:<port> so the script can be run against a
 * mock server. It accepts nothing else over http.
 *
 * Node 22, no npm packages. psql is needed only for check 4.
 */
import { execFile } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { promisify } from 'node:util';

const run = promisify(execFile);
const STOPPED = 'hosted smoke stopped unexpectedly (details withheld on purpose)';

// Tables that hold people's data. Names come from supabase/migrations; extend when a table is added.
const PEOPLE_TABLES = ['entries', 'entry_versions', 'children', 'child_members', 'child_invites', 'profiles',
  'policy_acceptances', 'deletion_requests', 'held_drafts', 'audio_blobs', 'store_subscriptions'];

const out = [];
let red = 0;
function line(status, name, note = '') {
  if (status === 'RED') red++;
  out.push(`${status.padEnd(11)} ${name}${note ? `: ${note}` : ''}`);
}

function usage(msg) {
  console.error(msg);
  process.exit(2);
}

function parseArgs(argv) {
  const o = { url: null, functions: ['config', 'content', 'purge-worker'], unchecked: [], dir: 'supabase/migrations', local: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--functions') o.functions = (argv[++i] ?? '').split(',').filter(Boolean);
    else if (a === '--expect-unchecked') o.unchecked = (argv[++i] ?? '').split(',').filter(Boolean);
    else if (a === '--migrations-dir') o.dir = argv[++i] ?? '';
    else if (a === '--allow-local') o.local = true;
    else if (a.startsWith('--')) usage(`unknown option ${a.slice(0, 20)}`);
    else if (!o.url) o.url = a;
    else usage('one project URL only');
  }
  if (!o.url) usage('usage: hosted-smoke.draft.mjs https://<ref>.supabase.co [options]');
  for (const f of [...o.functions, ...o.unchecked]) if (!/^[a-z0-9-]{1,40}$/.test(f)) usage('a function name is not a plain name');
  return o;
}

/** The URL must be https://<ref>.supabase.co with nothing else (or http://127.0.0.1:port with --allow-local). */
function target(raw, local) {
  let u;
  try { u = new URL(raw); } catch { usage('the project URL is not a URL'); }
  if (u.username || u.password || u.search || u.hash || (u.pathname !== '/' && u.pathname !== '')) usage('the project URL must have no credentials, path or query');
  if (local && u.protocol === 'http:' && u.hostname === '127.0.0.1') return { base: u.origin, ref: 'local-mock' };
  const m = /^([a-z0-9]{20})\.supabase\.co$/.exec(u.hostname);
  if (u.protocol !== 'https:' || !m || u.port) usage('the project URL must be https://<20-character ref>.supabase.co');
  return { base: u.origin, ref: m[1] };
}

/** Refuses a service-role or secret key: the reads must be anonymous. Never prints the key. */
function publishableKey(env) {
  const k = env.SUPABASE_PUBLISHABLE_KEY ?? '';
  if (!k) usage('SUPABASE_PUBLISHABLE_KEY is not set');
  if (/[\s\x00-\x1f]/.test(k)) usage('the key holds a space or control character');
  if (k.startsWith('sb_secret_')) usage('that is a secret key; use the publishable key');
  const parts = k.split('.');
  if (parts.length === 3) {
    try {
      const role = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')).role;
      if (role === 'service_role') usage('that is a service-role key; use the publishable key');
    } catch { /* not a decodable JWT: leave it to the server */ }
  }
  return k;
}

async function call(base, path, key, method = 'GET', extra = {}) {
  try {
    const res = await fetch(base + path, {
      method,
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
      headers: { apikey: key, ...extra },
    });
    return res;
  } catch {
    return null;
  }
}

async function authChecks(base, key) {
  const h = await call(base, '/auth/v1/health', key);
  if (!h) return line('RED', 'auth health', 'no answer');
  if (h.status !== 200) return line('RED', 'auth health', `status ${h.status}`);
  line('GREEN', 'auth health', 'status 200');
  const s = await call(base, '/auth/v1/settings', key);
  if (s?.status === 200) {
    try {
      const j = await s.json();
      const on = Object.entries(j.external ?? {}).filter(([, v]) => v === true).map(([k]) => k).filter((k) => /^[a-z_]{1,20}$/.test(k));
      line('INFO', 'sign-in providers on', on.join(',') || 'none');
      line('INFO', 'sign-up', j.disable_signup ? 'closed' : 'open');
    } catch { line('NOT CHECKED', 'auth settings', 'unreadable'); }
  } else line('NOT CHECKED', 'auth settings', 'not readable');
}

async function rlsChecks(base, key) {
  for (const t of PEOPLE_TABLES) {
    const r = await call(base, `/rest/v1/${t}?select=*&limit=1`, key, 'HEAD', { Prefer: 'count=exact', Range: '0-0' });
    if (!r) { line('RED', `anon read ${t}`, 'no answer'); continue; }
    if ([401, 403, 404].includes(r.status)) { line('GREEN', `anon read ${t}`, `denied (${r.status})`); continue; }
    if (r.status === 200 || r.status === 206) {
      const count = Number((r.headers.get('content-range') ?? '').split('/')[1]);
      if (Number.isFinite(count) && count > 0) line('RED', `anon read ${t}`, 'rows are visible without signing in');
      else if (count === 0) line('INFO', `anon read ${t}`, 'answered with zero rows: RLS hides them or the table is empty (not evidence on an empty table)');
      else line('RED', `anon read ${t}`, 'answered 200 and the row count is unreadable');
      continue;
    }
    line('RED', `anon read ${t}`, `unexpected status ${r.status}`);
  }
}

async function functionChecks(base, key, names, unchecked) {
  for (const n of names) {
    const r = await call(base, `/functions/v1/${n}/health`, key);
    const exempt = unchecked.includes(n);
    if (!r) { line('RED', `function ${n}`, 'no answer'); continue; }
    if (r.status === 200) {
      let ok = false;
      try { const j = await r.json(); ok = j?.ok === true && j?.data?.status === 'ready'; } catch { /* not json */ }
      line(ok ? 'GREEN' : 'RED', `function ${n}`, ok ? 'ready' : 'answered 200 but not {ok:true,data:{status:"ready"}}');
    } else if (r.status === 401 && exempt) line('NOT CHECKED', `function ${n}`, 'behind the gateway JWT check; presence not confirmed by this run');
    else if (r.status === 401) line('RED', `function ${n}`, '401: unreadable route; name it in --expect-unchecked only if that is by design');
    else if (r.status === 404) line('RED', `function ${n}`, 'not deployed, or an old deploy without the health route');
    else if (r.status === 503) line('RED', `function ${n}`, 'deployed, a required secret is missing');
    else line('RED', `function ${n}`, `status ${r.status}`);
  }
}

function localVersions(dir) {
  return readdirSync(dir).filter((f) => /^\d{14}_.+\.sql$/.test(f)).map((f) => f.slice(0, 14)).sort();
}

async function migrationChecks(ref, env, dir, local) {
  const url = env.SUPABASE_DB_URL;
  if (!url) return line('NOT CHECKED', 'migrations match', 'SUPABASE_DB_URL is not set');
  let files;
  try { files = localVersions(dir); } catch { return line('RED', 'migrations match', 'cannot read the local migrations folder'); }
  let u;
  try { u = new URL(url); } catch { return line('RED', 'migrations match', 'SUPABASE_DB_URL is not a URL'); }
  const mode = u.searchParams.get('sslmode') ?? 'require';
  if (!['require', 'verify-ca', 'verify-full'].includes(mode)) return line('RED', 'migrations match', 'the database URL must require TLS');
  if (!decodeURIComponent(u.username + u.hostname).includes(ref)) return line('RED', 'migrations match', 'the database URL does not belong to this project');
  const penv = {
    PATH: process.env.PATH, PGHOST: u.hostname, PGPORT: u.port || '5432', PGUSER: decodeURIComponent(u.username),
    PGPASSWORD: decodeURIComponent(u.password), PGDATABASE: u.pathname.slice(1) || 'postgres', PGSSLMODE: mode,
    PGCONNECT_TIMEOUT: '15', PGAPPNAME: 'hosted-smoke-draft',
  };
  let stdout;
  try {
    ({ stdout } = await run('psql', ['-X', '-A', '-t', '-q', '-v', 'ON_ERROR_STOP=1', '-c',
      'begin read only; set local statement_timeout = 5000; select version from supabase_migrations.schema_migrations order by 1; commit;'],
    { env: penv, timeout: 30_000 }));
  } catch (e) {
    const code = /SQLSTATE|ERROR/.test(String(e?.stderr ?? '')) ? 'the query was refused' : 'psql could not connect or is missing';
    return line('RED', 'migrations match', code);
  }
  const hosted = stdout.split('\n').map((s) => s.trim()).filter((s) => /^\d{14}$/.test(s)).sort();
  const pending = files.filter((v) => !hosted.includes(v));
  const ahead = hosted.filter((v) => !files.includes(v));
  if (!pending.length && !ahead.length) return line('GREEN', 'migrations match', `${hosted.length} applied, ${files.length} files`);
  if (pending.length) line('RED', 'migrations not applied on the project', `${pending.length}: ${pending.slice(0, 5).join(',')}`);
  if (ahead.length) line('RED', 'migrations applied but not in this checkout', `${ahead.length}: ${ahead.slice(0, 5).join(',')}`);
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  const { base, ref } = target(o.url, o.local);
  const key = publishableKey(process.env);
  out.push(`hosted smoke (DRAFT) for project ${ref}`);
  await authChecks(base, key);
  await rlsChecks(base, key);
  await functionChecks(base, key, o.functions, o.unchecked);
  await migrationChecks(ref, process.env, o.dir, o.local);
  console.log(out.join('\n'));
  console.log(red ? `\nRED: ${red} check(s) failed` : '\nGREEN: no check failed (NOT CHECKED and INFO lines are not evidence)');
  process.exit(red ? 1 : 0);
}

main().catch(() => { console.error(STOPPED); process.exit(2); });
