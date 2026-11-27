/**
 * ER-A15 (BL-1250): the global properties `build_kind` and `is_internal`, and the one local tester switch (FH-10).
 * Both ride on every event the client sends; the switch can never mark an event from a store build as internal.
 * Analytics stays off in every build (CR-194): nothing here sends anything before a yes. Fictional family Asha only.
 */
import { describe, expect, it } from 'vitest';
import { BUILD_KIND, createAnalytics, isInternalEvent, recordingProvider, resolveBuildKind, type AnalyticsOptions } from '../src';

const ID = '00000000-0000-4000-8000-0000000000b1';

async function granted(extra: Partial<AnalyticsOptions> = {}) {
  const provider = recordingProvider();
  const analytics = createAnalytics({ provider, randomId: () => ID, flushIntervalMs: 0, ...extra });
  await analytics.init();
  await analytics.grant();
  const sent = async () => (await analytics.flush(), provider.captured());
  return { analytics, provider, sent };
}

describe('build_kind and is_internal on every event (ER-A15)', () => {
  it('every event the client sends carries both, sampled or not, with or without a child count', async () => {
    const { analytics, sent } = await granted({ buildKind: 'testflight', sampleRates: { surface_impressed: 0.99 } });
    analytics.track('screen_view', { route: 'book' });
    analytics.setChildCount(2);
    analytics.track('control_tapped', { control: 'tonight_speak', route: 'tonight' });
    analytics.track('perf_measured', { metric: 'save_commit', ms_bucket: '1_3s', ok: true });
    analytics.track('surface_impressed', { surface: 'tonight_prompt', route: 'tonight' });
    const events = await sent();
    expect(events.length).toBeGreaterThanOrEqual(3);
    for (const e of events) {
      expect(e.properties.build_kind, e.event).toBe('testflight');
      expect(e.properties.is_internal, e.event).toBe(false);
    }
  });

  it('an event cannot set its own build kind or internal flag', async () => {
    const { analytics, sent } = await granted({ buildKind: 'store', internalTester: () => true });
    analytics.track('screen_view', { route: 'family', build_kind: 'dev', is_internal: true } as never);
    const [e] = await sent();
    expect(e!.properties).toMatchObject({ build_kind: 'store', is_internal: false });
  });

  it('nothing is sent before a yes, whatever the build kind or the switch (analytics stays off, CR-194)', async () => {
    for (const buildKind of BUILD_KIND.values) {
      const provider = recordingProvider();
      const analytics = createAnalytics({ provider, buildKind, internalTester: () => true, randomId: () => ID, flushIntervalMs: 0 });
      await analytics.init();
      expect(analytics.track('screen_view', { route: 'book' })).toBe('dropped_no_consent');
      await analytics.flush();
      expect(provider.captured(), buildKind).toEqual([]);
      expect(analytics.queueLength(), buildKind).toBe(0);
    }
  });
});

describe('build_kind resolution', () => {
  it('keeps each known kind and resolves anything else to dev, never to store', () => {
    for (const k of BUILD_KIND.values) expect(resolveBuildKind(k)).toBe(k);
    for (const v of [undefined, null, '', 'production', 'STORE', 'store ', 'Asha', 7, {}]) expect(resolveBuildKind(v), String(v)).toBe('dev');
  });

  it('an unset build kind is sent as dev', async () => {
    const { analytics, sent } = await granted();
    analytics.track('screen_view', { route: 'book' });
    expect((await sent())[0]!.properties.build_kind).toBe('dev');
  });
});

describe('the internal-tester switch (FH-10)', () => {
  it('is unreachable in a store build: never called, and is_internal is always false', async () => {
    let asked = 0;
    const tester = () => (asked++, true);
    expect(isInternalEvent('store', tester)).toBe(false);
    const { analytics, sent } = await granted({ buildKind: 'store', internalTester: tester });
    analytics.track('screen_view', { route: 'book' });
    analytics.track('control_tapped', { control: 'review_keep', route: 'tonight' });
    for (const e of await sent()) expect(e.properties.is_internal).toBe(false);
    expect(asked).toBe(0);
  });

  it('marks events internal in a test build only while the switch answers exactly true', async () => {
    let on = true;
    const { analytics, sent } = await granted({ buildKind: 'preview', internalTester: () => on });
    analytics.track('screen_view', { route: 'book' });
    on = false;
    analytics.track('screen_view', { route: 'family' });
    expect((await sent()).map((e) => e.properties.is_internal)).toEqual([true, false]);
    for (const k of ['testflight', 'preview', 'dev'] as const) {
      expect(isInternalEvent(k, () => true), k).toBe(true);
      expect(isInternalEvent(k), k).toBe(false);
      expect(isInternalEvent(k, () => 'true' as never), k).toBe(false);
      expect(isInternalEvent(k, () => { throw new Error('storage unavailable'); }), k).toBe(false);
    }
  });
});
