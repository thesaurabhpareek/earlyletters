// Release check B-8 (apps/mobile/e2e/TESTID_REQUESTS.md section 4): no e2e seam
// code in a bundle that can reach TestFlight or the App Store.
//
//   node .github/scripts/seam-guard.mjs --profile testflight [--profile production]
//   node .github/scripts/seam-guard.mjs --store-profiles      every store profile in eas.json
//   node .github/scripts/seam-guard.mjs --store-profiles --e2e-control
//
// --e2e-control is the positive control: once the RA-20-18 wiring line is in
// app/_layout.tsx, the `e2e` profile is exported too and must carry the seam,
// which proves the search can see seam code at all. Before the wiring line no
// bundle can carry it, so the control says so and is skipped.
//
// For each profile: the env from apps/mobile/eas.json (following `extends`),
// with the e2e switches in FORCED_ON turned on, the worst case where a flag
// leaks into the build (an EAS environment variable, a shell). Then
// `expo export --platform ios --no-bytecode` and a search of every exported
// file for the seam identifiers. Any hit fails the run.
//
// Since B-9, app.config.ts refuses to evaluate when the flag meets a store
// profile, so the forced export is expected to stop at config time. That
// refusal counts as holding, and the profile is then exported as it builds
// (without the flag) and searched the same way. Any other export failure
// fails the run. A positive control (the public product name from
// packages/brand, which every bundle shows) makes sure a search can see the
// bundle at all.
//
// No secrets. Run `npm ci` at the repository root first. Exit 0 clean, 1 a seam
// found or the export failed, 2 usage.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
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

/** The RA-20-18 wiring line: the root layout imports and calls the seams hook. */
export function wiringPresent(layoutSource) {
  return /from\s+['"]@\/dev\/e2e-seams['"]/.test(layoutSource) && /\buseE2eSeams\(\)/.test(layoutSource);
}

/** How app.config.ts says it refused a build for B-9 (apps/mobile/src/lib/build-env.ts, e2eRefusal). */
export const B9_REFUSAL = /EXPO_PUBLIC_E2E=1 .*\(B-9\)/;

/** The switches that turn seams on, forced on for the check: if the gate holds with them on, it holds with any value. */
export const FORCED_ON = { EXPO_PUBLIC_E2E: '1' };

const EAS_JSON = 'apps/mobile/eas.json';
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

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? listFiles(p) : [p];
  });
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
    log(`::error::B-8 ${profile}: the bundle exported ${label} carries e2e seam code (${found.map(([k, n]) => `${k} x${n}`).join(', ')}). The gate in apps/mobile/src/dev/e2e-seams.ts must keep seams out of every store profile; until it does, no wiring line ships (RA-20-18).`);
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
 * The positive control: export the `e2e` profile as it builds (EXPO_PUBLIC_E2E=1, development app env) and
 * require the seam. Skipped, with a line saying why, while the wiring line is not in app/_layout.tsx.
 */
export async function e2eControl(root, eas, log, run = spawnSync) {
  const layout = join(root, 'apps/mobile/src/app/_layout.tsx');
  if (!existsSync(layout) || !wiringPresent(readFileSync(layout, 'utf8'))) {
    log('B-8 positive control: skipped. The RA-20-18 wiring line is not in apps/mobile/src/app/_layout.tsx yet, so no bundle can carry the seam to find.');
    return true;
  }
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
  if (!r.hits[CONTROL_IDENTIFIER]) {
    log(`::error::B-8 positive control: the e2e bundle does not carry ${CONTROL_IDENTIFIER}, so a clean store bundle proves nothing. Check the wiring line and the gate in apps/mobile/src/dev/e2e-seams.ts.`);
    return false;
  }
  log(`B-8 positive control: the e2e bundle carries the seam (${Object.entries(r.hits).map(([k, n]) => `${k} x${n}`).join(', ')}), so the search can see it.`);
  return true;
}

const USAGE = 'usage: node .github/scripts/seam-guard.mjs (--profile <name> ... | --store-profiles) [--e2e-control]';

export async function main(argv, root = process.cwd(), log = (s) => console.log(s)) {
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
