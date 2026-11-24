/**
 * NS-53 section 18 and R251: the only Moments events are the card impression
 * and the card tap, each carrying one closed property, `slot`. Fixtures: the
 * fictional family Asha only.
 */
import { describe, expect, it } from 'vitest';
import { REGISTRY, createAnalytics, createTrackers, EVENTS, memoryStorage, recordingProvider, sanitizeEvent, type Violation } from '../src';

const MOMENTS = ['moments_card_impressed', 'moments_card_tapped'] as const;

async function setup(grant: boolean) {
  const provider = recordingProvider();
  const violations: Violation[] = [];
  let n = 0;
  const analytics = createAnalytics({ provider, storage: memoryStorage(), randomId: () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`, onViolation: (v) => violations.push(v), flushIntervalMs: 0 });
  await analytics.init();
  if (grant) await analytics.grant();
  return { analytics, provider, violations };
}

describe('Moments events (NS-53-R251, NS-53-R167)', () => {
  it('[NS-53-R251-a] exactly two Moments events exist, each with the single closed property slot = look_back | question', () => {
    const named = Object.keys(EVENTS).filter((n) => /moments?_/.test(n) && n !== 'moment_shown');
    expect(named.sort()).toEqual([...MOMENTS].sort());
    for (const n of MOMENTS) {
      expect(Object.keys(EVENTS[n].props)).toEqual(['slot']);
      expect(EVENTS[n].props.slot).toMatchObject({ type: 'enum', values: ['look_back', 'question'] });
      expect(EVENTS[n].level).toBe('L2');
    }
  });

  it('[CODE-R13] the catalogue and the registry hold one definition of each Moments event: slot, area, when, level and reqs cannot differ', () => {
    for (const n of MOMENTS) {
      const c = EVENTS[n];
      const r = REGISTRY[n];
      expect({ area: c.area, when: c.when, level: c.level, reqs: c.reqs, props: c.props }, n).toEqual({ area: r.area, when: r.when, level: r.level, reqs: r.reqs, props: r.props });
    }
  });

  it('[NS-53-R251-b] any other Moments event name is rejected and nothing is sent', async () => {
    const { analytics, provider, violations } = await setup(true);
    for (const n of ['moments_home_viewed', 'moments_ask_impressed', 'moments_first_paint', 'screen.moments_home.viewed', 'ui.moments_card.impressed', 'moments_permission_result', 'moments_card_dismissed']) {
      expect(sanitizeEvent(n, { slot: 'question' }).props, n).toBeNull();
      analytics.track(n as never, { slot: 'question' } as never);
    }
    await analytics.flush();
    expect(provider.captured()).toHaveLength(0);
    expect(violations.length).toBeGreaterThan(0);
  });

  it('[NS-53-R251-c] only the slot enum is accepted: other slots, extra properties and free text are refused', async () => {
    for (const n of MOMENTS) {
      for (const slot of ['today', 'pictures', 'birthday', 'Asha', 'She laughed at the dog today', '2025-03-14', '', 'look_back ']) {
        expect(sanitizeEvent(n, { slot, schema_version: 11 }).props, `${n} slot ${slot}`).toBeNull();
      }
      for (const extra of ['title', 'text', 'child_name', 'letter_id', 'date', 'count', 'place', 'source', 'permission', 'device_tier', 'ms_bucket']) {
        const r = sanitizeEvent(n, { slot: 'question', schema_version: 11, [extra]: 'asha' });
        expect(r.violations.some((v) => v.kind === 'unknown_property' && v.event === n), `${n}.${extra}`).toBe(true);
        expect(r.props, `${n}.${extra}`).toEqual({ slot: 'question', schema_version: 11 });
      }
      expect(sanitizeEvent(n, { schema_version: 11 }).props, 'slot is required').toBeNull();
    }
  });

  it('[NS-53-R251-d] stays opt-in: with analytics off or undecided nothing is sent or queued', async () => {
    for (const decline of [false, true]) {
      const { analytics, provider } = await setup(false);
      if (decline) {
        await analytics.grant();
        await analytics.revoke();
      }
      const t = createTrackers(analytics);
      expect(t.trackMomentsCard({ action: 'impressed', slot: 'look_back' })).toBe('dropped_no_consent');
      expect(t.trackMomentsCard({ action: 'tapped', slot: 'question' })).toBe('dropped_no_consent');
      expect(analytics.queueLength()).toBe(0);
      await analytics.flush();
      expect(provider.captured()).toHaveLength(0);
    }
  });

  it('[NS-53-R251-e] with consent the helper sends one event per call with the slot and nothing else of its own', async () => {
    const { analytics, provider } = await setup(true);
    const t = createTrackers(analytics);
    expect(t.trackMomentsCard({ action: 'impressed', slot: 'look_back' })).toBe('queued');
    expect(t.trackMomentsCard({ action: 'tapped', slot: 'question' })).toBe('queued');
    await analytics.flush();
    const got = provider.captured();
    expect(got.map((e) => e.event)).toEqual(['moments_card_impressed', 'moments_card_tapped']);
    expect(got.map((e) => e.properties.slot)).toEqual(['look_back', 'question']);
    for (const e of got) expect(Object.keys(e.properties).filter((k) => !['schema_version', 'child_count_bucket', 'sample_pct'].includes(k))).toEqual(['slot']);
  });

  it('[NS-53-R251-f] the helper refuses a slot outside the closed set at run time', async () => {
    const { analytics, provider } = await setup(true);
    const t = createTrackers(analytics);
    for (const slot of ['birthday', 'Asha', 'pictures']) t.trackMomentsCard({ action: 'tapped', slot } as never);
    t.trackMomentsCard({ action: 'asked', slot: 'question' } as never);
    await analytics.flush();
    expect(provider.captured().map((e) => e.properties.slot)).toEqual(['question']);
  });
});
