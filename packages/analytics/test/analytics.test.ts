import { describe, expect, it } from 'vitest';
import {
  createAnalytics,
  memoryStorage,
  recordingProvider,
  SCHEMA_VERSION,
  STORAGE_KEYS,
  type Violation,
} from '../src';

// Canary values from the fictional test family (CLAUDE.md). None may ever
// reach the provider.
const CANARIES = ['Asha', 'asha', 'Nani', 'She laughed at the dog today', 'asha.parent@example.com', '2025-03-14'];

let n = 0;
const ids = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;

function setup(extra: Partial<Parameters<typeof createAnalytics>[0]> = {}) {
  const provider = recordingProvider();
  const storage = memoryStorage();
  const violations: Violation[] = [];
  const analytics = createAnalytics({
    provider,
    storage,
    randomId: ids,
    onViolation: (v) => violations.push(v),
    flushIntervalMs: 0,
    ...extra,
  });
  return { analytics, provider, storage, violations };
}

const validLetter = {
  mode: 'spoken',
  destination: 'book',
  child_ordinal: 'first',
  member_role: 'parent',
  prompt_kind: 'opening',
  audio_bucket: '1_2m',
  words_bucket: '100_299',
  machine_edit_count: 4,
  edits_reverted_count: 0,
  engine: 'on_device',
  from_notification_2h: false,
} as const;

describe('consent gate', () => {
  it('sends and queues nothing before consent', async () => {
    const { analytics, provider } = setup();
    await analytics.init();
    expect(analytics.consent()).toBe('unknown');
    expect(analytics.track('letter_saved', validLetter)).toBe('dropped_no_consent');
    expect(analytics.track('screen_view', { route: 'tonight' })).toBe('dropped_no_consent');
    expect(analytics.queueLength()).toBe(0);
    await analytics.flush();
    expect(provider.captured()).toHaveLength(0);
    expect(provider.calls.some((c) => c.method === 'identify' || c.method === 'optIn')).toBe(false);
  });

  it('does not backfill events tracked before consent once consent is granted', async () => {
    const { analytics, provider } = setup();
    await analytics.init();
    analytics.track('letter_saved', validLetter);
    await analytics.grant();
    await analytics.flush();
    expect(provider.captured()).toHaveLength(0);
  });

  it('declining behaves exactly like no answer', async () => {
    const { analytics, provider } = setup();
    await analytics.init();
    await analytics.revoke();
    expect(analytics.consent()).toBe('denied');
    expect(analytics.track('screen_view', { route: 'book' })).toBe('dropped_no_consent');
    await analytics.flush();
    expect(provider.captured()).toHaveLength(0);
  });

  it('after grant, opts in, identifies with a random id only, and sends', async () => {
    const { analytics, provider } = setup();
    await analytics.init();
    await analytics.grant();
    const identify = provider.calls.find((c) => c.method === 'identify')!;
    expect(identify.args).toHaveLength(1);
    expect(identify.args[0]).toMatch(/^[0-9a-f-]{36}$/);
    expect(analytics.track('letter_saved', validLetter)).toBe('queued');
    await analytics.flush();
    const [evt] = provider.captured();
    expect(evt.event).toBe('letter_saved');
    expect(evt.properties).toMatchObject({ ...validLetter, schema_version: SCHEMA_VERSION });
  });

  it('restores a persisted grant on init without a new id', async () => {
    const first = setup();
    await first.analytics.init();
    await first.analytics.grant();
    const id = first.storage.dump()[STORAGE_KEYS.id];
    const provider = recordingProvider();
    const again = createAnalytics({ provider, storage: first.storage, randomId: ids, flushIntervalMs: 0 });
    expect(await again.init()).toBe('granted');
    expect(provider.calls.find((c) => c.method === 'identify')!.args[0]).toBe(id);
  });
});

describe('allowlist', () => {
  it('strips unknown properties and keeps valid ones', async () => {
    const { analytics, provider, violations } = setup();
    await analytics.init();
    await analytics.grant();
    // @ts-expect-error unknown property is a type error too
    analytics.track('screen_view', { route: 'book', referrer: 'settings' });
    await analytics.flush();
    expect(provider.captured()[0].properties).toEqual({ route: 'book', schema_version: SCHEMA_VERSION });
    expect(violations).toContainEqual({ kind: 'unknown_property', event: 'screen_view', property: '<unlisted>' });
  });

  it('drops unknown events entirely', async () => {
    const { analytics, provider, violations } = setup();
    await analytics.init();
    await analytics.grant();
    // @ts-expect-error not in the catalogue
    expect(analytics.track('letter_text_typed', { route: 'book' })).toBe('dropped_invalid');
    await analytics.flush();
    expect(provider.captured()).toHaveLength(0);
    expect(violations[0].kind).toBe('unknown_event');
  });

  it('drops the event when a required value is outside the enum or integer range (PDATA-03)', async () => {
    const { analytics, provider, violations } = setup();
    await analytics.init();
    await analytics.grant();
    expect(
      analytics.track('letter_saved', {
        ...validLetter,
        // @ts-expect-error not an allowed value
        destination: 'everyone',
        machine_edit_count: 10_000,
      }),
    ).toBe('dropped_invalid');
    await analytics.flush();
    expect(provider.captured()).toHaveLength(0);
    expect(violations).toContainEqual({ kind: 'invalid_value', event: 'letter_saved', property: 'destination' });
    expect(violations).toContainEqual({ kind: 'invalid_value', event: 'letter_saved', property: 'machine_edit_count' });
    expect(analytics.violationCounts()).toEqual({ invalid_value: 2 });
  });

  it('strips an invalid optional value but keeps the event', async () => {
    const { analytics, provider, violations } = setup();
    await analytics.init();
    await analytics.grant();
    // @ts-expect-error not an allowed value
    expect(analytics.track('letter_saved', { ...validLetter, audio_bucket: 'forever' })).toBe('queued');
    await analytics.flush();
    const props = provider.captured()[0].properties;
    expect(props).not.toHaveProperty('audio_bucket');
    expect(props.mode).toBe('spoken');
    expect(violations).toEqual([{ kind: 'invalid_value', event: 'letter_saved', property: 'audio_bucket' }]);
  });

  it('drops the event and counts a violation when a required property is missing (PDATA-03)', async () => {
    const { analytics, provider, violations } = setup();
    await analytics.init();
    await analytics.grant();
    const { destination: _omit, ...partial } = validLetter;
    void _omit;
    // @ts-expect-error destination is required
    expect(analytics.track('letter_saved', partial)).toBe('dropped_invalid');
    await analytics.flush();
    expect(provider.captured()).toHaveLength(0);
    expect(violations).toEqual([{ kind: 'missing_property', event: 'letter_saved', property: 'destination' }]);
    expect(analytics.violationCounts()).toEqual({ missing_property: 1 });
  });

  it('rejects non-integer numbers, nulls, objects and arrays', async () => {
    const { analytics, provider } = setup();
    await analytics.init();
    await analytics.grant();
    analytics.track('read_together_ended', {
      reason: 'finished',
      session_bucket: '1_5m',
      letters_heard: 2.5,
    });
    analytics.track('read_together_ended', {
      reason: 'finished',
      // @ts-expect-error null is never allowed
      session_bucket: null,
      letters_heard: 2,
    });
    analytics.track('read_together_ended', {
      reason: 'finished',
      session_bucket: '1_5m',
      letters_heard: 2,
      // @ts-expect-error nested objects are never allowed
      extra: { a: 1 },
    });
    analytics.track('read_together_ended', {
      reason: 'finished',
      session_bucket: '1_5m',
      // @ts-expect-error arrays are never allowed
      letters_heard: [1],
    });
    await analytics.flush();
    expect(provider.captured()).toHaveLength(1);
    expect(provider.captured()[0].properties).toEqual({
      reason: 'finished',
      session_bucket: '1_5m',
      letters_heard: 2,
      schema_version: SCHEMA_VERSION,
    });
  });
});

describe('free text and PII', () => {
  const piiLike = [
    'asha.parent@example.com',
    '+1 415 555 0134',
    'https://letters.example.com/i/abc',
    '2025-03-14',
    '14/03/2025',
    '3f2b8c1e-9a4d-4c7b-8e2f-1a2b3c4d5e6f',
    'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0',
  ];

  it.each(piiLike)('drops the whole event when a property looks like PII: %s', async (value) => {
    const { analytics, provider, violations } = setup();
    await analytics.init();
    await analytics.grant();
    // @ts-expect-error value is not in the enum
    expect(analytics.track('screen_view', { route: value })).toBe('dropped_invalid');
    await analytics.flush();
    expect(provider.captured()).toHaveLength(0);
    expect(violations[0].kind).toMatch(/pii_like_value|string_too_long/);
  });

  it('drops the event when an unknown property smuggles PII', async () => {
    const { analytics, provider } = setup();
    await analytics.init();
    await analytics.grant();
    // @ts-expect-error unknown property
    analytics.track('screen_view', { route: 'book', email: 'asha.parent@example.com' });
    await analytics.flush();
    expect(provider.captured()).toHaveLength(0);
  });

  it('drops free text (names, sentences) and strings over 40 characters', async () => {
    const { analytics, provider, violations } = setup();
    await analytics.init();
    await analytics.grant();
    // @ts-expect-error free text
    analytics.track('child_switched', { child_ordinal: 'Asha', surface: 'book' });
    // @ts-expect-error free text
    analytics.track('error_shown', { code: 'She laughed at the dog today' });
    // @ts-expect-error too long
    analytics.track('error_shown', { code: 'a'.repeat(41) });
    await analytics.flush();
    expect(provider.captured()).toHaveLength(0);
    expect(violations.map((v) => v.kind)).toEqual(['free_text', 'free_text', 'string_too_long']);
  });

  it('never puts the offending value in a violation report', async () => {
    const { analytics, violations } = setup();
    await analytics.init();
    await analytics.grant();
    for (const c of CANARIES) {
      // @ts-expect-error deliberate misuse
      analytics.track('screen_view', { route: c, [c]: c });
    }
    const serialized = JSON.stringify(violations);
    for (const c of CANARIES) expect(serialized).not.toContain(c);
  });

  it('canary family never reaches the provider, whatever the caller does', async () => {
    const { analytics, provider } = setup();
    await analytics.init();
    await analytics.grant();
    for (const c of CANARIES) {
      // @ts-expect-error deliberate misuse
      analytics.track('letter_saved', { ...validLetter, child_ordinal: c, note: c, [c]: true });
      // @ts-expect-error deliberate misuse
      analytics.track(c, { route: 'book' });
    }
    await analytics.flush();
    const sent = JSON.stringify(provider.calls);
    for (const c of CANARIES) expect(sent).not.toContain(c);
  });
});

describe('revoke', () => {
  it('clears the queue, opts out, resets, and stops sending within the session', async () => {
    const { analytics, provider } = setup();
    await analytics.init();
    await analytics.grant();
    analytics.track('screen_view', { route: 'tonight' });
    analytics.track('screen_view', { route: 'book' });
    expect(analytics.queueLength()).toBe(2);

    await analytics.revoke();
    expect(analytics.queueLength()).toBe(0);
    expect(provider.calls.map((c) => c.method)).toEqual(expect.arrayContaining(['optOut', 'reset']));

    expect(analytics.track('screen_view', { route: 'family' })).toBe('dropped_no_consent');
    await analytics.flush();
    expect(provider.captured()).toHaveLength(0);
  });

  it('resets the distinct id: a later grant uses a new id and the old one is retired', async () => {
    const { analytics, provider, storage } = setup();
    await analytics.init();
    await analytics.grant();
    const firstId = storage.dump()[STORAGE_KEYS.id];
    await analytics.revoke();
    expect(storage.dump()[STORAGE_KEYS.id]).toBeUndefined();
    await analytics.grant();
    const secondId = storage.dump()[STORAGE_KEYS.id];
    expect(secondId).not.toBe(firstId);
    const identified = provider.calls.filter((c) => c.method === 'identify').map((c) => c.args[0]);
    expect(identified).toEqual([firstId, secondId]);
    expect(analytics.analyticsIds()).toEqual([secondId, firstId]);
    await analytics.forgetIds();
    expect(analytics.analyticsIds()).toEqual([]);
    expect(analytics.consent()).toBe('denied');
  });

  it('a revoke during flush stops the rest of the batch', async () => {
    const provider = recordingProvider();
    let analytics!: ReturnType<typeof createAnalytics>;
    let revoked = false;
    const capture = provider.capture;
    provider.capture = async (e, p) => {
      await capture(e, p);
      if (!revoked) {
        revoked = true;
        await analytics.revoke();
      }
    };
    analytics = createAnalytics({ provider, randomId: ids, flushIntervalMs: 0 });
    await analytics.init();
    await analytics.grant();
    analytics.track('screen_view', { route: 'tonight' });
    analytics.track('screen_view', { route: 'book' });
    analytics.track('screen_view', { route: 'family' });
    await analytics.flush();
    expect(provider.captured()).toHaveLength(1);
    expect(provider.calls.filter((c) => c.method === 'flush')).toHaveLength(0);
  });
});

describe('globals, sampling, queue cap', () => {
  it('sends child_count_bucket as an event property, never a person property', async () => {
    const { analytics, provider } = setup();
    await analytics.init();
    await analytics.grant();
    analytics.setChildCount(3);
    analytics.track('child_switched', { child_ordinal: 'third_plus', surface: 'book' });
    await analytics.flush();
    expect(provider.captured()[0].properties.child_count_bucket).toBe('three_plus');
    expect(provider.calls.find((c) => c.method === 'identify')!.args).toHaveLength(1);
  });

  it('samples deterministically per id and tags kept events', async () => {
    const { analytics, provider } = setup({ sampleRates: { screen_view: 0.5, letter_opened: 0 } });
    await analytics.init();
    await analytics.grant();
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) results.add(analytics.track('screen_view', { route: 'book' }));
    expect(results.size).toBe(1); // all kept or all dropped for one person
    expect(analytics.track('letter_opened', { author_relation: 'self', has_audio: true })).toBe('dropped_sampled');
    await analytics.flush();
    for (const e of provider.captured()) expect(e.properties.sample_pct).toBe(50);
  });

  it('caps the queue by bytes, dropping oldest first', async () => {
    const { analytics, violations } = setup({ maxQueueBytes: 400 });
    await analytics.init();
    await analytics.grant();
    for (let i = 0; i < 20; i++) analytics.track('screen_view', { route: 'tonight' });
    expect(analytics.queueLength()).toBeLessThan(20);
    expect(violations.some((v) => v.kind === 'queue_overflow')).toBe(true);
  });
});
