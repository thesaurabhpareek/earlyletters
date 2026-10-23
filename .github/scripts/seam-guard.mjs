// Release check B-8 (apps/mobile/e2e/TESTID_REQUESTS.md section 4): no e2e seam
// code in a bundle that can reach TestFlight or the App Store.
//
//   node .github/scripts/seam-guard.mjs --profile testflight [--profile production]
//   node .github/scripts/seam-guard.mjs --store-profiles      every store profile in eas.json
//   node .github/scripts/seam-guard.mjs --store-profiles --e2e-control
//   node .github/scripts/seam-guard.mjs --changed-since <base> <head>
//
// Where it runs: the job "no e2e seam in store bundles (B-8)" in .github/workflows/ci.yml, on
// every pull request, under the `required` aggregator; and in testflight.yml before the EAS
// build, for the profile being built. The ci.yml job always runs this file's tests, then runs
// the exports only when the pull request changed something that can reach the bundle or the
// check itself (--changed-since, below). A job whose export step was skipped still reports
// success, so `required` stays the one required check (docs/release/AUTOMATION.md 2.1).
//
// --changed-since <base> <head> prints `run=true` or `run=false`: whether `git diff base...head`
// touches a path in BUNDLE_PATHS. It prints `run=true` when the diff cannot be computed, so a
// missing base can never skip the check.
//
// --e2e-control is the positive control, decided from the e2e export itself: the `e2e` profile
// is exported as it builds and must carry the seam, which proves the search can see seam code
// at all. If it does not carry the seam and a file under apps/mobile/src imports the seams
// module, the control fails (the wiring is in, the gate is wrong). Only when nothing imports it
// is the control skipped, with a line saying so (the RA-20-18 wiring line has not landed).
//
// For each profile: the env from apps/mobile/eas.json (following `extends`), with the e2e
// switches in FORCED_ON turned on, the worst case where a flag leaks into the build (an EAS
// environment variable, a shell). Then `expo export --platform ios --no-bytecode` and a search
// of every exported file for the seam identifiers. Any hit fails the run.
//
// Since B-9, app.config.ts refuses to evaluate when the flag meets a store profile, so the
// forced export is expected to stop at config time. That refusal counts as holding, and the
// profile is then exported as it builds (without the flag) and searched the same way. Any
// other export failure fails the run. A positive control (the public product name from
// packages/brand, which every bundle shows) makes sure a search can see the bundle at all.
//
// No secrets. Run `npm ci` at the repository root first. Exit 0 clean, 1 a seam found or the
// export failed, 2 usage.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Strings only seam code carries: the launch-argument keys and fixed texts of
 * apps/mobile/src/dev (TESTID_REQUESTS.md sections 3 and 4). Kept here, in a
 * founder-reviewed path, so a change to a seam cannot also weaken the check.
 * The e2e build must contain them; the kill-harness workflow checks that side.
 */
export const SEAM_IDENTIFIERS = [
  // S19's list on #203 (B-8, rewritten).
  'e2eSeed',
  'e2eOffline',
  'e2eConfig',
  'e2eKillDrill',
  'e2eKillRun',
  'e2eKillPlant',
  'kill-drill',
  'Asha kill drill',
  // The drill's other launch-argument keys (DRILL_ARG in apps/mobile/e2e/kill/protocol.mjs; a test keeps them in sync).
  'e2eKillKind',
  'e2eKillPoint',
];

/** The identifier the e2e bundle must carry for the positive control: the drill's mode key. */
export const CONTROL_IDENTIFIER = 'e2eKillDrill';

/** How app.config.ts says it refused a build for B-9 (apps/mobile/src/lib/build-env.ts, e2eRefusal). */
export const B9_REFUSAL = /EXPO_PUBLIC_E2E=1 .*\(B-9\)/;

/** The switches that turn seams on, forced on for the check: if the gate holds with them on, it holds with any value. */
export const FORCED_ON = { EXPO_PUBLIC_E2E: '1' };

/**
 * Paths whose change can alter what a store bundle carries, or what this check enforces. A pull
 * request that touches none of them skips the exports (its bundle is the base branch's, already
 * checked there). The workflow files are here because they decide when and how the check runs.
 */
export const BUNDLE_PATHS = [
  /^apps\/mobile\//,
  /^packages\//,
  /^package\.json$/,
  /^package-lock\.json$/,
  /^\.github\/scripts\/seam-guard\.mjs$/,
  /^\.github\/scripts\/seam-guard\.test\.mjs$/,
  /^\.github\/workflows\/ci\.yml$/,
  /^\.github\/workflows\/testflight\.yml$/,
];

const EAS_JSON = 'apps/mobile/eas.json';
const SEAMS_MODULE = 'apps/mobile/src/dev/e2e-seams.ts';
const MIN_BUNDLE_BYTES = 500_000;

function profileOf(eas, name) {
  const p = eas?.build?.[name];
  if (!p || typeof p !== 'object') throw new Error(`no build profile "${name}" in ${EAS_JSON}`);
  return p;
}

/** The chain from the profile to its root base, guarding against cycles. */
function chain(eas, name) {
  const out = [];
  for (let n = name; n !== undefined; n = profileOf(eas, n).extends) {
    if (out.includes(n)) throw new Error(`build profile "${name}" extends itself through "${n}"`);
    out.push(n);
  }
  return out;
}

/** A profile's env: the base first, then each child over it, as EAS merges `extends`. */
export function profileEnv(eas, name) {
  return chain(eas, name)
    .reverse()
    .reduce((env, n) => ({ ...env, ...(profileOf(eas, n).env ?? {}) }), {});
}

function setting(eas, name, path) {
  for (const n of chain(eas, name)) {
    const v = path.reduce((o, k) => (o == null ? undefined : o[k]), profileOf(eas, n));
    if (v !== undefined) return v;
  }
  return undefined;
}

/** Profiles whose build can be uploaded: distribution "store" (EAS's default) and not a simulator build. */
export function storeProfiles(eas) {
  return Object.keys(eas?.build ?? {})
    .filter((n) => (setting(eas, n, ['distribution']) ?? 'store') === 'store' && setting(eas, n, ['ios', 'simulator']) !== true)
    .sort();
}

/** How often each identifier occurs in the texts; identifiers with no hit are left out. */
export function scan(texts, identifiers = SEAM_IDENTIFIERS) {
  const hits = {};
  for (const id of identifiers) {
    let n = 0;
    for (const t of texts) for (let at = t.indexOf(id); at !== -1; at = t.indexOf(id, at + id.length)) n++;
    if (n) hits[id] = n;
  }
  return hits;
}

/**
 * The export's environment: the runner's without any EXPO_PUBLIC_* it had, then
 * the profile's, then (when `forced`) FORCED_ON.
 */
export function exportEnv(base, profileEnvValues, forced = true) {
  const out = {};
  for (const [k, v] of Object.entries(base)) if (!k.startsWith('EXPO_PUBLIC_')) out[k] = v;
  return { ...out, ...profileEnvValues, ...(forced ? FORCED_ON : {}), CI: '1' };
}

/** The changed paths that can reach a store bundle or change this check (see BUNDLE_PATHS). */
export function relevant(files) {
  return files.filter((f) => BUNDLE_PATHS.some((re) => re.test(f)));
}

/**
 * The files `git diff --name-only base...head` lists (the head side since the merge base), or
 * `files: null` with a reason when there is nothing to compare or git cannot answer. The caller
 * runs the exports in that case: not knowing is never a reason to skip.
 */
export function changedSince(base, head, run = spawnSync, cwd = process.cwd()) {
  if (!base || !head || /^0+$/.test(base) || /^0+$/.test(head)) return { files: null, reason: 'no base and head to compare' };
  const r = run('git', ['diff', '--name-only', '--no-renames', `${base}...${head}`], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (r.status !== 0) return { files: null, reason: `git diff ${base}...${head} failed (exit ${r.status}): ${(r.stderr ?? '').trim().split('\n').slice(-1)[0] ?? ''}` };
  return { files: (r.stdout ?? '').split('\n').map((s) => s.trim()).filter(Boolean), reason: null };
}

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? listFiles(p) : [p];
  });
}

/** A specifier that ends in the seams module, in an import, a re-export, a dynamic import or a require. */
const SEAMS_IMPORT = /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)['"][^'"\n]*\/e2e-seams(?:\.[cm]?[jt]sx?)?['"]/;

function withoutComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/**
 * The app files that import the seams module (the RA-20-18 wiring, under whatever name or path),
 * relative to the repository root. The module itself and test files do not count.
 */
export function seamImporters(root) {
  const src = join(root, 'apps/mobile/src');
  if (!existsSync(src)) return [];
  return listFiles(src)
    .filter((f) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f) && !/\.test\.[cm]?[jt]sx?$/.test(f))
    .filter((f) => relative(root, f) !== SEAMS_MODULE)
    .filter((f) => SEAMS_IMPORT.test(withoutComments(readFileSync(f, 'utf8'))))
    .map((f) => relative(root, f))
    .sort();
}

async function publicName(root) {
  const { brand } = await import(resolve(root, 'packages/brand/index.ts'));
  if (typeof brand?.name !== 'string' || brand.name.length < 3) throw new Error('packages/brand has no public name for the positive control');
  return brand.name;
}

/** One export: { status: 'ok', files, bytes, hits, seen } or { status: 'refused' | 'failed', output }. */
async function exportAndScan(root, env, run) {
  const out = mkdtempSync(join(tmpdir(), 'seam-guard-'));
  try {
    const r = run('npx', ['expo', 'export', '--platform', 'ios', '--no-bytecode', '--clear', '--output-dir', out], {
      cwd: join(root, 'apps/mobile'),
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    const output = `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
    if (r.status !== 0) return { status: B9_REFUSAL.test(output) ? 'refused' : 'failed', exit: r.status, output };
    const files = listFiles(out).filter((f) => /\.(js|hbc|json)$/.test(f));
    const texts = files.map((f) => readFileSync(f, 'latin1'));
    const bytes = texts.reduce((n, t) => n + t.length, 0);
    const control = await publicName(root);
    return { status: 'ok', files, bytes, hits: scan(texts), seen: texts.some((t) => t.includes(control)), looksLikeApp: files.some((f) => f.endsWith('.js')) && bytes >= MIN_BUNDLE_BYTES };
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

/** Checks one export's bundle; logs and returns false on a seam or a bundle that proves nothing. */
function judge(profile, label, r, log) {
  if (!r.looksLikeApp || !r.seen) {
    log(`::error::B-8 ${profile}: the export ${label} does not look like the app's bundle (${r.files.length} files, ${r.bytes} bytes, public name ${r.seen ? 'found' : 'missing'}), so a clean search would prove nothing.`);
    return false;
  }
  const found = Object.entries(r.hits);
  if (found.length) {
    log(`::error::B-8 ${profile}: the bundle exported ${label} carries e2e seam code (${found.map(([k, n]) => `${k} x${n}`).join(', ')}). The gate in ${SEAMS_MODULE} must keep seams out of every store profile; until it does, no wiring line ships (RA-20-18).`);
    return false;
  }
  return true;
}

/** One profile: the forced export, then (after a B-9 refusal) the export as it builds. True when nothing leaks. */
export async function guard(root, eas, profile, log, run = spawnSync) {
  const env = profileEnv(eas, profile);
  const forced = Object.entries(FORCED_ON).map(([k, v]) => `${k}=${v}`).join(' ');
  const appEnv = `EXPO_PUBLIC_APP_ENV=${env.EXPO_PUBLIC_APP_ENV ?? '(unset)'}`;
  const first = await exportAndScan(root, exportEnv(process.env, env, true), run);
  if (first.status === 'ok') {
    if (!judge(profile, `with ${forced}`, first, log)) return false;
    log(`B-8 ${profile}: clean with ${forced} forced. ${first.files.length} files, ${first.bytes} bytes, ${appEnv}; none of ${SEAM_IDENTIFIERS.length} seam identifiers.`);
    return true;
  }
  if (first.status === 'failed') {
    log(`::error::B-8 ${profile}: expo export with ${forced} failed (exit ${first.exit}) for a reason other than the B-9 refusal, so the bundle was not checked.`);
    log(first.output.split('\n').filter(Boolean).slice(-30).join('\n'));
    return false;
  }
  const built = await exportAndScan(root, exportEnv(process.env, env, false), run);
  if (built.status !== 'ok') {
    log(`::error::B-8 ${profile}: expo export as the profile builds failed (exit ${built.exit}), so the bundle was not checked.`);
    log(built.output.split('\n').filter(Boolean).slice(-30).join('\n'));
    return false;
  }
  if (!judge(profile, 'as the profile builds', built, log)) return false;
  log(`B-8 ${profile}: app.config.ts refused the build with ${forced} (B-9), and the bundle as the profile builds is clean. ${built.files.length} files, ${built.bytes} bytes, ${appEnv}; none of ${SEAM_IDENTIFIERS.length} seam identifiers.`);
  return true;
}

/**
 * The positive control, decided from the e2e export: the `e2e` profile is exported as it builds
 * (EXPO_PUBLIC_E2E=1, development app env). It passes when the bundle carries the seam. It fails
 * when it does not and a file under apps/mobile/src imports the seams module: the wiring is in
 * and the gate kept the seam out of the one build that must carry it. It is skipped, with a
 * line saying why, only when nothing imports the module (before RA-20-18).
 */
export async function e2eControl(root, eas, log, run = spawnSync) {
  if (!eas.build?.e2e) {
    log(`::error::B-8 positive control: no "e2e" build profile in ${EAS_JSON} (TESTID_REQUESTS.md B-1).`);
    return false;
  }
  const r = await exportAndScan(root, exportEnv(process.env, profileEnv(eas, 'e2e'), false), run);
  if (r.status !== 'ok') {
    log(`::error::B-8 positive control: expo export of the e2e profile failed (exit ${r.exit}).`);
    log(r.output.split('\n').filter(Boolean).slice(-30).join('\n'));
    return false;
  }
  if (!r.looksLikeApp || !r.seen) {
    log(`::error::B-8 positive control: the e2e export does not look like the app's bundle (${r.files.length} files, ${r.bytes} bytes).`);
    return false;
  }
  if (r.hits[CONTROL_IDENTIFIER]) {
    log(`B-8 positive control: the e2e bundle carries the seam (${Object.entries(r.hits).map(([k, n]) => `${k} x${n}`).join(', ')}), so the search can see it.`);
    return true;
  }
  const importers = seamImporters(root);
  if (importers.length) {
    log(`::error::B-8 positive control: ${importers.join(', ')} import${importers.length === 1 ? 's' : ''} the seams module, but the e2e bundle does not carry ${CONTROL_IDENTIFIER}, so a clean store bundle proves nothing. Check the gate in ${SEAMS_MODULE} and the e2e profile's env.`);
    return false;
  }
  log(`B-8 positive control: skipped. No file under apps/mobile/src imports the seams module yet (RA-20-18), so no bundle can carry the seam to find; the e2e export (${r.files.length} files, ${r.bytes} bytes) is clean as expected.`);
  return true;
}

const USAGE = 'usage: node .github/scripts/seam-guard.mjs (--profile <name> ... | --store-profiles) [--e2e-control] | --changed-since <base> <head>';

export async function main(argv, root = process.cwd(), log = (s) => console.log(s), run = spawnSync) {
  if (argv[0] === '--changed-since') {
    if (argv.length !== 3 || argv[1].startsWith('--') || argv[2].startsWith('--')) {
      log(USAGE);
      return 2;
    }
    const { files, reason } = changedSince(argv[1], argv[2], run, root);
    if (files === null) {
      log(`B-8: ${reason}; the exports run.`);
      log('run=true');
      return 0;
    }
    const hits = relevant(files);
    if (hits.length) log(`B-8: ${hits.length} of ${files.length} changed files can reach a store bundle or change this check (${hits.slice(0, 8).join(', ')}${hits.length > 8 ? ', ...' : ''}); the exports run.`);
    else log(`B-8: none of the ${files.length} changed files can reach a store bundle or change this check; the exports are skipped (the base branch's bundle was checked there).`);
    log(`run=${hits.length ? 'true' : 'false'}`);
    return 0;
  }
  const eas = JSON.parse(readFileSync(join(root, EAS_JSON), 'utf8'));
  const profiles = [];
  let control = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--profile' && argv[i + 1] && !argv[i + 1].startsWith('--')) profiles.push(argv[++i]);
    else if (argv[i] === '--store-profiles') profiles.push(...storeProfiles(eas));
    else if (argv[i] === '--e2e-control') control = true;
    else {
      log(USAGE);
      return 2;
    }
  }
  if (!profiles.length) {
    log(USAGE);
    return 2;
  }
  for (const p of profiles) {
    if (!eas.build?.[p]) {
      log(`::error::B-8: no build profile "${p}" in ${EAS_JSON}.`);
      return 2;
    }
  }
  if (!existsSync(join(root, 'node_modules'))) {
    log('Run npm ci at the repository root first.');
    return 2;
  }
  let ok = true;
  for (const p of [...new Set(profiles)]) ok = (await guard(root, eas, p, log)) && ok;
  if (control) ok = (await e2eControl(root, eas, log)) && ok;
  return ok ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
