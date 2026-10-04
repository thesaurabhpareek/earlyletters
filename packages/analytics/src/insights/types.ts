/**
 * Inputs and outputs of the insights engine (docs/analytics/INSIGHTS_LOOP.md).
 * Everything here is a count, a rate or a catalogue enum value. There is no
 * field that can hold text a person wrote, an id or a name.
 */

/** `public.insights_aggregates(p_weeks)` (migration 20261004300000), already k-anonymised (k = 10). */
export interface ServerAggregates {
  schema: number;
  generated_at?: string;
  k_min: number;
  since?: string;
  weekly_keeping_families: {
    week: string;
    complete: boolean;
    families: number | null;
    families_with_book_letter: number | null;
    letters: number | null;
    spoken_letters: number | null;
    typed_letters: number | null;
  }[];
  letters_per_active_family: {
    week: string;
    complete: boolean;
    active_families: number | null;
    letters_per_family_mean: number | null;
    letters_per_family_p50: number | null;
    letters_per_family_p90: number | null;
    families_two_plus_voices: number | null;
  }[];
  first_letter_conversion: {
    cohort_week: string;
    d7_matured: boolean;
    d30_matured: boolean;
    new_accounts: number | null;
    first_letter_d1: number | null;
    first_letter_d7: number | null;
    first_letter_d30: number | null;
  }[];
  family_invites: { week: string; role: 'co_parent' | 'contributor'; sent: number | null; accepted: number | null; accepted_within_7d: number | null }[];
  retention_cohorts: { cohort_week: string; week_offset: number; cohort_writers: number | null; active_writers: number | null }[];
  language_mix: { available: boolean; rows: { week: string; lang: string; families: number }[] };
}

/**
 * One row of a PostHog breakdown: events and distinct people for an event in
 * a week, optionally split by one catalogue property. Rows with fewer than
 * 10 people are dropped before the engine sees them (query and engine both).
 */
export interface DeviceRow {
  week: string;
  event: string;
  dim?: string;
  value?: string | number | boolean;
  events: number;
  people: number;
}

/** People per week who opened the app, started a letter, and saved one (consenting users only). */
export interface DeviceFunnelRow {
  week: string;
  opened: number;
  started: number;
  saved: number;
}

export interface DeviceData {
  source: 'posthog' | 'synthetic';
  rows: DeviceRow[];
  funnel: DeviceFunnelRow[];
}

export interface InsightsInput {
  /** The report date, YYYY-MM-DD (UTC). */
  date: string;
  server: ServerAggregates | null;
  device: DeviceData | null;
  /** True when built from synthetic data (dry run). Printed on the report. */
  synthetic?: boolean;
}

export type Confidence = 'high' | 'medium' | 'low';

export interface Metric {
  key: string;
  label: string;
  /** Latest complete week, or latest matured cohort. */
  value: number | null;
  previous: number | null;
  unit: 'count' | 'rate' | 'number';
  source: 'server' | 'device';
  /** Week (or cohort week) the value belongs to. */
  week: string | null;
}

export interface Finding {
  area: 'funnel' | 'retention' | 'drop_off' | 'adoption' | 'languages' | 'quality' | 'plus' | 'anomaly';
  text: string;
  source: 'server' | 'device';
}

export interface Anomaly {
  metric: string;
  label: string;
  week: string;
  value: number;
  baseline: number;
  change: number;
  direction: 'up' | 'down';
  source: 'server' | 'device';
}

export interface Proposal {
  /** Stable slug: the same problem keeps the same id from week to week. */
  id: string;
  title: string;
  problem: string;
  evidence: string[];
  hypothesis: string;
  change: string;
  metric: string;
  confidence: Confidence;
  /** Ranking score: impact x reach x confidence weight. */
  score: number;
  area: Finding['area'];
}

export interface InsightsReport {
  date: string;
  synthetic: boolean;
  latestWeek: string | null;
  sources: { server: boolean; device: boolean; languageMix: boolean };
  metrics: Metric[];
  findings: Finding[];
  anomalies: Anomaly[];
  proposals: Proposal[];
}
