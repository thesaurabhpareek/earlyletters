/**
 * NS-53 section 18 and R251: the only Moments events are the card impression
 * and the card tap, each carrying one closed property, `slot`. Fixtures: the
 * fictional family Asha only.
 */
import { describe, expect, it } from 'vitest';
import { createAnalytics, createTrackers, EVENTS, memoryStorage, recordingProvider, sanitizeEvent, sanitizeWith, SCHEMA_VERSION, type Violation } from '../src';
import { intentRecorder } from './support';

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

  it('[NS-53-R251-c] only the slot enum is accepted: other slots, extra properties and free text are refused', async () => {
    for (const n of MOMENTS) {
      for (const slot of ['today', 'pictures', 'birthday', 'Asha', 'She laughed at the dog today', '2025-03-14', '', 'look_back ']) {
        expect(sanitizeWith(EVENTS, n, { slot, schema_version: SCHEMA_VERSION }).props, `${n} slot ${slot}`).toBeNull();
      }
      for (const extra of ['title', 'text', 'child_name', 'letter_id', 'date', 'count', 'place', 'source', 'permission', 'device_tier', 'ms_bucket']) {
        const r = sanitizeWith(EVENTS, n, { slot: 'question', schema_version: SCHEMA_VERSION, [extra]: 'asha' });
        expect(r.violations.some((v) => v.kind === 'unknown_property' && v.event === n), `${n}.${extra}`).toBe(true);
        expect(r.props, `${n}.${extra}`).toEqual({ slot: 'question', schema_version: SCHEMA_VERSION });
      }
      expect(sanitizeWith(EVENTS, n, { schema_version: SCHEMA_VERSION }).props, 'slot is required').toBeNull();
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

  it('[NS-53-R251-e] the two events are held off the send path: the registry does not list them, so even with consent nothing is queued or sent', async () => {
    const { analytics, provider } = await setup(true);
    const t = createTrackers(analytics);
    for (const n of MOMENTS) expect(sanitizeEvent(n, { slot: 'question', schema_version: SCHEMA_VERSION }).props, n).toBeNull();
    expect(t.trackMomentsCard({ action: 'impressed', slot: 'look_back' })).toBe('dropped_invalid');
    expect(t.trackMomentsCard({ action: 'tapped', slot: 'question' })).toBe('dropped_invalid');
    expect(analytics.queueLength()).toBe(0);
    await analytics.flush();
    expect(provider.captured()).toHaveLength(0);
  });

  it('[NS-53-R251-f] the helper sends one event per call with the slot and nothing else of its own (checked against the catalogue shape)', async () => {
    const { analytics } = await setup(true);
    const { analytics: rec, intents } = intentRecorder(analytics);
    const t = createTrackers(rec);
    expect(t.trackMomentsCard({ action: 'impressed', slot: 'look_back' })).toBe('queued');
    expect(t.trackMomentsCard({ action: 'tapped', slot: 'question' })).toBe('queued');
    expect(intents).toEqual([
      ['moments_card_impressed', { slot: 'look_back' }],
      ['moments_card_tapped', { slot: 'question' }],
    ]);
  });

  it('[NS-53-R251-g] the helper refuses a slot outside the closed set at run time', async () => {
    const { analytics } = await setup(true);
    const { analytics: rec, intents } = intentRecorder(analytics);
    const t = createTrackers(rec);
    for (const slot of ['birthday', 'Asha', 'pictures']) t.trackMomentsCard({ action: 'tapped', slot } as never);
    t.trackMomentsCard({ action: 'asked', slot: 'question' } as never);
    expect(intents.map(([, p]) => p.slot)).toEqual(['question']);
  });
});
