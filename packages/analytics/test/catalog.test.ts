import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ALLOWED_SDK_PROPERTIES,
  EVENTS,
  GLOBAL_PROPS,
  isPiiLike,
  posthogBeforeSend,
  REQUIRED_POSTHOG_AUTOCAPTURE,
  REQUIRED_POSTHOG_OPTIONS,
  type PropSpec,
} from '../src';

const entries = Object.entries(EVENTS) as [string, { reqs: readonly string[]; level: string; props: Record<string, PropSpec> }][];

/** Property keys that name content or L3/L4 data. B-NFR-001: language names too. */
const FORBIDDEN_KEY = /(text|transcript|name|note|email|audio_url|birth|due_date|dob|token|query|phone|address|signs_as|language_code|locale|timezone|photo_url|word$|term$)/;

describe('catalogue rules', () => {
  it('has snake_case event names of 40 characters or fewer', () => {
    for (const [name] of entries) expect(name).toMatch(/^[a-z][a-z0-9_]{0,39}$/);
  });

  it('cites at least one requirement per event', () => {
    for (const [name, spec] of entries) {
      expect(spec.reqs.length, name).toBeGreaterThan(0);
      for (const r of spec.reqs) expect(r, name).toMatch(/^(PRD-REQ-\d{3}|[ABC]-(REQ|NFR)-\d{3}|K-\d{2}|ADR-\d{4}|NFR-7\.\d+|LEGAL-REQ-\d{3})$/);
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

  it('sends goals only as a count and nothing derived from languages (both L4, PRD 7.10)', () => {
    expect(Object.keys(EVENTS.goals_set.props)).toEqual(['count']);
    expect(Object.keys(EVENTS)).not.toContain('languages_set');
    for (const [name, spec] of entries) {
      for (const key of Object.keys(spec.props)) {
        expect(key, `${name}.${key}`).not.toMatch(/lingual|language|goal|voices|for_later|book_to_hold/);
      }
    }
  });

  it('every event and property is documented in docs/analytics/TRACKING_PLAN.md', () => {
    const plan = readFileSync(resolve(__dirname, '../../../docs/analytics/TRACKING_PLAN.md'), 'utf8');
    for (const [name, spec] of entries) {
      expect(plan, `event ${name}`).toContain(`\`${name}\``);
      for (const key of Object.keys(spec.props)) {
        expect(plan.includes(`\`${key}\``) || plan.includes(`${key}:`), `${name}.${key}`).toBe(true);
      }
    }
  });
});

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
        distinct_id: '3f2b8c1e-9a4d-4c7b-8e2f-1a2b3c4d5e6f',
      },
    })!;
    expect(Object.keys(out.properties!).sort()).toEqual(['$app_version', '$os', 'distinct_id', 'route', 'schema_version']);
    for (const k of Object.keys(out.properties!)) {
      if (k.startsWith('$') || k === 'distinct_id') expect(ALLOWED_SDK_PROPERTIES).toContain(k);
    }
  });

  it('before_send drops unknown events and passes $identify without extras', () => {
    const beforeSend = posthogBeforeSend();
    expect(beforeSend({ event: '$screen', properties: { $screen_name: 'x' } })).toBeNull();
    expect(beforeSend({ event: '$autocapture', properties: {} })).toBeNull();
    const id = beforeSend({ event: '$identify', properties: { distinct_id: 'abc', $set: { name: 'Asha' }, route: 'book' } })!;
    expect(id.properties).toEqual({ distinct_id: 'abc' });
  });

  it('before_send drops events whose catalogue props carry PII', () => {
    const beforeSend = posthogBeforeSend();
    expect(beforeSend({ event: 'screen_view', properties: { route: 'asha.parent@example.com' } })).toBeNull();
  });
});
