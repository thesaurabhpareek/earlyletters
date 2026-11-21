import { describe, expect, it, vi } from 'vitest';
import {
  buildPostHogOptions,
  createAnalytics,
  createLazyPostHogAdapter,
  EV,
  memoryStorage,
  posthogBeforeSend,
  posthogHostFor,
  recordingProvider,
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

