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

  /*
   * Held until wiring. #1533 typed the two names in catalog.ts; #1259 then made the send path read only registry.ts
   * (validate.ts: "registry-driven sending is the only path", founder note of 20 Nov), and CDO-25 item 4 says the
   * registry.ts and ids.ts rows land with the wiring PR. So today a Moments name is unknown to sanitizeEvent and a
   * send is dropped as dropped_invalid with nothing captured. #1533 and #1695 merged while #1259 was open, which is
   * why -c, -e and -f once asserted the pre-registry behaviour.
   */
  it('[NS-53-R251-c] held until wiring: the Moments names are not in the registry, so any payload, slot or extra property is refused whole', () => {
    for (const n of MOMENTS) {
      expect(n in REGISTRY, `${n} in registry`).toBe(false);
      for (const props of [{ slot: 'question', schema_version: 11 }, { slot: 'look_back', schema_version: 11 }, { slot: 'Asha', schema_version: 11 }, { slot: 'question', schema_version: 11, title: 'asha' }, { schema_version: 11 }]) {
        const r = sanitizeEvent(n, props);
        expect(r.props, `${n} ${JSON.stringify(props)}`).toBeNull();
      }
    }
  });

  it('[NS-53-R251-g] guard: fails the moment the registry gains a Moments row; the wiring PR must then restore the accept and refuse assertions', () => {
    const present = MOMENTS.filter((n) => n in REGISTRY);
    expect(
      present,
      'Moments rows are in registry.ts. The wiring PR (CDO-25 item 4) must flip [NS-53-R251-c], -e and -f back to: slot enum only, extra property reported unknown_property, trackMomentsCard returns queued, bad slot dropped.',
    ).toEqual([]);
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

  it('[NS-53-R251-e] held until wiring: with consent the helper drops both calls as dropped_invalid and nothing is queued or captured', async () => {
    const { analytics, provider } = await setup(true);
    const t = createTrackers(analytics);
    expect(t.trackMomentsCard({ action: 'impressed', slot: 'look_back' })).toBe('dropped_invalid');
    expect(t.trackMomentsCard({ action: 'tapped', slot: 'question' })).toBe('dropped_invalid');
    expect(analytics.queueLength()).toBe(0);
    await analytics.flush();
    expect(provider.captured()).toHaveLength(0);
  });

  it('[NS-53-R251-f] held until wiring: a slot outside the closed set, or an unknown action, is dropped as well and nothing is captured', async () => {
    const { analytics, provider } = await setup(true);
    const t = createTrackers(analytics);
    for (const slot of ['birthday', 'Asha', 'pictures', 'question']) t.trackMomentsCard({ action: 'tapped', slot } as never);
    t.trackMomentsCard({ action: 'asked', slot: 'question' } as never);
    await analytics.flush();
    expect(provider.captured()).toEqual([]);
  });
});
