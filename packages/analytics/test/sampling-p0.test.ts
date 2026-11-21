/**
 * Risk 11 (case C13 in docs/qa/test-plan-b13/04-analytics-and-insights.md): TRACKING_PLAN 5.3 lists events that are
 * never sampled, but `client.ts` applies any remote-config rate to any event. `it.fails` while the gap exists:
 * when the client refuses a rate for these events the cases go red, which is the cue to drop `.fails`.
 */
import { describe, expect, it } from 'vitest';
import { createAnalytics, EVENTS, recordingProvider, type EventName } from '../src';

/** TP 5.3 "Never sampled", by catalogue area (consent, capture, languages, family, reminders, plus, settings, children, errors). */
const NEVER = ['consent', 'capture', 'languages', 'family', 'reminders', 'plus', 'settings', 'children', 'errors'];
const area = (n: string) => (EVENTS as Record<string, { area: string }>)[n].area;
const all = Object.keys(EVENTS) as EventName[];

async function trackWithRate(name: EventName, rate: number) {
  const a = createAnalytics({ provider: recordingProvider(), randomId: () => '00000000-0000-4000-8000-0000000000aa', flushIntervalMs: 0, sampleRates: { [name]: rate } });
  await a.init();
  await a.grant();
  const props: Record<string, string | number | boolean> = {};
  for (const [k, p] of Object.entries(EVENTS[name].props) as [string, { type: string; values?: string[]; min?: number; optional?: boolean }][]) {
    if (!p.optional) props[k] = p.type === 'enum' ? p.values![0] : p.type === 'bool' ? true : p.min!;
  }
  return a.track(name, props as never);
}

describe('never-sampled events ignore a sample rate (TP 5.3)', () => {
  it('[TP-5.3-ctl] control: a sampled-list event at rate 0 is dropped, and the same event at rate 1 is queued', async () => {
    for (const n of ['screen_view', 'app_backgrounded', 'letter_opened', 'playback_started'] as const) {
      expect(await trackWithRate(n, 0), n).toBe('dropped_sampled');
      expect(await trackWithRate(n, 1), n).toBe('queued');
    }
  });

  it('[TP-5.3-ctl] control: every never-sampled area has events, and letter_saved and analytics_opted_in are in them', () => {
    for (const a of NEVER) expect(all.filter((n) => area(n) === a).length, a).toBeGreaterThan(0);
    expect(['letter_saved', 'analytics_opted_in'].every((n) => NEVER.includes(area(n)))).toBe(true);
  });

  for (const a of NEVER) {
    // TP-5.3-g: the client should refuse a rate below 1 for these; today it applies it.
    it.fails(`[TP-5.3-g] P0 events in area ${a} are queued even when remote config sets their rate to 0`, async () => {
      for (const n of all.filter((x) => area(x) === a)) expect(await trackWithRate(n, 0), n).toBe('queued');
    });
  }
});
