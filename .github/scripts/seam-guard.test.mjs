// Tests for release check B-8. Run: node --test .github/scripts/seam-guard.test.mjs
// The real export runs in .github/workflows/seam-guard.yml and testflight.yml; here it is replaced by
// a stand-in that writes a bundle, so these run in seconds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { B9_REFUSAL, CONTROL_IDENTIFIER, e2eControl, exportEnv, FORCED_ON, guard, main, profileEnv, scan, SEAM_IDENTIFIERS, storeProfiles, wiringPresent } from './seam-guard.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REAL_EAS = JSON.parse(readFileSync(join(REPO, 'apps/mobile/eas.json'), 'utf8'));

const EAS = {
  build: {
    development: { distribution: 'internal', developmentClient: true, env: { EXPO_PUBLIC_APP_ENV: 'development' } },
    preview: { distribution: 'store', env: { EXPO_PUBLIC_APP_ENV: 'preview', EXPO_PUBLIC_SERVER_FEATURES: 'on' } },
    testflight: { extends: 'preview', env: { EXPO_PUBLIC_SERVER_FEATURES: 'off' } },
    e2e: { extends: 'preview', withoutCredentials: true, ios: { simulator: true }, env: { EXPO_PUBLIC_E2E: '1' } },
    production: { env: { EXPO_PUBLIC_APP_ENV: 'production' } },
  },
};

test('profileEnv follows extends, the child over the base', () => {
  assert.deepEqual(profileEnv(EAS, 'testflight'), { EXPO_PUBLIC_APP_ENV: 'preview', EXPO_PUBLIC_SERVER_FEATURES: 'off' });
  assert.deepEqual(profileEnv(EAS, 'production'), { EXPO_PUBLIC_APP_ENV: 'production' });
  assert.throws(() => profileEnv(EAS, 'nope'), /no build profile "nope"/);
  assert.throws(() => profileEnv({ build: { a: { extends: 'b' }, b: { extends: 'a' } } }, 'a'), /extends itself/);
});

test('store profiles: distribution store (or unset) and not a simulator build; internal and simulator profiles are left out', () => {
  assert.deepEqual(storeProfiles(EAS), ['preview', 'production', 'testflight']);
});

test('this repository: the alpha builds and the App Store build are checked, the dev client is not', () => {
  const profiles = storeProfiles(REAL_EAS);
  for (const p of ['preview', 'testflight', 'production']) assert.ok(profiles.includes(p), `${p} is checked`);
  assert.ok(!profiles.includes('development'));
  for (const p of profiles) assert.notEqual(profileEnv(REAL_EAS, p).EXPO_PUBLIC_APP_ENV, undefined, `${p} names its APP_ENV`);
});

test('scan counts every identifier, and only seam identifiers', () => {
  assert.deepEqual(scan(['a e2eKillDrill b e2eKillDrill', 'Asha kill drill']), { e2eKillDrill: 2, 'Asha kill drill': 1 });
  assert.deepEqual(scan(['nothing to see', 'e2e kill drill']), {});
  assert.ok(SEAM_IDENTIFIERS.includes('e2eKillDrill'));
});

test('exportEnv drops the runner EXPO_PUBLIC_* values, applies the profile, then forces the e2e switches on', () => {
  const env = exportEnv({ PATH: '/bin', EXPO_PUBLIC_APP_ENV: 'development', EXPO_PUBLIC_E2E: '0', EXPO_PUBLIC_EXTRA: 'x' }, { EXPO_PUBLIC_APP_ENV: 'production' });
  assert.equal(env.PATH, '/bin');
  assert.equal(env.EXPO_PUBLIC_APP_ENV, 'production');
  assert.equal(env.EXPO_PUBLIC_EXTRA, undefined);
  for (const [k, v] of Object.entries(FORCED_ON)) assert.equal(env[k], v);
});

/**
 * A stand-in for `expo export`: writes one bundle into --output-dir and records the env it was given.
 * `forced` answers the export with EXPO_PUBLIC_E2E=1: a bundle body, or { refuse: true } for app.config.ts's
 * B-9 refusal, or { status } for another failure. `built` answers the export without the flag.
 */
function fakeExport(forced, built = forced) {
  const calls = [];
  const run = (cmd, args, opts) => {
    calls.push({ cmd, args, env: opts.env });
    const answer = opts.env.EXPO_PUBLIC_E2E === '1' ? forced : built;
    if (typeof answer === 'object' && answer.refuse) {
      return { status: 1, stdout: '', stderr: 'Error: EXPO_PUBLIC_E2E=1 with EXPO_PUBLIC_APP_ENV=preview: e2e seams never reach a preview build (B-9). Unset EXPO_PUBLIC_E2E, or build the e2e profile.' };
    }
    if (typeof answer === 'object') return { status: answer.status, stdout: '', stderr: 'Metro failed' };
    const out = args[args.indexOf('--output-dir') + 1];
    mkdirSync(join(out, '_expo/static/js/ios'), { recursive: true });
    writeFileSync(join(out, '_expo/static/js/ios/entry.js'), answer);
    writeFileSync(join(out, 'metadata.json'), '{}');
    return { status: 0, stdout: '', stderr: '' };
  };
  return { run, calls };
}

const bundle = (extra = '') => `var a="Early Letters";${'x'.repeat(600_000)}${extra}`;

test('a clean bundle passes, exported with the profile env and EXPO_PUBLIC_E2E=1', async () => {
  const lines = [];
  const { run, calls } = fakeExport(bundle());
  assert.equal(await guard(REPO, EAS, 'testflight', (s) => lines.push(s), run), true);
  assert.deepEqual(calls[0].args.slice(0, 5), ['expo', 'export', '--platform', 'ios', '--no-bytecode']);
  assert.equal(calls[0].env.EXPO_PUBLIC_E2E, '1');
  assert.equal(calls[0].env.EXPO_PUBLIC_APP_ENV, 'preview');
  assert.match(lines.join('\n'), /B-8 testflight: clean/);
});

test('planted failure: a seam in the bundle fails and names what it found', async () => {
  const lines = [];
  const { run } = fakeExport(bundle('Settings.get("e2eKillDrill");"Asha kill drill 3"'));
  assert.equal(await guard(REPO, EAS, 'testflight', (s) => lines.push(s), run), false);
  assert.match(lines.join('\n'), /::error::B-8 testflight: .*e2eKillDrill x1, Asha kill drill x1/);
});

test('a failed export fails; so does an export too small or without the public name to prove the search', async () => {
  assert.equal(await guard(REPO, EAS, 'production', () => {}, fakeExport({ status: 1 }).run), false);
  const lines = [];
  assert.equal(await guard(REPO, EAS, 'production', (s) => lines.push(s), fakeExport('tiny').run), false);
  assert.match(lines.join('\n'), /does not look like the app's bundle/);
  assert.equal(await guard(REPO, EAS, 'production', () => {}, fakeExport('y'.repeat(600_000)).run), false);
});

test('B-9: when app.config.ts refuses the forced build, the bundle as the profile builds must still be clean', async () => {
  const lines = [];
  const ok = fakeExport({ refuse: true }, bundle());
  assert.equal(await guard(REPO, EAS, 'testflight', (s) => lines.push(s), ok.run), true);
  assert.deepEqual(ok.calls.map((c) => c.env.EXPO_PUBLIC_E2E), ['1', undefined]);
  assert.match(lines.join('\n'), /refused the build with EXPO_PUBLIC_E2E=1 \(B-9\), and the bundle as the profile builds is clean/);
  const leak = [];
  assert.equal(await guard(REPO, EAS, 'testflight', (s) => leak.push(s), fakeExport({ refuse: true }, bundle('"e2eKillRun"')).run), false);
  assert.match(leak.join('\n'), /as the profile builds carries e2e seam code \(e2eKillRun x1\)/);
  assert.equal(await guard(REPO, EAS, 'testflight', () => {}, fakeExport({ refuse: true }, { status: 1 }).run), false);
  assert.ok(B9_REFUSAL.test('EXPO_PUBLIC_E2E=1 in an EAS build of the "testflight" profile: only the e2e profile carries e2e seams (B-9).'));
  assert.ok(!B9_REFUSAL.test('Error: Cannot find module expo-router'));
});

test('the identifiers are S19\'s list on #203, plus the drill\'s other launch-argument keys', () => {
  for (const id of ['e2eSeed', 'e2eOffline', 'e2eConfig', 'e2eKillDrill', 'e2eKillRun', 'e2eKillPlant', 'kill-drill', 'Asha kill drill', 'e2eKillKind', 'e2eKillPoint']) assert.ok(SEAM_IDENTIFIERS.includes(id), id);
  assert.ok(SEAM_IDENTIFIERS.includes(CONTROL_IDENTIFIER));
});

const PROTOCOL = join(REPO, 'apps/mobile/e2e/kill/protocol.mjs');
test('every launch-argument key, the marker folder and the drill text of the kill drill protocol are in SEAM_IDENTIFIERS', { skip: !existsSync(PROTOCOL) && 'apps/mobile/e2e/kill/protocol.mjs arrives with #203' }, async () => {
  const protocol = await import(PROTOCOL);
  for (const [name, key] of Object.entries(protocol.DRILL_ARG)) assert.ok(SEAM_IDENTIFIERS.includes(key), `DRILL_ARG.${name} = ${key} is missing from SEAM_IDENTIFIERS`);
  assert.ok(SEAM_IDENTIFIERS.includes(protocol.MARKER_DIR), `MARKER_DIR ${protocol.MARKER_DIR}`);
  assert.ok(SEAM_IDENTIFIERS.some((id) => protocol.drillText(7).startsWith(id)), 'the drill text');
});

test('wiringPresent: the import and the call, both', () => {
  const wired = "import { useE2eSeams } from '@/dev/e2e-seams';\nfunction Root() {\n  useE2eSeams();\n}";
  assert.equal(wiringPresent(wired), true);
  assert.equal(wiringPresent("import { useE2eSeams } from '@/dev/e2e-seams';"), false);
  assert.equal(wiringPresent('function Root() {}'), false);
});

/** A small repository for the positive control: a root layout, eas.json with an e2e profile, and the brand. */
function controlFixture({ wired = true, e2e = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'seam-control-'));
  mkdirSync(join(root, 'apps/mobile/src/app'), { recursive: true });
  mkdirSync(join(root, 'packages/brand'), { recursive: true });
  writeFileSync(join(root, 'apps/mobile/src/app/_layout.tsx'), wired ? "import { useE2eSeams } from '@/dev/e2e-seams';\nfunction Root() {\n  useE2eSeams();\n}\n" : 'function Root() {}\n');
  writeFileSync(join(root, 'packages/brand/index.ts'), "export const brand = { name: 'Early Letters' };\n");
  const eas = { build: { ...EAS.build } };
  if (!e2e) delete eas.build.e2e;
  return { root, eas };
}

test('positive control: skipped, with a reason, while the wiring line is not in _layout.tsx (this repository today)', async () => {
  const lines = [];
  const layout = readFileSync(join(REPO, 'apps/mobile/src/app/_layout.tsx'), 'utf8');
  const result = await e2eControl(REPO, REAL_EAS, (l) => lines.push(l), () => assert.fail('no export while unwired'));
  if (wiringPresent(layout)) return; // after RA-20-18 the next tests cover it
  assert.equal(result, true);
  assert.match(lines.join('\n'), /positive control: skipped\. The RA-20-18 wiring line is not in/);
});

test('positive control: with the wiring line, the e2e bundle must carry the seam', async () => {
  const { root, eas } = controlFixture();
  try {
    const lines = [];
    const good = fakeExport(bundle('"e2eKillDrill"'));
    assert.equal(await e2eControl(root, eas, (l) => lines.push(l), good.run), true);
    assert.equal(good.calls[0].env.EXPO_PUBLIC_E2E, '1');
    assert.equal(good.calls[0].env.EXPO_PUBLIC_APP_ENV, 'preview');
    assert.match(lines.join('\n'), /the e2e bundle carries the seam \(e2eKillDrill x1\)/);
    const blind = [];
    assert.equal(await e2eControl(root, eas, (l) => blind.push(l), fakeExport(bundle()).run), false);
    assert.match(blind.join('\n'), /does not carry e2eKillDrill, so a clean store bundle proves nothing/);
    assert.equal(await e2eControl(root, eas, () => {}, fakeExport({ status: 1 }).run), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('positive control: the wiring line without an e2e profile is an error', async () => {
  const { root, eas } = controlFixture({ e2e: false });
  try {
    const lines = [];
    assert.equal(await e2eControl(root, eas, (l) => lines.push(l), () => assert.fail('no export')), false);
    assert.match(lines.join('\n'), /no "e2e" build profile/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('usage: no profile, a flag without a value, or an unknown profile exits 2', async () => {
  const quiet = () => {};
  assert.equal(await main([], REPO, quiet), 2);
  assert.equal(await main(['--profile'], REPO, quiet), 2);
  assert.equal(await main(['--profile', '--store-profiles'], REPO, quiet), 2);
  assert.equal(await main(['--profile', 'no-such-profile'], REPO, quiet), 2);
  assert.equal(await main(['--bogus'], REPO, quiet), 2);
});
