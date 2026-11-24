import { describe, expect, it } from 'vitest';
import { createAnalytics, EVENTS, memoryStorage, recordingProvider, type EventName } from '../src';

// TRACKING_PLAN 5.3 (Decision), "Never sampled": analytics_opted_in,
// letter_saved, capture and transcription events, family, languages,
// reminders, Plus, settings, children, errors. Areas below are the catalog
// `area` values that list names. FR-DAT-36 is cited as the assignment's id;
// its own row in data-and-measurement.md is about the allowlist, not sampling.
const NEVER_SAMPLED_AREAS = ['capture', 'family', 'languages', 'reminders', 'plus', 'settings', 'children', 'errors'];
const P0 = (Object.keys(EVENTS) as EventName[]).filter(
  (n) => n === 'system:analytics_consent_accept' || n === 'capture:letter_save' || NEVER_SAMPLED_AREAS.includes(EVENTS[n].area),
);

let n = 0;
const ids = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;

async function granted(sampleRates: Partial<Record<EventName, number>>) {
  const analytics = createAnalytics({
    provider: recordingProvider(),
    storage: memoryStorage(),
    randomId: ids,
    flushIntervalMs: 0,
    sampleRates,
  });
  await analytics.init();
  await analytics.grant();
  return analytics;
}

describe('never-sampled events (TRACKING_PLAN 5.3, FR-DAT-36)', () => {
  it('the P0 list is non-empty and includes the two named events', () => {
    expect(P0).toContain('capture:letter_save');
    expect(P0).toContain('system:analytics_consent_accept');
    expect(P0.length).toBeGreaterThan(30);
  });

  for (const rate of [0, 0.5]) {
    for (const name of P0) {
      // Red today: track() samples every event. Remove `.fails` in the fixing PR.
      it.fails(`[5.3] ${name} is not dropped_sampled at rate ${rate}`, async () => {
        // Sampling is per analytics id, so one id at 0.5 may be kept by luck:
        // try 12 ids and require every one to be sent.
        for (let i = 0; i < 12; i++) {
          const a = await granted({ [name]: rate });
          // Props are empty on purpose: sampling runs before validation, so
          // the result may be dropped_invalid once fixed, never dropped_sampled.
          const r = a.track(name, {} as never);
          expect(r).toBeTypeOf('string'); // a throw cannot satisfy this
          expect(r).not.toBe('dropped_sampled');
        }
      });
    }
  }

  it('control: a non-P0 event at rate 0 is dropped_sampled', async () => {
    const a = await granted({ screen_view: 0 });
    expect(P0).not.toContain('screen_view');
    expect(a.track('screen_view', { route: 'book' })).toBe('dropped_sampled');
  });
});
