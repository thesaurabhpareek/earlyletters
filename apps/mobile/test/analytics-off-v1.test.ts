/**
 * v1.0 collects no analytics (decision of 15 Oct 2026, delegated by the
 * founder; D-088: the App Store label stays "Data Not Collected"). One build
 * switch, EXPO_PUBLIC_ANALYTICS, off unless a build says "on"
 * (lib/capabilities.ts). Off: no consent sheet, no Settings switch, no
 * PostHog key even if one is set, no startAnalytics(), no recorded yes.
 * packages/analytics stays; analytics returns with consent in v1.1.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { analyticsEnabled, capabilities, postHogKeyForBuild, setAnalyticsForTests, setServerFeaturesForTests } from '../src/lib/capabilities';

const APP = join(__dirname, '..');
const read = (p: string) => readFileSync(join(APP, p), 'utf8');

describe('[D-088] analytics switch: off unless a build says on', () => {
  afterEach(() => {
    setAnalyticsForTests(null);
    setServerFeaturesForTests(null);
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
    expect(read('src/components/consent/consent-ask.tsx')).toMatch(/return capabilities\.analytics \? <ConsentAskWhenDue \/> : null;/);
  });

  it('Settings, Privacy shows no usage switch while off', () => {
    const src = read('src/app/settings/privacy.tsx');
    expect(src).toMatch(/\{capabilities\.analytics \? \(\s*<ListSection title=\{consentCopy\.analyticsSection\}/);
  });

  it('only lib/analytics/posthog-sdk.ts imports the PostHog SDK, and only index.ts loads that file', () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const e of readdirSync(join(APP, dir), { withFileTypes: true })) {
        const rel = `${dir}/${e.name}`;
        if (e.isDirectory()) walk(rel);
        else if (/\.tsx?$/.test(e.name)) files.push(rel);
      }
    };
    walk('src');
    expect(files.filter((f) => /from 'posthog-react-native'|import\('posthog-react-native'\)/.test(read(f)))).toEqual(['src/lib/analytics/posthog-sdk.ts']);
    expect(files.filter((f) => /\.\/posthog-sdk'/.test(read(f)))).toEqual(['src/lib/analytics/index.ts']);
  });
});
