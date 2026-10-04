/**
 * HogQL queries the insights job runs against PostHog's query API
 * (`POST /api/projects/:id/query/` with `{"query": {"kind": "HogQLQuery",
 * "query": ...}}`, a personal API key with Query Read only; PostHog docs,
 * checked 3 Oct 2026). Counts only: every query groups and counts, filters
 * out groups under 10 people (k = 10) inside PostHog, and names only
 * catalogue events and properties. Function names (`toStartOfWeek` with
 * mode 1 for Monday weeks, `countIf`, `count(DISTINCT ...)`) are ClickHouse
 * functions that HogQL exposes; **Unverified** against a live project until
 * the first real run (INSIGHTS_LOOP.md, founder step 3).
 */
import { EVENTS, type EventName } from '../catalog';
import type { DeviceFunnelRow, DeviceRow } from './types';

export const K_MIN = 10;

/** Breakdowns the engine reads: event -> catalogue properties to split by. */
export const BREAKDOWNS: Readonly<Partial<Record<EventName, readonly string[]>>> = {
  transcription_completed: ['outcome', 'model'],
  pack_download: ['stage', 'pack', 'failure', 'lang'],
  machine_edit_rejected: ['reason', 'edit_type'],
  machine_edit_reverted: ['edit_type'],
  letter_saved: ['mode', 'destination'],
  capture_discarded: ['stage'],
  plus_offer_closed: ['outcome'],
  plan_changed: ['to_state'],
  language_set: ['lang', 'action'],
  error_shown: ['code'],
  sync_failed: ['reason'],
  auth_failed: ['reason'],
  invite_failed: ['reason'],
  export_failed: ['reason'],
  read_together_started: ['access'],
};

/** Events counted per week without a breakdown. */
export const WEEKLY_EVENTS: readonly EventName[] = [
  'app_opened',
  'capture_started',
  'capture_discarded',
  'letter_saved',
  'transcription_completed',
  'pack_download',
  'machine_edit_rejected',
  'machine_edit_reverted',
  'read_together_started',
  'invite_created',
  'plus_offer_viewed',
  'plus_offer_closed',
  'error_shown',
  'sync_failed',
  'export_started',
  'export_failed',
];

const ident = (s: string) => {
  if (!/^[a-z][a-z0-9_]{0,39}$/.test(s)) throw new Error('hogql: bad identifier');
  return s;
};
const list = (xs: readonly string[]) => xs.map((x) => `'${ident(x)}'`).join(', ');
const weeksBack = (w: number) => Math.min(104, Math.max(1, Math.floor(w)));

export interface HogQLQuery {
  name: string;
  query: string;
}

export function weeklyEventsQuery(weeks: number): HogQLQuery {
  return {
    name: 'insights_weekly_events',
    query: `SELECT toStartOfWeek(timestamp, 1) AS week, event, count() AS events, count(DISTINCT distinct_id) AS people
FROM events
WHERE timestamp >= now() - INTERVAL ${weeksBack(weeks)} WEEK AND event IN (${list(WEEKLY_EVENTS)})
GROUP BY week, event
HAVING people >= ${K_MIN}
ORDER BY week, event
LIMIT 10000`,
  };
}

export function breakdownQuery(event: EventName, dim: string, weeks: number): HogQLQuery {
  if (!(dim in EVENTS[event].props)) throw new Error('hogql: property not in catalogue');
  return {
    name: `insights_${ident(event)}_by_${ident(dim)}`,
    query: `SELECT toStartOfWeek(timestamp, 1) AS week, toString(properties.${ident(dim)}) AS value, count() AS events, count(DISTINCT distinct_id) AS people
FROM events
WHERE timestamp >= now() - INTERVAL ${weeksBack(weeks)} WEEK AND event = '${ident(event)}' AND properties.${ident(dim)} IS NOT NULL
GROUP BY week, value
HAVING people >= ${K_MIN}
ORDER BY week, value
LIMIT 10000`,
  };
}

export function funnelQuery(weeks: number): HogQLQuery {
  return {
    name: 'insights_weekly_funnel',
    query: `SELECT week, countIf(opened) AS opened, countIf(started) AS started, countIf(saved) AS saved
FROM (
  SELECT toStartOfWeek(timestamp, 1) AS week, distinct_id,
         max(event = 'app_opened') AS opened, max(event = 'capture_started') AS started, max(event = 'letter_saved') AS saved
  FROM events
  WHERE timestamp >= now() - INTERVAL ${weeksBack(weeks)} WEEK AND event IN ('app_opened', 'capture_started', 'letter_saved')
  GROUP BY week, distinct_id
)
GROUP BY week
HAVING opened >= ${K_MIN}
ORDER BY week
LIMIT 1000`,
  };
}

/** Every query the job runs, in order. */
export function allQueries(weeks: number): { kind: 'weekly' | 'breakdown' | 'funnel'; event?: EventName; dim?: string; q: HogQLQuery }[] {
  const out: ReturnType<typeof allQueries> = [{ kind: 'weekly', q: weeklyEventsQuery(weeks) }];
  for (const [event, dims] of Object.entries(BREAKDOWNS) as [EventName, readonly string[]][]) {
    for (const dim of dims) out.push({ kind: 'breakdown', event, dim, q: breakdownQuery(event, dim, weeks) });
  }
  out.push({ kind: 'funnel', q: funnelQuery(weeks) });
  return out;
}

// ---------------------------------------------------------------------------
// Parsing: everything that comes back is re-checked against the catalogue.
// ---------------------------------------------------------------------------

const WEEK = /^\d{4}-\d{2}-\d{2}/;
const toWeek = (v: unknown): string | null => (typeof v === 'string' && WEEK.test(v) ? v.slice(0, 10) : null);
const toCount = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
};

/**
 * A breakdown value is kept only when it is one of the catalogue's allowed
 * values for that property (enum value, bool, or int in range); anything
 * else becomes `other`. So nothing outside the catalogue can reach a report.
 */
export function catalogueValue(event: EventName, dim: string, raw: unknown): string {
  const spec = (EVENTS[event].props as Record<string, { type: string; values?: readonly string[]; min?: number; max?: number }>)[dim];
  if (!spec) return 'other';
  const s = String(raw);
  if (spec.type === 'enum') return spec.values!.includes(s) ? s : 'other';
  if (spec.type === 'bool') return s === 'true' || s === 'false' ? s : 'other';
  const n = Number(s);
  return Number.isInteger(n) && n >= spec.min! && n <= spec.max! ? String(n) : 'other';
}

export function parseWeeklyRows(results: unknown[][]): DeviceRow[] {
  const out: DeviceRow[] = [];
  for (const r of results) {
    const [week, event, events, people] = r;
    const w = toWeek(week);
    const e = toCount(events);
    const p = toCount(people);
    if (!w || e === null || p === null || p < K_MIN || typeof event !== 'string' || !(event in EVENTS)) continue;
    out.push({ week: w, event, events: e, people: p });
  }
  return out;
}

export function parseBreakdownRows(event: EventName, dim: string, results: unknown[][]): DeviceRow[] {
  const merged = new Map<string, DeviceRow>();
  for (const r of results) {
    const [week, value, events, people] = r;
    const w = toWeek(week);
    const e = toCount(events);
    const p = toCount(people);
    if (!w || e === null || p === null || p < K_MIN) continue;
    const v = catalogueValue(event, dim, value);
    const key = `${w}|${v}`;
    const prev = merged.get(key);
    if (prev) {
      prev.events += e;
      prev.people += p; // an upper bound when two raw values fold into `other`
    } else merged.set(key, { week: w, event, dim, value: v, events: e, people: p });
  }
  return [...merged.values()];
}

export function parseFunnelRows(results: unknown[][]): DeviceFunnelRow[] {
  const out: DeviceFunnelRow[] = [];
  for (const r of results) {
    const [week, opened, started, saved] = r;
    const w = toWeek(week);
    const o = toCount(opened);
    const s = toCount(started);
    const v = toCount(saved);
    if (!w || o === null || s === null || v === null || o < K_MIN) continue;
    out.push({ week: w, opened: o, started: s, saved: v });
  }
  return out;
}
