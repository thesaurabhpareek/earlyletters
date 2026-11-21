/// <reference types="node" />
/**
 * [NS-08-R5] backup off in store profiles (BL-976): scripts/preflight-keepsafe.mjs on eas.json as it is and on one
 * broken fixture per case, the script run as a script, and the production preflight's own backup check, which the
 * card names as the existing check. Fictional values only.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { productionChecks } from '../scripts/preflight-production.mjs';
import { keepSafeChecks, storeProfiles } from '../scripts/preflight-keepsafe.mjs';

const APP = join(__dirname, '..');
const SCRIPT = join(APP, 'scripts', 'preflight-keepsafe.mjs');

type Profile = { distribution?: string; env?: Record<string, string> };
type Eas = { build: Record<string, Profile> };
type Result = { level: string; msg: string; id?: string };

const realEas = (): Eas => JSON.parse(readFileSync(join(APP, 'eas.json'), 'utf8')) as Eas;
const failing = (eas: Eas) => (keepSafeChecks(eas) as Result[]).filter((r) => r.level === 'FAIL');
/** eas.json with one profile's EXPO_PUBLIC_BACKUP set to `value`, or left out when `value` is undefined. */
const withBackup = (profile: string, value: string | undefined): Eas => {
  const eas = realEas();
  const env = { ...(eas.build[profile].env ?? {}) };
  if (value === undefined) delete env.EXPO_PUBLIC_BACKUP;
  else env.EXPO_PUBLIC_BACKUP = value;
  eas.build[profile] = { ...eas.build[profile], env };
  return eas;
};

describe('[NS-08-R5] backup off in store profiles', () => {
  it('eas.json as it is: the store profiles are preview, production and testflight, and each writes EXPO_PUBLIC_BACKUP=off', () => {
    const eas = realEas();
    expect(storeProfiles(eas)).toEqual(['preview', 'production', 'testflight']);
    const results = keepSafeChecks(eas) as Result[];
    expect(results.map((r) => [r.level, r.id])).toEqual([
      ['PASS', 'backup-off'],
      ['PASS', 'backup-off'],
      ['PASS', 'backup-off'],
    ]);
  });

  it.each([
    ['testflight', 'on'],
    ['preview', 'on'],
    ['production', 'on'],
    ['testflight', ''],
    ['preview', 'yes'],
    ['production', undefined],
    ['testflight', undefined],
  ])('a %s profile with EXPO_PUBLIC_BACKUP %j FAILs, naming only that profile', (profile, value) => {
    const bad = failing(withBackup(profile, value));
    expect(bad).toHaveLength(1);
    expect(bad[0].id).toBe('backup-off');
    expect(bad[0].msg.startsWith(`${profile} profile:`)).toBe(true);
    expect(bad[0].msg).toContain(value === undefined ? 'not written' : JSON.stringify(value));
  });

  it('a profile that is not for the store is not checked, and an eas.json with no store profile FAILs', () => {
    expect(failing(withBackup('development', 'on'))).toEqual([]);
    expect(failing(withBackup('e2e', undefined))).toEqual([]);
    const eas = realEas();
    eas.build.production = { ...eas.build.production, distribution: 'internal' };
    expect(storeProfiles(eas)).toEqual(['preview', 'testflight']);
    expect(failing({ build: { development: { distribution: 'internal' } } })).toHaveLength(1);
  });

  it('runs as a script: exit 0 on the repository, and --json gives the same results', () => {
    const plain = spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8' });
    expect(plain.status, plain.stdout + plain.stderr).toBe(0);
    expect(plain.stdout).toContain('No FAIL.');
    const json = spawnSync(process.execPath, [SCRIPT, '--json'], { encoding: 'utf8' });
    expect(json.status).toBe(0);
    expect(JSON.parse(json.stdout).results).toEqual(keepSafeChecks(realEas()));
  });

  it('the production preflight passes eas.json as it is, and its backup check fails the production profile with backup on or unwritten', () => {
    const backupCheck = (eas: Eas) => {
      const input = { eas, cfg: null, introspected: null, environmentsMd: '', keysSource: '', publishedSource: '', versionJson: '{}', appConfigSource: '', shellEnv: {}, envFiles: [] };
      return (productionChecks(input as never) as Result[]).find((r) => r.id === 'backup')?.level;
    };
    expect(backupCheck(realEas())).toBe('PASS');
    expect(backupCheck(withBackup('production', 'on'))).toBe('FAIL');
    expect(backupCheck(withBackup('production', undefined))).toBe('FAIL');
  });
});
