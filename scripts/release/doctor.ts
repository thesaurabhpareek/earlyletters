// Release doctor: one read-only command that says which connections of the release pipeline work, and which
// are missing, before anyone tries a build. It complements, and does not replace:
//   - apps/mobile/scripts/preflight-testflight.mjs   the build configuration (never touches Apple or Expo)
//   - scripts/release/github-settings.ts --verify    GitHub environments, branch protection and rulesets
//   - scripts/ops/staging-smoke.ts                   the staging database and functions
// This script covers what those leave out: the repository's Expo and App Store Connect wiring, and that the
// credentials you hold actually reach Expo and Apple.
//
// The founder runs it on their own computer (agents have no keys and the agent sandbox cannot reach Apple or
// Expo). Every request is a GET, or `eas whoami`. It changes nothing. It never prints a key, a token or a
// password: a failure names the variable and the reason, never the value.
//
//   npx tsx scripts/release/doctor.ts                 # static checks, plus every live check whose variable is set
//   npx tsx scripts/release/doctor.ts --live          # a live check whose variable is missing counts as FAIL
//
// Variables (all optional; a missing one makes its live check UNVERIFIED, or FAIL with --live):
//   EXPO_TOKEN            an Expo robot or personal access token
//   ASC_API_KEY_ID        the key id from App Store Connect, Users and Access, Integrations
//   ASC_API_ISSUER_ID     the issuer id from the same page (a team key; an individual key has no issuer id)
//   ASC_API_KEY_P8_PATH   path to the downloaded AuthKey_<id>.p8 file (the file stays on your computer)
//
// App Store Connect token rules: ES256, header alg/kid/typ, payload iss/iat/exp/aud "appstoreconnect-v1",
// at most 20 minutes of life, and an optional scope list (developer.apple.com, "Generating Tokens for API
// Requests", read 27 Oct 2026). This script signs a 2 minute token scoped to the one GET it makes.
//
// UNVERIFIED until run with real credentials: the exact JSON App Store Connect returns for `filter[bundleId]`
// (the code reads `data` as an array, and treats anything else as a failure to read), and `eas whoami`'s output
// (only its exit code is used). Nothing here has been run against Apple or Expo.
import { execFileSync } from 'node:child_process';
import { createPrivateKey, sign } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type Level = 'PASS' | 'FAIL' | 'UNVERIFIED';
export interface Finding {
  level: Level;
  area: 'repo' | 'expo' | 'apple';
  message: string;
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString('base64url');

/** An App Store Connect JWT, ES256, scoped to one GET. `ieee-p1363` is the raw r||s form JWT requires. */
export function ascToken(opts: { keyId: string; issuerId: string; privateKeyPem: string; nowSeconds: number; scope: string[] }): string {
  const header = { alg: 'ES256', kid: opts.keyId, typ: 'JWT' };
  const payload = { iss: opts.issuerId, iat: opts.nowSeconds, exp: opts.nowSeconds + 120, aud: 'appstoreconnect-v1', scope: opts.scope };
  const input = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const sig = sign('sha256', Buffer.from(input), { key: createPrivateKey(opts.privateKeyPem), dsaEncoding: 'ieee-p1363' });
  return `${input}.${b64url(sig)}`;
}

export const ASC_BASE = 'https://api.appstoreconnect.apple.com';

export function appLookupPath(bundleId: string): string {
  return `/v1/apps?filter[bundleId]=${encodeURIComponent(bundleId)}`;
}

/** What one app lookup says. `data` is read as an array of apps; anything else is "could not read". */
export function interpretAppLookup(status: number, body: unknown, bundleId: string): Finding {
  if (status === 401 || status === 403) {
    return { level: 'FAIL', area: 'apple', message: `App Store Connect refused the key (HTTP ${status}). Check the key id, the issuer id, the .p8 file and that the key's role can read apps.` };
  }
  if (status !== 200) return { level: 'FAIL', area: 'apple', message: `App Store Connect answered HTTP ${status} for ${bundleId}.` };
  const data = (body as { data?: unknown } | null)?.data;
  if (!Array.isArray(data)) return { level: 'FAIL', area: 'apple', message: `App Store Connect's answer for ${bundleId} had no list of apps, so it cannot be read.` };
  if (data.length === 0) {
    return { level: 'FAIL', area: 'apple', message: `The key works, but no App Store Connect app record has bundle id ${bundleId}. Create it (FT-08 for the production id, docs/release/TESTFLIGHT.md step 2 for .preview).` };
  }
  const id = (data[0] as { id?: unknown }).id;
  return { level: 'PASS', area: 'apple', message: `App Store Connect has an app record for ${bundleId}${typeof id === 'string' ? ` (Apple id ${id}; put it in eas.json submit ascAppId)` : ''}.` };
}

/** Static checks of the repository's own wiring. `files` is injected so tests need no disk. */
export function repoFindings(files: { appConfig: string; easJson: string; keysTs: string }): Finding[] {
  const out: Finding[] = [];
  const add = (level: Level, message: string) => out.push({ level, area: 'repo', message });
  add(/projectId\s*:\s*['"][0-9a-f-]{36}['"]/i.test(files.appConfig) ? 'PASS' : 'FAIL',
    /projectId\s*:\s*['"][0-9a-f-]{36}['"]/i.test(files.appConfig)
      ? 'app.config.ts names an Expo project id (extra.eas.projectId).'
      : 'app.config.ts has no extra.eas.projectId. Run `eas init` in apps/mobile, then commit the id (FT-17, BL-339).');
  add(/\bowner\s*:\s*['"][^'"]+['"]/.test(files.appConfig) ? 'PASS' : 'FAIL',
    /\bowner\s*:\s*['"][^'"]+['"]/.test(files.appConfig)
      ? 'app.config.ts names the Expo owner.'
      : 'app.config.ts has no `owner`. A robot token cannot find the project without it (docs/release/1.0.0.md section 1).');
  let eas: { submit?: Record<string, { ios?: { ascAppId?: string } } | Record<string, never>> } = {};
  try {
    eas = JSON.parse(files.easJson);
  } catch {
    add('FAIL', 'apps/mobile/eas.json is not valid JSON.');
  }
  for (const profile of ['testflight', 'preview', 'production']) {
    const id = (eas.submit?.[profile] as { ios?: { ascAppId?: string } } | undefined)?.ios?.ascAppId;
    add(id ? 'PASS' : 'FAIL', id ? `eas.json submit.${profile} has ascAppId.` : `eas.json submit.${profile} has no ios.ascAppId. Set it from the App Store Connect record's Apple id (not needed until that record exists).`);
  }
  // Comments are removed first: the file carries a commented example line with a keyId in it.
  const keyCount = (files.keysTs.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').match(/keyId\s*:/g) ?? []).length;
  add(keyCount > 0 ? 'PASS' : 'FAIL', keyCount > 0
    ? `packages/api/src/keys.ts lists ${keyCount} signing key(s).`
    : 'packages/api/src/keys.ts lists no signing key (FT-16, D-115): no words from speech, no language packs, no kill switches.');
  return out;
}

export function render(findings: Finding[]): string {
  const order: Level[] = ['FAIL', 'UNVERIFIED', 'PASS'];
  const lines: string[] = [];
  for (const level of order) for (const f of findings.filter((x) => x.level === level)) lines.push(`${level.padEnd(10)} [${f.area}] ${f.message}`);
  const n = (l: Level) => findings.filter((f) => f.level === l).length;
  lines.push('', `${n('PASS')} pass, ${n('UNVERIFIED')} unverified, ${n('FAIL')} fail.`);
  return lines.join('\n');
}

/** Redacts anything that looks like a secret from text before it is printed. */
export function redact(text: string, secrets: (string | undefined)[]): string {
  let out = text;
  for (const s of secrets) if (s && s.length >= 6) out = out.split(s).join('[hidden]');
  return out;
}

// ---- command line --------------------------------------------------------------------------------------

async function main(argv: string[]) {
  const live = argv.includes('--live');
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const read = (p: string) => (existsSync(join(root, p)) ? readFileSync(join(root, p), 'utf8') : '');
  const findings = repoFindings({ appConfig: read('apps/mobile/app.config.ts'), easJson: read('apps/mobile/eas.json'), keysTs: read('packages/api/src/keys.ts') });
  const missing = (name: string, what: string): Finding => ({ level: live ? 'FAIL' : 'UNVERIFIED', area: name === 'EXPO_TOKEN' ? 'expo' : 'apple', message: `${name} ${name.includes(',') ? 'are' : 'is'} not set, so ${what} was not checked.` });
  const { EXPO_TOKEN, ASC_API_KEY_ID, ASC_API_ISSUER_ID, ASC_API_KEY_P8_PATH } = process.env;

  if (!EXPO_TOKEN) findings.push(missing('EXPO_TOKEN', 'the Expo login'));
  else {
    try {
      execFileSync('npx', ['--yes', 'eas-cli@24.10.0', 'whoami'], { env: { ...process.env, EXPO_TOKEN, CI: '1' }, stdio: ['ignore', 'pipe', 'pipe'], timeout: 120_000 });
      findings.push({ level: 'PASS', area: 'expo', message: 'EXPO_TOKEN signs in to Expo (`eas whoami` succeeded).' });
    } catch (e) {
      findings.push({ level: 'FAIL', area: 'expo', message: redact(`EXPO_TOKEN did not sign in to Expo: ${(e as Error).message.split('\n')[0]}`, [EXPO_TOKEN]) });
    }
  }

  const ascMissing = [['ASC_API_KEY_ID', ASC_API_KEY_ID], ['ASC_API_ISSUER_ID', ASC_API_ISSUER_ID], ['ASC_API_KEY_P8_PATH', ASC_API_KEY_P8_PATH]].filter(([, v]) => !v).map(([k]) => k as string);
  if (ascMissing.length) findings.push(missing(ascMissing.join(', '), 'the App Store Connect key'));
  else if (!existsSync(ASC_API_KEY_P8_PATH as string)) findings.push({ level: 'FAIL', area: 'apple', message: 'ASC_API_KEY_P8_PATH does not point at a file.' });
  else {
    const pem = readFileSync(ASC_API_KEY_P8_PATH as string, 'utf8');
    for (const bundleId of ['com.earlyletters.scribe', 'com.earlyletters.scribe.preview']) {
      const path = appLookupPath(bundleId);
      try {
        const token = ascToken({ keyId: ASC_API_KEY_ID as string, issuerId: ASC_API_ISSUER_ID as string, privateKeyPem: pem, nowSeconds: Math.floor(Date.now() / 1000), scope: [`GET ${path}`] });
        const res = await fetch(`${ASC_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
        let body: unknown = null;
        try {
          body = await res.json();
        } catch {
          body = null;
        }
        findings.push(interpretAppLookup(res.status, body, bundleId));
      } catch (e) {
        findings.push({ level: 'FAIL', area: 'apple', message: redact(`Could not sign or send the App Store Connect request: ${(e as Error).message.split('\n')[0]}`, [ASC_API_KEY_ID, ASC_API_ISSUER_ID, pem]) });
      }
    }
  }

  console.log(render(findings));
  console.log('\nGitHub settings: npx tsx scripts/release/github-settings.ts --approver <login> --verify');
  console.log('Staging: npx tsx scripts/ops/staging-smoke.ts (see docs/ops/runbooks/staging-smoke.md)');
  process.exit(findings.some((f) => f.level === 'FAIL') ? 1 : 0);
}

if (process.argv[1]?.endsWith('doctor.ts')) void main(process.argv.slice(2));
