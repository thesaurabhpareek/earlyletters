/**
 * Schema versioning and property naming (PDATA-10, PPRIV-02).
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  catalogShape,
  createAnalytics,
  EVENTS,
  GLOBAL_PROPS,
  recordingProvider,
  sanitizeEvent,
  sanitizeWith,
  SCHEMA_FINGERPRINTS,
  SCHEMA_VERSION,
  type PropSpec,
} from '../src';

const fingerprint = () => createHash('sha256').update(JSON.stringify(catalogShape())).digest('hex');

describe('schema_version', () => {
  it('the catalogue fingerprint is recorded for the current SCHEMA_VERSION (bump it when this fails)', () => {
    // If you changed an event or property, do NOT edit an existing entry:
    // bump SCHEMA_VERSION and add `<new version>: '<hash below>'`.
    expect(SCHEMA_FINGERPRINTS[SCHEMA_VERSION], `current fingerprint is ${fingerprint()}`).toBe(fingerprint());
  });

  it('versions only go up, and the newest recorded version is the current one', () => {
    const versions = Object.keys(SCHEMA_FINGERPRINTS).map(Number);
    expect(Math.max(...versions)).toBe(SCHEMA_VERSION);
    expect(new Set(Object.values(SCHEMA_FINGERPRINTS)).size).toBe(versions.length);
  });

  it('the fingerprint ignores documentation fields but sees value changes', () => {
    const before = JSON.stringify(catalogShape());
    const spec = EVENTS.screen_view as unknown as { when: string };
    const when = spec.when;
    spec.when = 'reworded';
    expect(JSON.stringify(catalogShape())).toBe(before);
    spec.when = when;
    const route = EVENTS.screen_view.props.route as unknown as { values: string[] };
    const original = route.values;
    route.values = [...original, 'new_route'];
    expect(JSON.stringify(catalogShape())).not.toBe(before);
    route.values = original;
  });

  it('is a required global property: an event without it is dropped', () => {
    expect((GLOBAL_PROPS.schema_version as PropSpec).optional).not.toBe(true);
    const res = sanitizeEvent('screen_view', { route: 'book' });
    expect(res.props).toBeNull();
    expect(res.violations).toEqual([{ kind: 'missing_property', event: 'screen_view', property: 'schema_version' }]);
  });

  it('the client stamps the current version on every event', async () => {
    const provider = recordingProvider();
    const a = createAnalytics({ provider, randomId: () => '00000000-0000-4000-8000-000000000001', flushIntervalMs: 0 });
    await a.init();
    await a.grant();
    a.track('screen_view', { route: 'book' });
    await a.flush();
    expect(provider.captured()[0].properties.schema_version).toBe(SCHEMA_VERSION);
  });
});

describe('property naming', () => {
  it('children are always `child_ordinal`, never a bare `ordinal`', () => {
    for (const [name, spec] of Object.entries(EVENTS)) {
      expect(Object.keys(spec.props), name).not.toContain('ordinal');
    }
    for (const name of ['child_added', 'child_switched'] as const) {
      expect(Object.keys(EVENTS[name].props), name).toContain('child_ordinal');
    }
  });
});

describe('child_added never says which kind of date was entered (PPRIV-02)', () => {
  it('sends has_date as a boolean and no mode', () => {
    const props = EVENTS.child_added.props as Record<string, PropSpec>;
    expect(props).not.toHaveProperty('mode');
    expect(props.has_date.type).toBe('bool');
    expect(JSON.stringify(props)).not.toContain('due_date');
  });

  it('drops a caller that still passes the old mode', () => {
    const res = sanitizeEvent('child_added', {
      has_date: true,
      child_ordinal: 'first',
      in_first_run: true,
      added_together: false,
      mode: 'due_date',
      schema_version: SCHEMA_VERSION,
    });
    expect(res.props).not.toBeNull();
    expect(res.props).not.toHaveProperty('mode');
    expect(res.violations).toEqual([{ kind: 'unknown_property', event: 'child_added', property: 'mode' }]);
  });
});

// These events are typed in the catalogue but held off the send path (ER-A00 P4), so they are checked with sanitizeWith.
describe('reminder_prime_shown.source names each showing (BL-1429, C-REQ-001 Rev)', () => {
  it('allows first_month beside first_letter, and still rejects anything else', () => {
    const source = EVENTS.reminder_prime_shown.props.source as unknown as { values: string[] };
    expect(source.values).toEqual(expect.arrayContaining(['first_letter', 'first_month']));
    expect(sanitizeWith(EVENTS, 'reminder_prime_shown', { source: 'first_month', schema_version: SCHEMA_VERSION }).props).toEqual({ source: 'first_month', schema_version: SCHEMA_VERSION });
    const bad = sanitizeWith(EVENTS, 'reminder_prime_shown', { source: 'second_prime', schema_version: SCHEMA_VERSION });
    expect(bad.props).toBeNull();
    expect(bad.violations.length).toBeGreaterThan(0);
  });
});

describe('the sign-in trigger names the Keep the book re-offer (BL-1464)', () => {
  it('is schema version 10 or later, with the version 10 fingerprint recorded', () => {
    expect(SCHEMA_VERSION).toBeGreaterThanOrEqual(10);
    expect(SCHEMA_FINGERPRINTS[10]).toMatch(/^[0-9a-f]{64}$/);
  });

  it.each(['auth_deferred'] as const)('%s (the one event the sheet sends; auth_sheet_shown is retired, BL-2175) allows third_letter beside first_letter, and still rejects any other value', (event) => {
    const trigger = EVENTS[event].props.trigger as unknown as { values: string[] };
    expect(trigger.values).toEqual(expect.arrayContaining(['first_letter', 'third_letter']));
    const ok = sanitizeWith(EVENTS, event, { trigger: 'third_letter', schema_version: SCHEMA_VERSION });
    expect(ok.violations).toEqual([]);
    expect(ok.props).toEqual({ trigger: 'third_letter', schema_version: SCHEMA_VERSION });
    for (const value of ['second_letter', 'fourth_letter', 'third-letter', 'Third_Letter', 'reoffer', '']) {
      const bad = sanitizeWith(EVENTS, event, { trigger: value, schema_version: SCHEMA_VERSION });
      expect(bad.props, value).toBeNull();
      expect(bad.violations.length, value).toBeGreaterThan(0);
    }
  });
});
