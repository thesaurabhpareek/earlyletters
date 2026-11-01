#!/usr/bin/env node
/**
 * Preflight for the App Store build, eas.json profile `production` (RT-REL-02, RT-REL-13; SR-B-05). The first store
 * build is the staged release of D-121: on this phone only, English only, servers, backup, the status report and
 * analytics off (packages/content/src/store.en.ts says the same to App Review).
 *
 *   npm run preflight:production -w @scribe/mobile            # the report, exit 1 on any FAIL
 *   npm run preflight:production -w @scribe/mobile -- --json  # the same results as JSON (scripts/release/doctor.ts reads it)
 *
 * Like the TestFlight preflight (preflight-testflight.mjs, whose helpers it shares through preflight-lib.mjs) it
 * reads the repository and evaluates `expo config` the way the profile builds it. It does not build, does not go
 * online and needs no secrets. It cannot see the EAS "production" environment on expo.dev; the UNVERIFIED lines
 * name what to check there by hand.
 *
 * Every check below is a FAIL when it does not hold. Today two of them FAIL by design until the founder steps are
 * done: the pack signing keys (packages/api/src/keys.ts is empty, docs/ops/PACKS_HOSTING.md step 1) and the App
 * Store Connect record (submit.production.ios.ascAppId), and extra.eas.projectId until step 3's PR.
 *
 * Exit code: 1 if any FAIL, otherwise 0.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { envFileProblems } from './env-file-guard.mjs';
import { createReport, expo, packManifestPublished, parseJsonOut, privacyManifestDeclared, secretKind, signingKeys } from './preflight-lib.mjs';

export const PROFILE = 'production';

/** Build flags that only ever belong to test builds (B-9): the e2e seams and the web preview seams. */
export const SEAM_FLAGS = ['EXPO_PUBLIC_E2E', 'EXPO_PUBLIC_WEB_PREVIEW'];

/**
 * The ACCOUNT_DELETION decision for a profile, read from the profile table in docs/release/ENVIRONMENTS.md:
 * 'on', 'off', 'unset' (the cell says "not written"), or null when the table or the cell cannot be read.
 */
export function accountDeletionDecision(environmentsMd, profile = PROFILE) {
  const rows = environmentsMd.split('\n').filter((l) => l.trim().startsWith('|'));
  const cells = (row) => row.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  const header = rows.find((r) => /`ACCOUNT_DELETION`/.test(r) && /Profile/.test(r));
  if (!header) return null;
  const col = cells(header).findIndex((c) => c === '`ACCOUNT_DELETION`');
  const row = rows.find((r) => cells(r)[0] === `\`${profile}\``);
  const cell = row ? cells(row)[col] : undefined;
  if (col < 0 || cell === undefined) return null;
  const plain = cell.replace(/\*\*/g, '').trim().toLowerCase();
  if (/^not written/.test(plain)) return 'unset';
  if (/^on\b/.test(plain)) return 'on';
  if (/^off\b/.test(plain)) return 'off';
  return null;
}

const isOff = (v) => String(v ?? '').trim().toLowerCase() === 'off';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Every check of the production profile, on inputs read elsewhere, so a test can give it fixtures.
 *
 * - `eas`: apps/mobile/eas.json, parsed
 * - `cfg`: `expo config --type public --json` with the production profile's env, or null when it did not evaluate
 * - `environmentsMd`: docs/release/ENVIRONMENTS.md
 * - `keysSource`: packages/api/src/keys.ts
 * - `publishedSource`: supabase/functions/config/published.ts
 * - `versionJson`: apps/mobile/version.json, as text
 * - `appConfigSource`: apps/mobile/app.config.ts
 * - `shellEnv`: the environment this runs in (a local build reads it)
 * - `envFiles`: apps/mobile/.env* files, as [{ name, text }]
 *
 * Each result has an `id`: english-only, analytics, servers, backup, status-report, account-deletion, signing-keys,
 * pack-manifest, privacy-manifest, version, project-id, asc-app-id, seams, secrets (and config when `expo config` failed).
 */
export function productionChecks(input) {
  const { results, pass, fail, unverified, check } = createReport();
  const eas = input.eas ?? {};
  const prof = eas.build?.[PROFILE];
  const env = prof?.env ?? {};
  const cfg = input.cfg;
  const shell = input.shellEnv ?? {};
  if (!prof) fail(`eas.json has no "${PROFILE}" build profile.`, 'profile');
  if (!cfg) fail(`\`expo config --type public\` did not evaluate with the ${PROFILE} profile's env${input.cfgError ? `: ${input.cfgError}` : ''}.`, 'config');

  // D-121 item 1: the first store build transcribes English only.
  check(
    env.EXPO_PUBLIC_ENGLISH_ONLY === 'on',
    `${PROFILE} profile: EXPO_PUBLIC_ENGLISH_ONLY=on (the first store build offers English only, D-121 item 1)`,
    `${PROFILE} profile EXPO_PUBLIC_ENGLISH_ONLY is ${JSON.stringify(env.EXPO_PUBLIC_ENGLISH_ONLY)}; the store build must say "on" (D-121 item 1), or the picker offers languages the listing does not name.`,
    'english-only',
  );

  // D-088: no analytics in the first store build, and no PostHog key named in the profile.
  check(
    isOff(env.EXPO_PUBLIC_ANALYTICS) && env.EXPO_PUBLIC_POSTHOG_KEY === undefined,
    `${PROFILE} profile: EXPO_PUBLIC_ANALYTICS=off and no PostHog key`,
    `${PROFILE} profile must set EXPO_PUBLIC_ANALYTICS to "off" and name no EXPO_PUBLIC_POSTHOG_KEY (got ${JSON.stringify(env.EXPO_PUBLIC_ANALYTICS)}${env.EXPO_PUBLIC_POSTHOG_KEY === undefined ? '' : ', and a PostHog key'}).`,
    'analytics',
  );

  // D-100, D-121: servers off in the store build, written out, and the evaluated config agrees.
  check(
    isOff(env.EXPO_PUBLIC_SERVER_FEATURES) && (!cfg || cfg.extra?.serverFeatures === false),
    `${PROFILE} profile: EXPO_PUBLIC_SERVER_FEATURES=off (no sign-in, sync or co-parent; config extra.serverFeatures false)`,
    `${PROFILE} profile EXPO_PUBLIC_SERVER_FEATURES is ${JSON.stringify(env.EXPO_PUBLIC_SERVER_FEATURES)} (config extra.serverFeatures ${cfg?.extra?.serverFeatures}); the store build says "off" until the founder re-plans the submission after the R-17 gate (D-100, D-121).`,
    'servers',
  );

  // F19-REQ-025: the build flags are written "off" explicitly.
  for (const [flag, id, extraKey, what] of [
    ['EXPO_PUBLIC_BACKUP', 'backup', 'backup', 'recording backup'],
    ['EXPO_PUBLIC_STATUS_REPORT', 'status-report', 'statusReport', 'the subscription status report'],
  ]) {
    check(
      isOff(env[flag]) && (!cfg || cfg.extra?.[extraKey] === false),
      `${PROFILE} profile: ${flag}=off (${what}; config extra.${extraKey} false)`,
      `${PROFILE} profile ${flag} is ${JSON.stringify(env[flag])} (config extra.${extraKey} ${cfg?.extra?.[extraKey]}); the store build writes "off" explicitly (F19-REQ-025).`,
      id,
    );
  }

  // The Delete account row: the value in eas.json must be the one docs/release/ENVIRONMENTS.md records.
  {
    const decision = accountDeletionDecision(input.environmentsMd ?? '');
    const written = env.EXPO_PUBLIC_ACCOUNT_DELETION;
    const ok = decision === 'unset' ? written === undefined : decision !== null && written === decision;
    check(
      ok,
      `${PROFILE} profile: EXPO_PUBLIC_ACCOUNT_DELETION${written === undefined ? ' not written' : `=${written}`}, as docs/release/ENVIRONMENTS.md records`,
      decision === null
        ? 'docs/release/ENVIRONMENTS.md has no readable ACCOUNT_DELETION decision for the production profile (the profile table, column `ACCOUNT_DELETION`).'
        : `${PROFILE} profile EXPO_PUBLIC_ACCOUNT_DELETION is ${JSON.stringify(written)}, but docs/release/ENVIRONMENTS.md records ${decision === 'unset' ? '"not written"' : JSON.stringify(decision)}. Change one of them so the two agree.`,
      'account-deletion',
    );
  }

  // D-115, F19-REQ-002: words from speech need the signed packs, so the store build needs a primary and a backup key.
  {
    const { keySet, keyIds } = signingKeys(input.keysSource ?? '');
    const repeated = [...new Set(keyIds.filter((k, i) => keyIds.indexOf(k) !== i))];
    check(
      keySet && keyIds.length >= 2 && repeated.length === 0,
      `${keyIds.length} pack signing keys in packages/api/src/keys.ts, each with its own id`,
      !keySet
        ? 'packages/api/src/keys.ts has no trusted signing key: the store build would install no speech model or language pack, so recordings get no words (D-115). Founder step: `node scripts/packs/keygen.mjs`, then `--backup`, and paste both public lines (docs/ops/PACKS_HOSTING.md step 1).'
        : repeated.length
          ? `packages/api/src/keys.ts lists key id ${repeated.join(', ')} more than once; only the first is ever used. Give the backup its own id.`
          : `packages/api/src/keys.ts trusts ${keyIds.length} signing key; the store build needs two, a primary and a cold backup (F19-REQ-002).`,
      'signing-keys',
    );
  }

  // D-115, SR-C-01: keys alone are not enough. Without a published signed manifest the host answers 404, so the
  // store build downloads no English pack and parents get no words.
  check(
    packManifestPublished(input.publishedSource ?? ''),
    'a signed pack manifest is published in supabase/functions/config/published.ts (whether the host serves it is not checked here: `npx tsx scripts/packs/publish.ts verify`)',
    'No signed pack manifest has been published (supabase/functions/config/published.ts is missing, or its PACK_MANIFEST is not a non-empty string): the store build would download no English pack, so recordings get no words (D-115, SR-C-01). Run `npx tsx scripts/packs/publish.ts release --key-file <signing.env> --models upstream`, then `upload`, and commit published.ts (docs/ops/PACKS_HOSTING.md steps 5 to 8).',
    'pack-manifest',
  );

  // App Store privacy manifest (ITMS-91053), and with servers off it declares no collected data.
  {
    const pm = cfg?.ios?.privacyManifests;
    const collected = pm?.NSPrivacyCollectedDataTypes ?? [];
    check(
      Boolean(cfg) && privacyManifestDeclared(pm) && collected.length === 0,
      `privacy manifest declared (tracking false, ${pm?.NSPrivacyAccessedAPITypes?.length ?? 0} required-reason categories, no collected data with servers off)`,
      !privacyManifestDeclared(pm)
        ? 'No privacy manifest in the production config (ios.privacyManifests), tracking is not false, or it declares no required-reason category.'
        : `The production privacy manifest declares collected data (${collected.map((c) => c.NSPrivacyCollectedDataType).join(', ')}) in a build with server features off.`,
      'privacy-manifest',
    );
  }

  // ADR 0022, D-089: the marketing version comes only from apps/mobile/version.json.
  {
    let version = null;
    try {
      version = JSON.parse(input.versionJson ?? '').version ?? null;
    } catch {
      version = null;
    }
    const literal = /\bversion\s*:\s*['"`]\d/.test(input.appConfigSource ?? '');
    const fromFile = /readFileSync\([^)]*version\.json/.test(input.appConfigSource ?? '');
    check(
      typeof version === 'string' && /^\d+\.\d+\.\d+$/.test(version) && fromFile && !literal && (!cfg || cfg.version === version),
      `version ${version} from apps/mobile/version.json (ADR 0022)`,
      `The version must come from apps/mobile/version.json only (ADR 0022): version.json says ${JSON.stringify(version)}, the evaluated config says ${JSON.stringify(cfg?.version)}${literal ? ', and app.config.ts writes a version literal' : ''}${fromFile ? '' : ', and app.config.ts does not read version.json'}.`,
      'version',
    );
  }

  // The EAS project link (founder step 3): `eas build` stops without it.
  check(
    UUID.test(String(cfg?.extra?.eas?.projectId ?? '')),
    `EAS project id is in the config (${cfg?.extra?.eas?.projectId})`,
    'No extra.eas.projectId in app.config.ts: every `eas build` stops until the founder sends the project id and a small PR adds it under extra (TESTFLIGHT.md step 3; FT-17, BL-339).',
    'project-id',
  );

  // The production App Store Connect record, so `eas submit --profile production` needs no prompt.
  {
    const id = eas.submit?.[PROFILE]?.ios?.ascAppId;
    check(
      /^\d+$/.test(String(id ?? '')),
      `${PROFILE} submit profile names the App Store Connect app (ios.ascAppId ${id})`,
      id
        ? `submit.${PROFILE}.ios.ascAppId is ${JSON.stringify(id)}; it is the numeric Apple ID of the production app record (App Store Connect > the app > App Information).`
        : `eas.json submit.${PROFILE} has no ios.ascAppId: create the production app record (bundle id without .preview) and send its numeric Apple ID (App Information). Not a secret; it goes in eas.json.`,
      'asc-app-id',
    );
  }

  // B-9: no test seam reaches a store build, from the profile or from this shell.
  {
    const set = (v) => String(v ?? '').trim() !== '';
    const found = SEAM_FLAGS.flatMap((k) => [...(set(env[k]) ? [`${k} in the eas.json ${PROFILE} profile`] : []), ...(set(shell[k]) ? [`${k} in this shell`] : [])]);
    check(
      found.length === 0,
      `no test seam flag (${SEAM_FLAGS.join(', ')}) in the ${PROFILE} profile or this shell`,
      `${found.join('; ')}. Test seams never go in a build that can be uploaded (B-9): remove it.`,
      'seams',
    );
    unverified(`the EAS "${prof?.environment ?? PROFILE}" environment on expo.dev holds no ${SEAM_FLAGS.join(' or ')} and no secret (this script cannot read it). Check the names with \`npx eas-cli@24.10.0 env:list --environment ${prof?.environment ?? PROFILE}\` in apps/mobile.`, 'eas-environment');
  }

  // No Supabase secret or service_role key in any env the build can read: every eas.json profile, this shell, .env* files.
  {
    const leaked = [];
    for (const [name, p] of Object.entries(eas.build ?? {})) {
      for (const [k, v] of Object.entries(p?.env ?? {})) {
        const kind = secretKind(String(v ?? '').trim());
        if (kind) leaked.push(`eas.json ${name} profile ${k} holds a ${kind}`);
        else if (/SECRET|SERVICE_ROLE|PRIVATE_KEY|PASSWORD/i.test(k)) leaked.push(`eas.json ${name} profile names ${k}`);
      }
    }
    for (const [k, v] of Object.entries(shell)) {
      if (!k.startsWith('EXPO_PUBLIC_')) continue;
      const kind = secretKind(String(v ?? '').trim());
      if (kind) leaked.push(`${k} in this shell holds a ${kind}`);
    }
    for (const { name, text } of input.envFiles ?? []) {
      for (const m of text.matchAll(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/gm)) {
        const kind = secretKind(m[2].trim().replace(/^['"]|['"]$/g, ''));
        if (kind) leaked.push(`apps/mobile/${name} ${m[1]} holds a ${kind}`);
      }
      for (const problem of envFileProblems(name, text)) leaked.push(`apps/mobile/${problem} (only APP_ENV, SERVER_FEATURES=off and ANALYTICS=off belong in a .env file)`);
    }
    check(
      leaked.length === 0,
      'no secret key in any eas.json profile, this shell or an apps/mobile/.env* file',
      `${leaked.join('; ')}. A server key never goes in the app or its build variables: delete it, rotate it in Supabase (Project Settings > API Keys) and use the publishable key instead.`,
      'secrets',
    );
  }

  return results;
}

/** Reads the repository and evaluates the config the way `eas build --profile production` would. */
export function readInputs(mobileDir, shellEnv = process.env) {
  const repo = join(mobileDir, '..', '..');
  const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
  let eas = null;
  try {
    eas = JSON.parse(read(join(mobileDir, 'eas.json')));
  } catch {
    eas = null;
  }
  const profEnv = eas?.build?.[PROFILE]?.env ?? {};
  // Project values and test seams come from the profile alone here; the seams and secrets checks read the shell.
  const buildEnv = { ...profEnv };
  for (const k of ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY', 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', 'EXPO_PUBLIC_POSTHOG_KEY', ...SEAM_FLAGS]) {
    if (!(k in profEnv)) buildEnv[k] = '';
  }
  const r = expo(mobileDir, ['config', '--type', 'public', '--json'], mobileDir, buildEnv);
  const cfg = parseJsonOut(r);
  return {
    eas,
    cfg,
    cfgError: cfg ? undefined : (r.stderr || r.stdout || '').trim().split('\n').slice(-3).join(' | '),
    environmentsMd: read(join(repo, 'docs/release/ENVIRONMENTS.md')),
    keysSource: read(join(repo, 'packages/api/src/keys.ts')),
    publishedSource: read(join(repo, 'supabase/functions/config/published.ts')),
    versionJson: read(join(mobileDir, 'version.json')),
    appConfigSource: read(join(mobileDir, 'app.config.ts')),
    shellEnv,
    envFiles: readdirSync(mobileDir)
      .filter((f) => f.startsWith('.env'))
      .map((name) => ({ name, text: read(join(mobileDir, name)) })),
  };
}

function main(argv) {
  const mobileDir = join(dirname(fileURLToPath(import.meta.url)), '..');
  const results = productionChecks(readInputs(mobileDir));
  const failed = results.filter((r) => r.level === 'FAIL').length;
  if (argv.includes('--json')) {
    console.log(JSON.stringify({ profile: PROFILE, results }, null, 2));
  } else {
    console.log(`Store preflight: profile "${PROFILE}" (the App Store build)\n`);
    for (const lvl of ['PASS', 'UNVERIFIED', 'WARN', 'FAIL']) for (const r of results.filter((x) => x.level === lvl)) console.log(`${lvl.padEnd(10)} ${r.msg}`);
    const count = (l) => results.filter((r) => r.level === l).length;
    console.log(`\n${['FAIL', 'WARN', 'UNVERIFIED', 'PASS'].map((l) => `${count(l)} ${l.toLowerCase()}`).join(', ')}`);
    console.log(failed ? 'Not ready for the store: fix every FAIL above.' : 'No FAIL. Configuration only: it does not prove the build compiles or signs. Read every UNVERIFIED line.');
  }
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
