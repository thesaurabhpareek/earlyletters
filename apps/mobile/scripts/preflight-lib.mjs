/**
 * Helpers shared by the store-profile preflights: preflight-testflight.mjs (the two alpha builds) and
 * preflight-production.mjs (the App Store build). Pure functions, or functions that take every path they use, so a
 * test can run them on fixtures and a preflight copied into a temporary tree still reads that tree.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';

/**
 * A result list and the five ways to add to it. Levels: PASS, WARN, FAIL, UNVERIFIED. The optional `id` names the
 * check, so a test can tell which one failed without matching its wording.
 */
export function createReport() {
  const results = [];
  const add = (level, msg, id) => results.push(id === undefined ? { level, msg } : { level, msg, id });
  const pass = (msg, id) => add('PASS', msg, id);
  const warn = (msg, id) => add('WARN', msg, id);
  const fail = (msg, id) => add('FAIL', msg, id);
  const unverified = (msg, id) => add('UNVERIFIED', msg, id);
  const check = (cond, good, problem, id) => (cond ? pass(good, id) : fail(problem, id));
  return { results, add, pass, warn, fail, unverified, check };
}

/** Runs the Expo CLI found in the mobile workspace's node_modules (no network, no npx lookup). */
export function expo(mobileDir, args, cwd, env) {
  let cli;
  try {
    cli = createRequire(join(mobileDir, 'package.json')).resolve('expo/bin/cli');
  } catch {
    return { status: 1, stdout: '', stderr: 'expo is not installed: run `npm install` at the repo root.' };
  }
  return spawnSync(process.execPath, [cli, ...args], {
    cwd,
    env: { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1', EXPO_NO_GIT_STATUS: '1', ...env },
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
}

/** The JSON object an `expo config --json` run printed, or null. */
export function parseJsonOut(r) {
  try {
    return JSON.parse(r.stdout.slice(r.stdout.indexOf('{')));
  } catch {
    return null;
  }
}

/** 'secret key' or 'service_role key' when a value is one of Supabase's server keys, otherwise null. */
export function secretKind(value) {
  if (/^sb_secret_/.test(value)) return 'secret key';
  if (/^eyJ/.test(value)) {
    try {
      if (JSON.parse(Buffer.from(value.split('.')[1] ?? '', 'base64url').toString('utf8')).role === 'service_role') return 'service_role key';
    } catch {
      /* not a readable JWT: not this check's business */
    }
  }
  return null;
}

/**
 * The trusted signing keys in packages/api/src/keys.ts, read outside line comments (the file carries a commented
 * example). `keySet` is whether any entry has a public key; `keyIds` lists every key id, repeats included.
 */
export function signingKeys(keysSource) {
  const code = keysSource.replace(/^\s*\/\/.*$/gm, '');
  return {
    keySet: /^\s*\{[^}]*publicKey\s*:/m.test(code),
    keyIds: [...code.matchAll(/keyId\s*:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]),
  };
}

/**
 * True only when supabase/functions/config/published.ts assigns PACK_MANIFEST a non-empty string literal (what
 * scripts/packs/lib.ts writes: `export const PACK_MANIFEST: string | null = ${JSON.stringify(manifest)};`). Fails
 * closed: a missing or empty file, null in any formatting, undefined, an empty string or anything it cannot read is
 * "not published", because then the host has nothing to serve and no speech model or pack downloads (D-115).
 */
export function packManifestPublished(publishedSource) {
  const code = String(publishedSource ?? '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  return /\bexport\s+const\s+PACK_MANIFEST\s*(?::[^=]*)?=\s*(["'`])(?:\\.|(?!\1)[^\\])+\1/.test(code);
}

/**
 * EAS Update channels without expo-updates (RS-07, D-091). A build profile that sets `channel` makes `eas build`
 * configure EAS Update, and with expo-updates not installed a `--non-interactive` build stops: that is what broke
 * alpha build 1, and #538 removed the channel from the alpha profiles. Read by preflight-production.mjs and by
 * scripts/release/doctor.ts, so both say the same thing.
 *
 * - `eas`: apps/mobile/eas.json, parsed (null or {} when it could not be read)
 * - `mobilePackage`: apps/mobile/package.json, parsed. Only `dependencies` counts: expo-updates is a native module
 *   and must be in the app's runtime dependencies for the build to include it. Anything unreadable counts as absent.
 *
 * Returns whether expo-updates is a dependency and, when it is not, every build profile (sorted) that sets a channel.
 */
export function updateChannelProblems(eas, mobilePackage) {
  const deps = mobilePackage && typeof mobilePackage === 'object' ? mobilePackage.dependencies : undefined;
  const hasUpdates = Boolean(deps && typeof deps === 'object' && Object.prototype.hasOwnProperty.call(deps, 'expo-updates'));
  const build = eas && typeof eas === 'object' && eas.build && typeof eas.build === 'object' ? eas.build : {};
  const withChannel = Object.entries(build)
    .filter(([, p]) => p && typeof p === 'object' && Object.prototype.hasOwnProperty.call(p, 'channel'))
    .map(([name]) => name)
    .sort();
  return { hasUpdates, withChannel, profiles: hasUpdates ? [] : withChannel };
}

/** The FAIL text for one profile that sets a channel without expo-updates. */
export function updateChannelMessage(profile, channel) {
  return `eas.json build profile "${profile}" sets "channel": ${JSON.stringify(channel)}, but expo-updates is not a dependency of apps/mobile/package.json: \`eas build --profile ${profile} --non-interactive\` stops while configuring EAS Update. Remove the channel from that profile, or install expo-updates first (D-091; #538 removed it from the alpha profiles).`;
}

/** True when an evaluated ios.privacyManifests says tracking false and declares at least one required-reason category. */
export function privacyManifestDeclared(pm) {
  return Boolean(pm && pm.NSPrivacyTracking === false && Array.isArray(pm.NSPrivacyAccessedAPITypes) && pm.NSPrivacyAccessedAPITypes.length > 0);
}
