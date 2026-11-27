/// <reference types="node" />
/**
 * BL-1250 (ER-A15), the app half: every event the app sends carries `build_kind` and `is_internal`, and the one local
 * tester switch (FH-10, CPrivO-61) cannot reach a store build. Four layers, so removing any one turns something red:
 *   1. app.config.ts writes `extra.buildKind` for each eas.json profile, and the production app env is `store` whatever
 *      the EAS profile is called;
 *   2. the runtime reading (`buildKindOf`) keeps production at `store` whatever `extra` says;
 *   3. the switch: a store build never reads or writes the setting; elsewhere only the exact value `true` is on;
 *   4. the options reach createAnalytics (events carry both properties) and src/lib/analytics/index.ts passes them.
 * Analytics stays off in every build today (D-170); nothing here turns it on. Fictional family "Asha" only.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getConfig } from 'expo/config';
import { createAnalytics, recordingProvider } from '@scribe/analytics';
import { buildKindFor } from '../src/lib/build-env';
import { stripComments } from './helpers/strip-comments';

const h = vi.hoisted(() => ({ settings: new Map<string, string>(), reads: 0, writes: 0, analytics: true }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { extra: {} } } }));
vi.mock('@/lib/capabilities', () => ({ capabilities: { get analytics() { return h.analytics; } } }));
vi.mock('@/lib/store', () => ({
  getSetting: (k: string) => (h.reads++, h.settings.get(k) ?? null),
  setSetting: (k: string, v: string) => (h.writes++, void h.settings.set(k, v)),
  deleteSetting: (k: string) => (h.writes++, void h.settings.delete(k)),
}));

const { INTERNAL_TESTER_KEY, analyticsBuildOptions, buildKindOf, internalTesterOn, internalTesterRowShown, setInternalTester } = await import(
  '../src/lib/analytics/internal-tester'
);

const ROOT = path.join(__dirname, '..');
const eas = JSON.parse(fs.readFileSync(path.join(ROOT, 'eas.json'), 'utf8')) as { build: Record<string, { env?: Record<string, string> }> };

/** app.config.ts with exactly one profile's env, as an EAS builder runs it (EAS_BUILD_PROFILE set to the profile's name). */
function extraFor(env: Record<string, string>): Record<string, unknown> {
  const names = Object.keys(process.env).filter((k) => k.startsWith('EXPO_PUBLIC_') || k === 'EAS_BUILD_PROFILE');
  const saved = Object.fromEntries(names.map((k) => [k, process.env[k]]));
  try {
    for (const k of names) delete process.env[k];
    Object.assign(process.env, env);
    return (getConfig(ROOT, { skipSDKVersionRequirement: true, isPublicConfig: false }).exp.extra ?? {}) as Record<string, unknown>;
  } finally {
    for (const k of Object.keys(env)) delete process.env[k];
    for (const [k, v] of Object.entries(saved)) if (v !== undefined) process.env[k] = v;
  }
}
const profile = (name: string, over: Record<string, string> = {}) => extraFor({ ...(eas.build[name]?.env ?? {}), EAS_BUILD_PROFILE: name, ...over });

beforeEach(() => {
  h.settings.clear();
  h.reads = 0;
  h.writes = 0;
  h.analytics = true;
});

describe('[ER-A15] [BL-1250] app.config.ts names the build kind of every eas.json profile', () => {
  const expected: Record<string, string> = { production: 'store', testflight: 'testflight', preview: 'preview', development: 'dev', e2e: 'dev' };

  it('covers every profile in eas.json, so a new profile cannot ship without a kind', () => {
    expect(Object.keys(eas.build).sort()).toEqual(Object.keys(expected).sort());
  });

  for (const [name, kind] of Object.entries(expected)) {
    it(`the ${name} profile is ${kind}`, () => {
      expect(profile(name).buildKind).toBe(kind);
    });
  }

  it('the production app env is store even when the EAS profile is named testflight', () => {
    expect(profile('production', { EAS_BUILD_PROFILE: 'testflight' }).buildKind).toBe('store');
    expect(buildKindFor('production', 'testflight')).toBe('store');
  });

  it('only the exact testflight profile name is testflight', () => {
    expect(buildKindFor('preview', ' testflight ')).toBe('testflight');
    for (const name of ['testflight2', 'test', 'TestFlight', 'preview']) expect(buildKindFor('preview', name), name).toBe('preview');
  });

  it('a preview build made off EAS is preview, and an unset app env is dev, never store', () => {
    expect(extraFor({ EXPO_PUBLIC_APP_ENV: 'preview' }).buildKind).toBe('preview');
    expect(extraFor({}).buildKind).toBe('dev');
  });
});

describe('[ER-A15] the running app reads its build kind', () => {
  it('the production app env is store whatever extra.buildKind says', () => {
    for (const extra of ['dev', 'testflight', 'preview', 'store', 'nonsense', undefined, null]) expect(buildKindOf('production', extra), String(extra)).toBe('store');
  });

  it('a test build takes extra.buildKind, and falls back to its app env when extra is missing or unknown', () => {
    expect(buildKindOf('preview', 'testflight')).toBe('testflight');
    expect(buildKindOf('preview', 'preview')).toBe('preview');
    expect(buildKindOf('preview', undefined)).toBe('preview');
    expect(buildKindOf('preview', 'nonsense')).toBe('preview');
    expect(buildKindOf('development', 'nonsense')).toBe('dev');
    expect(buildKindOf('development', undefined)).toBe('dev');
    expect(buildKindOf('preview', 'dev')).toBe('dev');
  });
});

describe('[FH-10] [CPrivO-61] the tester switch cannot reach a store build', () => {
  it('a store build answers off without reading the setting, refuses to write it, and shows no row', () => {
    h.settings.set(INTERNAL_TESTER_KEY, 'true');
    expect(internalTesterOn('store')).toBe(false);
    expect(h.reads).toBe(0);
    expect(setInternalTester(true, 'store')).toBe(false);
    expect(setInternalTester(false, 'store')).toBe(false);
    expect(h.writes).toBe(0);
    expect(h.settings.get(INTERNAL_TESTER_KEY)).toBe('true');
    expect(internalTesterRowShown('store', true)).toBe(false);
  });

  it('a test build shows the row only where usage can be sent', () => {
    for (const kind of ['testflight', 'preview', 'dev'] as const) {
      expect(internalTesterRowShown(kind, true), kind).toBe(true);
      expect(internalTesterRowShown(kind, false), kind).toBe(false);
    }
  });

  it('on stores exactly "true", off removes the row, and only "true" reads as on', () => {
    expect(internalTesterOn('testflight')).toBe(false);
    expect(setInternalTester(true, 'testflight')).toBe(true);
    expect(h.settings.get(INTERNAL_TESTER_KEY)).toBe('true');
    expect(internalTesterOn('testflight')).toBe(true);
    expect(setInternalTester(false, 'testflight')).toBe(true);
    expect(h.settings.has(INTERNAL_TESTER_KEY)).toBe(false);
    for (const v of ['1', 'yes', 'TRUE', ' true']) {
      h.settings.set(INTERNAL_TESTER_KEY, v);
      expect(internalTesterOn('preview'), v).toBe(false);
    }
  });
});

describe('[ER-A15] the options reach every event', () => {
  async function sentWith(kind: Parameters<typeof analyticsBuildOptions>[0]) {
    const provider = recordingProvider();
    const analytics = createAnalytics({ provider, randomId: () => '00000000-0000-4000-8000-0000000000a5', flushIntervalMs: 0, ...analyticsBuildOptions(kind) });
    await analytics.init();
    await analytics.grant();
    analytics.track('screen_view', { route: 'book' });
    await analytics.flush();
    return provider.captured();
  }

  it('a TestFlight phone with the switch on sends build_kind testflight and is_internal true', async () => {
    h.settings.set(INTERNAL_TESTER_KEY, 'true');
    const events = await sentWith('testflight');
    expect(events.length).toBeGreaterThan(0);
    for (const e of events) expect(e.properties, e.event).toMatchObject({ build_kind: 'testflight', is_internal: true });
  });

  it('the same phone with the switch off sends is_internal false', async () => {
    const events = await sentWith('preview');
    for (const e of events) expect(e.properties, e.event).toMatchObject({ build_kind: 'preview', is_internal: false });
  });

  it('a store build with the setting somehow on still sends is_internal false and never reads it', async () => {
    h.settings.set(INTERNAL_TESTER_KEY, 'true');
    const events = await sentWith('store');
    expect(events.length).toBeGreaterThan(0);
    for (const e of events) expect(e.properties, e.event).toMatchObject({ build_kind: 'store', is_internal: false });
    expect(h.reads).toBe(0);
  });
});

describe('[BL-1250] src/lib/analytics/index.ts passes the build options to createAnalytics', () => {
  const raw = fs.readFileSync(path.join(ROOT, 'src/lib/analytics/index.ts'), 'utf8');
  const callOf = (text: string) => text.slice(text.indexOf('createAnalytics({'), text.indexOf('export const lifecycle'));

  it('spreads analyticsBuildOptions() last in the one createAnalytics call, imported from ./internal-tester, and sets neither key itself', () => {
    const src = stripComments(raw);
    // Last in the call, so no later key can override build_kind or the tester switch.
    expect(callOf(src)).toMatch(/\.\.\.analyticsBuildOptions\(\),\s*\}\);\s*$/);
    expect(callOf(src)).not.toMatch(/\b(buildKind|internalTester)\s*:/);
    expect(src).toMatch(/import \{ analyticsBuildOptions \} from '\.\/internal-tester';/);
  });
});
