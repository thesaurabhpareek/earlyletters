// Release check B-8 (apps/mobile/e2e/TESTID_REQUESTS.md section 4): no e2e seam
// code in a bundle that can reach TestFlight or the App Store.
//
//   node .github/scripts/seam-guard.mjs --profile testflight [--profile production]
//   node .github/scripts/seam-guard.mjs --store-profiles      every store profile in eas.json
//
// For each profile: the env from apps/mobile/eas.json (following `extends`),
// with the e2e switches in FORCED_ON turned on, the worst case where a flag
// leaks into the build (an EAS environment variable, a shell). Then
// `expo export --platform ios --no-bytecode` and a search of every exported
// file for the seam identifiers. Any hit fails the run. A positive control
// (the public product name from packages/brand, which every bundle shows)
// makes sure the search can see the bundle at all.
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
  'e2eKillDrill',
  'e2eKillRun',
  'e2eKillKind',
  'e2eKillPlant',
  'e2eSeed',
  'e2eOffline',
  'e2eConfig',
  'Asha kill drill',
];

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

/** The export's environment: the runner's without any EXPO_PUBLIC_* it had, then the profile's, then FORCED_ON. */
export function exportEnv(base, profileEnvValues) {
  const out = {};
  for (const [k, v] of Object.entries(base)) if (!k.startsWith('EXPO_PUBLIC_')) out[k] = v;
  return { ...out, ...profileEnvValues, ...FORCED_ON, CI: '1' };
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

/** One profile: export, then search. Returns true when the bundle is clean. */
export async function guard(root, eas, profile, log, run = spawnSync) {
  const env = profileEnv(eas, profile);
  const out = mkdtempSync(join(tmpdir(), `seam-guard-${profile}-`));
  try {
    const r = run('npx', ['expo', 'export', '--platform', 'ios', '--no-bytecode', '--clear', '--output-dir', out], {
      cwd: join(root, 'apps/mobile'),
      env: exportEnv(process.env, env),
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    if (r.status !== 0) {
      log(`::error::B-8 ${profile}: expo export failed (exit ${r.status}), so the bundle was not checked.`);
      log(String(r.stderr || r.stdout || '').split('\n').slice(-30).join('\n'));
      return false;
    }
    const files = listFiles(out).filter((f) => /\.(js|hbc|json)$/.test(f));
    const texts = files.map((f) => readFileSync(f, 'latin1'));
    const bytes = texts.reduce((s, t) => s + t.length, 0);
    const control = await publicName(root);
    const seen = texts.some((t) => t.includes(control));
    if (!files.some((f) => f.endsWith('.js')) || bytes < MIN_BUNDLE_BYTES || !seen) {
      log(`::error::B-8 ${profile}: the export does not look like the app's bundle (${files.length} files, ${bytes} bytes, public name ${seen ? 'found' : 'missing'}), so a clean search would prove nothing.`);
      return false;
    }
    const found = Object.entries(scan(texts));
    const forced = Object.entries(FORCED_ON).map(([k, v]) => `${k}=${v}`).join(' ');
    if (found.length) {
      log(`::error::B-8 ${profile}: the ${profile} bundle carries e2e seam code when ${forced} reaches it (${found.map(([k, n]) => `${k} x${n}`).join(', ')}). The gate in apps/mobile/src/dev/e2e-seams.ts must keep seams out of every store profile; until it does, no wiring line ships (RA-20-18).`);
      return false;
    }
    log(`B-8 ${profile}: clean. ${files.length} files, ${bytes} bytes, EXPO_PUBLIC_APP_ENV=${env.EXPO_PUBLIC_APP_ENV ?? '(unset)'}, ${forced} forced; none of ${SEAM_IDENTIFIERS.length} seam identifiers.`);
    return true;
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

const USAGE = 'usage: node .github/scripts/seam-guard.mjs (--profile <name> ... | --store-profiles)';

export async function main(argv, root = process.cwd(), log = (s) => console.log(s)) {
  const eas = JSON.parse(readFileSync(join(root, EAS_JSON), 'utf8'));
  const profiles = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--profile' && argv[i + 1] && !argv[i + 1].startsWith('--')) profiles.push(argv[++i]);
    else if (argv[i] === '--store-profiles') profiles.push(...storeProfiles(eas));
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
  return ok ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
