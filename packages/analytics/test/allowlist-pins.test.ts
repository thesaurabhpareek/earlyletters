import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createAnalytics, EVENTS, notificationOpenedEvent, recordingProvider, ROUTE_MAP, sanitizeEvent, SCHEMA_VERSION, trackNotificationOpened, type PropSpec } from '../src';

type Spec = { props: Record<string, PropSpec> };
const entries = Object.entries(EVENTS) as [string, Spec][];

/** NS-47-R34 stems. Lower case; matched anywhere in a name, key, enum value or column. */
export const DAY_STEMS = [
  'tradition', 'religio', 'faith', 'countr', 'region', 'origin', 'cultur', 'holiday', 'hemisphere',
  'library_day', 'typed_day', 'day_id', 'day_name', 'ticked', 'suggestion_', 'place', 'location',
  'workout', 'reflection', 'contact_',
] as const;

/**
 * Enum values that already existed before the stems were written and are not day data.
 * Exact (event.property=value) pairs only; a new one needs a reviewed edit here.
 */
export const STEM_EXEMPT: readonly string[] = [
  'dictionary_term_added.kind=place', // a Names and words kind, not a place the parent named
  'playback_started.version=original', // the saved-original toggle, "origin" is a prefix of "original"
  'machine_edit_rejected.reason=original_mismatch', // a verifier outcome
];

export function stemOf(s: string): string | undefined {
  const low = s.toLowerCase();
  return DAY_STEMS.find((t) => low.includes(t));
}

/** Every string an event can put on the wire: names, keys, enum values. */
function allowlistStrings(): { where: string; value: string }[] {
  const out: { where: string; value: string }[] = [];
  for (const [name, spec] of entries) {
    out.push({ where: name, value: name });
    for (const [key, p] of Object.entries(spec.props)) {
      out.push({ where: `${name}.${key}`, value: key });
      if (p.type === 'enum') for (const v of p.values) out.push({ where: `${name}.${key}=${v}`, value: v });
    }
  }
  return out;
}

describe('allowlist stems (NS-47-R34, NS-47-R9)', () => {
  it('[NS-47-R34] analytics allowlist rejects day vocabulary: event names, property keys, enum values', () => {
    const hits = allowlistStrings()
      .filter((s) => stemOf(s.value) !== undefined && !STEM_EXEMPT.includes(s.where))
      .map((s) => `${s.where} (stem ${stemOf(s.value)})`);
    expect(hits).toEqual([]);
  });

  it('[NS-47-R34] every exemption names a real enum value, so the list cannot rot into a blanket pass', () => {
    const live = allowlistStrings().map((s) => s.where);
    for (const e of STEM_EXEMPT) expect(live, e).toContain(e);
    expect(STEM_EXEMPT.length).toBe(3);
  });

  it('[NS-47-R34] the stem matcher catches a planted event, key and value', () => {
    for (const planted of ['day_ticked', 'tradition_picked', 'holiday', 'library_day', 'suggestion_title', 'workout_name']) {
      expect(stemOf(planted), planted).toBeDefined();
    }
    expect(stemOf('letter_saved')).toBeUndefined();
  });

  it('[NS-47-R34] ROUTE holds no Days, Browse, day detail, ask or suggestion route', () => {
    const bad = /(^|[/_-])(days?|browse|ask|suggestions?|culture|traditions?)([/_-]|$)/;
    const routeEnum = EVENTS.screen_view.props.route;
    expect(routeEnum.type).toBe('enum');
    for (const v of routeEnum.type === 'enum' ? routeEnum.values : []) {
      expect(v, `route ${v}`).not.toMatch(bad);
      expect(stemOf(v), `route ${v}`).toBeUndefined();
    }
    for (const [template, value] of Object.entries(ROUTE_MAP)) {
      expect(template, `template ${template}`).not.toMatch(bad);
      expect(value).not.toMatch(bad);
    }
  });

  it('[NS-47-R34] settings_changed.key gains no day-names switch', () => {
    const key = EVENTS.settings_changed.props.key;
    expect(key.type).toBe('enum');
    for (const v of key.type === 'enum' ? key.values : []) expect(v, v).not.toMatch(/day|names_in|tradition/);
    // `lock_screen_names` is the built reminder setting; the day-names switch must not join it.
    expect(key.type === 'enum' ? key.values.filter((v) => v.includes('name')) : []).toEqual(['lock_screen_names']);
  });

  it('[NS-47-R34] no insights.* view column or name matches the stems', () => {
    const sql = readFileSync(resolve(__dirname, '../../../supabase/migrations/20261004300000_insights_aggregates.sql'), 'utf8');
    const views = [...sql.matchAll(/create or replace view (insights\.[a-z_0-9]+)[\s\S]*?;\n/g)];
    expect(views.length).toBeGreaterThanOrEqual(6);
    const names: string[] = [];
    for (const m of views) {
      names.push(m[1]);
      for (const a of m[0].matchAll(/\bas ([a-z_][a-z0-9_]*)\b/g)) names.push(a[1]);
    }
    expect(names.length).toBeGreaterThan(20);
    expect(names.filter((n) => stemOf(n) !== undefined)).toEqual([]);
  });

  it('[NS-47-R9] the validator drops a day-vocabulary event or value sent anyway', () => {
    expect(sanitizeEvent('day_ticked', { day: 'x' }).props).toBeNull();
    expect(sanitizeEvent('screen_view', { route: 'days' }).props).toBeNull();
  });
});

describe('never-reported notification kinds (NS-46-R34, NS-48-R2)', () => {
  const NEVER = ['libraryDay', 'typedDay', 'birthday', 'monthAge'];

  it('[NS-46-R34] day notes are never observed: the four kinds return no event, with or without a variant', () => {
    for (const kind of NEVER) {
      expect(notificationOpenedEvent({ source: 'reminders', kind }), kind).toBeNull();
      expect(notificationOpenedEvent({ source: 'reminders', kind, variant: 3 }), kind).toBeNull();
    }
    expect(notificationOpenedEvent({ source: 'reminders', kind: 'evening' })).toEqual({ type: 'letter_reminder' });
  });

  it('[NS-46-R34] only the evening kind is ever reported, whatever else arrives', () => {
    const others = ['', 'Evening', 'EVENING', 'day', 'occasion', 'family_digest', 'reminder', 'evening ', 'libraryday'];
    for (const kind of [...NEVER, ...others]) expect(notificationOpenedEvent({ kind }), kind).toBeNull();
    for (const bad of [undefined, null, 'evening', 7, [], { kind: ['evening'] }, { type: 'evening' }]) {
      expect(notificationOpenedEvent(bad)).toBeNull();
    }
  });

  it('[NS-46-R34] with consent granted, opening a day note sends nothing at all', async () => {
    const provider = recordingProvider();
    const a = createAnalytics({ provider, randomId: () => '00000000-0000-4000-8000-0000000000aa', flushIntervalMs: 0 });
    await a.init();
    await a.grant();
    for (const kind of NEVER) expect(trackNotificationOpened(a, { source: 'reminders', kind, variant: 1 }), kind).toBe('not_sent');
    await a.flush();
    expect(provider.captured().filter((e) => e.event !== '$identify')).toEqual([]);
  });

  it('[NS-46-R34] no reminder or notification enum value names a day, birthday or month note', () => {
    const named = /day|birthday|month|typed|library|occasion|anniversary/;
    for (const ev of ['reminder_sent', 'notification_opened', 'reminder_suppressed'] as const) {
      for (const [key, p] of Object.entries(EVENTS[ev].props)) {
        if (p.type === 'enum') for (const v of p.values) expect(v, `${ev}.${key}`).not.toMatch(named);
      }
    }
  });

  it('[NS-48-R2] reminder_suppressed never names a winner and has no daily_budget reason (A-48-3)', () => {
    const reason = EVENTS.reminder_suppressed.props.reason;
    expect(reason.type).toBe('enum');
    const values = reason.type === 'enum' ? reason.values : [];
    expect(values).not.toContain('daily_budget');
    for (const v of values) expect(v).not.toMatch(/budget|day_note|birthday|month|winner|yielded|library/);
  });
});

describe('variant_id and age bands (NS-48-R38, A-48-1)', () => {
  const withVariant = entries.filter(([, s]) => 'variant_id' in s.props).map(([n]) => n).sort();

  it('[NS-48-R38] variant_id lives only on reminder_sent and notification_opened, optional, from 0, never above 399', () => {
    expect(withVariant).toEqual(['notification_opened', 'reminder_sent']);
    for (const name of withVariant) {
      const p = (EVENTS as unknown as Record<string, Spec>)[name].props.variant_id;
      expect(p.type, name).toBe('int');
      if (p.type !== 'int') continue;
      expect(p.optional, name).toBe(true);
      expect(p.min, name).toBe(0);
      expect(p.max, name).toBeLessThanOrEqual(399);
      expect(p.max, name).toBeGreaterThanOrEqual(99);
    }
  });

  it('[NS-48-R38] the validator and the observer refuse a variant_id outside the range', () => {
    const max = (EVENTS.notification_opened.props.variant_id as { max: number }).max;
    expect(sanitizeEvent('notification_opened', { type: 'letter_reminder', variant_id: max, schema_version: SCHEMA_VERSION }).props).toEqual({ type: 'letter_reminder', variant_id: max, schema_version: SCHEMA_VERSION });
    for (const v of [max + 1, 400, 1000, -1, 1.5, '3']) {
      expect(sanitizeEvent('notification_opened', { type: 'letter_reminder', variant_id: v, schema_version: SCHEMA_VERSION }).props?.variant_id, String(v)).toBeUndefined();
    }
    for (const v of [max + 1, 400, -1, 1.5, '3', null]) {
      expect(notificationOpenedEvent({ kind: 'evening', variant: v }), String(v)).toEqual({ type: 'letter_reminder' });
    }
  });

  it('[NS-48-R38] no event carries an age band, a recency band, a named-or-neutral flag or an age', () => {
    const banned = /(^|_)(age|ages|band|bands|recency|named|neutral|kind_age|months_old|age_months|age_days)(_|$)/;
    for (const [name, spec] of entries) {
      for (const key of Object.keys(spec.props)) expect(key, `${name}.${key}`).not.toMatch(banned);
    }
  });
});

describe('capture source and slips (NS-49-R36, NS-50-R17)', () => {
  it('[NS-49-R36] capture_started.source gains at most photo and suggestion', () => {
    const src = EVENTS.capture_started.props.source;
    expect(src.type).toBe('enum');
    const values = src.type === 'enum' ? src.values : [];
    const allowed = ['tonight', 'book', 'notification', 'make_it_yours', 'resurface', 'photo', 'suggestion'];
    for (const v of values) expect(allowed, v).toContain(v);
    expect(Object.keys(EVENTS.capture_started.props).sort()).toEqual(['child_ordinal', 'member_role', 'mode', 'prompt_kind', 'source']);
  });

  it('[NS-49-R36] no property carries a suggestion detail, a photo count or an outcome', () => {
    for (const [name, spec] of entries) {
      for (const key of Object.keys(spec.props)) {
        expect(key, `${name}.${key}`).not.toMatch(/suggest|title|photo_count|picked/);
      }
    }
  });

  it('[NS-50-R17] no analytics event exists for a Home slip, its rank, a dismissal or the Days ask', () => {
    for (const [name] of entries) {
      expect(name, name).not.toMatch(/(^|_)(slip|ask|asked|rank|dismissed?|days?)(_|$)/);
    }
  });
});
