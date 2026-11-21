/**
 * The backup gate check (CR-71 B5, BRIEF B5 PR 4, test B5-7): no build may switch `EXPO_PUBLIC_BACKUP` on until
 * (1) B5 exists (the backup file is excluded and deleted on Erase and sign-out, its token is in the Keychain),
 * (2) the bundled escrow key list is not empty, and
 * (3) the `/stop` page exists (its route file, and a unit test that answers 200).
 *
 * STATIC only: no network call, no build, no device. The live 200 of the `/stop` page is a release step for `ops`.
 * Pure: `backupGateProblems` takes plain values; `gatherBackupGateInputs` takes every path and every file access it
 * uses, so a test runs both on fixtures. `ops` wires this into the preflight scripts (BL-958); mobile does not edit them.
 */

/** Files whose presence is "B5 exists". Each is read by the check, so a rename shows up as a failure, not a pass. */
export const B5_FILES = [
  'src/lib/backup/files.ts', // exclusion with read-back, delete on Erase and sign-out
  'src/lib/backup/token-vault.ts', // the upload token in the Keychain
  'src/lib/backup/launch-migrate.ts', // old rows moved once
];

/** What each B5 file must still contain (a hollow or renamed function is a failure). */
export const B5_MARKERS = [
  ['src/lib/backup/files.ts', /export function deleteBackupFiles\b/],
  ['src/lib/backup/files.ts', /export function endBackupFileFor\b/],
  ['src/lib/backup/files.ts', /export function secureBackupFilesAtLaunch\b/],
  ['src/lib/erase-everything.ts', /\bdeleteBackupFiles\(\)/],
  ['src/lib/erase-everything.ts', /\bremoveAllBackupTokens\(\)/],
  ['src/lib/auth/session-provider.tsx', /\bendBackupFileFor\(/],
];

/**
 * Whether a value turns a build switch on, parsed EXACTLY as the app parses it: `trim().toLowerCase() === 'on'`
 * (apps/mobile/app.config.ts `isOn`, line 172, and src/lib/capabilities.ts `parseServerFeatures`, line 115). A script cannot
 * import those (TypeScript, and app.config.ts reads process.env), so the one-liner is repeated here: change all three together.
 * So "ON", "On" and " on" are on. Exact equality would fail open.
 */
export const isOn = (raw) => (raw ?? '').trim().toLowerCase() === 'on';

/** Drops // and block comments, so a commented-out key does not count. */
export function stripComments(src) {
  return src.replace(/\/\*[^]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** A plausible escrow public key: base64 of 32 bytes (an X25519 key, ESCROW contract), and not all zero bytes. A placeholder fails. */
export function plausibleEscrowKey(k) {
  if (!/^[A-Za-z0-9+/]{43}=$/.test(k)) return false;
  return Buffer.from(k, 'base64').some((b) => b !== 0);
}

/** How many keys the bundled list holds: entries with a numeric `version` and a plausible `publicKey`. */
export function bundledEscrowKeyCount(escrowKeysSource) {
  const code = stripComments(escrowKeysSource);
  const m = /BUNDLED_ESCROW_KEYS[^=]*=\s*\[([^]*?)\]\s*;/.exec(code);
  if (!m) return 0;
  return [...m[1].matchAll(/\{[^{}]*\}/g)].filter((e) => {
    const key = /\bpublicKey\s*:\s*['"`]([^'"`]*)['"`]/.exec(e[0]);
    return /\bversion\s*:\s*\d+/.test(e[0]) && key !== null && plausibleEscrowKey(key[1]);
  }).length;
}

/**
 * @param {{
 *   profiles: Record<string, string | undefined>,   EXPO_PUBLIC_BACKUP per EAS profile (undefined: not set, so off)
 *   profileCount: number,                            how many EAS build profiles eas.json lists
 *   shellValue?: string | undefined,                 EXPO_PUBLIC_BACKUP in the shell, if the caller reads it
 *   missingB5Files: string[],                        B5_FILES that are absent
 *   missingB5Markers: string[],                      B5_MARKERS that no longer match
 *   escrowKeyCount: number,
 *   stopRouteFile: boolean,                          apps/web/src/app/stop/page.tsx or route.ts exists
 *   stopTestAnswers200: boolean,                     a unit test of the stop route that expects 200
 * }} input
 * @returns {{ on: boolean, problems: { id: string, msg: string }[] }} Nothing is required while no profile says on.
 */
export function backupGateProblems(input) {
  const onIn = Object.entries(input.profiles).filter(([, v]) => isOn(v)).map(([k]) => k);
  const shellOn = isOn(input.shellValue);
  if (shellOn) onIn.push('the shell');
  if (onIn.length === 0) return { on: false, problems: [] };
  const where = onIn.join(', ');
  const problems = [];
  // A shell value of on overrides what eas.json says, so an eas.json with no profiles cannot vouch for anything then.
  // With the shell not on, an eas.json with no profiles has nothing on and needs no check (the early return above).
  if (shellOn && !(input.profileCount > 0)) {
    problems.push({ id: 'eas-no-profiles', msg: `EXPO_PUBLIC_BACKUP=on in the shell but eas.json lists no build profile to check` });
  }
  if (input.missingB5Files.length > 0 || input.missingB5Markers.length > 0) {
    problems.push({ id: 'b5-missing', msg: `EXPO_PUBLIC_BACKUP=on (${where}) but B5 is not all there: ${[...input.missingB5Files, ...input.missingB5Markers].join(', ')}` });
  }
  if (!(input.escrowKeyCount > 0)) {
    problems.push({ id: 'escrow-keys-empty', msg: `EXPO_PUBLIC_BACKUP=on (${where}) but BUNDLED_ESCROW_KEYS is empty (the founder's key ceremony, runbook K1 to K7)` });
  }
  if (!input.stopRouteFile) {
    problems.push({ id: 'stop-route-missing', msg: `EXPO_PUBLIC_BACKUP=on (${where}) but the /stop route file does not exist (apps/web/src/app/stop)` });
  } else if (!input.stopTestAnswers200) {
    problems.push({ id: 'stop-test-missing', msg: `EXPO_PUBLIC_BACKUP=on (${where}) but no unit test shows the /stop route answering 200` });
  }
  return { on: true, problems };
}

/**
 * Reads the inputs from a repo. `mobileDir` is apps/mobile, `webDir` is apps/web; `io` is `{ exists(path), read(path),
 * list(dir) }` (node:fs in the test and in the preflight).
 */
export function gatherBackupGateInputs({ mobileDir, webDir, join, io, shellValue }) {
  const eas = JSON.parse(io.read(join(mobileDir, 'eas.json')));
  const build = eas.build ?? {};
  // `extends`: a profile inherits its parent's env, its own env wins. A static check cannot see EAS dashboard
  // environment variables or `eas build --env`, so those stay an ops release step.
  const envOf = (name, seen = new Set()) => {
    if (seen.has(name) || !build[name]) return {};
    seen.add(name);
    const parent = typeof build[name].extends === 'string' ? envOf(build[name].extends, seen) : {};
    return { ...parent, ...(build[name].env ?? {}) };
  };
  const profiles = {};
  for (const name of Object.keys(build)) profiles[name] = envOf(name).EXPO_PUBLIC_BACKUP;
  const missingB5Files = B5_FILES.filter((f) => !io.exists(join(mobileDir, f)));
  const missingB5Markers = B5_MARKERS.filter(([f, re]) => !io.exists(join(mobileDir, f)) || !re.test(io.read(join(mobileDir, f)))).map(([f, re]) => `${f} ${re.source}`);
  const escrowPath = join(mobileDir, 'src/lib/backup/escrow-keys.ts');
  const escrowKeyCount = io.exists(escrowPath) ? bundledEscrowKeyCount(io.read(escrowPath)) : 0;
  const stopDir = join(webDir, 'src/app/stop');
  const stopRouteFile = ['page.tsx', 'page.ts', 'route.ts'].some((n) => io.exists(join(stopDir, n)));
  const testDir = join(webDir, 'test');
  const stopTests = io.exists(testDir) ? io.list(testDir).filter((n) => /stop/i.test(n) && /\.test\.[cm]?[jt]sx?$/.test(n)) : [];
  const stopTestAnswers200 = stopTests.some((n) => /\b200\b/.test(io.read(join(testDir, n))));
  return { profiles, profileCount: Object.keys(build).length, shellValue, missingB5Files, missingB5Markers, escrowKeyCount, stopRouteFile, stopTestAnswers200 };
}
