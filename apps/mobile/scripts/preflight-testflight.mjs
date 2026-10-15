#!/usr/bin/env node
/**
 * Preflight for the two alpha TestFlight builds (D-106; docs/release/TESTFLIGHT.md):
 *
 *   alpha build 1, profile `testflight`: server features OFF (no accounts, nothing leaves the phone)
 *   alpha build 2, profile `preview`:    server features ON against the staging Supabase project
 *
 *   npm run preflight:testflight -w @scribe/mobile                     # build 1 (profile testflight)
 *   npm run preflight:alpha -w @scribe/mobile                          # build 2 (profile preview)
 *   npm run preflight:alpha -w @scribe/mobile -- --skip-prebuild       # skip the native-project check (about a minute)
 *
 * Checks everything that can be checked without an Apple or Expo account, the way that eas.json profile
 * will build it. It does not build, does not touch the network and needs no secrets. Project values
 * (the staging URL and anon key) live in EAS environment variables, which this script cannot see; export
 * them in your shell before running it and it checks their shape (never the service key). It ends with
 * the founder steps from docs/release/TESTFLIGHT.md that are still open for this build, by name.
 *
 * Exit code: 1 if any FAIL, otherwise 0. WARN never fails the run: it means "the build will work, but
 * read the consequence first". UNVERIFIED means a check could not run here (it is not a pass).
 *
 * Levels: PASS, WARN, FAIL, UNVERIFIED, then the App Review notes (facts to tell the reviewer, not problems),
 * then the open founder steps.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MOBILE = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(MOBILE, '..', '..');
const require = createRequire(join(MOBILE, 'package.json'));
const SKIP_PREBUILD = process.argv.includes('--skip-prebuild');
const profileArg = process.argv.indexOf('--profile');
const PROFILE = profileArg > -1 ? String(process.argv[profileArg + 1] ?? '') : 'testflight';

/** The two alpha builds (D-106). `server` is what the profile must say today; the R-17 flip changes testflight. */
const ALPHA = {
  testflight: { build: 'alpha build 1', server: false },
  preview: { build: 'alpha build 2', server: true },
};
if (!Object.hasOwn(ALPHA, PROFILE)) {
  console.error(`--profile must be testflight (alpha build 1) or preview (alpha build 2); got ${JSON.stringify(PROFILE)}.`);
  process.exit(1);
}
const SPEC = ALPHA[PROFILE];

const results = [];
const notes = [];
/**
 * Founder steps (docs/release/TESTFLIGHT.md, same numbers and names). Each is `open` (seen missing here),
 * `check` (this script cannot see it: confirm it yourself) or `done` (seen done here).
 */
const STEPS = {
  1: 'Step 1. Apple Developer Program enrolment (FT-01)',
  2: 'Step 2. App Store Connect: the .preview App ID, the app record, testers and the API key (FT-07, FT-08)',
  3: 'Step 3. Expo account, the project id and EXPO_TOKEN (FT-17, BL-339)',
  4: 'Step 4. Words from speech: pack signing keys and the R2 bucket packs.earlyletters.app (FT-16, D-097)',
  5: 'Step 5. Build 1: preflight, build, submit, testers',
  6: 'Step 6. Supabase staging project and its schema (FT-10)',
  7: 'Step 7. Supabase Auth on staging, with Resend SMTP for sign-in email (FT-12, FT-13)',
  8: 'Step 8. Sign in with Apple: Team ID, key and the Supabase Apple provider (FT-07, FT-12)',
  9: 'Step 9. EAS environment variables for the preview environment',
  10: 'Step 10. Website: the AASA file and /auth/confirm live (Vercel APPLE_TEAM_ID, IOS_BUNDLE_ID)',
  11: 'Step 11. Build 2: preflight --profile preview, build, submit, the family group only',
  12: 'Step 12. Staging function secrets: the purge worker and the Resend key (FT-11)',
};
const founder = new Map();
const step = (n, state, why) => {
  const prev = founder.get(n);
  // open beats check beats done: one missing thing keeps the step open.
  const rank = { done: 0, check: 1, open: 2 };
  if (!prev || rank[state] > rank[prev.state]) founder.set(n, { state, why });
};
const add = (level, msg) => results.push({ level, msg });
const pass = (msg) => add('PASS', msg);
const warn = (msg) => add('WARN', msg);
const fail = (msg) => add('FAIL', msg);
const unverified = (msg) => add('UNVERIFIED', msg);
const check = (cond, good, problem) => (cond ? pass(good) : fail(problem));
const read = (p) => readFileSync(p, 'utf8');

/** Runs the Expo CLI found in this repo's node_modules (no network, no npx lookup). */
function expo(args, cwd, env) {
  let cli;
  try {
    cli = require.resolve('expo/bin/cli');
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

function parseJsonOut(r) {
  try {
    return JSON.parse(r.stdout.slice(r.stdout.indexOf('{')));
  } catch {
    return null;
  }
}

/** Every `<key>NAME</key>` in a plist, in order (enough for the checks below; not a plist parser). */
const plistKeys = (text) => [...text.matchAll(/<key>([^<]+)<\/key>/g)].map((m) => m[1]);
const plistValue = (text, key) => new RegExp(`<key>${key}</key>\\s*<(true|false)\\s*/>`).exec(text)?.[1] ?? null;

// ---------------------------------------------------------------- 1. eas.json: the profile
const easText = read(join(MOBILE, 'eas.json'));
const eas = JSON.parse(easText);
const prof = eas.build?.[PROFILE];
check(Boolean(prof), `eas.json has a "${PROFILE}" build profile (${SPEC.build})`, `eas.json has no "${PROFILE}" build profile.`);
const profEnv = prof?.env ?? {};
const SERVER_ON = String(profEnv.EXPO_PUBLIC_SERVER_FEATURES ?? '').trim().toLowerCase() === 'on';
if (prof) {
  check(prof.distribution === 'store', `${PROFILE} profile: distribution "store" (the only kind TestFlight accepts)`, `${PROFILE} profile distribution is ${JSON.stringify(prof.distribution)}; it must be "store".`);
  check(profEnv.EXPO_PUBLIC_APP_ENV === 'preview', `${PROFILE} profile: EXPO_PUBLIC_APP_ENV=preview (so the .preview bundle id is used)`, `${PROFILE} profile EXPO_PUBLIC_APP_ENV is ${JSON.stringify(profEnv.EXPO_PUBLIC_APP_ENV)}; it must be "preview" or the permanent production id would be spent.`);
  const sf = profEnv.EXPO_PUBLIC_SERVER_FEATURES;
  if (PROFILE === 'preview') {
    check(sf === 'on', 'preview profile: EXPO_PUBLIC_SERVER_FEATURES=on (alpha build 2: sign-in, sync and co-parent against staging)', `preview profile EXPO_PUBLIC_SERVER_FEATURES is ${JSON.stringify(sf)}; the preview profile is the alpha with servers and must say "on" (D-106).`);
  } else if (sf === 'off') {
    pass('testflight profile: EXPO_PUBLIC_SERVER_FEATURES=off (alpha build 1: no Supabase, sign-in, sync or co-parent)');
  } else if (sf === 'on') {
    warn('testflight profile has EXPO_PUBLIC_SERVER_FEATURES=on: that is the R-17 flip. Build it only after the R-17 security gate has passed (T16) and the founder approved the flip; until then nobody outside the family signs in (D-100).');
  } else {
    fail(`testflight profile EXPO_PUBLIC_SERVER_FEATURES is ${JSON.stringify(sf)}; write "off" (or "on" after the R-17 gate), never leave it to a default.`);
  }
  for (const [flag, what] of [
    ['EXPO_PUBLIC_BACKUP', 'recording backup (T27, after the restore drill)'],
    ['EXPO_PUBLIC_STATUS_REPORT', 'the subscription status report (when WP-F14-15 ships)'],
  ]) {
    const v = profEnv[flag];
    if (v === 'off') pass(`${PROFILE} profile: ${flag}=off (build flag; ${what})`);
    else if (v === 'on') warn(`${PROFILE} profile: ${flag}=on. This build flag turns on ${what}; it needs that feature merged, its kill switch consumer, and the founder's approval.`);
    else fail(`${PROFILE} profile: ${flag} is ${JSON.stringify(v)}; write "off" explicitly (F19-REQ-025).`);
  }
  check(prof.autoIncrement === true && eas.cli?.appVersionSource === 'remote', 'build number: EAS owns it (appVersionSource remote, autoIncrement true)', 'Build numbers are not auto-incremented by EAS: a second upload would be rejected as a duplicate build number.');
}
{
  const onProfiles = Object.entries(eas.build ?? {}).filter(([, p]) => p.env?.EXPO_PUBLIC_SERVER_FEATURES === 'on').map(([n]) => n);
  check(!onProfiles.includes('production'), `server features are on only in: ${onProfiles.join(', ') || 'none'} (never production before the store submission is re-planned)`, 'The production profile has EXPO_PUBLIC_SERVER_FEATURES=on. Turning the switch on in the store profile is the founder\'s call after the R-17 gate and the legal pages (D-100); put it back to "off".');
  const unwritten = Object.entries(eas.build ?? {}).filter(([, p]) => !['on', 'off'].includes(p.env?.EXPO_PUBLIC_SERVER_FEATURES)).map(([n]) => n);
  check(unwritten.length === 0, 'every eas.json profile writes EXPO_PUBLIC_SERVER_FEATURES as on or off', `eas.json profile(s) without an explicit on or off: ${unwritten.join(', ')}.`);
}
check(Boolean(eas.submit?.[PROFILE]), `eas.json has a "${PROFILE}" submit profile`, `eas.json has no "${PROFILE}" submit profile (\`eas submit --profile ${PROFILE}\` needs it).`);
check(!/(KEY|SECRET|TOKEN|PASSWORD|DSN)"\s*:/i.test(easText), 'eas.json holds no secret-looking names', 'eas.json holds a value named like a secret: project keys belong in EAS environment variables, never in this file.');
check(!/supabase\.co|sb_publishable_|sb_secret_|eyJ[A-Za-z0-9_-]{10,}/.test(easText), 'eas.json holds no Supabase URL or key (they come from the EAS environment)', 'eas.json holds a Supabase URL or key. Remove it: the staging URL and anon key are EAS environment variables (TESTFLIGHT.md step 9), never committed.');

// ---------------------------------------------------------------- 2. app config, evaluated as the profile builds it
const buildEnv = { ...profEnv };
for (const k of ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY', 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', 'EXPO_PUBLIC_POSTHOG_KEY']) buildEnv[k] = '';
const pub = expo(['config', '--type', 'public', '--json'], MOBILE, buildEnv);
const cfg = parseJsonOut(pub);
if (cfg) pass('`expo config --type public` evaluates');
else fail(`\`expo config --type public\` failed: ${(pub.stderr || pub.stdout || '').trim().split('\n').slice(-3).join(' | ')}`);
// `public` hides ios.config; `prebuild` shows the config as the native project will see it.
const full = parseJsonOut(expo(['config', '--type', 'prebuild', '--json'], MOBILE, buildEnv));
// The permanent production id, to prove the testflight id is exactly that plus ".preview".
const prod = parseJsonOut(expo(['config', '--type', 'public', '--json'], MOBILE, { ...buildEnv, EXPO_PUBLIC_APP_ENV: 'production' }));

let brandScheme = null;
try {
  brandScheme = /scheme[^'"\n]*['"]([a-z][a-z0-9+.-]*)['"]/i.exec(read(join(REPO, 'packages/brand/index.ts')))?.[1] ?? null;
} catch {
  /* reported below */
}
if (cfg) {
  const id = cfg.ios?.bundleIdentifier ?? '';
  check(/^[a-z][a-z0-9-]*(\.[a-z0-9-]+){2,}$/.test(id) && !/example/.test(id), `bundle id ${id}`, `Bundle id "${id}" is not a valid reverse-domain id, or still holds a placeholder (publisher.domain in packages/brand).`);
  check(Boolean(prod?.ios?.bundleIdentifier) && id === `${prod.ios.bundleIdentifier}.preview`, `bundle id is the production id plus ".preview" (${prod?.ios?.bundleIdentifier}), so the permanent id is not spent`, `Bundle id "${id}" is not "<production id>.preview" (production is "${prod?.ios?.bundleIdentifier}").`);
  check(Boolean(brandScheme) && cfg.scheme === brandScheme, `URL scheme "${cfg.scheme}" matches packages/brand`, `URL scheme "${cfg.scheme}" does not match packages/brand ("${brandScheme}").`);
  check(typeof cfg.name === 'string' && cfg.name.length > 1 && cfg.slug === 'scribe', `app name "${cfg.name}", slug "${cfg.slug}"`, `Unexpected app name "${cfg.name}" or slug "${cfg.slug}".`);
  check(
    cfg.extra?.appEnv === 'preview' && cfg.extra?.serverFeatures === SERVER_ON,
    `config extra: appEnv preview, serverFeatures ${SERVER_ON}`,
    `config extra says appEnv=${cfg.extra?.appEnv}, serverFeatures=${cfg.extra?.serverFeatures}; expected preview and ${SERVER_ON}.`,
  );
  check(
    cfg.extra?.backup === (SERVER_ON && profEnv.EXPO_PUBLIC_BACKUP === 'on') && cfg.extra?.statusReport === (SERVER_ON && profEnv.EXPO_PUBLIC_STATUS_REPORT === 'on'),
    `config extra: backup ${cfg.extra?.backup}, statusReport ${cfg.extra?.statusReport} (build flags need the server switch too)`,
    `config extra says backup=${cfg.extra?.backup}, statusReport=${cfg.extra?.statusReport}, which does not follow the profile's switches.`,
  );

  // Permissions: the microphone string, and nothing else asked for.
  const audio = (cfg.plugins ?? []).find((p) => Array.isArray(p) && p[0] === 'expo-audio')?.[1] ?? {};
  const mic = String(audio.microphonePermission ?? '');
  check(mic.length > 20 && !/\{app\}|TODO|example\.com|Allow \$\(PRODUCT_NAME\)/.test(mic), `microphone purpose string: "${mic}"`, `Microphone purpose string is missing, default or holds a placeholder (got "${mic}").`);
  check(audio.enableBackgroundRecording === false && audio.enableBackgroundPlayback === false, 'no background audio modes (LEGAL-REQ-011)', 'Background audio is on: it must stay off (LEGAL-REQ-011).');
  const asked = JSON.stringify([cfg.ios?.infoPlist ?? {}, cfg.plugins ?? []]);
  const extraPerms = [...new Set(asked.match(/(camera|photo|photos|location|contacts|faceID|bluetooth|calendars|speechRecognition|userTracking|notifications?)Permission|NS[A-Za-z]+UsageDescription/g) ?? [])];
  check(extraPerms.length === 0, 'config asks for no permission besides the microphone', `Config names other permissions: ${extraPerms.join(', ')}. Every unused permission is a question App Review will ask.`);

  // Privacy manifest declared.
  const pm = cfg.ios?.privacyManifests;
  check(pm && pm.NSPrivacyTracking === false && Array.isArray(pm.NSPrivacyAccessedAPITypes) && pm.NSPrivacyAccessedAPITypes.length > 0, `privacy manifest declared (tracking false, ${pm?.NSPrivacyAccessedAPITypes?.length ?? 0} required-reason categories)`, 'No privacy manifest in the config (ios.privacyManifests), or tracking is not false.');
  if (pm?.NSPrivacyAccessedAPITypes?.some((t) => t.NSPrivacyAccessedAPIType === 'NSPrivacyAccessedAPICategoryDiskSpace')) {
    warn('Privacy manifest declares the DiskSpace category (E174.1) for expo-sqlite; app.config.ts marks this UNVERIFIED. Apple may email a warning after the first upload either way: read it and adjust.');
  }

  // Export compliance.
  if (full) check(full.ios?.config?.usesNonExemptEncryption === false, 'ios.config.usesNonExemptEncryption is false (no export-compliance question at upload)', 'ios.config.usesNonExemptEncryption is not false: App Store Connect will ask the export-compliance question on every upload.');
  else fail('Could not read the prebuild config to check usesNonExemptEncryption.');

  // EAS project link (the founder's Expo account owns the id; it is not a secret).
  if (cfg.extra?.eas?.projectId) {
    pass(`EAS project id is in the config (${cfg.extra.eas.projectId})`);
    step(3, 'done', `extra.eas.projectId is ${cfg.extra.eas.projectId}`);
  } else {
    warn('No extra.eas.projectId in app.config.ts. `eas init` links the Expo project, but app.config.ts is a dynamic config and the CLI may not write to it (unverified): the founder sends the id it prints and it is added to `extra` in a small PR. A non-interactive build (the GitHub workflow) cannot proceed without it.');
    step(3, 'open', 'no extra.eas.projectId in app.config.ts: create the project (expo.dev, or `eas init` on your own computer) and send the id; EXPO_TOKEN as a GitHub secret');
  }

  // Version and build number.
  check(/^\d+\.\d+\.\d+$/.test(cfg.version ?? ''), `version ${cfg.version} (source: app.config.ts)`, `Version "${cfg.version}" is not x.y.z.`);
  const pkgVersion = JSON.parse(read(join(MOBILE, 'package.json'))).version;
  if (pkgVersion !== cfg.version) warn(`apps/mobile/package.json says ${pkgVersion} but app.config.ts says ${cfg.version}; the app config is what ships.`);
  check(cfg.ios?.buildNumber === undefined, 'build number: not set in app.config.ts (EAS remote counter is the single source; the first build is 1 unless you set it with `eas build:version:set`)', `ios.buildNumber is set in app.config.ts (${cfg.ios?.buildNumber}); with appVersionSource "remote" this is ignored or conflicts. Remove it.`);

  // Icons.
  checkIcons(cfg);
}

function pngInfo(file) {
  const b = readFileSync(file);
  if (b.length < 33 || b.readUInt32BE(0) !== 0x89504e47) return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), colorType: b[25] };
}
function checkIcons(c) {
  const light = c.ios?.icon?.light ?? c.icon;
  const paths = { icon: c.icon, 'ios light': light, 'ios dark': c.ios?.icon?.dark, 'ios tinted': c.ios?.icon?.tinted };
  for (const [what, rel] of Object.entries(paths)) {
    const file = rel && join(MOBILE, rel);
    if (!file || !existsSync(file)) {
      fail(`App icon (${what}) file "${rel}" does not exist.`);
      continue;
    }
    const info = pngInfo(file);
    if (!info || info.w !== 1024 || info.h !== 1024) fail(`App icon (${what}) ${rel} is not a 1024 x 1024 PNG.`);
    else if (what === 'icon' || what === 'ios light') {
      if (info.colorType === 6 || info.colorType === 4) fail(`App icon (${what}) ${rel} has an alpha channel; App Store Connect rejects icons with transparency.`);
      else pass(`App icon (${what}) ${rel}: 1024 x 1024, opaque`);
    } else pass(`App icon (${what}) ${rel}: 1024 x 1024`);
  }
  const scaffold = ['assets/images/icon.png', 'assets/images/adaptive-icon.png', 'assets/images/splash-icon.png'].filter((p) => existsSync(join(MOBILE, p)));
  if (scaffold.length) warn(`Expo scaffold icon file(s) still in the tree: ${scaffold.join(', ')}. Fine for TestFlight; remove before the store.`);
  else pass('no Expo scaffold icon files left (the icons are the approved brand set from packages/brand)');
  if (!/assets\/brand\//.test(c.icon ?? '')) warn(`app icon ${c.icon} is not from assets/brand: it may be a scaffold or placeholder icon.`);
}

// ---------------------------------------------------------------- 3. brand placeholders
try {
  const brand = read(join(REPO, 'packages/brand/index.ts'));
  check(!/example\.(com|org)/.test(brand), 'packages/brand holds no example.com placeholder', 'packages/brand still holds an example.com placeholder.');
} catch {
  fail('packages/brand/index.ts could not be read.');
}

// ---------------------------------------------------------------- 4. env files: nothing server-ish baked in
{
  const envFiles = readdirSync(MOBILE).filter((f) => f.startsWith('.env'));
  const bad = [];
  for (const f of envFiles) {
    for (const line of read(join(MOBILE, f)).split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))) {
      const [k, ...v] = line.split('=');
      if (k === 'EXPO_PUBLIC_APP_ENV') continue;
      if (k === 'EXPO_PUBLIC_SERVER_FEATURES' && v.join('=').trim() === 'off') continue;
      if (k === 'EXPO_PUBLIC_ANALYTICS' && v.join('=').trim() === 'off') continue;
      bad.push(`${f}: ${k}`);
    }
  }
  check(bad.length === 0, `apps/mobile/.env* files hold only APP_ENV, SERVER_FEATURES=off and ANALYTICS=off (${envFiles.join(', ') || 'none'})`, `apps/mobile/.env* holds other values (${bad.join(', ')}). They would be baked into the bundle.`);
  const supa = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY', 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'EXPO_PUBLIC_POSTHOG_KEY'].filter((k) => profEnv[k] !== undefined);
  check(supa.length === 0, `${PROFILE} profile names no Supabase or analytics key in eas.json (project values come from the EAS environment)`, `${PROFILE} profile sets ${supa.join(', ')} in eas.json. Remove them: they belong in EAS environment variables (TESTFLIGHT.md step 9).`);
  check(String(profEnv.EXPO_PUBLIC_ANALYTICS ?? '').trim() === 'off', `${PROFILE} profile sets EXPO_PUBLIC_ANALYTICS=off (no analytics in either alpha build, D-088)`, `${PROFILE} profile must set EXPO_PUBLIC_ANALYTICS to "off".`);
}

// ---------------------------------------------------------------- 4b. the staging project values
/** The role claim of a JWT, or null when the value is not a JWT. Decoded locally; never sent anywhere. */
function jwtRole(value) {
  if (!/^eyJ/.test(value)) return null;
  try {
    return JSON.parse(Buffer.from(value.split('.')[1] ?? '', 'base64url').toString('utf8')).role ?? null;
  } catch {
    return 'unreadable';
  }
}
{
  // Both alpha profiles build in the EAS "preview" environment, so build 1 (switch off) carries the same inlined
  // values as build 2. Any EXPO_PUBLIC_ value is baked into the bundle, so a secret under any such name is a FAIL
  // for either profile. Only the shell is visible here; nothing is sent anywhere.
  const secrets = Object.entries(process.env)
    .filter(([k]) => k.startsWith('EXPO_PUBLIC_'))
    .filter(([, v]) => /^sb_secret_/.test(String(v ?? '').trim()) || jwtRole(String(v ?? '').trim()) === 'service_role')
    .map(([k]) => k);
  if (secrets.length) {
    fail(`${secrets.join(', ')} in this shell hold${secrets.length === 1 ? 's' : ''} a SECRET or service_role key. An EXPO_PUBLIC_ value is inlined into the app, and both alpha profiles read the EAS "preview" environment: delete it there now, rotate it in Supabase (Project Settings > API Keys), and use the publishable (anon) key instead.`);
    step(9, 'open', `a secret key is in ${secrets.join(', ')}`);
  }
}
if (SERVER_ON || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  // EAS cloud builds read these from the EAS "preview" environment, which this script cannot see. If you export
  // the same values in your shell first, their shape is checked here; nothing is sent anywhere.
  const url = String(process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
  const key = String(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
  const howToSee = 'Run `npx eas-cli env:list --environment preview` to see them, or export the two values in this shell and run the preflight again.';
  if (!url && !key) {
    unverified(`EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not in this shell, so they could not be checked. A preview build without them in the EAS "preview" environment has the switch on but no project: the sign-in sheet says sign-in is not available in this build. ${howToSee}`);
    step(9, 'check', 'the staging URL and anon key must be EAS environment variables in "preview"; not visible here');
  } else {
    let ok = true;
    if (!/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(url)) {
      ok = false;
      fail(`EXPO_PUBLIC_SUPABASE_URL ${url ? `"${url}"` : 'is empty'}: expected the staging Project URL, https://<20-character ref>.supabase.co, with no path.`);
    }
    // The publishable key, or the legacy anon JWT. Never the secret key or a service_role JWT (FAIL above).
    const role = jwtRole(key);
    if (/^sb_secret_/.test(key) || role === 'service_role') {
      ok = false;
    } else if (!/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(key) && role !== 'anon') {
      ok = false;
      fail(`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY does not look like a publishable key (sb_publishable_...) or the legacy anon key${key ? '' : ' (it is empty)'}.`);
    }
    if (ok) pass(`Supabase values in this shell look right: ${url} and a publishable key (checked for shape only; the EAS "preview" environment must hold the same)`);
    step(9, ok ? 'check' : 'open', ok ? 'the values in this shell look right; confirm the EAS "preview" environment holds the same' : 'the values in this shell are wrong (see FAIL above)');
  }
}
if (SERVER_ON) {
  const otp = String(process.env.EXPO_PUBLIC_EMAIL_OTP_LENGTH ?? '').trim();
  unverified(`Email code length: the app expects ${otp || '6 (EXPO_PUBLIC_EMAIL_OTP_LENGTH unset)'} digits; Supabase Auth > Email > "Email OTP length" on staging must be the same number, or every typed code is refused.`);
  step(7, 'check', `Auth settings, SMTP and templates on staging; OTP length ${otp || '6'}`);
}

// ---------------------------------------------------------------- 5. language packs and the speech model host
{
  const fromEas = String(profEnv.EXPO_PUBLIC_DOCS_BASE_URL ?? '').trim();
  const fromShell = String(process.env.EXPO_PUBLIC_DOCS_BASE_URL ?? '').trim();
  const value = fromEas || fromShell;
  // Same rule as docsBaseFor in src/lib/remote/base.logic.ts: an https origin, no path, no trailing slash.
  const valid = /^https:\/\/[^\s/]+$/.test(value.replace(/\/+$/, ''));
  let keySet = false;
  try {
    keySet = /^\s*\{[^}]*publicKey\s*:/m.test(read(join(REPO, 'packages/api/src/keys.ts')).replace(/^\s*\/\/.*$/gm, ''));
  } catch {
    /* treated as not set */
  }
  const consequence =
    'The build then has NO pack manifest address, so the speech model and every language pack can never download. Recordings are still kept on the phone, but the words are never written down (Review stays on "Writing down what you said", Book cards say words are waiting). Typed letters are unaffected.';
  if (value && valid && fromEas) pass(`EXPO_PUBLIC_DOCS_BASE_URL is ${value.replace(/\/+$/, '')} (eas.json ${PROFILE} profile)`);
  else if (value && valid) warn(`EXPO_PUBLIC_DOCS_BASE_URL is set only in this shell (${value}); EAS cloud builds do not read your shell. Put it in the ${PROFILE} profile or an EAS "preview" environment variable. ${consequence}`);
  else if (value) warn(`EXPO_PUBLIC_DOCS_BASE_URL "${value}" is not an https origin without a path, so src/lib/remote/base.logic.ts ignores it. ${consequence}`);
  else warn(`EXPO_PUBLIC_DOCS_BASE_URL is not set in the ${PROFILE} profile. It may be set as a plain-text EAS "preview" environment variable, which this script cannot see: check the Expo dashboard. If it is not set anywhere: ${consequence}`);
  if (!keySet) {
    warn(
      'packages/api/src/keys.ts has no trusted signing key (TRUSTED_SIGNING_KEYS is empty; FT-16 `node scripts/packs/keygen.ts`). Even with a host set, the app fails closed: it installs no signed pack, so the speech model still cannot download. A speech-to-words test needs BOTH the host and the key in the build.',
    );
    step(4, 'open', 'packages/api/src/keys.ts has no public signing key (run `npx tsx scripts/packs/keygen.ts` twice and send the public lines)');
  } else pass('a pack signing key is present in packages/api/src/keys.ts');
  // A host and a key are not enough: the signed manifest must have been published (scripts/packs/publish.ts) and uploaded.
  let manifestPublished = false;
  try {
    manifestPublished = !/PACK_MANIFEST\s*:\s*string\s*\|\s*null\s*=\s*null\s*;/.test(read(join(REPO, 'supabase/functions/config/published.ts')));
  } catch {
    /* treated as not published */
  }
  if (!manifestPublished) {
    warn('No signed pack manifest has been published yet (supabase/functions/config/published.ts PACK_MANIFEST is null). Run `npx tsx scripts/packs/publish.ts all` and the upload commands it prints, or the host answers 404 and nothing downloads.');
    step(4, 'open', 'no signed pack manifest published to packs.earlyletters.app yet (R2 bucket, then `npx tsx scripts/packs/publish.ts all`)');
  } else {
    unverified('A signed pack manifest is in the repo. This script does not go online: open <docs base>/functions/v1/config/v1/packs in a browser and check it returns the same JSON before building.');
    step(4, keySet ? 'check' : 'open', 'a manifest is in the repo; check the R2 bucket serves it');
  }
}

// ---------------------------------------------------------------- 6. no real family data (CLAUDE.md privacy rule)
{
  const contentDir = join(REPO, 'packages/content');
  let vitest;
  try {
    vitest = require.resolve('vitest/vitest.mjs', { paths: [contentDir, REPO] });
  } catch {
    vitest = null;
  }
  if (!vitest) unverified('Real-family-data guard not run: vitest is not installed (run `npm install`).');
  else {
    const r = spawnSync(process.execPath, [vitest, 'run', 'test/no-real-family-data.test.ts'], { cwd: contentDir, encoding: 'utf8' });
    check(r.status === 0, 'no-real-family-data guard passes (packages/content/test/no-real-family-data.test.ts)', 'The no-real-family-data guard FAILS: real family details are in the tree. Run it and remove them (CLAUDE.md privacy rules).');
  }
}

// ---------------------------------------------------------------- 7. the native iOS project generates (temp copy, repo untouched)
let ios = null;
if (SKIP_PREBUILD) {
  unverified('`expo prebuild --platform ios --no-install` was skipped (--skip-prebuild). It is not proven that the native project generates.');
} else if (cfg) {
  // A sibling of apps/mobile, so ../../packages and the hoisted node_modules resolve as in the real tree.
  const tmp = mkdtempSync(join(MOBILE, '..', '.preflight-prebuild-'));
  try {
    const skip = new Set(['node_modules', 'ios', 'android', '.expo', 'e2e', 'e2e-web', 'web-preview', 'test']);
    cpSync(MOBILE, tmp, { recursive: true, filter: (src) => !skip.has(src.slice(MOBILE.length + 1).split('/')[0]) });
    const r = expo(['prebuild', '--platform', 'ios', '--no-install', '--clean'], tmp, buildEnv);
    const iosDir = join(tmp, 'ios');
    const appDir = existsSync(iosDir) ? readdirSync(iosDir).find((d) => existsSync(join(iosDir, d, 'Info.plist'))) : null;
    if (r.status !== 0 || !appDir) {
      fail(`\`expo prebuild --platform ios --no-install\` failed (exit ${r.status}): ${(r.stderr || r.stdout || '').trim().split('\n').slice(-4).join(' | ')}`);
    } else {
      pass('`expo prebuild --platform ios --no-install` generates the native project (in a temp copy; compiling and signing are NOT proven, only EAS can do that)');
      const read2 = (f) => (existsSync(join(iosDir, appDir, f)) ? read(join(iosDir, appDir, f)) : null);
      ios = {
        plist: read2('Info.plist') ?? '',
        entitlements: read2(`${appDir}.entitlements`) ?? '',
        privacy: read2('PrivacyInfo.xcprivacy'),
        podfile: existsSync(join(iosDir, 'Podfile')),
        podProps: existsSync(join(iosDir, 'Podfile.properties.json')) ? read(join(iosDir, 'Podfile.properties.json')) : '',
        pbxproj: readdirSync(iosDir).filter((d) => d.endsWith('.xcodeproj')).map((d) => read(join(iosDir, d, 'project.pbxproj'))).join('\n'),
      };
    }
  } catch (e) {
    fail(`prebuild check could not run: ${e.message}`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
if (ios) {
  let usage = plistKeys(ios.plist).filter((k) => /^NS.*UsageDescription$/.test(k));
  // expo-dev-client writes NSLocalNetworkUsageDescription for the dev launcher and adds a build phase that deletes it
  // from every non-Debug build. Accept it only when that phase is in the generated project.
  if (usage.includes('NSLocalNetworkUsageDescription') && /Strip Local Network Keys for Release/.test(ios.pbxproj)) {
    usage = usage.filter((k) => k !== 'NSLocalNetworkUsageDescription');
    notes.push('The generated Info.plist holds NSLocalNetworkUsageDescription (and a Bonjour entry) from expo-dev-client. A build phase ("Strip Local Network Keys for Release") removes them from the Release app that TestFlight gets; the phase is present, but the stripped result is UNVERIFIED until the first build is inspected. If App Review or a tester ever sees a local-network prompt, remove expo-dev-client from the testflight build.');
  }
  check(usage.length === 1 && usage[0] === 'NSMicrophoneUsageDescription', 'generated Info.plist asks for the microphone only (NSMicrophoneUsageDescription; the dev-client local-network key is stripped from Release)', `Generated Info.plist has usage strings: ${usage.join(', ') || 'none'}. Expected only NSMicrophoneUsageDescription.`);
  const modes = /<key>UIBackgroundModes<\/key>\s*<array>([\s\S]*?)<\/array>/.exec(ios.plist)?.[1];
  check(!modes, 'generated Info.plist has no UIBackgroundModes', `Generated Info.plist declares background modes (${modes?.replace(/\s+/g, ' ').trim()}); LEGAL-REQ-011 says none.`);
  check(plistValue(ios.plist, 'ITSAppUsesNonExemptEncryption') === 'false', 'generated Info.plist: ITSAppUsesNonExemptEncryption = false', 'Generated Info.plist lacks ITSAppUsesNonExemptEncryption=false.');
  check(ios.privacy !== null && /NSPrivacyTracking<\/key>\s*<false\/>/.test(ios.privacy), 'generated PrivacyInfo.xcprivacy present, tracking false', 'Generated native project has no PrivacyInfo.xcprivacy, or tracking is not false.');
  {
    let target = null;
    try {
      target = JSON.parse(ios.podProps || '{}')['ios.deploymentTarget'] ?? null;
    } catch {
      target = null;
    }
    check(target === '17.0', 'generated Podfile.properties.json sets ios.deploymentTarget 17.0 (D-098)', `Generated native project has ios.deploymentTarget ${JSON.stringify(target)}; D-098 needs 17.0 (expo-build-properties in app.config.ts).`);
  }
  check(new RegExp(`<string>${cfg?.scheme ?? 'scribe'}</string>`).test(ios.plist), `generated Info.plist registers the "${cfg?.scheme}" URL scheme`, `Generated Info.plist does not register the "${cfg?.scheme}" URL scheme.`);
  const ent = plistKeys(ios.entitlements);
  check(ent.includes('com.apple.developer.default-data-protection'), 'generated entitlements: data protection (complete until first unlock)', 'Generated entitlements lack the data-protection class.');
  if (ent.includes('com.apple.developer.applesignin')) {
    notes.push(
      SERVER_ON
        ? 'The build carries the Sign in with Apple entitlement (com.apple.developer.applesignin) and offers Sign in with Apple and email sign-in against the staging project. The Supabase Apple provider must list the .preview bundle id as a client id (TESTFLIGHT.md step 8).'
        : 'The build carries the Sign in with Apple entitlement (com.apple.developer.applesignin) and the expo-apple-authentication module, but this build offers no sign-in screen (SERVER_FEATURES=off). If App Review asks: "Sign in is not offered in this build; the code and entitlement are dormant."',
    );
  }
  if (ent.includes('com.apple.developer.associated-domains')) {
    const d = (cfg?.ios?.associatedDomains ?? []).join(', ');
    notes.push(
      SERVER_ON
        ? `The build carries the Associated Domains entitlement (${d}). Email sign-in links and invite links open the app only once the website serves the association file with this build's id (TESTFLIGHT.md step 10); until then they open the website and the person types the code instead.`
        : `The build carries the Associated Domains entitlement (${d}) for universal links (invites, email sign-in). Nothing in this build acts on those links (invite and sign-in are off, and links are an allowlist that never starts recording). EAS will register the capability on the .preview App ID.`,
    );
  }
}
if (cfg) {
  // Config-level notes, independent of whether prebuild ran.
  const dormant = SERVER_ON ? 'used in this build (sign-in against staging)' : 'dormant in this build, no sign-in screen is offered';
  if (cfg.ios?.usesAppleSignIn && !notes.some((n) => /Sign in with Apple/.test(n))) notes.push(`Config sets ios.usesAppleSignIn (Sign in with Apple entitlement) and the expo-apple-authentication plugin; ${dormant}.`);
  if (cfg.ios?.associatedDomains?.length && !notes.some((n) => /Associated Domains/.test(n))) notes.push(`Config sets ios.associatedDomains (${cfg.ios.associatedDomains.join(', ')}); ${SERVER_ON ? 'needs the website association file (step 10)' : 'dormant in this build'}.`);
  const google = (cfg.plugins ?? []).some((p) => (Array.isArray(p) ? p[0] : p) === '@react-native-google-signin/google-signin');
  if (!google) notes.push('Google sign-in is not in this build (it needs EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, which the profile does not set). Apple and email are enough for the alpha.');
  if (SERVER_ON) {
    notes.push('Server features are ON: sign-in (Apple, email link and code), sync and co-parent sharing talk to the staging Supabase project named by the EAS "preview" environment. Recording backup and the status report stay off (build flags). Analytics is off (EXPO_PUBLIC_ANALYTICS=off): no consent sheet, no PostHog client. Kill path: rebuild with EXPO_PUBLIC_SERVER_FEATURES=off and expire this build in App Store Connect (TESTFLIGHT.md "If something goes wrong").');
    notes.push('Not for anyone outside the family until the R-17 security gate passes (D-100): put this build in the family internal group only, with automatic distribution off for every other group.');
    const collected = cfg.ios?.privacyManifests?.NSPrivacyCollectedDataTypes ?? [];
    if (collected.length === 0)
      warn('The privacy manifest declares no collected data (NSPrivacyCollectedDataTypes is empty) but this build signs in and syncs. Fine for internal TestFlight [unverified]; fill it from docs/legal/data-map.yaml (BL-349, WP-F21-09) before any external group or store build.');
  } else {
    notes.push('Server-side code is dormant behind EXPO_PUBLIC_SERVER_FEATURES=off: no Supabase client is constructed, no network call is made for sign-in or sync, and co-parent entry points show "coming soon". Analytics is switched off (EXPO_PUBLIC_ANALYTICS=off): no consent sheet, no usage switch, no PostHog client, and no PostHog key is in the build.');
  }
  notes.push('Plus is a StoreKit 2 in-app purchase (product ids plus.annual and plus.monthly) created under THIS App Store Connect record: the .preview record needs its own products and the Paid Apps agreement before sandbox purchases load. Review notes for guideline 3.1.2(a) belong to the production submission, not TestFlight internal testing (unverified).');
}

// ---------------------------------------------------------------- founder steps this script cannot see
// Apple, App Store Connect, Supabase dashboards and the live website are outside the repo, and the script
// never goes online, so these stay "check" until the founder ticks them in docs/FOUNDER_TASKS.md.
step(1, 'check', 'Apple Developer Program membership Active (developer.apple.com > Account)');
step(2, 'check', 'App Store Connect record for the .preview bundle id, the testers, and the API key stored in EAS for builds from GitHub Actions');
if (!founder.has(3)) step(3, 'check', 'project id not checked (the app config did not evaluate)');
if (!founder.has(4)) step(4, 'check', 'words from speech need the key, the bucket and a published manifest');
step(5, 'check', PROFILE === 'testflight' ? 'this run is the preflight for build 1; the build itself runs in GitHub Actions or on your own computer, with iOS credentials in EAS' : 'build 1 is optional before build 2');
if (SERVER_ON) {
  let fromDevelop = false;
  try {
    const deploy = read(join(REPO, '.github/workflows/deploy-db.yml'));
    fromDevelop = /workflow_dispatch/.test(deploy) && /\bdevelop\b/.test(deploy);
  } catch {
    /* treated as not yet */
  }
  if (fromDevelop) step(6, 'check', 'scribe-staging exists and the develop run of deploy-db.yml has applied every migration');
  else step(6, 'open', ".github/workflows/deploy-db.yml cannot apply develop's migrations to staging yet (the S20 staging-from-develop PR), so build 2 has no schema");
  step(8, 'check', 'Supabase Apple provider client ids include the .preview bundle id');
  step(10, 'check', 'curl -sI https://<website>/.well-known/apple-app-site-association answers 200 application/json with no redirect');
  step(11, 'check', 'this run is the preflight for build 2');
  step(12, 'check', 'before anyone tries Delete account: RESEND_API_KEY and the purge worker on staging');
}
const needed = SERVER_ON ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : [1, 2, 3, 4, 5];

// ---------------------------------------------------------------- report
const order = ['FAIL', 'WARN', 'UNVERIFIED', 'PASS'];
const count = (l) => results.filter((r) => r.level === l).length;
console.log(`TestFlight preflight: ${SPEC.build}, profile "${PROFILE}", server features ${SERVER_ON ? 'ON (staging)' : 'OFF (on this phone only)'}\n`);
for (const lvl of ['PASS', 'UNVERIFIED', 'WARN', 'FAIL']) {
  for (const r of results.filter((x) => x.level === lvl)) console.log(`${lvl.padEnd(10)} ${r.msg}`);
}
if (notes.length) {
  console.log('\nApp Review notes (facts, not problems):');
  for (const n of notes) console.log(`  - ${n}`);
}
const open = needed.filter((n) => founder.get(n)?.state === 'open');
const toCheck = needed.filter((n) => founder.get(n)?.state === 'check');
console.log(`\nFounder steps for ${SPEC.build} (docs/release/TESTFLIGHT.md):`);
for (const n of open) console.log(`  MISSING   ${STEPS[n]}: ${founder.get(n).why}`);
for (const n of toCheck) console.log(`  CHECK     ${STEPS[n]}: ${founder.get(n).why}`);
for (const n of needed.filter((x) => founder.get(x)?.state === 'done')) console.log(`  DONE      ${STEPS[n]}: ${founder.get(n).why}`);
if (PROFILE === 'testflight') console.log('  (Steps 6 to 12 are for alpha build 2: run `npm run preflight:alpha -w @scribe/mobile`.)');
if (open.includes(4)) console.log('  Step 4 is optional: without it the build works for typing, the Book and reading, but recordings get no words.');

console.log(`\n${order.map((l) => `${count(l)} ${l.toLowerCase()}`).join(', ')}, ${open.length} founder step(s) missing, ${toCheck.length} to check by hand`);
console.log(
  count('FAIL')
    ? 'Do not build yet: fix every FAIL above.'
    : 'No FAIL. This checks configuration only: it does not prove the build compiles or signs, and it never touches Apple or Expo. Read every WARN and UNVERIFIED before you build.',
);
process.exit(count('FAIL') ? 1 : 0);
