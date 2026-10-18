// Which Edge Functions deploy-functions.yml deploys to staging, and whether the
// deploy landed (RA-20-05; docs/release/AUTOMATION.md section 2.2; docs/ops/DEPLOY.md
// "Edge Functions to staging").
//
//   node .github/scripts/functions-deploy.mjs plan --changed <file>   a push: <file> lists the changed paths
//   node .github/scripts/functions-deploy.mjs plan --only <name|all>  a manual run
//   node .github/scripts/functions-deploy.mjs confirm --before <json> --after <json> --deployed a,b [--failed c]
//   SUPABASE_DB_URL=... node .github/scripts/functions-deploy.mjs migrations   staging has every local migration?
//
// plan prints one JSON object and exits 1 on an error (nothing is deployed then):
//   { deploy, noVerifyJwt, smoke, changed, notes, warnings, errors }
// A push deploys every function once any function's code changed, not only the
// changed ones, and the deploy job deploys develop's tip, not the pushed commit:
// whichever run goes last deploys the newest develop, so neither queue order nor
// a replaced pending run can move staging backwards or drop a change.
//
// confirm reads two `supabase functions list -o json` outputs (before and after
// the deploys), prints a Markdown table and exits 1 unless every deployed
// function is ACTIVE, on a higher version, and has the gateway JWT setting it
// was deployed with.
//
// migrations reads staging's applied versions through psql (credentials as PG*
// variables, never argv; a read-only transaction) and exits 1 unless every file
// in supabase/migrations is applied: functions deploy after the migrations they
// call. It prints file names and counts only.
//
// plan and confirm use no network and no secrets.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Deployed with `--no-verify-jwt`, as each function's own header says: config and
 * content serve public signed documents before sign-in (ADR 0016), purge-worker's
 * caller presents a shared secret, not a JWT (docs/ops/README.md). Every other
 * function keeps the gateway's JWT check, the safe default. plan fails when a
 * function's header and this list disagree, so changing a function's gateway
 * check also changes this file (a founder-reviewed path).
 */
export const NO_VERIFY_JWT = ['config', 'content', 'purge-worker'];

/**
 * Functions whose GET /<name>/health answers without a session (RA-07-06, #202),
 * so the content-free smoke checks them after a deploy. Each is also in
 * NO_VERIFY_JWT: behind the gateway's check the route cannot answer anonymously.
 * Every other deployed function (analytics-forget, and apple-token and
 * subscription-status until S01 and S06 decide) is confirmed in the CLI's
 * function list instead. Add a name here when its owner adds an anonymous route.
 */
export const SMOKE_HEALTH = ['config', 'content', 'purge-worker'];

/** Never deployed by this workflow. */
export const NEVER = {
  escrow: 'escrow lives in its own project and only the founder deploys it (D-102)',
};

/** The push paths in deploy-functions.yml. A function importing a file outside them would not trigger a deploy when that file changes. */
export const WATCHED = ['supabase/functions/', 'packages/'];

/** Changing the deploy rules themselves redeploys everything under the new rules. */
export const SELF = ['.github/workflows/deploy-functions.yml', '.github/scripts/functions-deploy.mjs'];

const FUNCTIONS_DIR = 'supabase/functions';
const SLUG = /^[a-z][a-z0-9_-]{0,62}$/;

const toPosix = (p) => p.split('\\').join('/');

/** Function folders: a folder in supabase/functions with an index.ts, not starting with _ or . */
export function functionFolders(root) {
  const dir = join(root, FUNCTIONS_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => !n.startsWith('_') && !n.startsWith('.'))
    .filter((n) => statSync(join(dir, n)).isDirectory() && existsSync(join(dir, n, 'index.ts')))
    .sort();
}

/** The source with its comments blanked (newlines kept), skipping over string and template literals. */
export function withoutComments(source) {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];
    if (c === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') {
        out += ' ';
        i++;
      }
    } else if (c === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      const stop = end === -1 ? source.length : end + 2;
      for (; i < stop; i++) out += source[i] === '\n' ? '\n' : ' ';
    } else if (c === "'" || c === '"' || c === '`') {
      let j = i + 1;
      while (j < source.length && source[j] !== c && !(c !== '`' && source[j] === '\n')) j += source[j] === '\\' ? 2 : 1;
      out += source.slice(i, j + 1);
      i = j + 1;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

/**
 * Import specifiers in a module: static, side-effect and dynamic imports (also
 * with a plain template literal), and re-exports. Searched in the source as it
 * is and with its comments blanked, so a comment inside an import clause cannot
 * hide the import. Extra hits from comments only widen the set. CI compares the
 * result with `deno info --json` for every function (functions-deploy.test.mjs).
 */
export function specifiers(source) {
  const out = new Set();
  const patterns = [
    /\b(?:import|export)\s[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\s*\(\s*`([^`$]+)`\s*\)/g,
  ];
  for (const text of [source, withoutComments(source)]) for (const re of patterns) for (const m of text.matchAll(re)) out.add(m[1]);
  return [...out];
}

function readImportMap(root, fn) {
  const file = join(root, FUNCTIONS_DIR, fn, 'deno.json');
  if (!existsSync(file)) return { file: null, imports: {} };
  try {
    const json = JSON.parse(readFileSync(file, 'utf8'));
    return { file, imports: json && typeof json.imports === 'object' && json.imports ? json.imports : {} };
  } catch {
    return { file, imports: {} };
  }
}

/** The file a local specifier names, trying the extensions sloppy imports allow. */
function resolveFile(abs) {
  const tries = [abs, `${abs}.ts`, `${abs}.tsx`, `${abs}.js`, `${abs}.mjs`, join(abs, 'index.ts')];
  if (abs.endsWith('.js')) tries.splice(1, 0, `${abs.slice(0, -3)}.ts`);
  return tries.find((p) => existsSync(p) && statSync(p).isFile()) ?? null;
}

/**
 * Every repository file a function's bundle can contain: its index.ts, what that
 * imports through relative paths or relative entries in its deno.json, and so on,
 * plus the deno.json itself. Remote specifiers (npm:, jsr:, https:) are left out.
 */
export function closure(root, fn) {
  const absRoot = resolve(root);
  const map = readImportMap(root, fn);
  const seen = new Set();
  const files = new Set();
  if (map.file) files.add(toPosix(relative(absRoot, map.file)));
  const queue = [resolve(root, FUNCTIONS_DIR, fn, 'index.ts')];
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    files.add(toPosix(relative(absRoot, file)));
    for (const spec of specifiers(readFileSync(file, 'utf8'))) {
      let target = null;
      if (spec.startsWith('./') || spec.startsWith('../')) target = resolve(dirname(file), spec);
      else {
        const key = Object.keys(map.imports)
          .filter((k) => k === spec || (k.endsWith('/') && spec.startsWith(k)))
          .sort((a, b) => b.length - a.length)[0];
        const value = key === undefined ? null : map.imports[key];
        if (typeof value === 'string' && (value.startsWith('./') || value.startsWith('../'))) {
          target = resolve(dirname(map.file), key === spec ? value : value + spec.slice(key.length));
        }
      }
      if (!target) continue;
      const found = resolveFile(target);
      if (found && found.startsWith(absRoot)) queue.push(found);
    }
  }
  return [...files].sort();
}

/** The deploy command in a function's index.ts header, and whether it turns the gateway's JWT check off. */
export function headerDeploy(root, fn) {
  const source = readFileSync(join(root, FUNCTIONS_DIR, fn, 'index.ts'), 'utf8');
  const line = source.split('\n').find((l) => new RegExp(`supabase functions deploy ${fn}(\\s|$)`).test(l));
  if (!line) return null;
  return { noVerifyJwt: /--no-verify-jwt\b/.test(line) };
}

function functionOf(path) {
  const parts = path.split('/');
  return parts.length >= 4 && `${parts[0]}/${parts[1]}` === FUNCTIONS_DIR ? parts[2] : null;
}

/**
 * The deploy plan. `changed` is the list of changed paths for a push (null means
 * "unknown", which deploys everything); `only` is a manual run's input.
 */
export function plan(root, { changed = null, only = null } = {}) {
  const notes = [];
  const warnings = [];
  const errors = [];
  const folders = functionFolders(root);
  const deployable = folders.filter((n) => !(n in NEVER));
  for (const n of folders) if (!SLUG.test(n)) errors.push(`supabase/functions/${n}: not a valid function name (lower case letters, digits, - and _)`);
  for (const n of SMOKE_HEALTH) if (!NO_VERIFY_JWT.includes(n)) errors.push(`${n} is in SMOKE_HEALTH but not NO_VERIFY_JWT: behind the gateway's JWT check its health route cannot answer anonymously`);

  let deploy = [];
  let changedFunctions = [];
  if (only !== null) {
    const name = String(only).trim();
    if (name === 'all') deploy = [...deployable];
    else if (name in NEVER) errors.push(`${name}: not deployed here; ${NEVER[name]}`);
    else if (deployable.includes(name)) deploy = [name];
    else errors.push(`${name || '(empty)'}: no such function folder in supabase/functions (or "all")`);
  } else if (changed === null) {
    notes.push('The previous commit is not available, so every function is treated as changed.');
    deploy = [...deployable];
    changedFunctions = [...deployable];
  } else {
    const paths = changed.map((p) => toPosix(p.trim())).filter(Boolean);
    for (const name of Object.keys(NEVER)) {
      if (paths.some((p) => p.startsWith(`${FUNCTIONS_DIR}/${name}/`))) notes.push(`${name} changed and is not deployed: ${NEVER[name]}.`);
    }
    const gone = [...new Set(paths.map(functionOf).filter((n) => n && !folders.includes(n) && !n.startsWith('_') && !(n in NEVER)))];
    for (const n of gone) notes.push(`${n} is no longer in the repository; staging keeps it until the founder deletes it (this workflow never prunes).`);
    const changedSet = new Set(paths);
    for (const n of deployable) {
      if (closure(root, n).some((f) => changedSet.has(f))) changedFunctions.push(n);
    }
    const self = paths.filter((p) => SELF.includes(p));
    if (self.length) notes.push(`The deploy rules changed (${self.join(', ')}), so every function is deployed under them.`);
    if (changedFunctions.length || self.length) deploy = [...deployable];
  }

  for (const n of deploy) {
    const outside = closure(root, n).filter((f) => !WATCHED.some((w) => f.startsWith(w)) && !SELF.includes(f));
    if (outside.length) warnings.push(`${n} imports ${outside.join(', ')}, which the push paths of deploy-functions.yml do not watch: a change there will not deploy it.`);
    const header = headerDeploy(root, n);
    const listed = NO_VERIFY_JWT.includes(n);
    if (!header) warnings.push(`${n}: index.ts has no "supabase functions deploy ${n}" line, so it is deployed with the gateway's JWT check on.`);
    else if (header.noVerifyJwt !== listed) {
      errors.push(`${n}: its index.ts deploys it ${header.noVerifyJwt ? 'with' : 'without'} --no-verify-jwt but NO_VERIFY_JWT in .github/scripts/functions-deploy.mjs says ${listed ? 'with' : 'without'}. Make them agree in one PR.`);
    }
  }
  if (errors.length) deploy = [];
  return {
    deploy,
    noVerifyJwt: deploy.filter((n) => NO_VERIFY_JWT.includes(n)),
    smoke: deploy.filter((n) => SMOKE_HEALTH.includes(n)),
    changed: changedFunctions,
    notes,
    warnings,
    errors,
  };
}

/** `supabase functions list -o json`: an array (or null when the project has none). */
export function parseList(text) {
  let v;
  try {
    v = JSON.parse(text);
  } catch {
    return null;
  }
  if (v === null) return new Map();
  if (!Array.isArray(v)) return null;
  const out = new Map();
  for (const f of v) {
    if (!f || typeof f !== 'object' || typeof f.slug !== 'string') return null;
    out.set(f.slug, f);
  }
  return out;
}

const STATUS = /^[A-Z_]{1,24}$/;
const num = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : null);

/** One row per function: did the deploy land, as the function list sees it. */
export function confirm({ before, after, deployed, failed = [], noVerifyJwt = NO_VERIFY_JWT }) {
  const rows = [];
  for (const name of failed) rows.push({ name, ok: false, version: '', jwt: '', result: 'the deploy command failed (see the Deploy step)' });
  for (const name of deployed) {
    const was = before.get(name);
    const now = after.get(name);
    const wantJwt = !noVerifyJwt.includes(name);
    if (!now) {
      rows.push({ name, ok: false, version: '', jwt: '', result: 'not in the function list after the deploy' });
      continue;
    }
    const problems = [];
    const status = typeof now.status === 'string' && STATUS.test(now.status) ? now.status : 'an unexpected status';
    if (now.status !== 'ACTIVE') problems.push(`status is ${status}`);
    // Every deploy makes a new version; a later updated_at on the same version is a
    // metadata change, not this deploy. A version that is not a number fails closed.
    const v0 = num(was?.version);
    const v1 = num(now.version);
    if (v1 === null) problems.push('the function list does not give a numeric version');
    else if (was && v0 === null) problems.push('the list before the deploy did not give a numeric version');
    else if (was && v1 === v0) problems.push(`still version ${v1}, the same as before the deploy`);
    else if (was && v1 < v0) problems.push(`version ${v1}, lower than ${v0} before the deploy`);
    // A posture check: an answer that does not say whether the gateway checks JWTs is a failure, not a pass.
    let jwt = 'not reported';
    if (typeof now.verify_jwt === 'boolean') {
      jwt = now.verify_jwt ? 'on' : 'off';
      if (now.verify_jwt !== wantJwt) problems.push(`gateway JWT check is ${jwt}, expected ${wantJwt ? 'on' : 'off'}`);
    } else {
      problems.push(`the function list does not report verify_jwt, so the gateway JWT check (expected ${wantJwt ? 'on' : 'off'}) is unconfirmed`);
    }
    const version = v1 === null ? '' : was && v0 !== null ? `${v0} to ${v1}` : `new, ${v1}`;
    rows.push({ name, ok: problems.length === 0, version, jwt, result: problems.length ? problems.join('; ') : 'ACTIVE, new version' });
  }
  const failedCount = rows.filter((r) => !r.ok).length;
  const lines = [
    `### Function list after the deploy: ${failedCount ? `RED, ${failedCount} of ${rows.length} not confirmed` : `all ${rows.length} confirmed`}`,
    '',
    '| Function | Version | Gateway JWT check | Result |',
    '|---|---|---|---|',
    ...rows.map((r) => `| ${r.name} | ${r.version} | ${r.jwt} | ${r.ok ? 'PASS' : 'FAIL'}: ${r.result} |`),
    '',
    'From `supabase functions list -o json` before and after the deploys: slugs, status, version and verify_jwt only.',
    '',
  ];
  return { ok: failedCount === 0, rows, markdown: lines.join('\n') };
}

// ─── Migrations before functions ────────────────────────────────────────────

const MIGRATION_FILE = /^(\d+)_[^/]*\.sql$/;

/** The repository's migrations, as `supabase db push` reads them: <version>_<name>.sql in supabase/migrations. */
export function localMigrations(root) {
  const dir = join(root, 'supabase', 'migrations');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .map((file) => ({ file, m: MIGRATION_FILE.exec(file) }))
    .filter((x) => x.m)
    .map((x) => ({ version: x.m[1], file: x.file }))
    .sort((a, b) => a.version.localeCompare(b.version));
}

/** Local migration files whose version staging has not applied, in file order. */
export function pendingMigrations(local, applied) {
  const done = new Set(applied);
  return local.filter((m) => !done.has(m.version)).map((m) => m.file);
}

/** Control characters: a NUL makes spawn throw with the value in its message, so they never get that far. */
const CONTROL_RE = /[\u0000-\u001f\u007f]/;

/**
 * libpq settings for a postgres:// URL, so the password travels as PGPASSWORD,
 * never in argv. The same rules as #202's dbTargetOf (scripts/ops/lib/target.ts):
 * problems are fixed sentences that never echo any part of the URL; a control
 * character in the URL or in a decoded part is refused; TLS is required
 * (sslmode require, the default, verify-ca or verify-full).
 */
export function pgEnv(raw) {
  const no = (problem) => ({ env: null, problem });
  const text = String(raw ?? '').trim();
  if (text === '') return no('SUPABASE_DB_URL is not set');
  if (CONTROL_RE.test(text)) return no('SUPABASE_DB_URL holds a control character');
  let u;
  try {
    u = new URL(text);
  } catch {
    return no('SUPABASE_DB_URL is not a postgres:// URL');
  }
  if (u.protocol !== 'postgres:' && u.protocol !== 'postgresql:') return no('SUPABASE_DB_URL is not a postgres:// URL');
  if (!u.hostname || !u.username) return no('SUPABASE_DB_URL needs a host and a user');
  let user, password, database;
  try {
    user = decodeURIComponent(u.username);
    password = decodeURIComponent(u.password);
    database = decodeURIComponent(u.pathname.replace(/^\//, ''));
  } catch {
    return no('SUPABASE_DB_URL has a malformed percent escape');
  }
  if ([user, password, database].some((part) => CONTROL_RE.test(part))) return no('SUPABASE_DB_URL holds a control character');
  const sslmode = u.searchParams.get('sslmode') ?? 'require';
  if (!/^(require|verify-ca|verify-full)$/.test(sslmode)) return no('SUPABASE_DB_URL must use TLS: sslmode require, verify-ca or verify-full');
  return {
    env: { PGHOST: u.hostname.toLowerCase(), PGPORT: u.port || '5432', PGUSER: user, PGPASSWORD: password, PGDATABASE: database || 'postgres', PGSSLMODE: sslmode },
    problem: null,
  };
}

/** One read-only statement through psql. Returns its last output line, or the SQLSTATE of the failure (psql's own messages are never kept). */
export function psqlRead(env, sql, run = spawnSync) {
  let r;
  try {
    r = run(
      'psql',
      ['-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=sqlstate', '-c', 'begin transaction read only', '-c', "set local statement_timeout = '10s'", '-c', sql, '-c', 'rollback'],
      { env: { PATH: process.env.PATH ?? '/usr/bin:/bin', ...env, PGCONNECT_TIMEOUT: '10', PGAPPNAME: 'scribe-deploy-functions' }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
  } catch {
    // spawn throws synchronously on a bad argument or env value, with that value in its message: never shown.
    return { ok: false, why: 'psql did not run' };
  }
  if (r.error) return { ok: false, why: r.error.code === 'ENOENT' ? 'psql not found' : 'psql did not run' };
  if (r.status === 0) {
    const lines = String(r.stdout).split('\n').map((l) => l.trim()).filter(Boolean);
    return { ok: true, text: lines.length ? lines[lines.length - 1] : '' };
  }
  if (r.status === 2) return { ok: false, why: 'could not connect' };
  const state = /ERROR:\s+([0-9A-Z]{5})\b/.exec(String(r.stderr))?.[1];
  return { ok: false, why: state ? `the read failed (SQLSTATE ${state})` : 'the read failed' };
}

/** Staging's applied versions, then the local files it lacks. */
export function migrationsCheck(root, dbUrl, read = psqlRead) {
  const { env, problem } = pgEnv(dbUrl);
  if (!env) return { ok: false, error: problem };
  const exists = read(env, "select to_regclass('supabase_migrations.schema_migrations') is not null");
  if (!exists.ok) return { ok: false, error: exists.why };
  let applied = [];
  if (exists.text === 't') {
    const versions = read(env, "select coalesce(string_agg(version, ' ' order by version), '') from supabase_migrations.schema_migrations");
    if (!versions.ok) return { ok: false, error: versions.why };
    applied = versions.text.split(/\s+/).filter((v) => /^\d+$/.test(v));
  }
  const local = localMigrations(root);
  const pending = pendingMigrations(local, applied);
  return { ok: true, upToDate: pending.length === 0, local: local.length, pending };
}

function flags(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[a.slice(2)] = true;
    else {
      out[a.slice(2)] = next;
      i++;
    }
  }
  return out;
}

const list = (v) => (typeof v === 'string' ? v.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean) : []);

function main(argv) {
  const [command, ...rest] = argv;
  const f = flags(rest);
  const root = typeof f.root === 'string' ? f.root : process.cwd();
  if (command === 'plan') {
    let result;
    if (typeof f.only === 'string') result = plan(root, { only: f.only });
    else if (typeof f.changed === 'string') result = plan(root, { changed: readFileSync(f.changed, 'utf8').split('\n') });
    else if (f.all === true) result = plan(root, { changed: null });
    else {
      process.stderr.write('usage: functions-deploy.mjs plan (--changed <file> | --only <name|all> | --all)\n');
      return 2;
    }
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return result.errors.length ? 1 : 0;
  }
  if (command === 'confirm') {
    if (typeof f.before !== 'string' || typeof f.after !== 'string') {
      process.stderr.write('usage: functions-deploy.mjs confirm --before <json> --after <json> --deployed a,b [--failed c] [--no-verify-jwt a,b]\n');
      return 2;
    }
    const before = parseList(readFileSync(f.before, 'utf8'));
    const after = parseList(readFileSync(f.after, 'utf8'));
    if (!before || !after) {
      process.stdout.write('### Function list after the deploy: RED, `supabase functions list -o json` did not answer the expected list\n');
      return 1;
    }
    const r = confirm({
      before,
      after,
      deployed: list(f.deployed),
      failed: list(f.failed),
      noVerifyJwt: f['no-verify-jwt'] === undefined ? NO_VERIFY_JWT : list(f['no-verify-jwt']),
    });
    process.stdout.write(r.markdown);
    return r.ok ? 0 : 1;
  }
  if (command === 'migrations') {
    const r = migrationsCheck(root, process.env.SUPABASE_DB_URL);
    process.stdout.write(`${JSON.stringify(r)}\n`);
    return r.ok && r.upToDate ? 0 : 1;
  }
  process.stderr.write('usage: functions-deploy.mjs (plan | confirm | migrations) ...\n');
  return 2;
}

/** The one line printed when anything throws: never the error, its message or a stack (they can hold a decoded credential). */
export const STOPPED_LINE = '{"ok":false,"error":"stopped: functions-deploy.mjs failed unexpectedly; no detail is printed (exit 2)"}';

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const stop = () => {
    process.stdout.write(`${STOPPED_LINE}\n`);
    process.exit(2);
  };
  process.on('uncaughtException', stop);
  process.on('unhandledRejection', stop);
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch {
    stop();
  }
}

