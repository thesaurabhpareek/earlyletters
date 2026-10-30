/// <reference types="node" />
/**
 * The Delete account switch (founder, 30 Oct 2026): in the two alpha TestFlight builds the Delete account row stays hidden
 * unless `EXPO_PUBLIC_ACCOUNT_DELETION=on` is in the build's environment (lib/capabilities.ts). It may be switched on only
 * when the purge worker runs on staging and the sole-parent drill has passed (S1-35, S2-13, AL-07.6a).
 *
 * The rule, in one line: like backup and the status report it is a build flag on top of the server switch, and only `on` is on.
 * Where the row is wanted without a decision it is written `on` (`.env.development`, eas.json `development`, `e2e`, `production`,
 * the web e2e server-on build); the two alpha profiles (`testflight`, `preview`) do not write it at all, so it reads off
 * unless the EAS `preview` environment on expo.dev holds it, which needs no change to eas.json or app.config.ts after the freeze.
 *
 * What this file pins:
 *  - the capability logic, with a real read of the environment (a fresh copy of the module per case): unset, off, on, in the
 *    alpha shapes, and in development and e2e;
 *  - the files that write the variable: .env.development, eas.json, the web e2e build;
 *  - the Settings row and the route honour it (their conditions are read from the source and run against the real capability);
 *  - the open-request gate does NOT: a request opened elsewhere still shows Cancel deletion with the switch off.
 * Fictional family "Asha" only (CLAUDE.md).
 */
import { execFile } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { capabilities, setBuildFlagForTests, setServerFeaturesForTests } from '../src/lib/capabilities';
import { decideGate } from '../src/lib/account-deletion/first-run-gate.logic';
import { deletionView, type OpenRequest } from '../src/lib/account-deletion/open-request';

const APP = join(__dirname, '..');
const SRC = join(APP, 'src');
const VAR = 'EXPO_PUBLIC_ACCOUNT_DELETION';

/** Source without comments, so a rule is checked against code, not against what a comment says. */
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const src = (rel: string) => code(readFileSync(join(SRC, rel), 'utf8'));
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(n) && !/\.test\.tsx?$/.test(n) ? [p] : [];
  });

type Eas = { build: Record<string, { env?: Record<string, string> }> };
const eas = JSON.parse(readFileSync(join(APP, 'eas.json'), 'utf8')) as Eas;
const ALPHA = ['testflight', 'preview'];

/**
 * The capability as a build with exactly this environment would read it: a fresh copy of the module, read after the variables
 * are set (the values are read once, at load, as Expo inlines them at bundle time). The shell's own values are put back.
 */
async function readCapability(env: Record<string, string | undefined>): Promise<{ row: boolean; signIn: boolean }> {
  const keys = ['EXPO_PUBLIC_SERVER_FEATURES', VAR];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  try {
    for (const k of keys) delete process.env[k];
    for (const [k, v] of Object.entries(env)) if (v !== undefined) process.env[k] = v;
    vi.resetModules();
    const mod = await import('../src/lib/capabilities');
    return { row: mod.capabilities.accountDeletion, signIn: mod.capabilities.signIn };
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    vi.resetModules();
  }
}

describe('the capability: only "on" is on, and only with the server switch (the same rule as backup and the status report)', () => {
  afterEach(() => {
    setServerFeaturesForTests(null);
    setBuildFlagForTests('accountDeletion', null);
  });

  it('is off in this process (the variable is unset), with the other capabilities as they were', () => {
    expect(process.env[VAR] ?? '').not.toBe('on');
    expect(capabilities.accountDeletion).toBe(false);
  });

  it('server features on and the variable UNSET reads off: the alpha build 2 as the freeze leaves it', async () => {
    expect(await readCapability({ EXPO_PUBLIC_SERVER_FEATURES: 'on' })).toEqual({ row: false, signIn: true });
  });

  it('server features on and the variable "off", empty or anything but "on" reads off', async () => {
    for (const v of ['off', '', ' ', 'true', '1', 'yes', 'enabled', 'onn']) {
      expect((await readCapability({ EXPO_PUBLIC_SERVER_FEATURES: 'on', [VAR]: v })).row, JSON.stringify(v)).toBe(false);
    }
  });

  it('server features on and the variable "on" (the EAS preview environment, after the drill) reads on; case and spaces are ignored', async () => {
    for (const v of ['on', ' ON ', 'On']) {
      expect(await readCapability({ EXPO_PUBLIC_SERVER_FEATURES: 'on', [VAR]: v }), JSON.stringify(v)).toEqual({ row: true, signIn: true });
    }
  });

  it('the variable alone never brings the server back: build 1 shares the EAS environment, carries "on", and still has no row', async () => {
    expect(await readCapability({ EXPO_PUBLIC_SERVER_FEATURES: 'off', [VAR]: 'on' })).toEqual({ row: false, signIn: false });
    expect(await readCapability({ [VAR]: 'on' })).toEqual({ row: false, signIn: false });
  });

  it('the test override is for tests only, follows the server switch, and goes back to the build value', () => {
    setServerFeaturesForTests(true);
    expect(capabilities.accountDeletion).toBe(false);
    setBuildFlagForTests('accountDeletion', true);
    expect(capabilities.accountDeletion).toBe(true);
    setServerFeaturesForTests(false);
    expect(capabilities.accountDeletion).toBe(false);
    setServerFeaturesForTests(true);
    setBuildFlagForTests('accountDeletion', false);
    expect(capabilities.accountDeletion).toBe(false);
    setBuildFlagForTests('accountDeletion', null);
    setServerFeaturesForTests(null);
    expect(capabilities.accountDeletion).toBe(false);
    const saved = process.env.VITEST;
    delete process.env.VITEST;
    try {
      expect(() => setBuildFlagForTests('accountDeletion', true)).toThrow(/tests only/);
    } finally {
      process.env.VITEST = saved;
    }
  });

  it('it changes no other capability, and no other flag changes it', () => {
    setServerFeaturesForTests(true);
    setBuildFlagForTests('accountDeletion', true);
    expect(capabilities).toEqual({ signIn: true, sync: true, coParent: true, backup: false, statusReport: false, accountDeletion: true, analytics: false, englishOnly: false });
    setBuildFlagForTests('accountDeletion', null);
    setBuildFlagForTests('backup', true);
    setBuildFlagForTests('statusReport', true);
    expect(capabilities.accountDeletion).toBe(false);
    setBuildFlagForTests('backup', null);
    setBuildFlagForTests('statusReport', null);
  });
});

describe('the profiles: hidden in the alpha builds unless the EAS environment says on; shown in development, e2e and production', () => {
  /** What a build of this eas.json profile has in its environment, plus what the EAS environment of the same name adds. */
  const buildEnv = (profile: string, fromEasEnvironment: Record<string, string> = {}) => ({ ...(eas.build[profile].env ?? {}), ...fromEasEnvironment });

  it('the two alpha profiles do not write the variable: that is what lets expo.dev set it after the freeze, with eas.json and app.config.ts untouched', () => {
    for (const name of ALPHA) {
      expect(Object.keys(eas.build[name].env ?? {}), name).not.toContain(VAR);
    }
    expect(Object.keys(eas.build).filter((n) => !Object.keys(eas.build[n].env ?? {}).includes(VAR)).sort()).toEqual([...ALPHA].sort());
  });

  it('development, e2e and production write it "on" (the row is unchanged there); nothing writes it any other way', () => {
    const writing = Object.entries(eas.build).filter(([, p]) => p.env && VAR in p.env);
    expect(writing.map(([n]) => n).sort()).toEqual(['development', 'e2e', 'production']);
    for (const [n, p] of writing) expect(p.env?.[VAR], n).toBe('on');
    const text = readFileSync(join(APP, 'eas.json'), 'utf8');
    expect(text.match(new RegExp(`"${VAR}": "on"`, 'g'))?.length).toBe(3);
    expect([...new Set(text.match(/\w*ACCOUNT_DELETION\w*/g) ?? [])]).toEqual([VAR]);
  });

  it('alpha build 2 (preview, servers on) as eas.json leaves it: no row; with the variable "on" in the EAS environment: the row', async () => {
    expect(eas.build.preview.env?.EXPO_PUBLIC_SERVER_FEATURES).toBe('on');
    expect((await readCapability(buildEnv('preview'))).row).toBe(false);
    expect((await readCapability(buildEnv('preview', { [VAR]: 'off' }))).row).toBe(false);
    expect((await readCapability(buildEnv('preview', { [VAR]: 'on' }))).row).toBe(true);
  });

  it('alpha build 1 (testflight, servers off): no row either way; after the R-17 flip it follows the same variable as build 2', async () => {
    expect((await readCapability(buildEnv('testflight'))).row).toBe(false);
    expect((await readCapability(buildEnv('testflight', { [VAR]: 'on' }))).row).toBe(false);
    const flipped = { ...buildEnv('testflight'), EXPO_PUBLIC_SERVER_FEATURES: 'on' };
    expect((await readCapability(flipped)).row).toBe(false);
    expect((await readCapability({ ...flipped, [VAR]: 'on' })).row).toBe(true);
  });

  it('development, e2e and production keep the row wherever servers are on (as they flip it): no variable to set', async () => {
    for (const name of ['development', 'e2e', 'production']) {
      const withServers = { ...buildEnv(name), EXPO_PUBLIC_SERVER_FEATURES: 'on' };
      expect((await readCapability(withServers)).row, name).toBe(true);
      expect((await readCapability(buildEnv(name))).row, `${name} as written, servers off`).toBe(false);
    }
  });

  it('local development: .env.development writes it "on", and no other .env file names it (none can reach a store bundle)', () => {
    const files = readdirSync(APP).filter((n) => n.startsWith('.env'));
    expect(files).toContain('.env.development');
    for (const f of files) {
      const lines = readFileSync(join(APP, f), 'utf8')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#'));
      const named = lines.filter((l) => l.startsWith(`${VAR}=`));
      expect(named, f).toEqual(f === '.env.development' ? [`${VAR}=on`] : []);
    }
  });

  it('the web e2e build with servers on sets it, so flows that open Delete account (j24-style) still see the row; the server-off builds need nothing', () => {
    const setup = code(readFileSync(join(APP, 'e2e-web/support/global-setup.ts'), 'utf8'));
    const onBuild = setup.slice(setup.indexOf('build(ON_DIST, {'), setup.indexOf('});', setup.indexOf('build(ON_DIST, {')));
    expect(onBuild).toMatch(/EXPO_PUBLIC_SERVER_FEATURES: 'on',/);
    expect(onBuild).toMatch(/EXPO_PUBLIC_ACCOUNT_DELETION: 'on',/);
    expect(setup.match(/EXPO_PUBLIC_ACCOUNT_DELETION/g)?.length).toBe(1);
  });

  it('app.config.ts records it in extra by the same rule (on only, and with the server switch) and the preflight reports the state without ever failing on it', () => {
    const config = readFileSync(join(APP, 'app.config.ts'), 'utf8');
    expect(config).toMatch(/accountDeletion: serverFeatures && isOn\(process\.env\.EXPO_PUBLIC_ACCOUNT_DELETION\),/);
    const pre = readFileSync(join(APP, 'scripts/preflight-testflight.mjs'), 'utf8');
    const block = pre.slice(pre.indexOf('// The Delete account row (founder, 30 Oct 2026)'), pre.indexOf("check(prof.autoIncrement === true"));
    expect(block).toMatch(/pass\('Delete account row: hidden \(EXPO_PUBLIC_ACCOUNT_DELETION is not on\)'\)/);
    expect(block).not.toMatch(/\bfail\(|\bcheck\(/);
  });
});

describe('the preflight prints the state and never fails on it (both alpha builds)', () => {
  // The script as the founder runs it (`npm run preflight:testflight` / `preflight:alpha`), minus the native-project step. Nothing from
  // this shell or this vitest run reaches it that it would read: the build switches (EXPO_PUBLIC_*), B-9, nested vitest.
  const preflight = (profile: string, extra: Record<string, string> = {}) =>
    new Promise<string[]>((resolve) => {
      const env = { ...process.env };
      for (const k of Object.keys(env)) if (/^(EXPO_PUBLIC_|VITEST)/.test(k) || k === 'EAS_BUILD_PROFILE') delete env[k];
      const args = [join(APP, 'scripts/preflight-testflight.mjs'), '--profile', profile, '--skip-prebuild'];
      execFile(process.execPath, args, { cwd: APP, env: { ...env, ...extra }, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }, (err, stdout, stderr) => {
        resolve(`${stdout}${stderr}`.split('\n'));
      });
    });
  const about = (lines: string[]) => lines.filter((l) => /Delete account row|EXPO_PUBLIC_ACCOUNT_DELETION/.test(l));

  it('says "hidden" in both alpha builds when nothing sets the variable, and nothing about it is a FAIL', async () => {
    for (const lines of await Promise.all([preflight('testflight'), preflight('preview')])) {
      expect(lines.filter((l) => /^PASS\s+Delete account row: hidden \(EXPO_PUBLIC_ACCOUNT_DELETION is not on\)$/.test(l))).toHaveLength(1);
      expect(about(lines).filter((l) => l.startsWith('FAIL'))).toEqual([]);
    }
  }, 120_000);

  it('with the variable "on" in the shell: build 2 says "shown" as a WARN, build 1 still hidden (no servers); neither is a FAIL', async () => {
    const [build1, build2] = await Promise.all([
      preflight('testflight', { [VAR]: 'on' }),
      preflight('preview', { [VAR]: 'on' }),
    ]);
    expect(build2.filter((l) => /^WARN\s+Delete account row: shown/.test(l))).toHaveLength(1);
    expect(build2.filter((l) => /^PASS\s+Delete account row: hidden/.test(l))).toEqual([]);
    expect(build1.filter((l) => /^PASS\s+Delete account row: hidden/.test(l))).toHaveLength(1);
    expect(about(build1).concat(about(build2)).filter((l) => l.startsWith('FAIL'))).toEqual([]);
  }, 120_000);
});

describe('the Settings row and the route honour it', () => {
  afterEach(() => {
    setServerFeaturesForTests(null);
    setBuildFlagForTests('accountDeletion', null);
  });

  const home = src('app/settings/index.tsx');
  const page = src('app/settings/delete-account.tsx');
  const rowCondition = home.match(/\{([^{}?]+)\?\s*\(\s*<ListSection>\s*<ListRow title=\{h\.deleteAccountLabel\}/)?.[1];
  const routeCondition = page.match(/export default function DeleteAccountRoute\(\) \{\s*return ([^?]+) \? <DeleteAccount \/> : <Redirect href="\/settings" \/>;\s*\}/)?.[1];
  const run = (cond: string, scope: Record<string, unknown>) => new Function(...Object.keys(scope), `return Boolean(${cond});`)(...Object.values(scope)) as boolean;
  /** The four states a build and a person can be in: [servers, Delete account switch, signed in]. */
  const states: Array<[boolean, boolean, boolean]> = [
    [true, true, true],
    [true, true, false],
    [true, false, true],
    [true, false, false],
    [false, true, true],
    [false, true, false],
    [false, false, true],
    [false, false, false],
  ];

  it('the Settings row is drawn only with the switch on and the person signed in; absent otherwise (the real capability)', () => {
    expect(rowCondition, 'the Delete account row and its condition').toBeDefined();
    for (const [servers, deletion, signedIn] of states) {
      setServerFeaturesForTests(servers);
      setBuildFlagForTests('accountDeletion', deletion);
      expect(run(rowCondition!, { capabilities, auth: { signedIn } }), `servers ${servers}, switch ${deletion}, signed in ${signedIn}`).toBe(servers && deletion && signedIn);
    }
  });

  it('the route shows the page only with the switch on; otherwise it redirects to Settings, as Account does with sign-in off', () => {
    expect(routeCondition, 'the route and its condition').toBeDefined();
    for (const [servers, deletion] of [[true, true], [true, false], [false, true], [false, false]] as const) {
      setServerFeaturesForTests(servers);
      setBuildFlagForTests('accountDeletion', deletion);
      expect(run(routeCondition!, { capabilities }), `servers ${servers}, switch ${deletion}`).toBe(servers && deletion);
    }
    expect(page).toMatch(/<Redirect href="\/settings" \/>/);
    expect(src('app/settings/account.tsx')).toMatch(/capabilities\.signIn \? <AccountSettings \/> : <Redirect href="\/settings" \/>/);
  });

  it('nothing else opens the page: Settings home is the only screen that names the route, and the link allowlist never lets a link reach it', () => {
    const namers = walk(SRC).filter((f) => /['"`]\/settings\/delete-account['"`]/.test(code(readFileSync(f, 'utf8'))));
    expect(namers.map((f) => relative(SRC, f))).toEqual(['app/settings/index.tsx']);
    // The row's tap is the only push to it.
    expect(home.match(/ROUTES\.deleteAccount/g)?.length).toBe(1);
    expect(src('lib/family/entry.logic.ts')).not.toMatch(/delete-account/);
  });
});

describe('the open-request gate does NOT read the switch: a request opened elsewhere still shows its Cancel path', () => {
  const gateFiles = (): string[] => [
    ...walk(join(SRC, 'lib', 'account-deletion')),
    join(SRC, 'components', 'settings', 'open-deletion.tsx'),
    join(SRC, 'components', 'settings', 'open-deletion.logic.ts'),
  ];

  it('no file of the gate reads the capability module, the switch or the variable', () => {
    const files = gateFiles();
    expect(files.length).toBeGreaterThan(8);
    for (const f of files) {
      const text = code(readFileSync(f, 'utf8'));
      expect(text, relative(SRC, f)).not.toMatch(/capabilities|buildFlagEnabled|serverFeaturesEnabled|ACCOUNT_DELETION|\.accountDeletion\b/);
    }
  });

  it('the first-run route mounts the gate unconditionally, ahead of everything the switch could hide', () => {
    const onboarding = src('app/onboarding.tsx');
    expect(onboarding).not.toMatch(/capabilities\.accountDeletion|buildFlagEnabled\('accountDeletion'\)|ACCOUNT_DELETION/);
    expect(onboarding).toMatch(/const gate = useFirstRunGate\(\);\s*if \(gate\.screen === 'deletion' && gate\.request\) return <OpenDeletionScreen request=\{gate\.request\} \/>;\s*if \(gate\.screen === 'checking'\) return <CheckingScreen \/>;/);
  });

  it('with the switch off the gate decides as it always did: no book and an open request is the deletion screen, offering Cancel deletion', () => {
    for (const [servers, deletion] of [[true, false], [false, false], [true, true]] as const) {
      setServerFeaturesForTests(servers);
      setBuildFlagForTests('accountDeletion', deletion);
      const note: OpenRequest = { state: 'scheduled', requestId: 'req-asha-1', scheduledFor: '2026-11-28T09:00:00.000Z', userId: 'u-asha-mama' };
      const gate = decideGate({
        hasBook: false, hasDeletedBook: true, note, nowMs: Date.parse('2026-10-30T09:00:00.000Z'), signedIn: true, userId: 'u-asha-mama',
        checked: true, confirmed: true, wasDeletion: false, pathname: '/onboarding',
      });
      expect(gate.screen, `servers ${servers}, switch ${deletion}`).toBe('deletion');
      expect(gate.request).toMatchObject({ state: 'scheduled' });
      const view = deletionView(gate.request!, { signedIn: true, date: '28 November 2026', tryAgainLabel: 'Try again' });
      expect(view.actions[0], 'Cancel deletion is the one button').toBe('cancel');
    }
    setServerFeaturesForTests(null);
    setBuildFlagForTests('accountDeletion', null);
  });
});
