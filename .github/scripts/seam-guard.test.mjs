// Tests for release check B-8. Run: node --test .github/scripts/seam-guard.test.mjs
// The real export runs in .github/workflows/ci.yml and testflight.yml; here it is replaced by
// a stand-in that writes a bundle, so these run in seconds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  B9_REFUSAL,
  BUNDLE_PATHS,
  changedSince,
  CONTROL_IDENTIFIER,
  e2eControl,
  exportEnv,
  FORCED_ON,
  guard,
  main,
  profileEnv,
  relevant,
  scan,
  SEAM_IDENTIFIERS,
  seamImporters,
  storeProfiles,
} from './seam-guard.mjs';

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

test('this repository: the alpha builds and the App Store build are checked, the dev client and the e2e simulator build are not', () => {
  const profiles = storeProfiles(REAL_EAS);
  for (const p of ['preview', 'testflight', 'production']) assert.ok(profiles.includes(p), `${p} is checked`);
  assert.ok(!profiles.includes('development'));
  assert.ok(!profiles.includes('e2e'));
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

// ---------------------------------------------------------------- when the exports run (ci.yml, under `required`)

test('relevant: app, package, lockfile, the guard and the two workflows count; docs, SQL and other workflows do not', () => {
  const changed = [
    'apps/mobile/src/app/_layout.tsx',
    'apps/mobile/eas.json',
    'packages/brand/index.ts',
    'package-lock.json',
    'package.json',
    '.github/scripts/seam-guard.mjs',
    '.github/scripts/seam-guard.test.mjs',
    '.github/workflows/ci.yml',
    '.github/workflows/testflight.yml',
    'docs/release/TESTFLIGHT.md',
    'supabase/migrations/20261018000000_x.sql',
    '.github/workflows/deploy-db.yml',
    'apps/web/app/page.tsx',
    'docs/agents/checkins/S20.md',
  ];
  assert.deepEqual(relevant(changed), changed.slice(0, 9));
  assert.deepEqual(relevant(['docs/release/TESTFLIGHT.md', 'supabase/tests/x.test.ts']), []);
  assert.equal(BUNDLE_PATHS.length, 8);
});

test('changedSince: the head side of base...head; no base, a zero sha or a failing git mean "run the exports"', () => {
  const calls = [];
  const git = (cmd, args) => {
    calls.push([cmd, ...args]);
    return { status: 0, stdout: 'docs/x.md\napps/mobile/src/a.ts\n\n', stderr: '' };
  };
  assert.deepEqual(changedSince('abc', 'def', git), { files: ['docs/x.md', 'apps/mobile/src/a.ts'], reason: null });
  assert.deepEqual(calls[0], ['git', 'diff', '--name-only', '--no-renames', 'abc...def']);
  assert.equal(changedSince('', 'def', git).files, null);
  assert.equal(changedSince('0000000000000000000000000000000000000000', 'def', git).files, null);
  const broken = changedSince('abc', 'def', () => ({ status: 128, stdout: '', stderr: 'fatal: bad revision' }));
  assert.equal(broken.files, null);
  assert.match(broken.reason, /failed \(exit 128\): fatal: bad revision/);
});

test('--changed-since prints run=true for a relevant change, run=false for none, run=true when git cannot answer, and exits 2 on bad usage', async () => {
  const git = (out) => () => ({ status: 0, stdout: out, stderr: '' });
  let lines = [];
  assert.equal(await main(['--changed-since', 'a', 'b'], REPO, (l) => lines.push(l), git('apps/mobile/eas.json\n')), 0);
  assert.equal(lines.at(-1), 'run=true');
  assert.match(lines[0], /1 of 1 changed files can reach a store bundle/);
  lines = [];
  assert.equal(await main(['--changed-since', 'a', 'b'], REPO, (l) => lines.push(l), git('docs/release/TESTFLIGHT.md\nsupabase/x.sql\n')), 0);
  assert.equal(lines.at(-1), 'run=false');
  assert.match(lines[0], /none of the 2 changed files/);
  lines = [];
  assert.equal(await main(['--changed-since', 'a', 'b'], REPO, (l) => lines.push(l), () => ({ status: 1, stdout: '', stderr: 'no' })), 0);
  assert.equal(lines.at(-1), 'run=true');
  const quiet = () => {};
  assert.equal(await main(['--changed-since', 'a'], REPO, quiet), 2);
  assert.equal(await main(['--changed-since', 'a', '--store-profiles'], REPO, quiet), 2);
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

// The seams module and the drill protocol arrive together (#203). The sync test skips only while neither exists;
// a seams module without its protocol file is a moved file, and the list could drift unseen, so that fails.
const SEAMS = join(REPO, 'apps/mobile/src/dev/e2e-seams.ts');
const PROTOCOL = join(REPO, 'apps/mobile/e2e/kill/protocol.mjs');
test('every launch-argument key, the marker folder and the drill text of the kill drill protocol are in SEAM_IDENTIFIERS', { skip: !existsSync(SEAMS) && !existsSync(PROTOCOL) && 'the seams module and apps/mobile/e2e/kill/protocol.mjs arrive with #203' }, async () => {
  assert.ok(existsSync(PROTOCOL), `${SEAMS} exists but apps/mobile/e2e/kill/protocol.mjs does not: the protocol file moved, so this test can no longer keep SEAM_IDENTIFIERS in sync. Point PROTOCOL at its new place.`);
  const protocol = await import(PROTOCOL);
  for (const [name, key] of Object.entries(protocol.DRILL_ARG)) assert.ok(SEAM_IDENTIFIERS.includes(key), `DRILL_ARG.${name} = ${key} is missing from SEAM_IDENTIFIERS`);
  assert.ok(SEAM_IDENTIFIERS.includes(protocol.MARKER_DIR), `MARKER_DIR ${protocol.MARKER_DIR}`);
  assert.ok(SEAM_IDENTIFIERS.some((id) => protocol.drillText(7).startsWith(id)), 'the drill text');
});

// ---------------------------------------------------------------- the positive control, decided from the e2e export

/**
 * A small repository for the positive control: the app source tree, eas.json with an e2e profile, and the brand.
 * `wiring` is the text of app/_layout.tsx; the seams module and a file that only mentions it in a comment are
 * always present, as in this repository, and must not count as importers.
 */
function controlFixture({ wiring = 'function Root() {}\n', e2e = true, extra = {} } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'seam-control-'));
  mkdirSync(join(root, 'apps/mobile/src/app'), { recursive: true });
  mkdirSync(join(root, 'apps/mobile/src/dev'), { recursive: true });
  mkdirSync(join(root, 'packages/brand'), { recursive: true });
  writeFileSync(join(root, 'apps/mobile/src/app/_layout.tsx'), wiring);
  writeFileSync(join(root, 'apps/mobile/src/dev/e2e-seams.ts'), "export const useE2eSeams = () => {};\n");
  writeFileSync(join(root, 'apps/mobile/src/dev/kill-drill.ts'), "// loaded only through `src/dev/e2e-seams.ts`; see from '@/dev/e2e-seams' in the wiring\n/* import { useE2eSeams } from '@/dev/e2e-seams'; */\nexport const useKillDrill = () => {};\n");
  writeFileSync(join(root, 'apps/mobile/src/app/_layout.test.tsx'), "import { useE2eSeams } from '@/dev/e2e-seams';\n");
  for (const [path, text] of Object.entries(extra)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  writeFileSync(join(root, 'packages/brand/index.ts'), "export const brand = { name: 'Early Letters' };\n");
  const eas = { build: { ...EAS.build } };
  if (!e2e) delete eas.build.e2e;
  return { root, eas };
}

const WIRED = "import { useE2eSeams } from '@/dev/e2e-seams';\nfunction Root() {\n  useE2eSeams();\n}\n";
const WIRED_ALIASED = "import { useE2eSeams as useSeams } from '../dev/e2e-seams';\nfunction Root() {\n  useSeams();\n}\n";

test('seamImporters: the import under any binding or path, a re-export, a dynamic import and a require count; comments, test files and the module itself do not', () => {
  const unwired = controlFixture();
  try {
    assert.deepEqual(seamImporters(unwired.root), []);
  } finally {
    rmSync(unwired.root, { recursive: true, force: true });
  }
  const wired = controlFixture({
    wiring: WIRED_ALIASED,
    extra: {
      'apps/mobile/src/lib/seams.ts': "export { useE2eSeams } from '@/dev/e2e-seams';\n",
      'apps/mobile/src/lib/lazy.ts': "export const load = () => import('@/dev/e2e-seams.ts');\n",
      'apps/mobile/src/lib/legacy.js': "const s = require('./dev/e2e-seams');\n",
      'apps/mobile/src/lib/other.ts': "import { x } from '@/dev/e2e-seams-not';\nimport { y } from './e2e';\n",
    },
  });
  try {
    assert.deepEqual(seamImporters(wired.root), ['apps/mobile/src/app/_layout.tsx', 'apps/mobile/src/lib/lazy.ts', 'apps/mobile/src/lib/legacy.js', 'apps/mobile/src/lib/seams.ts']);
  } finally {
    rmSync(wired.root, { recursive: true, force: true });
  }
});

test('positive control: the e2e bundle carrying the seam passes, whatever the wiring looks like', async () => {
  const { root, eas } = controlFixture({ wiring: WIRED_ALIASED });
  try {
    const lines = [];
    const good = fakeExport(bundle('"e2eKillDrill"'));
    assert.equal(await e2eControl(root, eas, (l) => lines.push(l), good.run), true);
    assert.equal(good.calls.length, 1);
    assert.equal(good.calls[0].env.EXPO_PUBLIC_E2E, '1');
    assert.equal(good.calls[0].env.EXPO_PUBLIC_APP_ENV, 'preview');
    assert.match(lines.join('\n'), /the e2e bundle carries the seam \(e2eKillDrill x1\)/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('positive control: wired (under an alias and a relative path) but the e2e bundle has no seam is a failure that names the importer', async () => {
  const { root, eas } = controlFixture({ wiring: WIRED_ALIASED });
  try {
    const lines = [];
    assert.equal(await e2eControl(root, eas, (l) => lines.push(l), fakeExport(bundle()).run), false);
    assert.match(lines.join('\n'), /::error::B-8 positive control: apps\/mobile\/src\/app\/_layout\.tsx imports the seams module, but the e2e bundle does not carry e2eKillDrill/);
    const plain = [];
    assert.equal(await e2eControl(root, eas, (l) => plain.push(l), fakeExport(bundle()).run), false);
    assert.doesNotMatch(plain.join('\n'), /skipped/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('positive control: nothing imports the seams module, so the control is skipped with a reason, after a clean e2e export', async () => {
  const { root, eas } = controlFixture();
  try {
    const lines = [];
    const clean = fakeExport(bundle());
    assert.equal(await e2eControl(root, eas, (l) => lines.push(l), clean.run), true);
    assert.equal(clean.calls.length, 1, 'the e2e export still runs');
    assert.match(lines.join('\n'), /positive control: skipped\. No file under apps\/mobile\/src imports the seams module yet \(RA-20-18\)/);
    assert.equal(await e2eControl(root, eas, () => {}, fakeExport({ status: 1 }).run), false, 'a failed e2e export is never a skip');
    assert.equal(await e2eControl(root, eas, () => {}, fakeExport('tiny').run), false, 'a vacuous e2e export is never a skip');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('positive control: no e2e profile is an error before any export', async () => {
  const { root, eas } = controlFixture({ wiring: WIRED, e2e: false });
  try {
    const lines = [];
    assert.equal(await e2eControl(root, eas, (l) => lines.push(l), () => assert.fail('no export')), false);
    assert.match(lines.join('\n'), /no "e2e" build profile/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('this repository today: nothing under apps/mobile/src imports the seams module until RA-20-18, so the control skips after the e2e export', async () => {
  const importers = seamImporters(REPO);
  if (importers.length) return; // RA-20-18 has landed; the ci.yml run exports the e2e profile and requires the seam
  const lines = [];
  assert.equal(await e2eControl(REPO, REAL_EAS, (l) => lines.push(l), fakeExport(bundle()).run), true);
  assert.match(lines.join('\n'), /positive control: skipped/);
});

test('usage: no profile, a flag without a value, or an unknown profile exits 2', async () => {
  const quiet = () => {};
  assert.equal(await main([], REPO, quiet), 2);
  assert.equal(await main(['--profile'], REPO, quiet), 2);
  assert.equal(await main(['--profile', '--store-profiles'], REPO, quiet), 2);
  assert.equal(await main(['--profile', 'no-such-profile'], REPO, quiet), 2);
  assert.equal(await main(['--bogus'], REPO, quiet), 2);
});
