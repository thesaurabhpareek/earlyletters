import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildPostHogOptions,
  createAnalytics,
  createLazyPostHogAdapter,
  createPostHogAdapter,
  FORBIDDEN_POSTHOG_OPTIONS,
  keepAllowedAppProperties,
  memoryStorage,
  POSTHOG_SDK,
  posthogBeforeSend,
  REQUIRED_POSTHOG_OPTIONS,
  type PostHogLike,
} from '../src';

const ROOT = resolve(__dirname, '../../..');
const CANARIES = ['Asha', 'asha.parent@example.com', 'She laughed at the dog today'];

/** A stand-in for the SDK that records calls and keeps a queue like PostHog's. */
function fakeSdk() {
  const calls: { m: string; a: unknown[] }[] = [];
  let queue: unknown[] = [];
  const sdk: PostHogLike & { calls: typeof calls; queue: () => unknown[] } = {
    calls,
    queue: () => queue,
    capture: (...a) => {
      calls.push({ m: 'capture', a });
      queue.push(a);
    },
    identify: (...a) => void calls.push({ m: 'identify', a }),
    optIn: () => void calls.push({ m: 'optIn', a: [] }),
    optOut: () => void calls.push({ m: 'optOut', a: [] }),
    reset: () => void calls.push({ m: 'reset', a: [] }), // like PostHog: keeps the queue
    flush: () => {
      calls.push({ m: 'flush', a: [] });
      queue = [];
    },
    setPersistedProperty: (key, value) => {
      calls.push({ m: 'setPersistedProperty', a: [key, value] });
      if (key === 'queue' && value === null) queue = [];
    },
  };
  return sdk;
}

describe('PostHog options (verified against posthog-react-native 4.78.4)', () => {
  it('[LEGAL-REQ-003] [LEGAL-REQ-017] pins opt-in, replay, lifecycle, geoip, flags, surveys, errors and disk off', () => {
    expect(REQUIRED_POSTHOG_OPTIONS).toMatchObject({
      defaultOptIn: false,
      persistence: 'memory',
      enableSessionReplay: false,
      captureAppLifecycleEvents: false,
      disableGeoip: true,
      setDefaultPersonProperties: false,
      preloadFeatureFlags: false,
      disableRemoteFeatureFlags: true,
      sendFeatureFlagEvent: false,
      disableSurveys: true,
      errorTracking: { autocapture: false },
      capturePushNotificationSubscriptions: false,
      capturePushNotificationOpened: false,
      flushInterval: 0,
    });
  });

  it('builds the constructor options with the required ones last and the id bootstrapped', () => {
    const opts = buildPostHogOptions({ host: 'https://us.i.posthog.com', distinctId: '00000000-0000-4000-8000-000000000001' });
    expect(opts.host).toBe('https://us.i.posthog.com');
    expect(opts.bootstrap).toEqual({ distinctId: '00000000-0000-4000-8000-000000000001', isIdentifiedId: true });
    for (const [k, v] of Object.entries(REQUIRED_POSTHOG_OPTIONS)) expect((opts as Record<string, unknown>)[k], k).toEqual(v);
    for (const k of FORBIDDEN_POSTHOG_OPTIONS) expect(opts, k).not.toHaveProperty(k);
    expect(typeof opts.before_send).toBe('function');
  });

  it('keeps only allowlisted app and device fields at the source', () => {
    const kept = keepAllowedAppProperties({
      $app_version: '1.0.0',
      $app_build: '12',
      $os_name: 'iOS',
      $os_version: '26.0',
      $device_type: 'Mobile',
      ...({ $device_name: "Asha's Papa's iPhone", $locale: 'en-US', $timezone: 'America/Los_Angeles', $app_namespace: 'com.x' } as object),
    });
    expect(Object.keys(kept).sort()).toEqual(['$app_build', '$app_version', '$device_type', '$os_name', '$os_version']);
  });

  it('every required option name exists in the installed SDK types, at the verified version', () => {
    const pkg = resolve(ROOT, 'node_modules/posthog-react-native/package.json');
    if (!existsSync(pkg)) return; // SDK not installed in this checkout: nothing to compare
    const version = JSON.parse(readFileSync(pkg, 'utf8')).version;
    // A new SDK version must be re-verified (option names, before_send shape, queue behaviour).
    expect(version, 'update POSTHOG_SDK.verifiedVersion after re-verifying posthog.ts').toBe(POSTHOG_SDK.verifiedVersion);
    const types =
      readFileSync(resolve(ROOT, 'node_modules/posthog-react-native/dist/posthog-rn.d.ts'), 'utf8') +
      readFileSync(resolve(ROOT, 'node_modules/@posthog/core/dist/types.d.ts'), 'utf8');
    for (const k of [...Object.keys(REQUIRED_POSTHOG_OPTIONS), 'before_send', 'bootstrap', 'customAppProperties', 'host']) {
      expect(types, k).toMatch(new RegExp(`\\b${k}\\??:`));
    }
  });
});

describe('before_send with the real CaptureEvent shape', () => {
  it('removes top-level $set and $set_once, which PostHog would otherwise re-attach', () => {
    const out = posthogBeforeSend()({
      uuid: '0190a000-0000-7000-8000-000000000000',
      event: 'screen_view',
      timestamp: new Date(0),
      properties: { route: 'book', schema_version: 1, $set: { name: 'Asha' }, $os_name: 'iOS', $is_identified: true, $screen_width: 390 },
      $set: { email: 'asha.parent@example.com' },
      $set_once: { first: 'Asha' },
    })!;
    expect(out).not.toHaveProperty('$set');
    expect(out).not.toHaveProperty('$set_once');
    expect(out.uuid).toBe('0190a000-0000-7000-8000-000000000000');
    expect(out.timestamp).toEqual(new Date(0));
    expect(out.properties).toEqual({ route: 'book', schema_version: 1, $os_name: 'iOS' });
  });

  it('drops SDK events we never send ($set, $exception, $screen, lifecycle, flags)', () => {
    const bs = posthogBeforeSend();
    for (const event of ['$set', '$exception', '$screen', 'Application Opened', '$feature_flag_called', '$rageclick', '$autocapture']) {
      expect(bs({ event, properties: {} }), event).toBeNull();
    }
  });
});

describe('lazy adapter', () => {
  it('[LEGAL-REQ-003] constructs nothing before consent, and nothing on a denied init', async () => {
    let created = 0;
    const provider = createLazyPostHogAdapter({ create: () => (created++, fakeSdk()) });
    const analytics = createAnalytics({ provider, randomId: () => '00000000-0000-4000-8000-000000000009', flushIntervalMs: 0 });
    expect(await analytics.init()).toBe('unknown');
    analytics.track('screen_view', { route: 'book' });
    await analytics.flush();
    await analytics.revoke(); // a "No"
    expect(created).toBe(0);
    expect(provider.loaded()).toBe(false);
  });

  it('constructs once on grant with the random id, opts in, and sends', async () => {
    const sdk = fakeSdk();
    const ids: string[] = [];
    const provider = createLazyPostHogAdapter({ create: (id) => (ids.push(id), sdk) });
    const analytics = createAnalytics({ provider, randomId: () => '00000000-0000-4000-8000-00000000000a', flushIntervalMs: 0 });
    await analytics.init();
    await analytics.grant();
    expect(ids).toEqual(['00000000-0000-4000-8000-00000000000a']);
    expect(sdk.calls.map((c) => c.m)).toEqual(['optIn']); // id bootstrapped: no identify call
    analytics.track('screen_view', { route: 'tonight' });
    await analytics.flush();
    expect(sdk.calls.map((c) => c.m)).toEqual(['optIn', 'capture', 'flush']);
  });

  it('[PRD-REQ-018] withdrawal empties the SDK queue so nothing queued is sent later', async () => {
    const sdk = fakeSdk();
    const provider = createLazyPostHogAdapter({ create: () => sdk });
    const analytics = createAnalytics({ provider, randomId: () => '00000000-0000-4000-8000-00000000000b', flushIntervalMs: 0 });
    await analytics.init();
    await analytics.grant();
    // Simulate a batch that reached the SDK but failed to upload (still queued inside PostHog).
    await provider.capture('screen_view', { route: 'book', schema_version: 1 });
    expect(sdk.queue()).toHaveLength(1);
    await analytics.revoke();
    expect(sdk.queue()).toHaveLength(0);
    expect(sdk.calls.map((c) => c.m)).toEqual(expect.arrayContaining(['optOut', 'reset', 'setPersistedProperty']));
    // Nothing reaches the SDK after withdrawal.
    const before = sdk.calls.length;
    await provider.capture('screen_view', { route: 'book', schema_version: 1 });
    await provider.flush();
    expect(sdk.calls.length).toBe(before);
  });

  it('a second grant in the same process reuses the SDK and identifies the new id', async () => {
    const sdk = fakeSdk();
    let n = 0;
    const provider = createLazyPostHogAdapter({ create: () => sdk });
    const analytics = createAnalytics({ provider, randomId: () => `00000000-0000-4000-8000-00000000001${n++}`, flushIntervalMs: 0 });
    await analytics.init();
    await analytics.grant();
    await analytics.revoke();
    await analytics.grant();
    const identifies = sdk.calls.filter((c) => c.m === 'identify').map((c) => c.a[0]);
    expect(identifies).toEqual(['00000000-0000-4000-8000-000000000011']);
  });

  it('a failed load reports without a message and leaves analytics as a no-op', async () => {
    const errors: string[] = [];
    const provider = createLazyPostHogAdapter({
      create: () => {
        throw new Error('module missing: Asha');
      },
      onError: (stage) => errors.push(stage),
    });
    const analytics = createAnalytics({ provider, randomId: () => '00000000-0000-4000-8000-00000000000c', flushIntervalMs: 0 });
    await analytics.init();
    await analytics.grant();
    analytics.track('screen_view', { route: 'book' });
    await expect(analytics.flush()).resolves.toBeUndefined();
    expect(errors).toEqual(['load']);
    expect(JSON.stringify(errors)).not.toContain('Asha');
  });

  it('eager adapter also empties the SDK queue on optOut', async () => {
    const sdk = fakeSdk();
    const provider = createPostHogAdapter(sdk);
    await provider.capture('screen_view', { route: 'book', schema_version: 1 });
    await provider.optOut();
    expect(sdk.queue()).toHaveLength(0);
  });

  it('canary values never reach the SDK through the full path', async () => {
    const sdk = fakeSdk();
    const provider = createLazyPostHogAdapter({ create: () => sdk });
    const analytics = createAnalytics({ provider, storage: memoryStorage(), randomId: () => '00000000-0000-4000-8000-00000000000d', flushIntervalMs: 0 });
    await analytics.init();
    await analytics.grant();
    for (const c of CANARIES) {
      // @ts-expect-error deliberate misuse
      analytics.track('language_set', { lang: c, action: 'added', surface: 'settings' });
      // @ts-expect-error deliberate misuse
      analytics.track('pack_download', { lang: 'pt', pack_kind: 'text_rules', pack_version: 3, stage: 'started', network: 'wifi', note: c });
    }
    await analytics.flush();
    const sent = JSON.stringify(sdk.calls);
    for (const c of CANARIES) expect(sent).not.toContain(c);
  });
});
