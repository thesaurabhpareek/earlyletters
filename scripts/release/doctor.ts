// Release doctor: one read-only command that says which connections of the alpha release pipeline work, and
// which are missing, before anyone tries a build. It complements, and does not replace:
//   - apps/mobile/scripts/preflight-testflight.mjs   the build configuration (never touches Apple or Expo)
//   - apps/mobile/scripts/preflight-production.mjs   the store build configuration; the doctor runs it as its production row
//   - scripts/release/github-settings.ts --verify    GitHub environments, branch protection and rulesets
//   - scripts/ops/staging-smoke.ts                   the staging database and functions
// This script covers what those leave out: the repository's Expo and App Store Connect wiring, and that the
// credentials you hold actually reach Expo and Apple.
//
// The founder runs it on their own computer: agent sandboxes can reach Expo and App Store Connect over the
// network, but hold none of the credentials these checks need. Every request is a GET, or `eas whoami`. It
// changes nothing. It never prints a key, a token or a password: a failure names the variable and the reason,
// never the value.
//
//   npx tsx scripts/release/doctor.ts          # static checks, plus each live check whose variables are set
//   npx tsx scripts/release/doctor.ts --live   # as above; a live check whose variable is missing, or a missing ascAppId, is FAIL
//   npx tsx scripts/release/doctor.ts --store  # also gates the store build: each FAIL of the production preflight is a FAIL here
//
// A missing ascAppId is a WARN (a submit from your own computer does not need it, as the preflight says) and a FAIL
// only under --live, which checks the GitHub workflow path.
// A live check RUNS whenever its variables are set, with or without --live, and the output says so. --live only
// changes two things: a missing variable is UNVERIFIED without it and FAIL with it, and a missing ascAppId is WARN
// without it and FAIL with it.
//
// Exit code: 0 when nothing is FAIL (WARN, UNVERIFIED and NOT NEEDED never fail the run); 1 when anything is FAIL.
//
// Variables:
//   EXPO_TOKEN            an Expo robot or personal access token
//   ASC_API_KEY_ID        the key id from App Store Connect, Users and Access, Integrations
//   ASC_API_ISSUER_ID     the issuer id from the same page (a team key; an individual key has no issuer id)
//   ASC_API_KEY_P8_PATH   path to the downloaded AuthKey_<id>.p8 file (the file stays on your computer)
//
// Scope: the two alpha builds (docs/release/TESTFLIGHT.md): the `.preview` app record and the `testflight` and
// `preview` submit profiles. The production row is the store preflight (preflight-production.mjs, RT-REL-02,
// RT-REL-13): without --store it is NOT NEEDED for the alpha and says how many of its checks fail and which; with
// --store each of its FAILs is a FAIL here, and its UNVERIFIED lines are UNVERIFIED.
//
// Stays manual (the runbook says how; this script does not check them): the API key's role (App Manager), the
// automatic-distribution setting of the TestFlight groups, the EAS environment variable names
// (`eas env:list --environment preview`, names only), that the key is stored in EAS, and that EXPO_TOKEN can see
// this project (`whoami` passes for any valid token).
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
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type Level = 'PASS' | 'FAIL' | 'WARN' | 'UNVERIFIED' | 'NOT NEEDED';
export interface Finding {
  level: Level;
  area: 'repo' | 'expo' | 'apple' | 'store';
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
/** The one app record the alpha needs (docs/release/TESTFLIGHT.md step 2). The production id is not used by either alpha build. */
export const PREVIEW_BUNDLE_ID = 'com.earlyletters.scribe.preview';

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
    return { level: 'FAIL', area: 'apple', message: `The key works, but no App Store Connect app record has bundle id ${bundleId}. Create it (docs/release/TESTFLIGHT.md step 2).` };
  }
  const first = data[0];
  const id = first && typeof first === 'object' ? (first as { id?: unknown }).id : undefined;
  if (typeof id !== 'string') return { level: 'FAIL', area: 'apple', message: `App Store Connect's answer for ${bundleId} had an app with no id, so it cannot be read.` };
  return {
    level: 'PASS',
    area: 'apple',
    message: `App Store Connect has the app record for ${bundleId} (Apple id ${id}). Put that id in eas.json as submit.testflight.ios.ascAppId (build 1) and submit.preview.ios.ascAppId (build 2). The key's role (it must be App Manager) is not checked: see Users and Access, Integrations.`,
  };
}

/** The key ids listed (outside comments) in packages/api/src/keys.ts. */
export function signingKeyIds(keysTs: string): string[] {
  // Comments are removed first: the file carries a commented example line with a keyId in it.
  const code = keysTs.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  return [...code.matchAll(/keyId\s*:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
}

/** One result of apps/mobile/scripts/preflight-production.mjs (`--json`). */
export interface PreflightResult {
  level: 'PASS' | 'FAIL' | 'WARN' | 'UNVERIFIED';
  msg: string;
  id?: string;
}

/**
 * The production row: the store preflight's results, or null when it could not run. Without `store` (the alpha
 * scope) it is one NOT NEEDED line naming the checks that fail, or PASS when none does. With `store` each FAIL and
 * UNVERIFIED is its own line, and a preflight that could not run is a FAIL.
 */
export function productionFindings(results: PreflightResult[] | null, store: boolean): Finding[] {
  const SCRIPT = 'apps/mobile/scripts/preflight-production.mjs';
  if (!results) {
    return [{ level: store ? 'FAIL' : 'UNVERIFIED', area: 'store', message: `The store preflight (${SCRIPT}) did not run or printed no results: run \`npm run preflight:production -w @scribe/mobile\` to see why.` }];
  }
  const failed = results.filter((r) => r.level === 'FAIL');
  if (store) {
    const out: Finding[] = results.filter((r) => r.level === 'FAIL' || r.level === 'UNVERIFIED' || r.level === 'WARN').map((r) => ({ level: r.level, area: 'store', message: r.msg }));
    if (!failed.length) out.push({ level: 'PASS', area: 'store', message: `The store preflight (${SCRIPT}) passes every check of the production profile.` });
    return out;
  }
  if (!failed.length) return [{ level: 'PASS', area: 'store', message: `The store preflight (${SCRIPT}) passes every check of the production profile.` }];
  return [
    {
      level: 'NOT NEEDED',
      area: 'store',
      message: `Production (the store build) is not used by either alpha build. Its preflight fails ${failed.length} check(s): ${failed.map((r) => r.id ?? r.msg).join(', ')}. Run \`npm run preflight:production -w @scribe/mobile\` for the reasons, or the doctor with --store to make them FAIL.`,
    },
  ];
}

/**
 * Static checks of the repository's own wiring. `files` is injected so tests need no disk. When `production` is
 * given (the store preflight's results), its row replaces the plain NOT NEEDED line for production.
 */
export function repoFindings(
  files: { appConfig: string; easJson: string; keysTs: string },
  live = false,
  production?: { results: PreflightResult[] | null; store: boolean },
): Finding[] {
  const out: Finding[] = [];
  const add = (level: Level, message: string) => out.push({ level, area: 'repo', message });
  const hasProject = /projectId\s*:\s*['"][0-9a-f-]{36}['"]/i.test(files.appConfig);
  add(hasProject ? 'PASS' : 'FAIL', hasProject ? 'app.config.ts names an Expo project id (extra.eas.projectId).' : 'app.config.ts has no extra.eas.projectId. Create the project (expo.dev, or `npx eas-cli@24.10.0 init` in apps/mobile) and send the id; S20 adds it (TESTFLIGHT.md step 3; FT-17, BL-339).');
  // eas-cli 24.10.0 (getProjectIdAsync.js): once extra.eas.projectId is set, it asks for `owner` only below SDK 53,
  // robot token or not (this app is SDK 57), and refuses an owner that does not match the project's. With no project
  // id, a robot token without `owner` throws on any SDK (chooseAccountNameForEASProjectAsync), but the project id
  // line above is a FAIL then anyway. So a missing owner is a WARN, with or without --live.
  const hasOwner = /\bowner\s*:\s*['"][^'"]+['"]/.test(files.appConfig);
  add(hasOwner ? 'PASS' : 'WARN', hasOwner ? 'app.config.ts names the Expo owner.' : 'app.config.ts has no `owner`. Optional for SDK 53 and later in eas-cli 24.10.0 (this app is SDK 57); if it is set, it must match the Expo account that owns the project.');

  let eas: { submit?: Record<string, { ios?: { ascAppId?: unknown } }> } = {};
  try {
    eas = JSON.parse(files.easJson);
  } catch {
    add('FAIL', 'apps/mobile/eas.json is not valid JSON.');
  }
  for (const profile of ['testflight', 'preview']) {
    const id = eas.submit?.[profile]?.ios?.ascAppId;
    if (id && /^\d+$/.test(String(id))) add('PASS', `eas.json submit.${profile} has ios.ascAppId.`);
    else if (id) add('FAIL', `eas.json submit.${profile} ios.ascAppId is not the numeric Apple id of the app record.`);
    else add(live ? 'FAIL' : 'WARN', `eas.json submit.${profile} has no ios.ascAppId. Needed only for the GitHub workflow's non-interactive submit (TESTFLIGHT.md step 2.4); not needed to submit from your own computer, which asks instead. Set it from the .preview record's Apple id (App Information).${live ? ' FAIL because --live checks the workflow path.' : ''}`);
  }
  if (production) out.push(...productionFindings(production.results, production.store));
  else add('NOT NEEDED', 'eas.json submit.production and the production app record (com.earlyletters.scribe) are not used by either alpha build.');

  // The same rule as the preflight (preflight-testflight.mjs): none fails, one id warns (F19-REQ-002 asks for a
  // primary and a cold backup), a repeated id fails (only the first is ever used), two or more distinct ids pass.
  const ids = signingKeyIds(files.keysTs);
  const repeated = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  if (ids.length === 0) add('FAIL', 'packages/api/src/keys.ts lists no signing key (FT-16, D-115): no words from speech, no language packs, no kill switches.');
  else if (repeated.length) add('FAIL', `packages/api/src/keys.ts lists key id ${repeated.join(', ')} more than once; only the first is ever used. Give the backup its own id.`);
  else if (ids.length < 2) add('WARN', 'packages/api/src/keys.ts trusts one signing key; F19-REQ-002 asks for two, a primary and a cold backup. With one, losing it stops every new document until an app release.');
  else add('PASS', `packages/api/src/keys.ts lists ${ids.length} signing keys, each with its own id.`);
  return out;
}

export function render(findings: Finding[]): string {
  const order: Level[] = ['FAIL', 'WARN', 'UNVERIFIED', 'NOT NEEDED', 'PASS'];
  const lines: string[] = [];
  for (const level of order) for (const f of findings.filter((x) => x.level === level)) lines.push(`${level.padEnd(10)} [${f.area}] ${f.message}`);
  const n = (l: Level) => findings.filter((f) => f.level === l).length;
  lines.push('', `${n('PASS')} pass, ${n('WARN')} warn, ${n('UNVERIFIED')} unverified, ${n('NOT NEEDED')} not needed, ${n('FAIL')} fail.`);
  return lines.join('\n');
}

/** Redacts the given secrets, and anything shaped like a bearer token, from text before it is printed. */
export function redact(text: string, secrets: (string | undefined)[]): string {
  let out = text.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [hidden]');
  for (const s of secrets) if (s && s.length >= 6) out = out.split(s).join('[hidden]');
  return out;
}

/** Runs the store preflight with --json and returns its results, or null when it printed none it could read. */
export function runProductionPreflight(root: string): PreflightResult[] | null {
  const script = join(root, 'apps/mobile/scripts/preflight-production.mjs');
  if (!existsSync(script)) return null;
  let stdout = '';
  try {
    stdout = execFileSync(process.execPath, [script, '--json'], { cwd: join(root, 'apps/mobile'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 300_000, maxBuffer: 16 * 1024 * 1024 });
  } catch (e) {
    // Exit 1 means "a check failed"; the results are still on stdout.
    stdout = String((e as { stdout?: unknown }).stdout ?? '');
  }
  try {
    const parsed = JSON.parse(stdout.slice(stdout.indexOf('{'))) as { results?: unknown };
    return Array.isArray(parsed.results) ? (parsed.results as PreflightResult[]) : null;
  } catch {
    return null;
  }
}

const firstLine = (e: unknown) => (e instanceof Error ? e.message : String(e)).split('\n')[0];

export interface Env {
  EXPO_TOKEN?: string;
  ASC_API_KEY_ID?: string;
  ASC_API_ISSUER_ID?: string;
  ASC_API_KEY_P8_PATH?: string;
}

/** The Expo login check. `run` is `eas whoami`; only whether it throws is used. */
export function checkExpo(env: Env, live: boolean, run: (token: string) => void): Finding {
  const token = env.EXPO_TOKEN;
  if (!token) return { level: live ? 'FAIL' : 'UNVERIFIED', area: 'expo', message: 'EXPO_TOKEN is not set, so the Expo login was not checked.' };
  try {
    run(token);
    return { level: 'PASS', area: 'expo', message: 'EXPO_TOKEN signs in to Expo (`eas whoami` succeeded). That it can see this project is not checked.' };
  } catch (e) {
    return { level: 'FAIL', area: 'expo', message: redact(`EXPO_TOKEN did not sign in to Expo: ${firstLine(e)}`, [token]) };
  }
}

/** The App Store Connect check. `readKey` and `get` are injected so tests need no disk and no network. */
export async function checkApple(
  env: Env,
  live: boolean,
  io: { readKey: (path: string) => string; get: (url: string, token: string) => Promise<{ status: number; body: unknown }>; nowSeconds: () => number },
): Promise<Finding[]> {
  const missing = (['ASC_API_KEY_ID', 'ASC_API_ISSUER_ID', 'ASC_API_KEY_P8_PATH'] as const).filter((k) => !env[k]);
  if (missing.length) {
    return [{ level: live ? 'FAIL' : 'UNVERIFIED', area: 'apple', message: `${missing.join(', ')} ${missing.length > 1 ? 'are' : 'is'} not set, so the App Store Connect key was not checked.` }];
  }
  const { ASC_API_KEY_ID: keyId, ASC_API_ISSUER_ID: issuerId, ASC_API_KEY_P8_PATH: path } = env as Required<Env>;
  let pem: string;
  try {
    pem = io.readKey(path);
  } catch {
    // The error text is not used: Node names the file, and the file name holds the key id.
    return [{ level: 'FAIL', area: 'apple', message: 'ASC_API_KEY_P8_PATH could not be read as a file. Check the path and that you can open it.' }];
  }
  const requestPath = appLookupPath(PREVIEW_BUNDLE_ID);
  let token = '';
  try {
    token = ascToken({ keyId, issuerId, privateKeyPem: pem, nowSeconds: io.nowSeconds(), scope: [`GET ${requestPath}`] });
    const res = await io.get(`${ASC_BASE}${requestPath}`, token);
    return [interpretAppLookup(res.status, res.body, PREVIEW_BUNDLE_ID)];
  } catch (e) {
    return [{ level: 'FAIL', area: 'apple', message: redact(`Could not sign or send the App Store Connect request: ${firstLine(e)}`, [keyId, issuerId, pem, token]) }];
  }
}

// ---- command line --------------------------------------------------------------------------------------

async function main(argv: string[]) {
  const live = argv.includes('--live');
  const store = argv.includes('--store');
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const read = (p: string) => (existsSync(join(root, p)) ? readFileSync(join(root, p), 'utf8') : '');
  const env: Env = { EXPO_TOKEN: process.env.EXPO_TOKEN, ASC_API_KEY_ID: process.env.ASC_API_KEY_ID, ASC_API_ISSUER_ID: process.env.ASC_API_ISSUER_ID, ASC_API_KEY_P8_PATH: process.env.ASC_API_KEY_P8_PATH };
  const findings = repoFindings({ appConfig: read('apps/mobile/app.config.ts'), easJson: read('apps/mobile/eas.json'), keysTs: read('packages/api/src/keys.ts') }, live, { results: runProductionPreflight(root), store });

  const ran = [env.EXPO_TOKEN ? 'Expo (EXPO_TOKEN is set)' : '', env.ASC_API_KEY_ID && env.ASC_API_ISSUER_ID && env.ASC_API_KEY_P8_PATH ? 'Apple (the ASC_* variables are set)' : ''].filter(Boolean);
  console.log(ran.length ? `Running live checks because their variables are set: ${ran.join(', ')}.\n` : 'No live check variables are set: static checks only.\n');

  findings.push(
    checkExpo(env, live, (token) => {
      // Only what `eas whoami` needs: not the ASC_* variables.
      execFileSync('npx', ['--yes', 'eas-cli@24.10.0', 'whoami'], { env: { PATH: process.env.PATH ?? '', HOME: process.env.HOME ?? '', EXPO_TOKEN: token, CI: '1' } as unknown as NodeJS.ProcessEnv, stdio: ['ignore', 'pipe', 'pipe'], timeout: 120_000 });
    }),
  );
  findings.push(
    ...(await checkApple(env, live, {
      readKey: (p) => {
        if (!statSync(p).isFile()) throw new Error('not a file');
        return readFileSync(p, 'utf8');
      },
      get: async (url, token) => {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30_000) });
        let body: unknown = null;
        try {
          body = await res.json();
        } catch {
          body = null;
        }
        return { status: res.status, body };
      },
      nowSeconds: () => Math.floor(Date.now() / 1000),
    })),
  );

  console.log(render(findings));
  console.log('\nExit code: 0 when nothing is FAIL, 1 when anything is.');
  console.log('GitHub settings: npx tsx scripts/release/github-settings.ts --approver <login> --verify');
  console.log('Staging: npx tsx scripts/ops/staging-smoke.ts (see docs/ops/runbooks/staging-smoke.md)');
  process.exit(findings.some((f) => f.level === 'FAIL') ? 1 : 0);
}

if (process.argv[1]?.endsWith('doctor.ts')) void main(process.argv.slice(2));
