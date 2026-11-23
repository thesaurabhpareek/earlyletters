/**
 * ER-A00 P4: `before_send` is the last gate. The allowlist of SDK `$` keys is exactly the ten of V6
 * (`00-event-standard.md` section 6), pinned here so adding one is a PR to the standard first.
 * Fixtures: the fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALLOWED_SDK_PROPERTIES, buildPostHogOptions, IDENTITY_PROPERTIES, posthogBeforeSend, SCHEMA_VERSION, type Violation } from '../src';

const ID = '00000000-0000-4000-8000-0000000000aa';
const KEY = 'phc_AbCdEf0123456789AbCdEf';

/** The ten of V6: five kept at source, five SDK internals. */
const TEN = ['$app_version', '$app_build', '$os_name', '$os_version', '$device_type', '$lib', '$lib_version', '$session_id', '$process_person_profile', '$geoip_disable'];

const sdkFields = {
  $app_version: '1.0.10',
  $app_build: '12',
  $os_name: 'iOS',
  $os_version: '26.0',
  $device_type: 'Mobile',
  $lib: 'posthog-react-native',
  $lib_version: '4.87.1',
  $session_id: '0190a000-0000-7000-8000-000000000001',
  $process_person_profile: true,
  $geoip_disable: true,
};

const screenView = (extra: Record<string, unknown> = {}) => ({
  event: 'screen_view',
  uuid: '0190a000-0000-7000-8000-000000000002',
  timestamp: '2026-11-21T00:00:00.000Z',
  $set: { name: 'Asha' },
  $set_once: { email: 'asha.family@example.com' },
  properties: { route: 'book', schema_version: SCHEMA_VERSION, distinct_id: ID, token: KEY, ...sdkFields, ...extra },
});

describe('the SDK key allowlist is exactly the ten V6 fields', () => {
  it('is these ten, in no other number', () => {
    expect([...ALLOWED_SDK_PROPERTIES].sort()).toEqual([...TEN].sort());
    expect(ALLOWED_SDK_PROPERTIES).toHaveLength(10);
    expect(new Set(ALLOWED_SDK_PROPERTIES).size).toBe(10);
  });

  it('is the list the standard names, so a code change without a standard change fails', () => {
    const doc = readFileSync(resolve(__dirname, '../../../docs/analytics/instrumentation/00-event-standard.md'), 'utf8');
    for (const k of ALLOWED_SDK_PROPERTIES) expect(doc, k).toContain('`' + k + '`');
  });

  it('keeps the two identity keys apart: not `$` keys, not part of the ten', () => {
    expect([...IDENTITY_PROPERTIES]).toEqual(['distinct_id', 'token']);
    for (const k of IDENTITY_PROPERTIES) expect(ALLOWED_SDK_PROPERTIES).not.toContain(k);
  });

  it('a normal event leaves with the registry props, the ten and the two identity keys, nothing else', () => {
    const out = posthogBeforeSend()(screenView())!;
    expect(Object.keys(out.properties!).sort()).toEqual([...TEN, 'distinct_id', 'token', 'route', 'schema_version'].sort());
    expect(Object.keys(out).sort()).toEqual(['event', 'properties', 'timestamp', 'uuid']);
  });

  it('every other `$` key is dropped, one at a time, and the event still leaves', () => {
    const others: Record<string, unknown> = {
      $os: 'iOS', $anon_distinct_id: ID, $device_name: "Asha's iPhone", $device_model: 'iPhone', $locale: 'en-US', $timezone: 'America/Los_Angeles',
      $screen_name: 'Asha', $current_url: 'https://example.com', $network_carrier: 'x', $set: { a: 1 }, $set_once: { a: 1 }, $feature_flag: 'x',
      $exception_list: [], $user_id: 'Asha', $ip: '203.0.113.7', $referrer: 'x', $lib_custom: 'x',
    };
    for (const [k, v] of Object.entries(others)) {
      const out = posthogBeforeSend()(screenView({ [k]: v }))!;
      expect(out, k).not.toBeNull();
      expect(out.properties, k).not.toHaveProperty(k);
      expect(Object.keys(out.properties!).filter((p) => p.startsWith('$')).sort(), k).toEqual([...TEN].sort());
    }
  });

  it('person properties never leave: no top-level $set or $set_once', () => {
    const out = posthogBeforeSend()(screenView())!;
    expect(out).not.toHaveProperty('$set');
    expect(out).not.toHaveProperty('$set_once');
    expect(JSON.stringify(out)).not.toContain('Asha');
  });

  it('the options the app passes use the same hook (the ten, not a wider list)', () => {
    const o = buildPostHogOptions({ host: 'https://us.i.posthog.com', distinctId: ID });
    const out = o.before_send(screenView({ $device_name: "Asha's iPhone", $os: 'iOS' }))!;
    expect(Object.keys(out.properties!).filter((p) => p.startsWith('$')).sort()).toEqual([...TEN].sort());
    expect(o.before_send(null)).toBeNull();
  });
});

describe('values of the ten and of the identity keys are screened too', () => {
  const reasons = (evt: ReturnType<typeof screenView>) => {
    const seen: Violation[] = [];
    const out = posthogBeforeSend((v) => void seen.push(v))(evt);
    return { out, seen };
  };

  it('a version like 1.0.10 is a version, not a date', () => {
    expect(reasons(screenView({ $app_version: '1.0.10', $os_version: '17.10.12', $lib_version: '4.87.1' })).out).not.toBeNull();
  });

  for (const [k, bad] of [
    ['$app_version', 'asha.family@example.com'],
    ['$os_name', "Asha's iPhone"],
    ['$device_type', 'https://example.com/asha'],
    ['$lib', 'posthog-react-native 2026-03-14'],
    ['$session_id', 'Asha'],
    ['$app_build', { name: 'Asha' }],
    ['$os_version', 'x'.repeat(41)],
  ] as [string, unknown][]) {
    it(`drops the event when ${k} carries ${typeof bad === 'string' ? 'a PII-shaped or long string' : 'an object'}, naming the key and never the value`, () => {
      const { out, seen } = reasons(screenView({ [k]: bad }));
      expect(out).toBeNull();
      expect(seen).toEqual([{ kind: 'pii_like_value', event: 'screen_view', property: k }]);
      expect(JSON.stringify(seen)).not.toContain('Asha');
    });
  }

  it('drops the event when distinct_id is not a uuid or token is not a phc_ key', () => {
    for (const [k, bad] of [['distinct_id', 'Asha'], ['distinct_id', 'asha.family@example.com'], ['distinct_id', 7], ['token', 'phx_AbCdEf0123456789'], ['token', 'Asha']] as [string, unknown][]) {
      const { out, seen } = reasons(screenView({ [k]: bad }));
      expect(out, `${k}=${String(bad)}`).toBeNull();
      expect(seen).toEqual([{ kind: 'invalid_value', event: 'screen_view', property: k }]);
    }
  });

  it('$identify passes with the id only', () => {
    const out = posthogBeforeSend()({ event: '$identify', $set: { name: 'Asha' }, properties: { distinct_id: ID, ...sdkFields, $device_name: "Asha's iPhone", route: 'book' } })!;
    expect(Object.keys(out.properties!).sort()).toEqual([...TEN, 'distinct_id'].sort());
  });
});
