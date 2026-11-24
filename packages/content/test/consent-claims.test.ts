// BL-389, LEGAL-REQ-044: the consent sheet and the Settings usage switch say only what the build sends.
// No crash reporter exists in v1.0 (BL-021 is the scrubber; adding a crash or OTA SDK is a `pair` task), so
// consent words may not say "crash" until the app depends on one. v1.0 has no photos either (D-169).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { en } from '../src';

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('../../../apps/mobile/package.json', import.meta.url)), 'utf8'));
const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
const CRASH_SDK = /sentry|bugsnag|crashlytics|datadog|instabug|appcenter|raygun|rollbar/i;
// Fail closed: a crash SDK dependency, or the capture flag on (packages/analytics/src/crash.ts), ends the "no crash" rule.
const crashSource = readFileSync(fileURLToPath(new URL('../../analytics/src/crash.ts', import.meta.url)), 'utf8');
const crashFlagOn = /CRASH_REPORTING\s*=\s*\{[^}]*?enabled:\s*true/s.test(crashSource);
const reporterConfigured = deps.some((d) => CRASH_SDK.test(d)) || crashFlagOn;

const consentLines: Record<string, string> = {
  'analyticsConsent.title': en.analyticsConsent.title,
  'analyticsConsent.body': en.analyticsConsent.body,
  'analyticsConsent.detail': en.analyticsConsent.detail,
  'analyticsConsent.changeLater': en.analyticsConsent.changeLater,
  'analyticsConsent.yesButton': en.analyticsConsent.yesButton,
  'analyticsConsent.noButton': en.analyticsConsent.noButton,
  'analyticsConsent.notNowLabel': en.analyticsConsent.notNowLabel,
  'settings.privacy.analyticsLabel': en.settings.privacy.analyticsLabel,
  'settings.privacy.analyticsHelp': en.settings.privacy.analyticsHelp,
  'settings.privacy.analyticsOffNote': en.settings.privacy.analyticsOffNote,
};
const exportReadme = readFileSync(fileURLToPath(new URL('../src/features/export.en.ts', import.meta.url)), 'utf8');
const consentCopySource = readFileSync(fileURLToPath(new URL('../../../apps/mobile/src/components/consent/copy.ts', import.meta.url)), 'utf8');
const section = /analyticsSection:\s*'([^']*)'/.exec(consentCopySource)?.[1] ?? '';

describe('[BL-389, LEGAL-REQ-044] consent copy claims only what v1.0 does', () => {
  it('reads the section title it checks', () => {
    expect(section).not.toBe('');
  });
  it.skipIf(reporterConfigured)('says "crash" nowhere while no crash reporter is configured', () => {
    for (const [key, line] of Object.entries({ ...consentLines, 'consentCopy.analyticsSection': section })) expect(line, key).not.toMatch(/crash/i);
  });
  it('reads the crash flag it checks', () => {
    expect(/CRASH_REPORTING\s*=\s*\{[^}]*?enabled:\s*(true|false)/s.test(crashSource)).toBe(true);
  });
  it.skipIf(reporterConfigured)('the data export README names no crash-report choice', () => {
    expect(exportReadme).not.toMatch(/sharing usage and crash/i);
    expect(exportReadme).toContain('your choice about sharing usage (');
  });
  it('says "photos" nowhere (v1.0 has none)', () => {
    for (const [key, line] of Object.entries({ ...consentLines, 'consentCopy.analyticsSection': section })) expect(line, key).not.toMatch(/photo/i);
  });
  it('the sheet closes under the words "Not now"', () => {
    expect(en.analyticsConsent.notNowLabel).toBe('Not now');
    const src = readFileSync(fileURLToPath(new URL('../../../apps/mobile/src/components/consent/analytics-consent-sheet.tsx', import.meta.url)), 'utf8');
    expect(src).toContain('closeLabel={copy.analyticsConsent.notNowLabel}');
  });
});
