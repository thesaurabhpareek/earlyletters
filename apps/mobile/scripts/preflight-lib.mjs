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

/** True when an evaluated ios.privacyManifests says tracking false and declares at least one required-reason category. */
export function privacyManifestDeclared(pm) {
  return Boolean(pm && pm.NSPrivacyTracking === false && Array.isArray(pm.NSPrivacyAccessedAPITypes) && pm.NSPrivacyAccessedAPITypes.length > 0);
}
