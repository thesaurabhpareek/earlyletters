/// <reference types="node" />
/**
 * BL-958: the photo and Find build flags stay off in every store profile (the flag rows of NS-01 and NS-02; gate G6).
 * The first test reads the real eas.json, so turning either flag on in preview, testflight or production fails
 * `npm test`, which runs on every pull request and in the release-ios.yml `checks` job before an RC build.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveProfile, STORE_FLAGS, storeFlagMessage, storeFlagProblems, storeProfiles } from '../../../scripts/release/store-flags.mjs';

const APP = join(__dirname, '..');
const realEas = () => JSON.parse(readFileSync(join(APP, 'eas.json'), 'utf8'));
const PREFLIGHT = readFileSync(join(APP, 'scripts', 'preflight-testflight.mjs'), 'utf8');

/** A small eas.json in the shape of the real one: two internal profiles and three store profiles. */
const fixture = (env: Record<string, Record<string, string>> = {}) => ({
  build: {
    development: { developmentClient: true, distribution: 'internal', env: { EXPO_PUBLIC_PHOTOS: 'on', ...env.development } },
    e2e: { distribution: 'internal', ios: { simulator: true }, env: { EXPO_PUBLIC_BOOK_SEARCH: 'on', ...env.e2e } },
    preview: { distribution: 'store', env: { ...env.preview } },
    production: { autoIncrement: true, env: { ...env.production } },
    testflight: { distribution: 'store', env: { ...env.testflight } },
  },
});

describe('photo and Find flags in store profiles (BL-958)', () => {
  it('[BL-958][NS-01][NS-02] no store profile in eas.json turns on the photo or Find flag', () => {
    expect(storeProfiles(realEas())).toEqual(['preview', 'production', 'testflight']);
    expect(storeFlagProblems(realEas())).toEqual([]);
  });

  it('names exactly the six flags, and production is never an allowed profile before G6', () => {
    expect(STORE_FLAGS.map((f) => [f.env, f.card])).toEqual([
      ['EXPO_PUBLIC_PHOTOS', 'NS-01'],
      ['EXPO_PUBLIC_BOOK_SEARCH', 'NS-02'],
      ['EXPO_PUBLIC_NEW_DEVICE_EMAIL', 'NS-08'],
      ['EXPO_PUBLIC_BACKUP_LINE', 'NS-10'],
      ['EXPO_PUBLIC_SERVER_ERASE', 'BL-1854'],
      ['EXPO_PUBLIC_ANALYTICS', 'BL-1886'],
    ]);
    for (const f of STORE_FLAGS) expect(f.allowedOn).not.toContain('production');
  });

  it('fails a production profile that turns either flag on', () => {
    expect(storeFlagProblems(fixture({ production: { EXPO_PUBLIC_PHOTOS: 'on' } }))).toEqual([
      { profile: 'production', env: 'EXPO_PUBLIC_PHOTOS', value: 'on', card: 'NS-01' },
    ]);
    const [p] = storeFlagProblems(fixture({ production: { EXPO_PUBLIC_BOOK_SEARCH: 'on' } }));
    expect(p.profile).toBe('production');
    expect(storeFlagMessage(p)).toMatch(/store profile "production" sets EXPO_PUBLIC_BOOK_SEARCH="on".*gate G6/);
  });

  it('fails preview and testflight too, and any value but off, in any case', () => {
    const problems = storeFlagProblems(fixture({ preview: { EXPO_PUBLIC_PHOTOS: ' ON ' }, testflight: { EXPO_PUBLIC_BOOK_SEARCH: '1' } }));
    expect(problems.map((p) => `${p.profile} ${p.env}`)).toEqual(['preview EXPO_PUBLIC_PHOTOS', 'testflight EXPO_PUBLIC_BOOK_SEARCH']);
  });

  it('passes unset and "off", and ignores the internal and simulator profiles', () => {
    expect(storeFlagProblems(fixture({ production: { EXPO_PUBLIC_PHOTOS: 'off', EXPO_PUBLIC_BOOK_SEARCH: 'Off' } }))).toEqual([]);
  });

  it('passes a flag on where the table allows it, and nowhere else', () => {
    const flags = [{ env: 'EXPO_PUBLIC_PHOTOS', card: 'NS-01', allowedOn: ['preview', 'testflight'] }];
    const eas = fixture({ preview: { EXPO_PUBLIC_PHOTOS: 'on' }, testflight: { EXPO_PUBLIC_PHOTOS: 'on' }, production: { EXPO_PUBLIC_PHOTOS: 'on' } });
    expect(storeFlagProblems(eas, flags).map((p) => p.profile)).toEqual(['production']);
  });

  it('reads a flag a store profile inherits through extends, and a child that writes off wins', () => {
    const base = { distribution: 'store', env: { EXPO_PUBLIC_PHOTOS: 'on' } };
    expect(storeFlagProblems({ build: { base: { ...base, distribution: 'internal' }, production: { extends: 'base' } } }).map((p) => p.profile)).toEqual([]);
    expect(storeFlagProblems({ build: { base, production: { extends: 'base' } } }).map((p) => p.profile)).toEqual(['base', 'production']);
    expect(storeFlagProblems({ build: { base, production: { extends: 'base', env: { EXPO_PUBLIC_PHOTOS: 'off' } } } }).map((p) => p.profile)).toEqual(['base']);
    expect(resolveProfile({ a: { extends: 'b' }, b: { extends: 'a' } }, 'a')).not.toBeNull();
  });

  it('[BL-1987] EXPO_PUBLIC_SERVER_ERASE is listed with allowedOn empty, so no store profile can turn it on', () => {
    const row = STORE_FLAGS.find((f) => f.env === 'EXPO_PUBLIC_SERVER_ERASE');
    expect(row?.allowedOn).toEqual([]);
    for (const profile of ['preview', 'testflight', 'production']) {
      const problems = storeFlagProblems(fixture({ [profile]: { EXPO_PUBLIC_SERVER_ERASE: 'on' } }));
      expect(problems, profile).toEqual([{ profile, env: 'EXPO_PUBLIC_SERVER_ERASE', value: 'on', card: 'BL-1854' }]);
    }
    // Development and e2e builds may carry it.
    expect(storeFlagProblems(fixture({ development: { EXPO_PUBLIC_SERVER_ERASE: 'on' }, e2e: { EXPO_PUBLIC_SERVER_ERASE: 'on' } }))).toEqual([]);
    // The real eas.json carries it in no store profile (the first test also covers this through the whole table).
    expect(storeFlagProblems(realEas()).filter((p) => p.env === 'EXPO_PUBLIC_SERVER_ERASE')).toEqual([]);
  });

  it('[CR-178 4a][D-170][BL-1886] EXPO_PUBLIC_ANALYTICS is held: allowedOn is empty and any store profile that sets it on fails', () => {
    const row = STORE_FLAGS.find((f) => f.env === 'EXPO_PUBLIC_ANALYTICS');
    expect(row?.card).toBe('BL-1886');
    expect(row?.allowedOn).toEqual([]);
    for (const profile of ['preview', 'testflight', 'production']) {
      const problems = storeFlagProblems(fixture({ [profile]: { EXPO_PUBLIC_ANALYTICS: 'on' } }));
      expect(problems, profile).toEqual([{ profile, env: 'EXPO_PUBLIC_ANALYTICS', value: 'on', card: 'BL-1886' }]);
    }
    expect(storeFlagProblems(fixture({ production: { EXPO_PUBLIC_ANALYTICS: 'off' } }))).toEqual([]);
    expect(storeFlagProblems(fixture({ development: { EXPO_PUBLIC_ANALYTICS: 'on' }, e2e: { EXPO_PUBLIC_ANALYTICS: 'on' } }))).toEqual([]);
    // The real eas.json writes "off" in every profile today (BL-1867 turns preview and testflight on, with this row).
    expect(storeFlagProblems(realEas()).filter((p) => p.env === 'EXPO_PUBLIC_ANALYTICS')).toEqual([]);
  });

  it('[BL-1886] a mutant that adds production to the analytics row fails the production-never check', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'store-flags-mutant-'));
    try {
      const src = readFileSync(join(APP, '..', '..', 'scripts', 'release', 'store-flags.mjs'), 'utf8');
      const row = "env: 'EXPO_PUBLIC_ANALYTICS', card: 'BL-1886', allowedOn: Object.freeze([])";
      expect(src).toContain(row);
      const file = join(dir, 'store-flags.mjs');
      writeFileSync(file, src.replace(row, "env: 'EXPO_PUBLIC_ANALYTICS', card: 'BL-1886', allowedOn: Object.freeze(['production'])"));
      const mutant = await import(file);
      // The mutant table lets a production profile carry the flag, which the real table refuses ...
      const eas = fixture({ production: { EXPO_PUBLIC_ANALYTICS: 'on' } });
      expect(mutant.storeFlagProblems(eas)).toEqual([]);
      expect(storeFlagProblems(eas).map((p) => p.env)).toEqual(['EXPO_PUBLIC_ANALYTICS']);
      // ... and the invariant the "six flags" test asserts is what turns red on the mutant.
      expect(mutant.STORE_FLAGS.some((f: { allowedOn: string[] }) => f.allowedOn.includes('production'))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('the TestFlight preflight fails on the same table for every store profile', () => {
    expect(PREFLIGHT).toMatch(/import \{[^}]*storeFlagProblems[^}]*\} from '\.\.\/\.\.\/\.\.\/scripts\/release\/store-flags\.mjs'/);
    expect(PREFLIGHT).toMatch(/storeFlagProblems\(eas\)/);
  });
});
