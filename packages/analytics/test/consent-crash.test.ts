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
      const basics = createBasics(analytics);
      expect(analytics.consent()).toBe('unknown');
      expect(analytics.track(EV.screenView, { route: 'book' })).toBe('dropped_no_consent');
      expect(basics.tap('tonight_speak', 'tonight')).toBe('dropped_no_consent');
      expect(basics.perf('save_commit', 400)).toBe('dropped_no_consent');
      createTrackers(analytics).trackColdStart({ ttfiMs: 900 });
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

describe('crash capture: built, off, and one flip from on', () => {
  it('is off, and the SDK gets exception autocapture off', () => {
    expect(CRASH_REPORTING.enabled).toBe(false);
    expect(buildPostHogOptions({ host: 'h', distinctId: ID }).errorTracking).toEqual({ autocapture: false, exceptionSteps: { enabled: false } });
  });

  it('on, it asks for uncaught exceptions and unhandled rejections only: no console, no native crashes', () => {
    expect(errorTrackingOptions(true)).toEqual({
      autocapture: { uncaughtExceptions: true, unhandledRejections: true, console: [], nativeCrashes: false },
      exceptionSteps: { enabled: false },
    });
    expect(buildPostHogOptions({ host: 'h', distinctId: ID, crashEnabled: true }).errorTracking).toEqual(errorTrackingOptions(true));
  });

  const exceptionEvent = (err: Error) => ({
    event: '$exception',
    uuid: '0190a000-0000-7000-8000-000000000000',
    $set: { name: 'Asha' },
    properties: {
      distinct_id: ID,
      $app_version: '1.0.0',
      $app_build: '12',
      $os_name: 'iOS',
      $os_version: '26.0',
      $device_type: 'Mobile',
      $device_name: "Asha's iPhone",
      $locale: 'en-US',
      $exception_level: 'error',
      $exception_message: err.message,
      $exception_values: [err.message],
      $exception_steps: [{ message: err.message }],
      // Properties a caller attached to captureException():
      child_name: 'Asha',
      note: 'first steps on 2025-03-04',
      $exception_list: [
        {
          type: err.name,
          value: err.message,
          mechanism: { handled: false, type: 'onerror', synthetic: false },
          stacktrace: {
            type: 'raw',
            frames: (err.stack ?? '')
              .split('\n')
              .slice(1, 4)
              .map((l, i) => ({ platform: 'hermes', filename: '/var/containers/Bundle/Application/7B1F2C3D-0000-4000-8000-00000000AAAA/app.bundle', abs_path: `/Users/asha.parent/dev/${l.trim()}`, function: `saveLetter${i}`, lineno: 10 + i, colno: 3, in_app: true, context_line: err.message, vars: { name: 'Asha' } })),
          },
        },
      ],
    },
  });

  it('a thrown Error holding a date and a name leaves the client with neither', () => {
    let err: Error;
    try {
      throw new Error('Could not save the letter Asha wrote on 2025-03-04 (born 04/03/2025)');
    } catch (e) {
      err = e as Error;
    }
    err.name = 'AshaError';
    const out = posthogBeforeSend(undefined, { crashEnabled: true })(exceptionEvent(err))!;
    expect(out).not.toBeNull();
    const wire = JSON.stringify(out);
    for (const leak of ['Asha', '2025-03-04', '04/03/2025', 'asha.parent', 'Could not save', 'first steps', 'child_name', '7B1F2C3D', '$set', 'context_line', 'abs_path']) {
      expect(wire, leak).not.toContain(leak);
    }
    const props = out.properties as Record<string, unknown>;
    expect(Object.keys(props).sort()).toEqual(['$app_build', '$app_version', '$device_type', '$exception_level', '$exception_list', '$os_name', '$os_version', 'distinct_id']);
    const list = props.$exception_list as { type: string; value?: string; stacktrace: { frames: Record<string, unknown>[] } }[];
    expect(list[0].type).toBe('Error'); // an unknown class name is reported as the plain class
    expect(list[0]).not.toHaveProperty('value');
    expect(list[0].stacktrace.frames.length).toBeGreaterThan(0);
    for (const f of list[0].stacktrace.frames) {
      expect(Object.keys(f).sort()).toEqual(['colno', 'filename', 'function', 'in_app', 'lineno', 'platform']);
      expect(f.filename).toBe('app.bundle');
    }
  });

  it('keeps a built-in class name and drops the event when crash capture is off', () => {
    const e = new TypeError('x');
    const on = posthogBeforeSend(undefined, { crashEnabled: true })(exceptionEvent(e))!;
    expect(((on.properties as Record<string, unknown>).$exception_list as { type: string }[])[0].type).toBe('TypeError');
    expect(posthogBeforeSend()(exceptionEvent(e))).toBeNull();
    expect(posthogBeforeSend(undefined, { crashEnabled: false })(exceptionEvent(e))).toBeNull();
  });
});
