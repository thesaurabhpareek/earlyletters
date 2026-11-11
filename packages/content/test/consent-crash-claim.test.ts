/**
 * BL-389: the consent words say only what the build collects. While no crash reporter is configured, no word a person
 * reads when they are asked about sharing (the "Help us make it better?" sheet, the Settings, Privacy switch and its
 * section, the export README's line about the choice) says crashes or breakages are shared.
 *
 * "Configured" is read from the code: a crash-reporting package in any workspace manifest, or an init of one in the
 * app's source. Adding a reporter is a `pair` task (BACKLOG rule 8), is not decided here, and, when it lands, it flips
 * `reporterConfigured` in this file's evidence by itself and the words may then say it, in the same pull request.
 *
 * Not read: `settings.privacy.noReports` ("This version collects no usage or crash reports.") is a denial, true in a
 * build without analytics; and TestFlight's own words, because Apple's TestFlight does send crash reports (5.2).
 * Fix the copy, never this test.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en, exportCopy } from '../src';

const REPO = join(__dirname, '..', '..', '..');
const REPORTERS = /(?:@sentry\/|sentry-expo|sentry_|crashlytics|bugsnag|@datadog\/mobile|instabug|react-native-exception-handler|expo-crash)/i;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    if (n === 'node_modules' || n.startsWith('.')) return [];
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return sourceFiles(p);
    return /\.(?:ts|tsx)$/.test(n) && !/\.test\.tsx?$/.test(n) ? [p] : [];
  });
}

/** Evidence of a crash reporter: a dependency in a manifest, or an import or init of one in the app's source. */
export function reporterEvidence(): string[] {
  const manifests = ['package.json', 'apps/mobile/package.json', 'packages/analytics/package.json', 'packages/core/package.json']
    .filter((m) => { try { statSync(join(REPO, m)); return true; } catch { return false; } })
    .flatMap((m) => {
      const j = JSON.parse(readFileSync(join(REPO, m), 'utf8')) as Record<string, Record<string, string> | undefined>;
      return Object.keys({ ...j.dependencies, ...j.devDependencies, ...j.optionalDependencies }).filter((d) => REPORTERS.test(d)).map((d) => `${m}: ${d}`);
    });
  const imports = [...sourceFiles(join(REPO, 'apps', 'mobile', 'src')), ...sourceFiles(join(REPO, 'packages', 'analytics', 'src'))]
    .flatMap((f) => readFileSync(f, 'utf8').split('\n').filter((l) => /^\s*(?:import|export)\b.*from\s+['"]/.test(l) && REPORTERS.test(l)).map((l) => `${f}: ${l.trim()}`));
  return [...manifests, ...imports];
}

const CRASH_CLAIM = /\bcrash(?:es|ed|ing)?\b|\bwhen something (?:breaks|goes wrong|fails)\b|\berror reports?\b|\bbug reports?\b/i;

/** The words a person reads when asked about sharing, by key. */
function consentWords(): { key: string; text: string }[] {
  const { noReports: _denial, ...privacy } = en.settings.privacy as Record<string, unknown> & { noReports: string };
  const walk = (v: unknown, path: string): { key: string; text: string }[] =>
    typeof v === 'string' ? [{ key: path, text: v }]
      : v && typeof v === 'object' ? Object.entries(v).flatMap(([k, x]) => walk(x, `${path}.${k}`))
      : [];
  const analyticsSection = /analyticsSection:\s*'([^']*)'/.exec(readFileSync(join(REPO, 'apps', 'mobile', 'src', 'components', 'consent', 'copy.ts'), 'utf8'))?.[1] ?? '';
  return [
    ...walk(en.analyticsConsent, 'en.analyticsConsent'),
    ...walk(privacy, 'en.settings.privacy'),
    { key: 'consentCopy.analyticsSection', text: analyticsSection },
    { key: 'features.export.readme (analytics line)', text: exportCopy.readme.filter((l: string) => /sharing usage/i.test(l)).join(' ') },
  ];
}

describe('[BL-389] the consent words and the crash reporter', () => {
  const evidence = reporterEvidence();
  const words = consentWords();

  it('reads what it should: the sheet, the switch, the section and the README line are all found', () => {
    const keys = words.map((w) => w.key);
    expect(keys).toContain('en.analyticsConsent.body');
    expect(keys).toContain('en.settings.privacy.analyticsLabel');
    expect(keys).toContain('en.settings.privacy.analyticsHelp');
    expect(words.find((w) => w.key === 'consentCopy.analyticsSection')?.text).not.toBe('');
    expect(words.find((w) => w.key.startsWith('features.export.readme'))?.text).toMatch(/sharing usage/i);
    expect(words.every((w) => w.key.endsWith('noReports') === false)).toBe(true);
  });

  it('the detector sees a reporter when one is declared (so "none found" means something)', () => {
    expect(REPORTERS.test('@sentry/react-native')).toBe(true);
    expect(REPORTERS.test('expo-crashlytics')).toBe(true);
    expect(REPORTERS.test('@supabase/supabase-js')).toBe(false);
  });

  it('with no crash reporter configured, no consent word says crashes or breakages are shared', () => {
    if (evidence.length > 0) return; // a reporter exists: the words may say so (and the Sentry scrubber, BL-021, is the gate)
    const claims = words.filter((w) => CRASH_CLAIM.test(w.text)).map((w) => `${w.key}: "${w.text}"`);
    expect(claims, 'no crash SDK is configured; fix the words, not this test').toEqual([]);
  });
});
