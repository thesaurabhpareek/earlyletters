/// <reference types="node" />
/**
 * BL-958: the photo and Find build flags stay off in every store profile (the flag rows of NS-01 and NS-02; gate G6).
 * The first test reads the real eas.json, so turning either flag on in preview, testflight or production fails
 * `npm test`, which runs on every pull request and in the release-ios.yml `checks` job before an RC build.
 */
import { readFileSync } from 'node:fs';
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

  it('names exactly the two flags, and production is never an allowed profile before G6', () => {
    expect(STORE_FLAGS.map((f) => [f.env, f.card])).toEqual([
      ['EXPO_PUBLIC_PHOTOS', 'NS-01'],
      ['EXPO_PUBLIC_BOOK_SEARCH', 'NS-02'],
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

  it('the TestFlight preflight fails on the same table for every store profile', () => {
    expect(PREFLIGHT).toMatch(/import \{[^}]*storeFlagProblems[^}]*\} from '\.\.\/\.\.\/\.\.\/scripts\/release\/store-flags\.mjs'/);
    expect(PREFLIGHT).toMatch(/storeFlagProblems\(eas\)/);
  });
});
