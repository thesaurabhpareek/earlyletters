#!/usr/bin/env node
/**
 * Preflight for the first TestFlight build of the v1.0 ON-DEVICE app (EXPO_PUBLIC_SERVER_FEATURES=off).
 *
 *   npm run preflight:testflight -w @scribe/mobile
 *   npm run preflight:testflight -w @scribe/mobile -- --skip-prebuild   # skip the native-project check (about a minute)
 *
 * Checks everything that can be checked without an Apple or Expo account, the way the `testflight`
 * profile in eas.json will build it. It does not build, does not touch the network and needs no secrets.
 * v1.0 has no backend, so it does NOT ask for a Supabase URL or key, a Sign in with Apple key or a pack
 * signing key as requirements; where one of them would change what testers can do, it says so as a WARN.
 *
 * Exit code: 1 if any FAIL, otherwise 0. WARN never fails the run: it means "the build will work, but
 * read the consequence first". UNVERIFIED means a check could not run here (it is not a pass).
 *
 * Levels: PASS, WARN, FAIL, UNVERIFIED, then the App Review notes (facts to tell the reviewer, not problems).
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
const PROFILE = 'testflight';

const results = [];
const notes = [];
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

// ---------------------------------------------------------------- 1. eas.json: the testflight profile
const easText = read(join(MOBILE, 'eas.json'));
const eas = JSON.parse(easText);
const prof = eas.build?.[PROFILE];
check(Boolean(prof), 'eas.json has a "testflight" build profile', 'eas.json has no "testflight" build profile.');
const profEnv = prof?.env ?? {};
if (prof) {
  check(prof.distribution === 'store', 'testflight profile: distribution "store" (the only kind TestFlight accepts)', `testflight profile distribution is ${JSON.stringify(prof.distribution)}; it must be "store".`);
  check(profEnv.EXPO_PUBLIC_APP_ENV === 'preview', 'testflight profile: EXPO_PUBLIC_APP_ENV=preview (so the .preview bundle id is used)', `testflight profile EXPO_PUBLIC_APP_ENV is ${JSON.stringify(profEnv.EXPO_PUBLIC_APP_ENV)}; it must be "preview" or the permanent production id would be spent.`);
  check(profEnv.EXPO_PUBLIC_SERVER_FEATURES === 'off', 'testflight profile: EXPO_PUBLIC_SERVER_FEATURES=off (no Supabase, sign-in, sync or co-parent)', `testflight profile EXPO_PUBLIC_SERVER_FEATURES is ${JSON.stringify(profEnv.EXPO_PUBLIC_SERVER_FEATURES)}; v1.0 requires "off".`);
  check(prof.autoIncrement === true && eas.cli?.appVersionSource === 'remote', 'build number: EAS owns it (appVersionSource remote, autoIncrement true)', 'Build numbers are not auto-incremented by EAS: a second upload would be rejected as a duplicate build number.');
}
const onProfiles = Object.entries(eas.build ?? {}).filter(([, p]) => p.env?.EXPO_PUBLIC_SERVER_FEATURES !== 'off').map(([n]) => n);
check(onProfiles.length === 0, 'every eas.json profile has server features off', `eas.json profile(s) without EXPO_PUBLIC_SERVER_FEATURES=off: ${onProfiles.join(', ')}.`);
check(Boolean(eas.submit?.[PROFILE]), 'eas.json has a "testflight" submit profile', 'eas.json has no "testflight" submit profile (`eas submit --profile testflight` needs it).');
check(!/(KEY|SECRET|TOKEN|PASSWORD|DSN)"\s*:/i.test(easText), 'eas.json holds no secret-looking values', 'eas.json holds a value named like a secret: secrets belong in EAS environment variables, never in this file.');

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
  check(cfg.extra?.appEnv === 'preview' && cfg.extra?.serverFeatures === false, 'config extra: appEnv preview, serverFeatures false', `config extra says appEnv=${cfg.extra?.appEnv}, serverFeatures=${cfg.extra?.serverFeatures}; expected preview and false.`);

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
  if (cfg.extra?.eas?.projectId) pass(`EAS project id is in the config (${cfg.extra.eas.projectId})`);
  else warn('No extra.eas.projectId in app.config.ts. `eas init` links the Expo project, but app.config.ts is a dynamic config and the CLI may not write to it (unverified): the founder sends the id it prints and it is added to `extra` in a small PR. A non-interactive build (the GitHub workflow) cannot proceed without it.');

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
  else pass('no Expo scaffold icon files left (the icons are the generated brand set, scripts/brand/icons.mjs)');
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
      bad.push(`${f}: ${k}`);
    }
  }
  check(bad.length === 0, `apps/mobile/.env* files hold only APP_ENV and SERVER_FEATURES=off (${envFiles.join(', ') || 'none'})`, `apps/mobile/.env* holds other values (${bad.join(', ')}). They would be baked into the bundle.`);
  const supa = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY', 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'EXPO_PUBLIC_POSTHOG_KEY'].filter((k) => profEnv[k]);
  check(supa.length === 0, 'testflight profile sets no Supabase or analytics key (none is needed for v1.0)', `testflight profile sets ${supa.join(', ')}; v1.0 on-device needs none of these.`);
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
  if (value && valid && fromEas) pass(`EXPO_PUBLIC_DOCS_BASE_URL is ${value.replace(/\/+$/, '')} (eas.json testflight profile)`);
  else if (value && valid) warn(`EXPO_PUBLIC_DOCS_BASE_URL is set only in this shell (${value}); EAS cloud builds do not read your shell. Put it in the testflight profile or an EAS "preview" environment variable. ${consequence}`);
  else if (value) warn(`EXPO_PUBLIC_DOCS_BASE_URL "${value}" is not an https origin without a path, so src/lib/remote/base.logic.ts ignores it. ${consequence}`);
  else warn(`EXPO_PUBLIC_DOCS_BASE_URL is not set in the testflight profile. It may be set as a plain-text EAS "preview" environment variable, which this script cannot see: check the Expo dashboard. If it is not set anywhere: ${consequence}`);
  if (!keySet) {
    warn(
      'packages/api/src/keys.ts has no trusted signing key (TRUSTED_SIGNING_KEYS is empty; FT-16 `node scripts/packs/keygen.ts`). Even with a host set, the app fails closed: it installs no signed pack, so the speech model still cannot download. A speech-to-words test needs BOTH the host and the key in the build.',
    );
  } else pass('a pack signing key is present in packages/api/src/keys.ts');
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
  check(new RegExp(`<string>${cfg?.scheme ?? 'scribe'}</string>`).test(ios.plist), `generated Info.plist registers the "${cfg?.scheme}" URL scheme`, `Generated Info.plist does not register the "${cfg?.scheme}" URL scheme.`);
  const ent = plistKeys(ios.entitlements);
  check(ent.includes('com.apple.developer.default-data-protection'), 'generated entitlements: data protection (complete until first unlock)', 'Generated entitlements lack the data-protection class.');
  if (ent.includes('com.apple.developer.applesignin')) notes.push('The build carries the Sign in with Apple entitlement (com.apple.developer.applesignin) and the expo-apple-authentication module, but v1.0 offers no sign-in screen (SERVER_FEATURES=off). If App Review asks: "Sign in is not offered in v1.0; the code and entitlement are dormant and are used from v1.1."');
  if (ent.includes('com.apple.developer.associated-domains')) {
    const d = (cfg?.ios?.associatedDomains ?? []).join(', ');
    notes.push(`The build carries the Associated Domains entitlement (${d}) for universal links (invites, email sign-in). Nothing in v1.0 acts on those links (invite and sign-in are off, and links are an allowlist that never starts recording). The website must serve the association file for it to do anything, and EAS will register the capability on the .preview App ID.`);
  }
}
if (cfg) {
  // Config-level notes, independent of whether prebuild ran.
  if (cfg.ios?.usesAppleSignIn && !notes.some((n) => /Sign in with Apple/.test(n))) notes.push('Config sets ios.usesAppleSignIn (Sign in with Apple entitlement) and the expo-apple-authentication plugin; dormant in v1.0, no sign-in screen is offered.');
  if (cfg.ios?.associatedDomains?.length && !notes.some((n) => /Associated Domains/.test(n))) notes.push(`Config sets ios.associatedDomains (${cfg.ios.associatedDomains.join(', ')}); dormant in v1.0.`);
  const google = (cfg.plugins ?? []).some((p) => (Array.isArray(p) ? p[0] : p) === '@react-native-google-signin/google-signin');
  if (!google) notes.push('Google sign-in is not in this build (it needs EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, which the profile does not set).');
  notes.push('Server-side code is dormant behind EXPO_PUBLIC_SERVER_FEATURES=off: no Supabase client is constructed, no network call is made for sign-in or sync, and co-parent entry points show "coming soon". Analytics is off unless a person opts in AND a PostHog key is in the build (none is).');
  notes.push('Plus is a StoreKit 2 in-app purchase (product ids plus.annual and plus.monthly) created under THIS App Store Connect record: the .preview record needs its own products and the Paid Apps agreement before sandbox purchases load. Review notes for guideline 3.1.2(a) belong to the production submission, not TestFlight internal testing (unverified).');
}

// ---------------------------------------------------------------- report
const order = ['FAIL', 'WARN', 'UNVERIFIED', 'PASS'];
const count = (l) => results.filter((r) => r.level === l).length;
console.log('Early Letters TestFlight preflight (v1.0 on-device, profile "testflight")\n');
for (const lvl of ['PASS', 'UNVERIFIED', 'WARN', 'FAIL']) {
  for (const r of results.filter((x) => x.level === lvl)) console.log(`${lvl.padEnd(10)} ${r.msg}`);
}
if (notes.length) {
  console.log('\nApp Review notes (facts, not problems):');
  for (const n of notes) console.log(`  - ${n}`);
}
console.log(`\n${order.map((l) => `${count(l)} ${l.toLowerCase()}`).join(', ')}`);
console.log(
  count('FAIL')
    ? 'Do not build yet: fix every FAIL above.'
    : 'No FAIL. This checks configuration only: it does not prove the build compiles or signs, and it never touches Apple or Expo. Read every WARN and UNVERIFIED before you build.',
);
process.exit(count('FAIL') ? 1 : 0);
