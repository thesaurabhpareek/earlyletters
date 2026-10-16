// Which Edge Functions deploy-functions.yml deploys to staging, and whether the
// deploy landed (RA-20-05; docs/release/AUTOMATION.md section 2.2; docs/ops/DEPLOY.md
// "Edge Functions to staging").
//
//   node .github/scripts/functions-deploy.mjs plan --changed <file>   a push: <file> lists the changed paths
//   node .github/scripts/functions-deploy.mjs plan --only <name|all>  a manual run
//   node .github/scripts/functions-deploy.mjs confirm --before <json> --after <json> --deployed a,b [--failed c]
//
// plan prints one JSON object and exits 1 on an error (nothing is deployed then):
//   { deploy, noVerifyJwt, smoke, changed, notes, warnings, errors }
// A push deploys every function once any function's code changed, not only the
// changed ones: GitHub replaces a pending run in the concurrency group with the
// newest one, so the newest run has to carry every earlier change (deploy-db.yml
// works the same way: `db push` applies everything pending).
//
// confirm reads two `supabase functions list -o json` outputs (before and after
// the deploys), prints a Markdown table and exits 1 unless every deployed
// function is ACTIVE, moved to a new version, and has the gateway JWT setting it
// was deployed with.
//
// No network and no secrets: plan reads the repository, confirm reads two files.
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

/** Import specifiers in a module: static, side-effect and dynamic imports, and re-exports. Comments may add extra hits; extra hits only widen the set. */
export function specifiers(source) {
  const out = new Set();
  const patterns = [
    /\b(?:import|export)\s[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const re of patterns) for (const m of source.matchAll(re)) out.add(m[1]);
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
    const v0 = num(was?.version);
    const v1 = num(now.version);
    const u0 = num(was?.updated_at);
    const u1 = num(now.updated_at);
    const moved = !was || (v0 !== null && v1 !== null && v1 > v0) || (u0 !== null && u1 !== null && u1 > u0);
    if (!moved) problems.push('same version and update time as before the deploy');
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
    'From `supabase functions list -o json` before and after the deploys: slugs, status, version, update time and verify_jwt only.',
    '',
  ];
  return { ok: failedCount === 0, rows, markdown: lines.join('\n') };
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
  process.stderr.write('usage: functions-deploy.mjs (plan | confirm) ...\n');
  return 2;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}

