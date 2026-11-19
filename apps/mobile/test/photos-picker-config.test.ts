/// <reference types="node" />
// NX-39-R52 conditions C1 to C4 for expo-image-picker: the pin, the lockfile entries, the plugin options and the built
// plist. The picker's own plugin is configured to add no photo or camera string; these tests prove it on the real
// prebuild config, not by reading the options.
import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.join(__dirname, '..');
const REPO = path.join(ROOT, '..', '..');
const req = createRequire(path.join(ROOT, 'package.json'));

const PICKER_INTEGRITY = 'sha512-plgcGuMZMWqDchjXQW6S/WepYLB5KqfbZOzwC6xe0+j5IhY4ipvVuRZcXeP/0NgKgU0Jiu/XoTK4Bi8crtZ+sQ==';
const LOADER_INTEGRITY = 'sha512-uhrZKLT/cTl2mXyR28kPpVkS5O+PK9N1QA/07IFM4f5T4g0lTW1JHT3NEWwEEsGFldPmVX4j7LwUVVZxE+woug==';

/** C1 check as a pure function, so a positive control can feed it a bad lockfile. */
export function pickerLockProblems(lock: { packages: Record<string, Record<string, unknown>> }, pkg: { dependencies: Record<string, string> }): string[] {
  const problems: string[] = [];
  if (pkg.dependencies['expo-image-picker'] !== '57.0.20') problems.push(`apps/mobile pin is ${pkg.dependencies['expo-image-picker']}, not exactly 57.0.20`);
  const want: Record<string, [string, string]> = {
    'node_modules/expo-image-picker': ['57.0.20', PICKER_INTEGRITY],
    'node_modules/expo-image-loader': ['57.0.1', LOADER_INTEGRITY],
  };
  for (const [key, [version, integrity]] of Object.entries(want)) {
    const e = lock.packages[key];
    if (!e) problems.push(`${key} missing`);
    else {
      if (e.version !== version) problems.push(`${key} version ${String(e.version)}`);
      if (e.integrity !== integrity) problems.push(`${key} integrity ${String(e.integrity)}`);
      if (e.license !== 'MIT') problems.push(`${key} licence ${String(e.license)}`);
      if (e.hasInstallScript) problems.push(`${key} has an install script`);
    }
  }
  // Nothing else may depend on, or be, a picker or loader entry; a second copy nested anywhere is a change to read.
  for (const key of Object.keys(lock.packages)) {
    if (/expo-image-(picker|loader)$/.test(key) && !(key in want)) problems.push(`${key} is an extra copy`);
  }
  if (JSON.stringify(lock.packages['node_modules/expo-image-picker']?.dependencies) !== JSON.stringify({ 'expo-image-loader': '~57.0.1' })) problems.push('picker dependencies changed');
  return problems;
}

describe('[NX-39-R52][C1] the picker lockfile entries are exactly the reviewed ones', () => {
  const lock = JSON.parse(fs.readFileSync(path.join(REPO, 'package-lock.json'), 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  it('[C1] exact pin, reviewed integrity values, MIT, no install script', () => {
    expect(pickerLockProblems(lock, pkg)).toEqual([]);
    expect(lock.packages['apps/mobile'].dependencies['expo-image-picker']).toBe('57.0.20');
  });
  it('[C1] positive control: a range, a different integrity, a licence change or an install script each fail it', () => {
    const bad = (mut: (l: any, p: any) => void) => {
      const l = structuredClone(lock);
      const p = structuredClone(pkg);
      mut(l, p);
      return pickerLockProblems(l, p);
    };
    expect(bad((_, p) => (p.dependencies['expo-image-picker'] = '~57.0.20')).length).toBeGreaterThan(0);
    expect(bad((l) => (l.packages['node_modules/expo-image-picker'].integrity = 'sha512-x')).length).toBeGreaterThan(0);
    expect(bad((l) => (l.packages['node_modules/expo-image-loader'].license = 'GPL-3.0')).length).toBeGreaterThan(0);
    expect(bad((l) => (l.packages['node_modules/expo-image-loader'].hasInstallScript = true)).length).toBeGreaterThan(0);
    expect(bad((l) => (l.packages['node_modules/expo-image-picker'].version = '57.0.21')).length).toBeGreaterThan(0);
    expect(bad((l) => (l.packages['apps/mobile/node_modules/expo-image-picker'] = {})).length).toBeGreaterThan(0);
  });
  it('[C1] the lockfile gained no other expo package or install script because of the picker', () => {
    const withScripts = Object.entries(lock.packages as Record<string, { hasInstallScript?: boolean }>)
      .filter(([k, v]) => /expo-image-/.test(k) && v.hasInstallScript);
    expect(withScripts).toEqual([]);
  });
});

describe('[NX-39-R4][NX-39-R51][C2][C3] the built plist adds no photo or camera key', () => {
  const { getPrebuildConfigAsync } = createRequire(req.resolve('@expo/cli/package.json'))('@expo/prebuild-config');
  const { compileModsAsync } = req('expo/config-plugins');

  async function built() {
    const saved = process.env.EXPO_PUBLIC_PHOTOS;
    try {
      const { exp } = await getPrebuildConfigAsync(ROOT, { platforms: ['ios'] });
      return await compileModsAsync(exp, { projectRoot: ROOT, introspect: true, platforms: ['ios'], assertMissingModProviders: false, ignoreExistingNativeFiles: true });
    } finally {
      if (saved === undefined) delete process.env.EXPO_PUBLIC_PHOTOS;
      else process.env.EXPO_PUBLIC_PHOTOS = saved;
    }
  }

  it('[C2] the config lists the plugin with no photo string, no camera string and the expo-audio microphone string', async () => {
    const { exp } = await getPrebuildConfigAsync(ROOT, { platforms: ['ios'] });
    const plugins = (exp.plugins ?? []) as unknown[];
    const pick = plugins.find((p) => Array.isArray(p) && p[0] === 'expo-image-picker') as [string, Record<string, unknown>] | undefined;
    const audio = plugins.find((p) => Array.isArray(p) && p[0] === 'expo-audio') as [string, Record<string, unknown>] | undefined;
    expect(pick, 'expo-image-picker is listed').toBeTruthy();
    expect(pick![1].photosPermission).toBe(false);
    expect(pick![1].cameraPermission).toBe(false);
    expect(typeof pick![1].microphonePermission).toBe('string');
    expect(pick![1].microphonePermission).toBe(audio![1].microphonePermission);
    expect(pick![1].microphonePermission).not.toBe(false);
  }, 60_000);

  it('[C3] the introspected Info.plist has no library, camera or location key and keeps the real microphone string', async () => {
    const out = await built();
    const plist = (out.ios?.infoPlist ?? {}) as Record<string, unknown>;
    const keys = Object.keys(plist);
    expect(keys.filter((k) => /^NSPhotoLibrary|^NSCamera|^NSLocation|^NSPhotoLibraryAdd/.test(k))).toEqual([]);
    expect(typeof plist.NSMicrophoneUsageDescription).toBe('string');
    expect(plist.NSMicrophoneUsageDescription).not.toMatch(/Allow \$\(PRODUCT_NAME\)/); // not the picker's default string
    // no new entitlement, no app group
    expect(Object.keys(out.ios?.entitlements ?? {}).some((k) => /application-groups/.test(k))).toBe(false);
  }, 60_000);

  it('[C3] positive control: the picker with its defaults would have written three keys (so the check can fail)', async () => {
    const plugin = req('expo-image-picker/plugin/build/withImagePicker');
    const bare = { name: 'x', slug: 'x', ios: {}, _internal: { projectRoot: ROOT } }; // a clean config: no earlier plugin to undo the keys
    const applied = (plugin.default ?? plugin)(bare, {});
    const out = await compileModsAsync(applied, { projectRoot: ROOT, introspect: true, platforms: ['ios'], assertMissingModProviders: false, ignoreExistingNativeFiles: true });
    const keys = Object.keys(out.ios?.infoPlist ?? {});
    expect(keys).toEqual(expect.arrayContaining(['NSPhotoLibraryUsageDescription', 'NSCameraUsageDescription', 'NSMicrophoneUsageDescription']));
  }, 60_000);
});
