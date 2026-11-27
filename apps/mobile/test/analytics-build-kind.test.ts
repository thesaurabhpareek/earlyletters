/**
 * ER-A15 (BL-1250, FH-10), app half: the app passes `build_kind` from its app environment and the one local
 * internal-tester switch to createAnalytics. A store install (eas.json production profile) has the switch off and no
 * way to turn it on: it never reads or writes the flag, and no screen, setting or link calls the setter.
 * Analytics stays off in every build (D-088, CR-194): nothing here sends anything before a yes. Fictional family Asha.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BUILD_KIND as KINDS, createAnalytics, recordingProvider } from '@scribe/analytics';
import { APP_ENV, APP_ENVS, resolveAppEnv } from '../src/lib/build-env';
import { BUILD_KIND, INTERNAL_TESTER_KEY, buildKindFor, makeInternalTester, type SyncSettings } from '../src/lib/analytics/build-kind';
import { stripComments } from './helpers/strip-comments';

const APP = join(__dirname, '..');
const read = (p: string) => readFileSync(join(APP, p), 'utf8');
const ID = '00000000-0000-4000-8000-0000000000a5';

/** An in-memory settings table that counts every read and write. */
function settings(initial: Record<string, string> = {}) {
  const rows = new Map(Object.entries(initial));
  const calls = { get: 0, set: 0, remove: 0 };
  const storage: SyncSettings = {
    get: (k) => (calls.get++, rows.get(k) ?? null),
    set: (k, v) => (calls.set++, void rows.set(k, v)),
    remove: (k) => (calls.remove++, void rows.delete(k)),
  };
  return { storage, rows, calls };
}

describe('build_kind from the app environment (ER-A15)', () => {
  it('only production is store; preview is preview; development is dev', () => {
    expect(buildKindFor('production')).toBe('store');
    expect(buildKindFor('preview')).toBe('preview');
    expect(buildKindFor('development')).toBe('dev');
    for (const env of APP_ENVS) expect(KINDS.values, env).toContain(buildKindFor(env));
    expect(APP_ENVS.filter((env) => buildKindFor(env) === 'store')).toEqual(['production']);
  });

  it('the eas.json production profile is store and every other profile is not', () => {
    const eas = JSON.parse(read('eas.json')) as { build: Record<string, { env?: Record<string, string> }> };
    for (const [name, profile] of Object.entries(eas.build)) {
      const env = resolveAppEnv(profile.env?.EXPO_PUBLIC_APP_ENV);
      expect(env, name).not.toBeNull();
      expect(buildKindFor(env!) === 'store', name).toBe(name === 'production');
    }
  });

  it('this process (no app environment set) is a dev build, never store', () => {
    expect(APP_ENV).toBe('development');
    expect(BUILD_KIND).toBe('dev');
  });
});

describe('the internal-tester switch (FH-10)', () => {
  it('in a store build it is off and never reads the flag, whatever storage holds', () => {
    for (const value of ['1', 'true', 'on']) {
      const { storage, calls } = settings({ [INTERNAL_TESTER_KEY]: value });
      expect(makeInternalTester('store', storage).isOn(), value).toBe(false);
      expect(calls.get, value).toBe(0);
    }
  });

  it('in a store build it cannot be turned on: nothing is written and the answer is no', () => {
    const { storage, rows, calls } = settings();
    const tester = makeInternalTester(buildKindFor('production'), storage);
    expect(tester.setInternalTester(true)).toBe(false);
    expect(tester.setInternalTester(false)).toBe(false);
    expect(rows.size).toBe(0);
    expect(calls).toEqual({ get: 0, set: 0, remove: 0 });
    expect(tester.isOn()).toBe(false);
  });

  it('in a non-store build it is off until set, and only the exact value 1 is on', () => {
    for (const kind of ['preview', 'dev', 'testflight'] as const) {
      const { storage, rows } = settings();
      const tester = makeInternalTester(kind, storage);
      expect(tester.isOn(), kind).toBe(false);
      expect(tester.setInternalTester(true), kind).toBe(true);
      expect(rows.get(INTERNAL_TESTER_KEY), kind).toBe('1');
      expect(tester.isOn(), kind).toBe(true);
      expect(tester.setInternalTester(false), kind).toBe(true);
      expect(rows.has(INTERNAL_TESTER_KEY), kind).toBe(false);
      expect(tester.isOn(), kind).toBe(false);
    }
    for (const value of ['true', 'on', ' 1', '0', '']) {
      expect(makeInternalTester('preview', settings({ [INTERNAL_TESTER_KEY]: value }).storage).isOn(), value).toBe(false);
    }
  });

  it('a settings read that throws counts as off', () => {
    const storage: SyncSettings = {
      get: () => {
        throw new Error('db closed');
      },
      set: () => {},
      remove: () => {},
    };
    expect(makeInternalTester('preview', storage).isOn()).toBe(false);
  });
});

describe('sent events carry the build kind and the switch, and nothing of the flag itself', () => {
  async function sentWith(env: 'production' | 'preview' | 'development', flag: string | null) {
    const { storage } = settings(flag === null ? {} : { [INTERNAL_TESTER_KEY]: flag });
    const buildKind = buildKindFor(env);
    const provider = recordingProvider();
    const analytics = createAnalytics({ provider, randomId: () => ID, flushIntervalMs: 0, buildKind, internalTester: makeInternalTester(buildKind, storage).isOn });
    await analytics.init();
    await analytics.grant();
    analytics.track('screen_view', { route: 'book' });
    await analytics.flush();
    return provider.captured();
  }

  it('a store install with the flag already set still sends is_internal false', async () => {
    const events = await sentWith('production', '1');
    expect(events.length).toBeGreaterThan(0);
    for (const e of events) expect(e.properties, e.event).toMatchObject({ build_kind: 'store', is_internal: false });
  });

  it('a preview build with the switch on sends is_internal true; off sends false', async () => {
    for (const e of await sentWith('preview', '1')) expect(e.properties, e.event).toMatchObject({ build_kind: 'preview', is_internal: true });
    for (const e of await sentWith('development', null)) expect(e.properties, e.event).toMatchObject({ build_kind: 'dev', is_internal: false });
  });

  it('no event carries the settings key: the switch only sets is_internal', async () => {
    for (const e of await sentWith('preview', '1')) {
      const text = JSON.stringify(e);
      expect(text).not.toContain(INTERNAL_TESTER_KEY);
    }
  });
});

describe('the app wiring (index.ts)', () => {
  const raw = read('src/lib/analytics/index.ts');
  const src = stripComments(raw);
  const callOf = (text: string) => text.slice(text.indexOf('createAnalytics({'), text.indexOf('export const lifecycle'));

  it('passes BUILD_KIND and the switch reader to createAnalytics', () => {
    expect(callOf(src)).toMatch(/\bbuildKind: BUILD_KIND,/);
    expect(callOf(src)).toMatch(/\binternalTester: internalTester\.isOn,/);
    expect(src).toMatch(/const internalTester = makeInternalTester\(BUILD_KIND, /);
    expect(src).toMatch(/import \{[^}]*\bBUILD_KIND\b[^}]*\bmakeInternalTester\b[^}]*\} from '\.\/build-kind'/s);
  });

  it('a commented-out line does not satisfy the wiring check', () => {
    const off = stripComments(raw.replace(/^(\s*)buildKind: BUILD_KIND,/m, '$1// buildKind: BUILD_KIND,'));
    expect(off).not.toBe(src);
    expect(callOf(off)).not.toMatch(/\bbuildKind: BUILD_KIND,/);
  });

  it('does not export the switch, so no screen can reach it through the analytics module', () => {
    expect(src).not.toMatch(/export\s+(const|let|function)\s+internalTester\b/);
    expect(src).not.toMatch(/export\s*\{[^}]*\binternalTester\b/s);
  });

  it('nothing in the app turns the switch on: no call of setInternalTester and no use of the flag key outside build-kind.ts', () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) files.push(p);
      }
    };
    walk(join(APP, 'src'));
    const offenders = files
      .filter((p) => !p.endsWith(join('lib', 'analytics', 'build-kind.ts')))
      .filter((p) => {
        const text = stripComments(readFileSync(p, 'utf8'));
        return /\bsetInternalTester\s*\(/.test(text) || text.includes(INTERNAL_TESTER_KEY) || text.includes('internal_tester');
      })
      .map((p) => relative(APP, p));
    expect(files.length).toBeGreaterThan(50);
    expect(offenders).toEqual([]);
  });
});
