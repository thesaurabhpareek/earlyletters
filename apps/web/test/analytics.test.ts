/**
 * Website analytics: what may be sent, the on/off switch, the scene throttle and URL scrubbing.
 * Owner: E3 (release). Covers src/lib/analytics/*.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createTracker,
  SCENE_THROTTLE_MS,
  type AnalyticsEvent,
  type TrackerDeps,
} from '../src/lib/analytics';
import { CTA_MODES, CTA_PLACEMENTS, NOTIFY_RESULTS, SCENE_IDS, toWireEvent } from '../src/lib/analytics/events';
import { scrubUrl } from '../src/lib/analytics/scrub';

function harness(enabled = true) {
  let clock = 1_000_000;
  const sent: Array<{ name: string; data: Record<string, string> }> = [];
  const timers: Array<{ at: number; run: () => void }> = [];
  const deps: TrackerDeps = {
    enabled,
    emit: (name, data) => sent.push({ name, data }),
    now: () => clock,
    setTimer: (run, ms) => {
      const timer = { at: clock + ms, run };
      timers.push(timer);
      return timer;
    },
  };
  return {
    track: createTracker(deps),
    sent,
    advance(ms: number) {
      clock += ms;
      for (const timer of timers.filter((t) => t.at <= clock)) {
        timers.splice(timers.indexOf(timer), 1);
        timer.run();
      }
    },
  };
}

describe('events', () => {
  it('maps every allowed event to its wire form with at most 2 properties', () => {
    const events: AnalyticsEvent[] = [
      ...CTA_MODES.flatMap((mode) => CTA_PLACEMENTS.map((placement) => ({ name: 'cta_click' as const, mode, placement }))),
      ...NOTIFY_RESULTS.map((result) => ({ name: 'notify_submit' as const, result })),
      ...SCENE_IDS.map((id) => ({ name: 'scene_reached' as const, id })),
    ];
    for (const event of events) {
      const wire = toWireEvent(event);
      expect(wire, JSON.stringify(event)).not.toBeNull();
      expect(Object.keys(wire!.data).length).toBeLessThanOrEqual(2); // Vercel Pro allows 2 properties per event
    }
    expect(toWireEvent({ name: 'cta_click', mode: 'live', placement: 'header' })).toEqual({
      name: 'cta_click',
      data: { mode: 'live', placement: 'header' },
    });
  });

  it('drops anything that is not on the lists, so free text can never be sent', () => {
    const bad = [
      { name: 'notify_submit', result: 'someone@example.com' },
      { name: 'notify_submit', result: undefined },
      { name: 'cta_click', mode: 'live', placement: 'Meera' },
      { name: 'cta_click', mode: 'beta', placement: 'header' },
      { name: 'scene_reached', id: 'https://earlyletters.com/?email=a@b.c' },
      { name: 'scene_reached', id: 42 },
      { name: 'signup', email: 'someone@example.com' },
      null,
      undefined,
    ];
    for (const event of bad) expect(toWireEvent(event as unknown as AnalyticsEvent), JSON.stringify(event)).toBeNull();
  });
});

describe('createTracker', () => {
  it('does nothing when analytics is off', () => {
    const { track, sent } = harness(false);
    track({ name: 'cta_click', mode: 'prelaunch', placement: 'header' });
    track({ name: 'scene_reached', id: 'evening' });
    expect(sent).toEqual([]);
  });

  it('sends cta_click and notify_submit straight away, every time', () => {
    const { track, sent } = harness();
    track({ name: 'cta_click', mode: 'prelaunch', placement: 'pill' });
    track({ name: 'cta_click', mode: 'prelaunch', placement: 'pill' });
    track({ name: 'notify_submit', result: 'ok' });
    expect(sent.map((e) => e.name)).toEqual(['cta_click', 'cta_click', 'notify_submit']);
  });

  it('never throws, even for nonsense', () => {
    const { track } = harness();
    expect(() => track(undefined as unknown as AnalyticsEvent)).not.toThrow();
    expect(() => track({ name: 'scene_reached', id: {} } as unknown as AnalyticsEvent)).not.toThrow();
  });

  it('reports a scene once per page load', () => {
    const { track, sent, advance } = harness();
    track({ name: 'scene_reached', id: 'evening' });
    advance(SCENE_THROTTLE_MS * 5);
    track({ name: 'scene_reached', id: 'evening' });
    advance(SCENE_THROTTLE_MS * 5);
    expect(sent).toEqual([{ name: 'scene_reached', data: { id: 'evening' } }]);
  });

  it('sends the first scene at once and the latest one when the window closes', () => {
    const { track, sent, advance } = harness();
    track({ name: 'scene_reached', id: 'evening' });
    advance(100);
    track({ name: 'scene_reached', id: 'a-minute' });
    advance(100);
    track({ name: 'scene_reached', id: 'just-talk' });
    advance(100);
    track({ name: 'scene_reached', id: 'exactly' });
    expect(sent.map((e) => e.data.id)).toEqual(['evening']);
    advance(SCENE_THROTTLE_MS);
    expect(sent.map((e) => e.data.id)).toEqual(['evening', 'exactly']);
  });

  it('allows one scene per window after a quiet spell', () => {
    const { track, sent, advance } = harness();
    track({ name: 'scene_reached', id: 'evening' });
    advance(SCENE_THROTTLE_MS);
    track({ name: 'scene_reached', id: 'a-minute' });
    advance(SCENE_THROTTLE_MS);
    track({ name: 'scene_reached', id: 'just-talk' });
    expect(sent.map((e) => e.data.id)).toEqual(['evening', 'a-minute', 'just-talk']);
  });

  it('does not let throttled scenes delay other events', () => {
    const { track, sent } = harness();
    track({ name: 'scene_reached', id: 'evening' });
    track({ name: 'scene_reached', id: 'a-minute' });
    track({ name: 'cta_click', mode: 'prelaunch', placement: 'start' });
    expect(sent.map((e) => e.name)).toEqual(['scene_reached', 'cta_click']);
  });

  it('can report a scene that was skipped by the throttle when the visitor comes back to it', () => {
    const { track, sent, advance } = harness();
    track({ name: 'scene_reached', id: 'evening' });
    track({ name: 'scene_reached', id: 'a-minute' }); // pending
    track({ name: 'scene_reached', id: 'just-talk' }); // replaces a-minute
    advance(SCENE_THROTTLE_MS);
    advance(SCENE_THROTTLE_MS);
    track({ name: 'scene_reached', id: 'a-minute' });
    expect(sent.map((e) => e.data.id)).toEqual(['evening', 'just-talk', 'a-minute']);
  });
});

describe('scrubUrl', () => {
  it('keeps the path and drops the fragment and unknown query parameters', () => {
    expect(scrubUrl('https://earlyletters.com/privacy?email=a@b.c&name=Meera#section-2')).toBe(
      'https://earlyletters.com/privacy',
    );
    expect(scrubUrl('https://earlyletters.com/?q=1')).toBe('https://earlyletters.com/');
  });

  it('keeps ref and utm parameters only when the value is a short plain token', () => {
    expect(scrubUrl('https://earlyletters.com/?ref=qr-hospital&utm_source=news_letter&utm_medium=email&utm_campaign=oct26')).toBe(
      'https://earlyletters.com/?ref=qr-hospital&utm_source=news_letter&utm_medium=email&utm_campaign=oct26',
    );
    expect(scrubUrl('https://earlyletters.com/?ref=someone%40example.com')).toBe('https://earlyletters.com/');
    expect(scrubUrl(`https://earlyletters.com/?ref=${'a'.repeat(31)}`)).toBe('https://earlyletters.com/');
    expect(scrubUrl('https://earlyletters.com/?utm_term=x&utm_content=y')).toBe('https://earlyletters.com/');
  });

  it('copes with input that is not a URL', () => {
    expect(scrubUrl('/privacy?email=a@b.c#x')).toBe('/privacy');
    expect(scrubUrl('')).toBe('');
  });
});

describe('default tracker', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('is a no-op unless NEXT_PUBLIC_ANALYTICS=vercel (no queue is created, nothing is sent)', async () => {
    const win = { navigator: {} } as Record<string, unknown>;
    vi.stubGlobal('window', win);
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS', '');
    const mod = await import('../src/lib/analytics');
    expect(mod.analyticsEnabled).toBe(false);
    mod.track({ name: 'cta_click', mode: 'live', placement: 'header' });
    expect(win.va).toBeUndefined();
    expect(win.vaq).toBeUndefined();
  });

  it('queues events on window.va, with the URL scrubber registered first', async () => {
    const win = { navigator: {} } as Record<string, unknown>;
    vi.stubGlobal('window', win);
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS', 'vercel');
    const mod = await import('../src/lib/analytics');
    expect(mod.analyticsEnabled).toBe(true);
    mod.track({ name: 'notify_submit', result: 'rate_limited' });
    const queue = win.vaq as unknown[][];
    expect(queue[0]?.[0]).toBe('beforeSend');
    expect(typeof queue[0]?.[1]).toBe('function');
    expect(queue[1]).toEqual(['event', { name: 'notify_submit', data: { result: 'rate_limited' } }]);
  });

  it('stays silent when the browser sends Global Privacy Control or Do Not Track', async () => {
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS', 'vercel');
    for (const navigator of [{ globalPrivacyControl: true }, { doNotTrack: '1' }]) {
      const win = { navigator } as Record<string, unknown>;
      vi.stubGlobal('window', win);
      vi.resetModules();
      const mod = await import('../src/lib/analytics');
      expect(mod.privacySignalOn()).toBe(true);
      mod.track({ name: 'cta_click', mode: 'live', placement: 'footer' });
      expect(win.va).toBeUndefined();
    }
  });
});
