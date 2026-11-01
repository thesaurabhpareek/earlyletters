/// <reference types="node" />
/**
 * The store-profile preflight (scripts/preflight-production.mjs; RT-REL-02, RT-REL-13, SR-B-05) and its row in the
 * release doctor. A clean fixture passes; each fixture below breaks one check and only that check FAILs. Keys and
 * ids are fictional (Asha).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { accountDeletionDecision, productionChecks, readInputs, SEAM_FLAGS } from '../scripts/preflight-production.mjs';
import { productionFindings, repoFindings } from '../../../scripts/release/doctor';

const APP = join(__dirname, '..');
const REPO = join(APP, '..', '..');

type Input = Parameters<typeof productionChecks>[0];
type Result = { level: string; msg: string; id?: string };

const ENVIRONMENTS = [
  '| Profile | Use | `SERVER_FEATURES` | `ACCOUNT_DELETION` |',
  '|---|---|---|---|',
  '| `preview` | alpha build 2 | **on** | **not written**: from the EAS `preview` environment |',
  '| `production` | the App Store app | off | on (hide-until-proven is for the alpha only) |',
].join('\n');

const key = (id: string) => `  { keyId: '${id}', publicKey: 'QXNoYSBmaWN0aW9uYWwga2V5LCBub3QgYSByZWFsIGtleQ==', kinds: ['pack-manifest'] },\n`;
const KEYS = `export const TRUSTED_SIGNING_KEYS = [\n  // { keyId: 'example', publicKey: 'x' },\n${key('asha-2026-10')}${key('asha-2026-10-backup')}];\n`;

const PROFILE_ENV = {
  EXPO_PUBLIC_DOCS_BASE_URL: 'https://packs.earlyletters.app',
  EXPO_PUBLIC_APP_ENV: 'production',
  EXPO_PUBLIC_SERVER_FEATURES: 'off',
  EXPO_PUBLIC_BACKUP: 'off',
  EXPO_PUBLIC_STATUS_REPORT: 'off',
  EXPO_PUBLIC_ANALYTICS: 'off',
  EXPO_PUBLIC_ACCOUNT_DELETION: 'on',
  EXPO_PUBLIC_ENGLISH_ONLY: 'on',
};

/** A store-ready repository, as productionChecks reads it. */
function good(): Input {
  return {
    eas: {
      build: { production: { autoIncrement: true, environment: 'production', env: { ...PROFILE_ENV } } },
      submit: { production: { ios: { ascAppId: '6800000001' } } },
    },
    cfg: {
      version: '1.0.0',
      extra: { appEnv: 'production', serverFeatures: false, backup: false, statusReport: false, accountDeletion: false, eas: { projectId: '123e4567-e89b-12d3-a456-426614174000' } },
      ios: { privacyManifests: { NSPrivacyTracking: false, NSPrivacyTrackingDomains: [], NSPrivacyAccessedAPITypes: [{ NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults', NSPrivacyAccessedAPITypeReasons: ['CA92.1'] }], NSPrivacyCollectedDataTypes: [] } },
    },
    environmentsMd: ENVIRONMENTS,
    keysSource: KEYS,
    versionJson: '{ "version": "1.0.0" }\n',
    appConfigSource: "const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8'));\nexport default () => ({ version: readVersion() });\n",
    shellEnv: { PATH: '/usr/bin' },
    envFiles: [{ name: '.env.development', text: 'EXPO_PUBLIC_APP_ENV=development\nEXPO_PUBLIC_SERVER_FEATURES=off\n' }],
  };
}

const fails = (input: Input) => (productionChecks(input) as Result[]).filter((r) => r.level === 'FAIL').map((r) => r.id);
const withEnv = (patch: Record<string, string | undefined>): Input => {
  const i = good();
  const env: Record<string, string | undefined> = { ...PROFILE_ENV, ...patch };
  for (const k of Object.keys(env)) if (env[k] === undefined) delete env[k];
  (i.eas as { build: { production: { env: unknown } } }).build.production.env = env;
  return i;
};
const withCfg = (mutate: (cfg: Record<string, any>) => void): Input => {
  const i = good();
  mutate(i.cfg as Record<string, any>);
  return i;
};

describe('the store preflight on a store-ready fixture', () => {
  it('fails nothing, and gives every check an id', () => {
    const results = productionChecks(good()) as Result[];
    expect(results.filter((r) => r.level === 'FAIL')).toEqual([]);
    const ids = results.filter((r) => r.level === 'PASS').map((r) => r.id);
    expect(ids).toEqual([
      'english-only',
      'analytics',
      'servers',
      'backup',
      'status-report',
      'account-deletion',
      'signing-keys',
      'privacy-manifest',
      'version',
      'project-id',
      'asc-app-id',
      'seams',
      'secrets',
    ]);
  });
});

describe('one failing fixture per check: only that check FAILs', () => {
  const cases: [string, string, Input][] = [
    ['english-only', 'EXPO_PUBLIC_ENGLISH_ONLY unset', withEnv({ EXPO_PUBLIC_ENGLISH_ONLY: undefined })],
    ['english-only', 'EXPO_PUBLIC_ENGLISH_ONLY=off', withEnv({ EXPO_PUBLIC_ENGLISH_ONLY: 'off' })],
    ['analytics', 'EXPO_PUBLIC_ANALYTICS=on', withEnv({ EXPO_PUBLIC_ANALYTICS: 'on' })],
    ['analytics', 'a PostHog key in the profile', withEnv({ EXPO_PUBLIC_POSTHOG_KEY: 'phc_asha' })],
    ['servers', 'EXPO_PUBLIC_SERVER_FEATURES=on', withEnv({ EXPO_PUBLIC_SERVER_FEATURES: 'on' })],
    ['servers', 'EXPO_PUBLIC_SERVER_FEATURES unwritten', withEnv({ EXPO_PUBLIC_SERVER_FEATURES: undefined })],
    ['servers', 'the evaluated config says serverFeatures true', withCfg((c) => (c.extra.serverFeatures = true))],
    ['backup', 'EXPO_PUBLIC_BACKUP=on', withEnv({ EXPO_PUBLIC_BACKUP: 'on' })],
    ['backup', 'EXPO_PUBLIC_BACKUP unwritten', withEnv({ EXPO_PUBLIC_BACKUP: undefined })],
    ['status-report', 'EXPO_PUBLIC_STATUS_REPORT=on', withEnv({ EXPO_PUBLIC_STATUS_REPORT: 'on' })],
    ['status-report', 'EXPO_PUBLIC_STATUS_REPORT unwritten', withEnv({ EXPO_PUBLIC_STATUS_REPORT: undefined })],
    ['account-deletion', 'EXPO_PUBLIC_ACCOUNT_DELETION=off where the decision is on', withEnv({ EXPO_PUBLIC_ACCOUNT_DELETION: 'off' })],
    ['account-deletion', 'EXPO_PUBLIC_ACCOUNT_DELETION unwritten where the decision is on', withEnv({ EXPO_PUBLIC_ACCOUNT_DELETION: undefined })],
    ['account-deletion', 'a decision of "not written" with the profile writing on', { ...good(), environmentsMd: ENVIRONMENTS.replace('| off | on (hide', '| off | **not written** (hide') }],
    ['account-deletion', 'no readable decision', { ...good(), environmentsMd: '# Environments\n' }],
    ['signing-keys', 'no key (develop today)', { ...good(), keysSource: "export const TRUSTED_SIGNING_KEYS = [\n  // { keyId: 'el-2026-10', publicKey: 'x' },\n];\n" }],
    ['signing-keys', 'one key, no backup', { ...good(), keysSource: `export const TRUSTED_SIGNING_KEYS = [\n${key('asha-2026-10')}];\n` }],
    ['signing-keys', 'a repeated key id', { ...good(), keysSource: `export const TRUSTED_SIGNING_KEYS = [\n${key('asha-2026-10')}${key('asha-2026-10')}];\n` }],
    ['privacy-manifest', 'no privacy manifest', withCfg((c) => delete c.ios.privacyManifests)],
    ['privacy-manifest', 'tracking true', withCfg((c) => (c.ios.privacyManifests.NSPrivacyTracking = true))],
    ['privacy-manifest', 'collected data with servers off', withCfg((c) => (c.ios.privacyManifests.NSPrivacyCollectedDataTypes = [{ NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeEmailAddress' }]))],
    ['version', 'version.json is not x.y.z', { ...good(), versionJson: '{ "version": "1.0" }' }],
    ['version', 'the config version differs from version.json', withCfg((c) => (c.version = '1.0.1'))],
    ['version', 'app.config.ts writes a version literal', { ...good(), appConfigSource: "export default () => ({ version: '1.0.0' });\n" }],
    ['project-id', 'no extra.eas.projectId (develop today)', withCfg((c) => delete c.extra.eas)],
    ['project-id', 'a project id that is not a UUID', withCfg((c) => (c.extra.eas.projectId = 'asha'))],
    ['asc-app-id', 'no submit.production.ios.ascAppId (develop today)', { ...good(), eas: { ...(good().eas as object), submit: { production: {} } } }],
    ['asc-app-id', 'an ascAppId that is not numeric', { ...good(), eas: { ...(good().eas as object), submit: { production: { ios: { ascAppId: 'asha' } } } } }],
    ['seams', 'EXPO_PUBLIC_E2E in the profile', withEnv({ EXPO_PUBLIC_E2E: '1' })],
    ['seams', 'EXPO_PUBLIC_WEB_PREVIEW in the profile', withEnv({ EXPO_PUBLIC_WEB_PREVIEW: '1' })],
    ['seams', 'EXPO_PUBLIC_E2E in the shell', { ...good(), shellEnv: { EXPO_PUBLIC_E2E: '1' } }],
    ['secrets', 'an sb_secret_ key in the shell', { ...good(), shellEnv: { EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_ashafictional0000' } }],
    ['secrets', 'a service_role JWT in the profile', withEnv({ EXPO_PUBLIC_SUPABASE_ANON_KEY: `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.c2ln` })],
    ['secrets', 'a secret-named variable in another profile', { ...good(), eas: { ...(good().eas as { build: object }), build: { ...(good().eas as { build: object }).build, preview: { env: { SUPABASE_SECRET: 'x' } } } } }],
    ['secrets', 'a secret key in an .env file', { ...good(), envFiles: [{ name: '.env.local', text: 'EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_secret_ashafictional0000\n' }] }],
  ];

  it.each(cases)('%s: %s', (id, _what, input) => {
    expect(fails(input)).toEqual([id]);
  });

  it('covers every check with at least one fixture', () => {
    const passIds = (productionChecks(good()) as Result[]).filter((r) => r.level === 'PASS').map((r) => r.id);
    expect([...new Set(cases.map(([id]) => id))].sort()).toEqual([...passIds].sort());
  });

  it('the seam list is the e2e and web-preview flags', () => {
    expect(SEAM_FLAGS).toEqual(['EXPO_PUBLIC_E2E', 'EXPO_PUBLIC_WEB_PREVIEW']);
  });

  it('fails without an evaluated config instead of passing the config checks', () => {
    const f = fails({ ...good(), cfg: null, cfgError: 'boom' });
    expect(f).toEqual(expect.arrayContaining(['config', 'privacy-manifest', 'project-id']));
  });
});

describe('the ACCOUNT_DELETION decision comes from docs/release/ENVIRONMENTS.md', () => {
  it('reads on, off and not written from the profile table', () => {
    expect(accountDeletionDecision(ENVIRONMENTS)).toBe('on');
    expect(accountDeletionDecision(ENVIRONMENTS, 'preview')).toBe('unset');
    expect(accountDeletionDecision(ENVIRONMENTS.replace('| off | on (hide', '| off | off (hide'))).toBe('off');
    expect(accountDeletionDecision('no table')).toBeNull();
  });

  it('the real document records a decision for production, and eas.json follows it', () => {
    const decision = accountDeletionDecision(readFileSync(join(REPO, 'docs/release/ENVIRONMENTS.md'), 'utf8'));
    expect(decision).not.toBeNull();
    const eas = JSON.parse(readFileSync(join(APP, 'eas.json'), 'utf8'));
    expect(eas.build.production.env.EXPO_PUBLIC_ACCOUNT_DELETION ?? 'unset').toBe(decision);
  });
});

describe('the real repository', () => {
  it('fails only the founder steps still open (signing keys, project id, the production ascAppId); every other check passes', () => {
    const shell = { PATH: process.env.PATH ?? '' };
    const results = productionChecks(readInputs(APP, shell)) as Result[];
    const failed = results.filter((r) => r.level === 'FAIL').map((r) => r.id);
    for (const id of failed) expect(['signing-keys', 'project-id', 'asc-app-id'], results.find((r) => r.id === id)?.msg).toContain(id);
    // keys.ts is empty on develop today (founder step, PACKS_HOSTING.md step 1), so this FAILs by design.
    if (!/publicKey\s*:/.test(readFileSync(join(REPO, 'packages/api/src/keys.ts'), 'utf8').replace(/^\s*\/\/.*$/gm, ''))) expect(failed).toContain('signing-keys');
  }, 120_000);

  it('npm run preflight:production runs this script', () => {
    const pkg = JSON.parse(readFileSync(join(APP, 'package.json'), 'utf8'));
    expect(pkg.scripts['preflight:production']).toBe('node scripts/preflight-production.mjs');
  });
});

describe('the release doctor: production row', () => {
  const results: Result[] = [
    { level: 'PASS', msg: 'english only', id: 'english-only' },
    { level: 'FAIL', msg: 'no signing key', id: 'signing-keys' },
    { level: 'FAIL', msg: 'no ascAppId', id: 'asc-app-id' },
    { level: 'UNVERIFIED', msg: 'EAS production environment', id: 'eas-environment' },
  ];

  it('without --store it is NOT NEEDED for the alpha and names the failing checks', () => {
    const f = productionFindings(results as never, false);
    expect(f).toHaveLength(1);
    expect(f[0].level).toBe('NOT NEEDED');
    expect(f[0].area).toBe('store');
    expect(f[0].message).toContain('signing-keys, asc-app-id');
    expect(f[0].message).toContain('--store');
  });

  it('with --store each FAIL and UNVERIFIED is its own line, and a clean run is one PASS', () => {
    expect(productionFindings(results as never, true).map((x) => [x.level, x.message])).toEqual([
      ['FAIL', 'no signing key'],
      ['FAIL', 'no ascAppId'],
      ['UNVERIFIED', 'EAS production environment'],
    ]);
    expect(productionFindings([results[0]] as never, true).map((x) => x.level)).toEqual(['PASS']);
    expect(productionFindings([results[0]] as never, false).map((x) => x.level)).toEqual(['PASS']);
  });

  it('a preflight that did not run is UNVERIFIED, or FAIL with --store', () => {
    expect(productionFindings(null, false)[0].level).toBe('UNVERIFIED');
    expect(productionFindings(null, true)[0].level).toBe('FAIL');
  });

  it('replaces the plain NOT NEEDED production line in repoFindings', () => {
    const files = { appConfig: "owner: 'asha'", easJson: JSON.stringify({ submit: {} }), keysTs: '[]' };
    const f = repoFindings(files, false, { results: results as never, store: false });
    expect(f.filter((x) => x.message.includes('submit.production and the production app record'))).toEqual([]);
    expect(f.filter((x) => x.area === 'store').map((x) => x.level)).toEqual(['NOT NEEDED']);
    expect(repoFindings(files, false, { results: results as never, store: true }).filter((x) => x.area === 'store' && x.level === 'FAIL')).toHaveLength(2);
  });
});
