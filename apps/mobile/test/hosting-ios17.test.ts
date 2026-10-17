/**
 * D-097 and D-098 (15 Oct 2026, delegated by founder; DEBATES Q-001, Q-002):
 * one host for language packs and speech models, packs.earlyletters.app on
 * Cloudflare R2, set per EAS profile as the docs base; and iOS 17 or later
 * through expo-build-properties.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getConfig } from 'expo/config';
import { describe, expect, it } from 'vitest';
import { PACKS_ORIGIN, SELF_HOST_BASE, SPEECH_MODELS } from '../src/lib/models/catalog';
import { docsBaseFor } from '../src/lib/remote/base.logic';

const ROOT = path.join(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');

describe('[D-097] packs and models come from packs.earlyletters.app', () => {
  it('the speech catalog uses the one host for every file we host', () => {
    expect(PACKS_ORIGIN).toBe('https://packs.earlyletters.app');
    expect(SELF_HOST_BASE).toBe('https://packs.earlyletters.app/speech');
    for (const m of Object.values(SPEECH_MODELS)) {
      for (const u of [m.url, ...(m.mirrors ?? [])]) expect(u, m.id).toMatch(/^https:\/\/(huggingface\.co|packs\.earlyletters\.app)\//);
    }
  });

  it('every EAS profile sets the docs base to that host, and the app accepts it', () => {
    const eas = JSON.parse(read('eas.json')) as { build: Record<string, { env?: Record<string, string> }> };
    for (const [name, profile] of Object.entries(eas.build)) {
      expect(profile.env?.EXPO_PUBLIC_DOCS_BASE_URL, name).toBe(PACKS_ORIGIN);
      expect(docsBaseFor(profile.env?.EXPO_PUBLIC_DOCS_BASE_URL, false, null), name).toBe(PACKS_ORIGIN);
    }
  });

  it('no source, script or test still names the old hosts', () => {
    const files = ['src/lib/models/catalog.ts', '../../scripts/packs/publish.ts', '../../scripts/packs/lib.test.ts'];
    for (const f of files) expect(read(f), f).not.toMatch(/models\.earlyletters\.com|packs\.earlyletters\.com/);
  });
});

describe('[D-098] iOS 17 or later', () => {
  it('app.config.ts sets the deployment target through expo-build-properties', () => {
    const exp = getConfig(ROOT, { skipSDKVersionRequirement: true, isPublicConfig: false }).exp;
    const plugin = (exp.plugins ?? []).find((p) => Array.isArray(p) && p[0] === 'expo-build-properties') as [string, { ios?: { deploymentTarget?: string } }] | undefined;
    expect(plugin?.[1].ios?.deploymentTarget).toBe('17.0');
  });

  it('expo-build-properties is a dependency, at the SDK 57 version', () => {
    const pkg = JSON.parse(read('package.json')) as { dependencies: Record<string, string> };
    expect(pkg.dependencies['expo-build-properties']).toMatch(/^~57\./);
  });
});
