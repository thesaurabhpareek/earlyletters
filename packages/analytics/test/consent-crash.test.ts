import { describe, expect, it, vi } from 'vitest';
import {
  buildPostHogOptions,
  createAnalytics,
  createBasics,
  createLazyPostHogAdapter,
  createTrackers,
  CRASH_REPORTING,
  errorTrackingOptions,
  EV,
  memoryStorage,
  posthogBeforeSend,
  posthogHostFor,
  recordingProvider,
  tierOf,
  type AnalyticsOptions,
  type PostHogLike,
} from '../src';

const ID = '00000000-0000-4000-8000-0000000000aa';

function sdk() {
  const calls: string[] = [];
  const captured: { event: string; properties: Record<string, unknown> }[] = [];
  const ph: PostHogLike = {
    capture: (event, properties) => void (calls.push('capture'), captured.push({ event, properties: properties ?? {} })),
    identify: () => void calls.push('identify'),
    optIn: () => void calls.push('optIn'),
    optOut: () => void calls.push('optOut'),
    reset: () => void calls.push('reset'),
    flush: () => void calls.push('flush'),
    setPersistedProperty: (k, v) => void calls.push(`persist:${k}:${v}`),
  };
  return { ph, calls, captured };
}

function stack(storage = memoryStorage()) {
  const { ph, calls, captured } = sdk();
  const create = vi.fn(async () => ph);
  const provider = createLazyPostHogAdapter({ create });
  const analytics = createAnalytics({ provider, storage, randomId: () => ID, flushIntervalMs: 0 });
  return { analytics, create, calls, captured, storage };
}

describe('nothing leaves the device before the parent says yes', () => {
  it('constructs no SDK and makes no network call while consent is unknown', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network must not be used'));
    try {
      const { analytics, create, calls } = stack();
      await analytics.init();
      expect(analytics.consent()).toBe('unknown');
      expect(analytics.track(EV.screenView, { route: 'book' })).toBe('dropped_no_consent');
      await analytics.flush();
      expect(create).not.toHaveBeenCalled();
      expect(calls).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(analytics.queueLength()).toBe(0);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('a parent who declines sends nothing, and the SDK is never built', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network must not be used'));
    try {
      const { analytics, create, captured } = stack();
      await analytics.init();
      await analytics.revoke(); // "Don't share"
      expect(analytics.consent()).toBe('denied');
      expect(analytics.track(EV.letterSaved, {} as never)).toBe('dropped_no_consent');
      await analytics.flush();
      expect(create).not.toHaveBeenCalled();
      expect(captured).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('after a yes the SDK is built once with the random id, and events reach it', async () => {
    const { analytics, create, captured } = stack();
    await analytics.init();
    await analytics.grant();
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(ID);
    expect(analytics.track(EV.screenView, { route: 'book' })).toBe('queued');
    await analytics.flush();
    expect(captured.map((c) => c.event)).toEqual(['screen_view']);
  });

  it('withdrawal stops sending at once, empties the queue, resets the SDK and clears the active id', async () => {
    const { analytics, calls, captured } = stack();
    await analytics.init();
    await analytics.grant();
    analytics.track(EV.screenView, { route: 'book' });
    await analytics.revoke();
    expect(calls.slice(-4)).toEqual(['optOut', 'persist:queue:null', 'reset', 'persist:queue:null']);
    expect(analytics.queueLength()).toBe(0);
    expect(analytics.track(EV.screenView, { route: 'family' })).toBe('dropped_no_consent');
    await analytics.flush();
    expect(captured).toEqual([]);
    // The id is retired (kept only so account deletion can ask for it); no id is active and a later yes starts a new one.
    expect(analytics.consent()).toBe('denied');
  });

  it('never identifies with anything but the random id, and sends no person properties', async () => {
    const rec = recordingProvider();
    const analytics = createAnalytics({ provider: rec, randomId: () => ID, flushIntervalMs: 0 });
    await analytics.init();
    await analytics.grant();
    for (const c of rec.calls.filter((x) => x.method === 'identify')) expect(c.args).toEqual([ID]);
  });
});

// BL-2122 (P7 of the adapter split): the basics helpers and the call-site trackers go through the same gate. These
// tests were split out of the consent describe above when P4 landed without `createBasics`.
describe('basics helpers and trackers send nothing before the parent says yes (BL-2122)', () => {
  function everyHelper(analytics: Parameters<typeof createBasics>[0]) {
    const basics = createBasics(analytics);
    return [
      basics.tap('tonight_speak', 'tonight'),
      basics.impress('tonight_prompt', 'tonight', 1),
      basics.perf('save_commit', 400),
      basics.startPerf('cold_start')(),
      createTrackers(analytics).trackInviteAccepted({ role: 'parent' }),
    ];
  }

  for (const answer of ['unknown', 'declined'] as const) {
    it(`consent ${answer}: zero sends, no SDK, no network, nothing queued`, async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network must not be used'));
      try {
        const { analytics, create, calls, captured, storage } = stack();
        await analytics.init();
        if (answer === 'declined') await analytics.revoke();
        expect(everyHelper(analytics)).toEqual(Array(5).fill('dropped_no_consent'));
        await analytics.flush();
        expect(create).not.toHaveBeenCalled();
        expect(calls).toEqual([]);
        expect(captured).toEqual([]);
        expect(fetchSpy).not.toHaveBeenCalled();
        expect(analytics.queueLength()).toBe(0);
        expect(storage.dump()['scribe.analytics.id']).toBeUndefined();
      } finally {
        fetchSpy.mockRestore();
      }
    });
  }

  it('obeys basicsPolicy: these consented-tier events never pass collect_by_default without a yes, and off wins', async () => {
    const policies: AnalyticsOptions['basicsPolicy'][] = [undefined, 'ask_first', 'collect_by_default'];
    for (const basicsPolicy of policies) {
      const provider = recordingProvider();
      // tierOf is the registry's, as the app passes it, so a registry tier change shows here (review of #2074).
      const analytics = createAnalytics({ provider, basicsPolicy, tierOf, randomId: () => ID, flushIntervalMs: 0 });
      await analytics.init();
      const before = basicsPolicy === 'collect_by_default' ? 'dropped_disclosure_pending' : 'dropped_no_consent';
      expect(createBasics(analytics).tap('review_keep', 'tonight'), String(basicsPolicy)).toBe(before);
      await analytics.recordDisclosureShown();
      const shown = basicsPolicy === 'collect_by_default' ? 'dropped_not_basics' : 'dropped_no_consent';
      expect(createBasics(analytics).perf('speak_to_mic', 50), String(basicsPolicy)).toBe(shown);
      await analytics.grant();
      expect(createBasics(analytics).tap('review_keep', 'tonight')).toBe('queued');
      await analytics.flush();
      await analytics.revoke();
      const off = basicsPolicy === 'collect_by_default' ? 'dropped_user_off' : 'dropped_no_consent';
      expect(createBasics(analytics).impress('keep_sheet', 'tonight'), String(basicsPolicy)).toBe(off);
      await analytics.flush();
      expect(provider.captured().map((c) => c.event), String(basicsPolicy)).toEqual(['control_tapped']);
    }
  });

  it('a planted id or property never reaches the SDK: no entry text, transcript, audio or child name', async () => {
    const provider = recordingProvider();
    const analytics = createAnalytics({ provider, randomId: () => ID, flushIntervalMs: 0 });
    await analytics.init();
    await analytics.grant();
    const plant = 'Asha said her first word today';
    // A forced id that is not in the closed list is dropped whole by the validator.
    expect(createBasics(analytics).tap(plant as never, 'tonight')).toBe('dropped_invalid');
    expect(createBasics(analytics).impress('Asha' as never, 'tonight')).toBe('dropped_invalid');
    // A caller that adds a property behind the helper's back. A key the registry does not list never leaves; a value
    // that looks like a path or an address drops the whole event.
    const plantWith = (extra: Record<string, unknown>): Parameters<typeof createBasics>[0] => ({
      track: ((name: never, props: Record<string, unknown>) => analytics.track(name, { ...props, ...extra } as never)) as never,
    });
    expect(createBasics(plantWith({ audio_uri: 'file:///asha.m4a' })).tap('tonight_write', 'tonight')).toBe('dropped_invalid');
    expect(createBasics(plantWith({ child_name: 'Asha', transcript: plant })).tap('tonight_write', 'tonight')).toBe('queued');
    await analytics.flush();
    const sent = provider.captured();
    expect(sent.map((c) => c.event)).toEqual(['control_tapped']);
    expect(Object.keys(sent[0]!.properties).sort()).toEqual(['control', 'route', 'schema_version']);
    expect(JSON.stringify(sent)).not.toMatch(/Asha|first word|m4a/);
  });
});

describe('PostHog options', () => {
  it('pins the founder options in the object the app passes', () => {
    const o = buildPostHogOptions({ host: 'https://us.i.posthog.com', distinctId: ID });
    expect(o).toMatchObject({
      defaultOptIn: false,
      persistence: 'file',
      captureAppLifecycleEvents: false,
      sendFeatureFlagEvent: false,
      preloadFeatureFlags: false,
      disableRemoteFeatureFlags: true,
      disableGeoip: true,
      enableSessionReplay: false,
      personProfiles: 'identified_only',
      setDefaultPersonProperties: false,
    });
    expect(typeof o.before_send).toBe('function');
    expect(o).not.toHaveProperty('autocapture');
  });

  it('host: US by default, EU only when asked, never an arbitrary URL', () => {
    expect(posthogHostFor(undefined)).toBe('https://us.i.posthog.com');
    expect(posthogHostFor('us')).toBe('https://us.i.posthog.com');
    expect(posthogHostFor(' EU ')).toBe('https://eu.i.posthog.com');
    expect(posthogHostFor('https://evil.example')).toBe('https://us.i.posthog.com');
  });
});

/**
 * A fake SDK that behaves like the real one where it matters here: every capture, including one the SDK makes
 * on its own (`$exception`), goes through the `before_send` of the options the app really passes, and what
 * survives is the queue. Nothing is sent anywhere.
 */
function queueingSdk(crashEnabled?: boolean) {
  const options = buildPostHogOptions({ host: 'https://us.i.posthog.com', distinctId: ID, crashEnabled });
  const queue: { event: string; properties?: Record<string, unknown> }[] = [];
  const ph: PostHogLike = {
    capture: (event, properties) => {
      const kept = options.before_send({ event, properties });
      if (kept) queue.push(kept);
    },
    identify: () => undefined,
    optIn: () => undefined,
    optOut: () => undefined,
    reset: () => undefined,
    flush: () => undefined,
    setPersistedProperty: (_k, _v) => void (queue.length = 0),
  };
  return { ph, queue, options };
}

const exceptionProps = {
  distinct_id: ID,
  $app_version: '1.0.0',
  $os_name: 'iOS',
  $exception_message: 'Could not save the letter Asha wrote on 2025-03-04',
  $exception_list: [{ type: 'TypeError', value: 'Asha', stacktrace: { type: 'raw', frames: [{ filename: 'app.bundle', function: 'saveLetter', lineno: 1, colno: 2, in_app: true }] } }],
};

describe('no $exception is queued unless crash capture is on AND the parent said yes', () => {
  it('the flip is off in the shipped code', () => {
    expect(CRASH_REPORTING.enabled).toBe(false);
    expect(errorTrackingOptions()).toEqual({ autocapture: false, exceptionSteps: { enabled: false } });
  });

  it('with CRASH_REPORTING.enabled false (the default), before_send drops every $exception', () => {
    for (const crashEnabled of [undefined, false]) {
      const { ph, queue, options } = queueingSdk(crashEnabled);
      expect(options.errorTracking).toEqual({ autocapture: false, exceptionSteps: { enabled: false } });
      ph.capture('$exception', exceptionProps);
      ph.capture('$exception', { ...exceptionProps, $exception_level: 'fatal' });
      expect(queue, String(crashEnabled)).toEqual([]);
    }
  });

  it('the violation names no value', () => {
    const seen: unknown[] = [];
    const before = posthogBeforeSend((v) => void seen.push(v));
    expect(before({ event: '$exception', properties: exceptionProps })).toBeNull();
    expect(JSON.stringify(seen)).not.toContain('Asha');
    expect(seen).toHaveLength(1);
  });

  it('with no consent the SDK is never built, so nothing can be captured or queued, even with crash capture on', async () => {
    const made: ReturnType<typeof queueingSdk>[] = [];
    const create = vi.fn(async () => {
      const q = queueingSdk(true);
      made.push(q);
      return q.ph;
    });
    const analytics = createAnalytics({ provider: createLazyPostHogAdapter({ create }), storage: memoryStorage(), randomId: () => ID, flushIntervalMs: 0 });
    await analytics.init();
    expect(analytics.consent()).toBe('unknown');
    await analytics.flush();
    expect(create).not.toHaveBeenCalled();
    await analytics.revoke(); // a "no" is also no SDK
    expect(analytics.consent()).toBe('denied');
    expect(create).not.toHaveBeenCalled();
    expect(made).toEqual([]);
  });

  it('after a yes with crash capture off, an $exception the SDK makes on its own still reaches no queue', async () => {
    const made: ReturnType<typeof queueingSdk>[] = [];
    const create = vi.fn(async () => {
      const q = queueingSdk(false);
      made.push(q);
      return q.ph;
    });
    const analytics = createAnalytics({ provider: createLazyPostHogAdapter({ create }), storage: memoryStorage(), randomId: () => ID, flushIntervalMs: 0 });
    await analytics.init();
    await analytics.grant();
    expect(made).toHaveLength(1);
    made[0].ph.capture('$exception', exceptionProps);
    expect(made[0].queue).toEqual([]);
    expect(analytics.track(EV.screenView, { route: 'book' })).toBe('queued');
    await analytics.flush();
    expect(made[0].queue.map((e) => e.event)).toEqual(['screen_view']);
  });

  it('only when both are on does a reduced $exception queue, with no message and no caller text', async () => {
    const { ph, queue } = queueingSdk(true);
    ph.capture('$exception', exceptionProps);
    expect(queue.map((e) => e.event)).toEqual(['$exception']);
    const wire = JSON.stringify(queue);
    for (const leak of ['Asha', '2025-03-04', 'Could not save', '$exception_message']) expect(wire, leak).not.toContain(leak);
  });
});
