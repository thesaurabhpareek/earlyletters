/// <reference types="node" />
/**
 * G-23: the app's privacy manifest (src/lib/privacy-manifest.ts, written to
 * PrivacyInfo.xcprivacy by Expo from app.config.ts) must say exactly what the
 * App Store privacy label says. The label's source is
 * docs/legal/app-store-privacy-labels.md section 3.3; when legal changes it,
 * this test fails until the manifest follows (or the other way round).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { privacyManifests } from '../src/lib/privacy-manifest';

function labelsDoc(): string {
  for (const p of [resolve(process.cwd(), '../../docs/legal/app-store-privacy-labels.md'), resolve(process.cwd(), 'docs/legal/app-store-privacy-labels.md')]) {
    if (existsSync(p)) return readFileSync(p, 'utf8');
  }
  throw new Error('app-store-privacy-labels.md not found');
}

/** The JSON block under "### 3.3". */
function documentedManifest(): typeof privacyManifests {
  const doc = labelsDoc();
  const section = doc.slice(doc.indexOf('### 3.3'));
  const block = /```json\n([\s\S]*?)\n```/.exec(section);
  if (!block) throw new Error('no JSON block in section 3.3');
  return (JSON.parse(block[1]) as { ios: { privacyManifests: typeof privacyManifests } }).ios.privacyManifests;
}

const byType = <T extends object>(list: T[], key: keyof T) => [...list].sort((a, b) => String(a[key]).localeCompare(String(b[key])));

describe('privacy manifest (PrivacyInfo.xcprivacy)', () => {
  it('[G-23] matches the privacy label document, section 3.3, entry for entry', () => {
    const doc = documentedManifest();
    expect(privacyManifests.NSPrivacyTracking).toBe(doc.NSPrivacyTracking);
    expect(privacyManifests.NSPrivacyTrackingDomains).toEqual(doc.NSPrivacyTrackingDomains);
    expect(byType(privacyManifests.NSPrivacyAccessedAPITypes, 'NSPrivacyAccessedAPIType')).toEqual(byType(doc.NSPrivacyAccessedAPITypes, 'NSPrivacyAccessedAPIType'));
    expect(byType(privacyManifests.NSPrivacyCollectedDataTypes, 'NSPrivacyCollectedDataType')).toEqual(byType(doc.NSPrivacyCollectedDataTypes, 'NSPrivacyCollectedDataType'));
  });

  it('declares no tracking and none of the data v1.0 never sends (crash data, audio, photos, location, device id)', () => {
    expect(privacyManifests.NSPrivacyTracking).toBe(false);
    expect(privacyManifests.NSPrivacyTrackingDomains).toEqual([]);
    const types = privacyManifests.NSPrivacyCollectedDataTypes.map((t) => t.NSPrivacyCollectedDataType);
    for (const never of ['CrashData', 'AudioData', 'PhotosorVideos', 'PreciseLocation', 'CoarseLocation', 'DeviceID', 'Contacts']) {
      expect(types).not.toContain(`NSPrivacyCollectedDataType${never}`);
    }
    expect(privacyManifests.NSPrivacyCollectedDataTypes.every((t) => t.NSPrivacyCollectedDataTypeTracking === false)).toBe(true);
  });

  it('declares one approved reason for each required-reason API the app and its dependencies use', () => {
    const reasons = Object.fromEntries(privacyManifests.NSPrivacyAccessedAPITypes.map((a) => [a.NSPrivacyAccessedAPIType.replace('NSPrivacyAccessedAPICategory', ''), a.NSPrivacyAccessedAPITypeReasons]));
    expect(reasons).toEqual({ UserDefaults: ['CA92.1'], FileTimestamp: ['C617.1'], SystemBootTime: ['35F9.1'], DiskSpace: ['E174.1'] });
  });

  it('is what app.config.ts hands to Expo', () => {
    const config = readFileSync(resolve(__dirname, '../app.config.ts'), 'utf8');
    expect(config).toMatch(/loadTs<PrivacyManifestModule>\('\.\/src\/lib\/privacy-manifest\.ts'\)/);
    expect(config).toMatch(/\n\s+privacyManifests,\n/);
  });
});
