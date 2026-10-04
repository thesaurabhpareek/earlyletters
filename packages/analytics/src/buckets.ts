/**
 * Raw numbers to catalogue buckets. The app never sends a raw duration,
 * count or time: it passes the number here and sends the bucket. Pure and
 * tested (test/helpers.test.ts). Bucket edges match TRACKING_PLAN 3.3.
 */
import type { Catalog } from './catalog';
import { V1_LANGUAGES, type Lang } from './catalog';

type PropValues<E extends keyof Catalog, P extends keyof Catalog[E]['props']> = Catalog[E]['props'][P] extends { values: readonly (infer V)[] } ? V : never;

export type AudioBucket = PropValues<'letter_saved', 'audio_bucket'>;
export type WordsBucket = PropValues<'letter_saved', 'words_bucket'>;
export type LettersBucket = PropValues<'book_opened', 'letters_bucket'>;
export type LatencyBucket = PropValues<'transcription_completed', 'latency_bucket'>;
export type DaysBucket = PropValues<'app_opened', 'days_since_last_open'>;
export type SessionBucket = PropValues<'app_backgrounded', 'session_bucket'>;
export type TtfiBucket = PropValues<'app_cold_start', 'ttfi_bucket'>;
export type FirstLetterBucket = PropValues<'analytics_opted_in', 'time_to_first_letter'>;
export type ExportSizeBucket = PropValues<'export_completed', 'size_bucket'>;
export type ExportDurationBucket = PropValues<'export_completed', 'duration_bucket'>;
export type ChildOrdinal = PropValues<'letter_saved', 'child_ordinal'>;
export type HourBucket = PropValues<'reminder_schedule_set', 'hour_bucket'>;

const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Negative, NaN and infinite inputs are treated as 0 so a bad clock never throws. */
const n = (x: number | null | undefined): number => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : 0);

export function audioBucket(ms: number): AudioBucket {
  const v = n(ms);
  if (v < 15 * SEC) return 'lt_15s';
  if (v < MIN) return '15_60s';
  if (v < 2 * MIN) return '1_2m';
  if (v < 5 * MIN) return '2_5m';
  return 'gt_5m';
}

export function wordsBucket(words: number): WordsBucket {
  const v = n(words);
  if (v < 25) return 'lt_25';
  if (v < 100) return '25_99';
  if (v < 300) return '100_299';
  return '300_plus';
}

export function lettersBucket(letters: number): LettersBucket {
  const v = Math.floor(n(letters));
  if (v === 0) return '0';
  if (v === 1) return '1';
  if (v <= 4) return '2_4';
  if (v <= 9) return '5_9';
  if (v <= 49) return '10_49';
  if (v <= 99) return '50_99';
  if (v <= 364) return '100_364';
  return '365_plus';
}

export function latencyBucket(ms: number): LatencyBucket {
  const v = n(ms);
  if (v < 5 * SEC) return 'lt_5s';
  if (v < 15 * SEC) return '5_15s';
  if (v < 30 * SEC) return '15_30s';
  if (v < MIN) return '30_60s';
  return 'gt_60s';
}

/** Whole days elapsed (not calendar days), so the bucket never depends on a time zone. */
export function daysBucket(ms: number): DaysBucket {
  const days = n(ms) / DAY;
  if (days < 1) return 'd0';
  if (days < 2) return 'd1';
  if (days < 8) return 'd2_7';
  if (days < 31) return 'd8_30';
  if (days < 91) return 'd31_90';
  return 'd91_plus';
}

export function sessionBucket(ms: number): SessionBucket {
  const v = n(ms);
  if (v < MIN) return 'lt_1m';
  if (v < 5 * MIN) return '1_5m';
  if (v < 15 * MIN) return '5_15m';
  return 'gt_15m';
}

export function ttfiBucket(ms: number): TtfiBucket {
  const v = n(ms);
  if (v < SEC) return 'lt_1s';
  if (v < 2 * SEC) return '1_2s';
  if (v < 3 * SEC) return '2_3s';
  return 'gt_3s';
}

/** Time from first launch to the first saved letter; `unknown` when either time is missing. */
export function timeToFirstLetterBucket(ms: number | null | undefined): FirstLetterBucket {
  if (ms === null || ms === undefined || !Number.isFinite(ms) || ms < 0) return 'unknown';
  if (ms < 90 * SEC) return 'lt_90s';
  if (ms < 5 * MIN) return '90s_5m';
  if (ms < 30 * MIN) return '5_30m';
  if (ms < DAY) return '30m_24h';
  return 'gt_24h';
}

export function exportSizeBucket(bytes: number): ExportSizeBucket {
  const mb = n(bytes) / (1024 * 1024);
  if (mb < 10) return 'lt_10mb';
  if (mb < 100) return '10_100mb';
  if (mb < 500) return '100_500mb';
  return 'gt_500mb';
}

export function exportDurationBucket(ms: number): ExportDurationBucket {
  const v = n(ms);
  if (v < 30 * SEC) return 'lt_30s';
  if (v < 2 * MIN) return '30s_2m';
  return 'gt_2m';
}

/** 0-based position of the book among the viewer's books (creation order). Never an id. */
export function childOrdinal(index: number): ChildOrdinal {
  const v = Math.floor(n(index));
  if (v === 0) return 'first';
  if (v === 1) return 'second';
  return 'third_plus';
}

/** Local hour (0 to 23) of a reminder time, as a coarse part of the day. */
export function hourBucket(hour: number): HourBucket {
  const h = ((Math.floor(n(hour)) % 24) + 24) % 24;
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'late_evening';
}

/** Clamp to a catalogue int range (counts over the cap are sent as the cap). */
export function clampInt(value: number, min: number, max: number): number {
  const v = Math.round(Number.isFinite(value) ? value : min);
  return Math.min(max, Math.max(min, v));
}

/**
 * BCP 47 or ISO code ('pt-BR', 'zh-Hans', 'HI') to one of the seven v1.0
 * languages, or null when it is not one of them (then nothing is sent).
 */
export function toV1Lang(code: string | null | undefined): Lang | null {
  if (!code) return null;
  const primary = code.trim().toLowerCase().split(/[-_]/)[0];
  const alias: Record<string, string> = { cmn: 'zh', zho: 'zh', chi: 'zh', hin: 'hi', spa: 'es', fra: 'fr', fre: 'fr', ara: 'ar', por: 'pt', eng: 'en' };
  const v = alias[primary] ?? primary;
  return (V1_LANGUAGES as readonly string[]).includes(v) ? (v as Lang) : null;
}
