import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ALLOWED_SDK_PROPERTIES,
  EVENTS,
  GLOBAL_PROPS,
  isPiiLike,
  posthogBeforeSend,
  REGISTRY,
  REQUIRED_POSTHOG_AUTOCAPTURE,
  REQUIRED_POSTHOG_OPTIONS,
  type PropSpec,
  withRenderedCatalogue,
} from '../src';
import { bool, int, oneOf } from '../src/schema';
import { WIRE_NAME_MAX, WIRE_NAME_RE } from '../src/wire-names';

const entries = Object.entries(EVENTS) as [string, { area: string; reqs: readonly string[]; level: string; props: Record<string, PropSpec> }][];

/** Property keys that name content or L3/L4 data. B-NFR-001: language names too. */
const FORBIDDEN_KEY = /(text|transcript|name|note|email|audio_url|birth|due_date|dob|token|query|phone|address|signs_as|language_code|locale|timezone|photo_url|word$|term$)/;

describe('catalogue rules', () => {
  it('has event names that are a snake_case key of 40 characters or fewer, or a wire name (category:object_action, 60 or fewer)', () => {
    for (const [name] of entries) {
      if (name.includes(':')) {
        expect(name).toMatch(WIRE_NAME_RE);
        expect(name.length).toBeLessThanOrEqual(WIRE_NAME_MAX);
      } else expect(name).toMatch(/^[a-z][a-z0-9_]{0,39}$/);
    }
  });

  it('cites at least one requirement per event', () => {
    for (const [name, spec] of entries) {
      expect(spec.reqs.length, name).toBeGreaterThan(0);
      for (const r of spec.reqs) expect(r, name).toMatch(/^(PRD-REQ-\d{3}|[ABC]-(REQ|NFR)-\d{3}|K-\d{2}|ADR-\d{4}|NFR-7\.\d+|LEGAL-REQ-\d{3}|FR-[A-Z]{3}-\d{2})$/);
    }
  });

  it('classifies every event and property as L1 or L2 only', () => {
    for (const [name, spec] of entries) {
      expect(['L1', 'L2'], name).toContain(spec.level);
      for (const p of Object.values(spec.props)) expect(['L1', 'L2'], name).toContain(p.level);
    }
    for (const p of Object.values(GLOBAL_PROPS)) expect(['L1', 'L2']).toContain(p.level);
  });

  it('never uses a property key that names content or personal data', () => {
    for (const [name, spec] of entries) {
      for (const key of Object.keys(spec.props)) {
        expect(key, `${name}.${key}`).toMatch(/^[a-z][a-z0-9_]{0,39}$/);
        expect(key, `${name}.${key}`).not.toMatch(FORBIDDEN_KEY);
      }
    }
  });

  it('has only safe enum values and bounded integers', () => {
    for (const [name, spec] of entries) {
      for (const [key, p] of Object.entries(spec.props)) {
        if (p.type === 'enum') {
          expect(p.values.length, `${name}.${key}`).toBeGreaterThan(0);
          for (const v of p.values) {
            expect(v, `${name}.${key}`).toMatch(/^[a-z0-9]+(?:_[a-z0-9]+)*$/);
            expect(v.length).toBeLessThanOrEqual(40);
            expect(isPiiLike(v), `${name}.${key}=${v}`).toBe(false);
          }
        }
        if (p.type === 'int') {
          expect(Number.isInteger(p.min) && Number.isInteger(p.max) && p.min <= p.max, `${name}.${key}`).toBe(true);
          // Bounded small: no room for timestamps, ids or birth years.
          expect(p.max, `${name}.${key}`).toBeLessThanOrEqual(1000);
        }
      }
    }
  });

  it('refers to children only by ordinal or count bucket', () => {
    for (const [name, spec] of entries) {
      for (const key of Object.keys(spec.props)) {
        if (key.includes('child')) expect(['child_ordinal'], `${name}.${key}`).toContain(key);
      }
    }
  });

  it('has no event timed by a birthday or due date (K-01, TRACKING_PLAN 6.4)', () => {
    const all = JSON.stringify(EVENTS);
    for (const banned of ['year_one', 'month_age', 'birthday_note', 'month_chapter', 'child_arrived']) {
      expect(all).not.toContain(`"${banned}"`);
    }
  });

  it('sends no goals event (retired, BL-2175) and no multilingual flag (PRD 7.10, B-NFR-001)', () => {
    expect(Object.keys(EVENTS)).not.toContain('goals_set');
    expect(Object.keys(EVENTS)).not.toContain('languages_set');
    for (const [name, spec] of entries) {
      for (const key of Object.keys(spec.props)) {
        expect(key, `${name}.${key}`).not.toMatch(/lingual|language|goal|voices|for_later|book_to_hold/);
      }
    }
  });

  it('carries language only as `lang`, only on languages events, only from the seven v1.0 codes', () => {
    const withLang = entries.filter(([, spec]) => 'lang' in spec.props).map(([name]) => name).sort();
    expect(withLang).toEqual(['me:language_update', 'system:pack_download_update']);
    for (const name of withLang) {
      const spec = EVENTS[name as 'me:language_update'];
      expect(spec.area).toBe('languages');
      expect(spec.props.lang.type).toBe('enum');
      expect([...spec.props.lang.values].sort()).toEqual(['ar', 'en', 'es', 'fr', 'hi', 'pt', 'zh']);
    }
    // Never next to letter, capture, book or family behaviour.
    for (const [name, spec] of entries) {
      if (['capture', 'book', 'family', 'children', 'celebrate'].includes(spec.area)) {
        expect(Object.keys(spec.props), name).not.toContain('lang');
      }
    }
  });

  it('docs/analytics/TRACKING_PLAN.md section 3.1 is the generated catalogue (run `npm run plan -w @scribe/analytics`)', () => {
    const plan = readFileSync(resolve(__dirname, '../../../docs/analytics/TRACKING_PLAN.md'), 'utf8');
    expect(withRenderedCatalogue(plan) === plan, 'TRACKING_PLAN.md is out of date: run `npm run plan -w @scribe/analytics`').toBe(true);
    for (const [name] of entries) expect(plan, `event ${name}`).toContain(`\`${name}\``);
  });
});

/**
 * BL-1948 item 2 (NS-54-R26, NS-41-R16): no property in the catalogue is shaped to hold a phone number or a sign-in
 * code, before any phone step exists (BL-1902). `isPiiLike` only sees a run of 7 digits or more, so a partial (the
 * last four of a number) or a 6-digit code needs its own rule here: an enum value with a run of 4 or more digits, an
 * int that can reach 10000 or more in size (either end of its range, so a large negative min counts too), or a property named for a phone, number, digit, OTP or code is rejected. The rule
 * reads REGISTRY, EVENTS and GLOBAL_PROPS as they are, so a property added later is covered without a change here.
 */
const DIGIT_RUN = /\d{4,}/;
const INT_MAX_LIMIT = 10000;
const PHONE_SHAPED_NAME = /phone|number|digit|otp|code/i;

/**
 * Named exceptions to the property-name rule only, as `event.property`, each with why. Not a way to add one quietly:
 * the list is pinned below, an exception holds only while the property is an enum with no digit in any value, and it
 * covers that one event, so the same name on any other event still fails.
 * `system:error_view.code` was on develop when the rule landed (BL-1948): it carries `ERROR_CODE`, a closed list of
 * error slugs, never a sign-in code. Renaming it is a schema bump and a wire change, so it is left for a ruling.
 */
const PHONE_NAME_EXCEPTIONS: Readonly<Record<string, string>> = {
  'system:error_view.code': 'ERROR_CODE slugs such as save_failed and mic_denied: a closed list with no digits',
};

function exceptionHolds(event: string, key: string, spec: PropSpec): boolean {
  return `${event}.${key}` in PHONE_NAME_EXCEPTIONS && spec.type === 'enum' && spec.values.every((v) => !/\d/.test(v));
}

/** Every way one event's properties could hold a phone number or a code, as `event.key: reason` lines. Empty is clean. */
function phoneShapedProps(event: string, props: Readonly<Record<string, PropSpec>>): string[] {
  const out: string[] = [];
  for (const [key, spec] of Object.entries(props)) {
    if (PHONE_SHAPED_NAME.test(key) && !exceptionHolds(event, key, spec)) out.push(`${event}.${key}: name`);
    if (spec.type === 'enum') for (const v of spec.values) if (DIGIT_RUN.test(v)) out.push(`${event}.${key}: value ${v}`);
    if (spec.type === 'int' && Math.max(Math.abs(spec.min), Math.abs(spec.max)) >= INT_MAX_LIMIT) {
      out.push(`${event}.${key}: range ${spec.min} to ${spec.max}`);
    }
  }
  return out;
}

function catalogueProblems(): string[] {
  const tables = [REGISTRY, EVENTS] as unknown as Record<string, { props: Readonly<Record<string, PropSpec>> }>[];
  const out = tables.flatMap((t) => Object.entries(t).flatMap(([name, row]) => phoneShapedProps(name, row.props)));
  return [...out, ...phoneShapedProps('(global)', GLOBAL_PROPS as Readonly<Record<string, PropSpec>>)];
}

describe('[NS-54-R26] no catalogue property is shaped to hold a phone number or a code (BL-1948 item 2)', () => {
  it('holds for every registry, held and global property on this branch', () => {
    expect(catalogueProblems()).toEqual([]);
  });

  it('rejects an enum value with a run of 4 or more digits, and lets 3 through (the bucket shapes)', () => {
    expect(phoneShapedProps('onboarding:phone_verify_submit', { via: oneOf('sms', '1234') })).toEqual(['onboarding:phone_verify_submit.via: value 1234']);
    expect(phoneShapedProps('x:y_z', { tail: oneOf('ends_0199') })).toEqual(['x:y_z.tail: value ends_0199']);
    expect(phoneShapedProps('x:y_z', { bucket: oneOf('100_364', '365_plus') })).toEqual([]);
  });

  it('rejects an int that can reach 10000 or more at either end, and lets 9999 through', () => {
    expect(phoneShapedProps('x:y_z', { tries: int(0, 10000) })).toEqual(['x:y_z.tries: range 0 to 10000']);
    expect(phoneShapedProps('x:y_z', { tries: int(0, 999999) })).toEqual(['x:y_z.tries: range 0 to 999999']);
    // A large negative min carries a full number as well as a large max does (review of #2137).
    expect(phoneShapedProps('x:y_z', { tries: int(-9999999999, 0) })).toEqual(['x:y_z.tries: range -9999999999 to 0']);
    expect(phoneShapedProps('x:y_z', { tries: int(-9999, 9999) })).toEqual([]);
    expect(phoneShapedProps('x:y_z', { tries: int(0, 9999) })).toEqual([]);
  });

  it('rejects a property named for a phone, number, digit, OTP or code, in any case', () => {
    for (const key of ['phoneCode', 'phone', 'phone_last4', 'number_bucket', 'digits', 'otp_sent', 'code_length', 'resend_code']) {
      expect(phoneShapedProps('x:y_z', { [key]: bool() }), key).toEqual([`x:y_z.${key}: name`]);
    }
  });

  it('keeps the name exceptions to the one pinned entry, each still on develop and still a digit-free enum', () => {
    expect(Object.keys(PHONE_NAME_EXCEPTIONS)).toEqual(['system:error_view.code']);
    for (const id of Object.keys(PHONE_NAME_EXCEPTIONS)) {
      const [event, key] = id.split('.');
      const spec = (EVENTS as unknown as Record<string, { props: Record<string, PropSpec> }>)[event]?.props[key];
      expect(spec, `${id} is gone: delete its exception`).toBeDefined();
      expect(exceptionHolds(event, key, spec), id).toBe(true);
    }
  });

  it('an exception covers its own event only, and lapses once the property holds a digit or stops being an enum', () => {
    expect(phoneShapedProps('onboarding:phone_verify_submit', { code: oneOf('save_failed') })).toEqual(['onboarding:phone_verify_submit.code: name']);
    expect(phoneShapedProps('system:error_view', { code: oneOf('save_failed', 'e42') })).toEqual(['system:error_view.code: name']);
    expect(phoneShapedProps('system:error_view', { code: int(0, 99) })).toEqual(['system:error_view.code: name']);
    expect(phoneShapedProps('system:error_view', { code: oneOf('save_failed', 'generic') })).toEqual([]);
  });
});

const ID = '3f2b8c1e-9a4d-4c7b-8e2f-1a2b3c4d5e6f';

describe('PostHog configuration (LEGAL-REQ-017 CI check)', () => {
  it('pins replay, autocapture and opt-in off', () => {
    expect(REQUIRED_POSTHOG_OPTIONS.defaultOptIn).toBe(false);
    expect(REQUIRED_POSTHOG_OPTIONS.enableSessionReplay).toBe(false);
    expect(REQUIRED_POSTHOG_AUTOCAPTURE.captureScreens).toBe(false);
    expect(REQUIRED_POSTHOG_AUTOCAPTURE.captureTouches).toBe(false);
  });

  it('before_send strips SDK properties that can identify or locate a person', () => {
    const beforeSend = posthogBeforeSend();
    const out = beforeSend({
      event: 'screen_view',
      properties: {
        route: 'book',
        schema_version: 1,
        $device_name: "Asha's Papa's iPhone",
        $timezone: 'America/Los_Angeles',
        $locale: 'en-US',
        $screen_name: 'letter/[id]?child=Asha',
        $set: { email: 'asha.parent@example.com' },
        $os: 'iOS',
        $app_version: '1.0.0',
        distinct_id: ID,
      },
    })!;
    // `$os` is not one of the ten V6 keys, so it goes too (ER-A00 P4).
    expect(Object.keys(out.properties!).sort()).toEqual(['$app_version', 'distinct_id', 'route', 'schema_version']);
    for (const k of Object.keys(out.properties!)) {
      if (k.startsWith('$')) expect(ALLOWED_SDK_PROPERTIES).toContain(k);
    }
  });

  it('before_send drops unknown events and passes $identify without extras', () => {
    const beforeSend = posthogBeforeSend();
    expect(beforeSend({ event: '$screen', properties: { $screen_name: 'x' } })).toBeNull();
    expect(beforeSend({ event: '$autocapture', properties: {} })).toBeNull();
    const id = beforeSend({ event: '$identify', properties: { distinct_id: ID, $set: { name: 'Asha' }, route: 'book' } })!;
    expect(id.properties).toEqual({ distinct_id: ID });
  });

  it('before_send drops events whose catalogue props carry PII', () => {
    const beforeSend = posthogBeforeSend();
    expect(beforeSend({ event: 'screen_view', properties: { route: 'asha.parent@example.com' } })).toBeNull();
  });
});
