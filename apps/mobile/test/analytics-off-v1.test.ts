/**
 * v1.0 collects no analytics (decision of 15 Oct 2026, delegated by the
 * founder; D-088: the App Store label stays "Data Not Collected"). One build
 * switch, EXPO_PUBLIC_ANALYTICS, off unless a build says "on"
 * (lib/capabilities.ts). Off: no consent sheet, no Settings switch, no
 * PostHog key even if one is set, no startAnalytics(), no recorded yes.
 * packages/analytics stays; analytics returns with consent in v1.1.
 *
 * 20 Nov 2026: the SDK is now a dependency (founder approval items on the PR) and the build flag is still off in
 * every profile. Turning it on in `production` is the founder's separate commit.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { analyticsAskAvailable, analyticsEnabled, capabilities, postHogKeyForBuild, setAnalyticsForTests, setServerFeaturesForTests } from '../src/lib/capabilities';

const APP = join(__dirname, '..');
const read = (p: string) => readFileSync(join(APP, p), 'utf8');

describe('[D-088] analytics switch: off unless a build says on', () => {
  afterEach(() => {
    setAnalyticsForTests(null);
    setServerFeaturesForTests(null);
  });

  it('the consent ask needs the switch AND a PostHog key, and both mounts use that one check', () => {
    expect(analyticsAskAvailable(true, 'phc_test_key')).toBe(true);
    expect(analyticsAskAvailable(true, undefined)).toBe(false);
    expect(analyticsAskAvailable(true, '   ')).toBe(false);
    expect(analyticsAskAvailable(false, 'phc_test_key')).toBe(false);
    for (const f of ['src/components/consent/consent-ask.tsx', 'src/app/analytics-consent.tsx']) {
      expect(read(f), f).toMatch(/analyticsAskAvailable\(analyticsEnabled\(\), process\.env\.EXPO_PUBLIC_POSTHOG_KEY\)/);
    }
  });

  it('no consent surface claims crash reports while crash capture is off', () => {
    expect(read('../../packages/analytics/src/crash.ts')).toMatch(/enabled: false/);
    const strings = read('../../packages/content/src/strings.en.ts');
    const block = strings.slice(strings.indexOf('analyticsLabel:'), strings.indexOf('analyticsOffNote:'));
    expect(block.toLowerCase()).not.toMatch(/crash|breaks/);
    expect(read('src/components/consent/copy.ts')).not.toMatch(/analyticsSection: '[^']*crash/i);
  });

  it('is off in this process and does not follow the server switch', () => {
    expect(process.env.EXPO_PUBLIC_ANALYTICS ?? '').not.toBe('on');
    expect(analyticsEnabled()).toBe(false);
    setServerFeaturesForTests(true);
    expect(capabilities.analytics).toBe(false);
  });

  it('is off in every EAS build profile and for local development', () => {
    const eas = JSON.parse(read('eas.json')) as { build: Record<string, { env?: Record<string, string> }> };
    for (const [name, profile] of Object.entries(eas.build)) expect(profile.env?.EXPO_PUBLIC_ANALYTICS, name).toBe('off');
    expect(read('.env.development').split('\n')).toContain('EXPO_PUBLIC_ANALYTICS=off');
  });

  it('gives PostHog no key while off, whatever the environment holds', () => {
    expect(postHogKeyForBuild(false, 'phc_test_key')).toBe('');
    expect(postHogKeyForBuild(false, undefined)).toBe('');
    expect(postHogKeyForBuild(true, ' phc_test_key ')).toBe('phc_test_key');
    expect(postHogKeyForBuild(true, undefined)).toBe('');
  });

  it('the override is for tests only', () => {
    setAnalyticsForTests(true);
    expect(capabilities.analytics).toBe(true);
    setAnalyticsForTests(null);
    const saved = process.env.VITEST;
    delete process.env.VITEST;
    try {
      expect(() => setAnalyticsForTests(true)).toThrow(/tests only/);
    } finally {
      process.env.VITEST = saved;
    }
    expect(analyticsEnabled()).toBe(false);
  });
});

describe('[D-088] every analytics entry point follows the switch', () => {
  it('the provider takes its key only through postHogKeyForBuild', () => {
    const src = read('src/lib/analytics/index.ts');
    expect(src).toMatch(/const KEY = postHogKeyForBuild\(analyticsEnabled\(\), process\.env\.EXPO_PUBLIC_POSTHOG_KEY\);/);
    expect(src.match(/EXPO_PUBLIC_POSTHOG_KEY/g)?.length).toBe(2); // the header comment and that one line
  });

  it('startAnalytics and grantAnalytics stop at once while off', () => {
    const src = read('src/lib/analytics/index.ts');
    const start = src.slice(src.indexOf('export async function startAnalytics'));
    expect(start.slice(0, start.indexOf('analytics.init()'))).toMatch(/if \(!capabilities\.analytics\) return;/);
    const grant = src.slice(src.indexOf('export async function grantAnalytics'));
    expect(grant.slice(0, grant.indexOf('analytics.grant()'))).toMatch(/if \(!capabilities\.analytics\) return;/);
  });

  it('the consent sheet is never mounted while off', () => {
    expect(read('src/components/consent/consent-ask.tsx')).toMatch(/return analyticsAskAvailable\(analyticsEnabled\(\), process\.env\.EXPO_PUBLIC_POSTHOG_KEY\) \? <ConsentAskWhenDue \/> : null;/);
  });

  it('Settings, Privacy shows no usage switch while off', () => {
    const src = read('src/app/settings/privacy.tsx');
    expect(src).toMatch(/\{capabilities\.analytics \? \(\s*<ListSection title=\{consentCopy\.analyticsSection\}/);
  });

  it('[20 Nov 2026] the PostHog SDK is a pinned dependency, imported only by lib/analytics/index.ts and only after a yes', () => {
    const pkg = JSON.parse(read('package.json')) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    // Founder approval items on the PR: name, version, licence (both MIT). Exact versions, no range.
    expect(all['posthog-react-native']).toBe('4.87.1');
    expect(all['@posthog/react-native-plugin']).toBe('2.13.3');
    expect(Object.keys(all).filter((d) => /posthog/.test(d)).sort()).toEqual(['@posthog/react-native-plugin', 'posthog-react-native']);
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const e of readdirSync(join(APP, dir), { withFileTypes: true })) {
        const rel = `${dir}/${e.name}`;
        if (e.isDirectory()) walk(rel);
        else if (/\.(tsx?|js)$/.test(e.name)) files.push(rel);
      }
    };
    walk('src');
    const code = (f: string) => read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(files.filter((f) => /posthog-react-native|@posthog\//.test(code(f)))).toEqual(['src/lib/analytics/index.ts']);
    const idx = code('src/lib/analytics/index.ts');
    // A dynamic import inside the factory: no SDK code runs before the first yes.
    expect(idx).toMatch(/await import\('posthog-react-native'\)/);
    expect(idx).not.toMatch(/^import .*posthog-react-native/m);
    expect(idx).not.toMatch(/@posthog\/react-native-plugin/); // the native plugin is installed for the later crash flip, never imported
  });
});
