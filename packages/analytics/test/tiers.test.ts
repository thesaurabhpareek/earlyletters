/**
 * ER-B02 (BL-1255): every catalogue row carries a tier, the basics set is pinned, and an event with no tier can never
 * pass under `collect_by_default`.
 */
import { describe, expect, it } from 'vitest';
import { basicsEvents, createAnalytics, EVENTS, recordingProvider, REGISTRY, tierOf, type EventName } from '../src';

/** The closed basics set. Privacy signs any change (BL-1255); candidates for funnel steps wait for that signature. */
const BASICS = ['screen_view'];

describe('tier on every row', () => {
  it('every catalogue row and every registry row has a tier of basics or consented', () => {
    for (const [name, row] of Object.entries(EVENTS)) expect(['basics', 'consented'], name).toContain((row as { tier?: string }).tier);
    for (const [name, row] of Object.entries(REGISTRY)) expect(['basics', 'consented'], name).toContain((row as { tier?: string }).tier);
  });

  it('a registry row and its catalogue row agree on tier (the registry holds rows the catalogue does not yet)', () => {
    for (const [name, row] of Object.entries(REGISTRY)) if (name in EVENTS) expect((EVENTS as Record<string, { tier: string }>)[name]?.tier, name).toBe(row.tier);
  });

  it('the basics set is exactly the pinned list (a change needs this test edited with privacy)', () => {
    expect(basicsEvents()).toEqual(BASICS);
    expect(basicsEvents().length).toBeLessThanOrEqual(12);
  });

  it('no content-bearing or perf row is basics', () => {
    for (const n of basicsEvents()) expect(n).not.toMatch(/perf|measure|transcri|letter|child/);
  });
});

describe('tierOf', () => {
  it('reads the row, and a name the catalogue does not hold is consented', () => {
    expect(tierOf('screen_view')).toBe('basics');
    expect(tierOf('letter_saved')).toBe('consented');
    expect(tierOf('not_an_event')).toBe('consented');
    expect(tierOf('constructor')).toBe('consented');
    expect(tierOf('__proto__')).toBe('consented');
  });
});

describe('collect_by_default with the real tierOf', () => {
  async function started(tier: (n: EventName) => never) {
    const analytics = createAnalytics({ provider: recordingProvider(), basicsPolicy: 'collect_by_default', tierOf: tier, flushIntervalMs: 0 });
    await analytics.init();
    await analytics.recordDisclosureShown();
    return analytics;
  }

  it('passes screen_view and nothing else before a yes', async () => {
    const analytics = await started(tierOf as never);
    expect(analytics.track('screen_view', { route: 'family' })).toBe('queued');
    expect(analytics.track('capture_started', { source: 'tonight' } as never)).toBe('dropped_not_basics');
    expect(analytics.track('system:error_view', { code: 'sync_failed' } as never)).toBe('dropped_not_basics');
  });

  it('an untiered answer (undefined, a typo, a missing row) is treated as consented', async () => {
    for (const bad of [undefined, 'basic', 'BASICS', null]) {
      const analytics = await started((() => bad) as never);
      expect(analytics.track('screen_view', { route: 'family' })).toBe('dropped_not_basics');
    }
  });
});
