import { describe, expect, it } from 'vitest';
import { createAnalytics, createBasics, createTrackers, EV, posthogBeforeSend, recordingProvider, REGISTRY } from '../src';

/** The fictional family "Asha": strings that must never appear in anything outgoing (V14). */
const CANARY = ['Asha', 'asha.parent@example.com', '2026-03-14', 'She laughed at the dog today', 'asha-first-steps.m4a', 'Hindu', 'Mumbai'];

async function granted() {
  const provider = recordingProvider();
  const analytics = createAnalytics({ provider, randomId: () => '00000000-0000-4000-8000-0000000000aa', flushIntervalMs: 0 });
  await analytics.init();
  await analytics.grant();
  return { analytics, provider };
}

describe('[V14] canary: nothing content-shaped leaves, through the helpers or the SDK hook', () => {
  it('drops every registry event given a canary in every property, and counts it', async () => {
    const { analytics, provider } = await granted();
    for (const [name, row] of Object.entries(REGISTRY)) {
      for (const canary of CANARY) {
        const props = Object.fromEntries(Object.keys(row.props).map((k) => [k, canary]));
        analytics.track(name as never, props as never);
      }
    }
    await analytics.flush();
    expect(provider.captured()).toEqual([]);
    expect(Object.values(analytics.violationCounts()).reduce((a, b) => a + (b ?? 0), 0)).toBeGreaterThan(0);
  });

  it('the typed helpers send nothing containing a canary, even when forced', async () => {
    const { analytics, provider } = await granted();
    const basics = createBasics(analytics);
    const t = createTrackers(analytics);
    for (const c of CANARY) {
      basics.tap(c as never, c as never);
      basics.impress(c as never, c as never, 1);
      basics.perf(c as never, 100);
      t.trackInviteCreated({ role: c as never, channel: c as never, shared: true, childIndex: 0 });
    }
    await analytics.flush();
    expect(JSON.stringify(provider.captured())).not.toMatch(new RegExp(CANARY.map((c) => c.replace(/[.]/g, '\\.')).join('|')));
    expect(provider.captured()).toEqual([]);
  });

  it('before_send drops canary values and strips unknown properties', () => {
    const send = posthogBeforeSend();
    for (const c of CANARY) {
      const out = send({ event: EV.screenView, properties: { route: c, schema_version: 9 } });
      expect(out === null || !JSON.stringify(out).includes(c)).toBe(true);
    }
    const out = send({ event: EV.screenView, properties: { route: 'book', schema_version: 9, child_name: 'Asha', $set: { name: 'Asha' } } })!;
    expect(JSON.stringify(out)).not.toContain('Asha');
  });
});

describe('an unregistered event or property is dropped and counted', () => {
  it('counts an unregistered event name (a held one too) and never sends it', async () => {
    const { analytics, provider } = await granted();
    expect(analytics.track('export_started' as never, { letters_bucket: '1' } as never)).toBe('dropped_invalid');
    expect(analytics.track('made_up_event' as never, {} as never)).toBe('dropped_invalid');
    await analytics.flush();
    expect(provider.captured()).toEqual([]);
    expect(analytics.violationCounts()).toEqual({ unknown_event: 2 });
  });

  it('strips an unregistered property, keeps the rest, and counts it', async () => {
    const { analytics, provider } = await granted();
    expect(analytics.track(EV.screenView, { route: 'book', extra_thing: 'x' } as never)).toBe('queued');
    await analytics.flush();
    expect(provider.captured()[0].properties).toEqual({ route: 'book', schema_version: expect.any(Number) });
    expect(analytics.violationCounts()).toEqual({ unknown_property: 1 });
  });
});
