/**
 * The recency and last-letter layers of the reminder key (NS-48-R3, R5, R27). Pure: no clock, no store, no React
 * Native. They only choose which catalogue key supplies a note's words, so they can never add, remove or move a note
 * (the planner has already decided that). Both sit above the floor in `notification-key.ts` and fall back to it.
 *
 * Words: no catalogue exists yet (new words wait for G3), so `EMPTY_CATALOGUE` is the shipped value and both layers
 * answer null; the floor then runs exactly as before. A catalogue only ever arrives as data passed to
 * `layeredSelector`; nothing here holds a string a parent reads.
 */
import { EVENING_FROM_MINUTES, selectFloorOnly, type KeyInput, type KeySelector } from './notification-key';

export type RecencyBand = 'r1' | 'r2' | 'r3' | 'r4';
/** What a made letter was, as far as a reminder may know (NS-48-R27). `first` and `small` have no flag yet. */
export type LastLetterKind = 'spoke' | 'typed';

/** A catalogue key and whether its words name the evening (day part, NS-48-R12). */
export interface LayerKey {
  key: string;
  evening: boolean;
}

export interface LayerCatalogue {
  /** Keys per recency band. A key belongs to one band only: the pools never overlap (NS-48-R3). */
  recency: Partial<Record<RecencyBand, readonly LayerKey[]>>;
  /** Keys per last-letter kind, used only when the last letter is within 6 days (NS-48-R5). */
  kind: Partial<Record<LastLetterKind, readonly LayerKey[]>>;
}

export const EMPTY_CATALOGUE: LayerCatalogue = { recency: {}, kind: {} };

/** Last day of the last-letter layer: a letter older than this shapes nothing (NS-48-R5). */
export const LAST_LETTER_LAST_DAY = 6;

/**
 * Recency from plan-time day numbers (NS-48-R3): fire date minus anchor date, r1 the next day, r2 days 2 to 6, r3
 * days 7 to 14, r4 days 15 to 35. An anchor after the fire date is clamped to it (gap 0 reads as r1). Null when
 * either day is unknown or past day 35, so the floor runs.
 */
export function recencyBand(fireDay: number, anchorDay: number | null | undefined): RecencyBand | null {
  if (anchorDay == null || !Number.isFinite(anchorDay) || !Number.isFinite(fireDay)) return null;
  const gap = fireDay - anchorDay; // an anchor after the fire date is a gap of 0 or less: r1 (clamped, NS-48-R3)
  if (gap <= 1) return 'r1';
  if (gap <= 6) return 'r2';
  if (gap <= 14) return 'r3';
  if (gap <= 35) return 'r4';
  return null;
}

/**
 * The kind a reminder may know (NS-48-R27): a spoken letter is `spoke`; typed, mixed and a note are `typed`; a quiet-day
 * mark (`not_much`) is not a letter, so null. Anything unrecognised is null (the grid runs).
 */
export function lastLetterKind(captureMode: string, entryKind: string): LastLetterKind | null {
  if (entryKind === 'not_much') return null;
  if (entryKind === 'note') return 'typed';
  if (captureMode === 'spoken') return 'spoke';
  if (captureMode === 'typed' || captureMode === 'mixed') return 'typed';
  return null;
}

function pick(pool: readonly LayerKey[] | undefined, input: KeyInput): string | null {
  if (!pool || pool.length === 0) return null;
  const evening = !(input.minutesOfDay < EVENING_FROM_MINUTES);
  const eligible = pool.filter((k) => evening || !k.evening);
  if (eligible.length === 0) return null;
  const n = Number.isFinite(input.slotOrdinal) ? Math.floor(input.slotOrdinal) : 0;
  return eligible[((n % eligible.length) + eligible.length) % eligible.length].key;
}

/**
 * Layer order (NS-48-R5): the last-letter layer when the letter is within 6 days and the kind is known, then the
 * recency layer, then null (the floor). The caller passes the recency band and the kind computed at plan time.
 */
export function selectLayered(input: KeyInput, catalogue: LayerCatalogue): string | null {
  const kind = input.recency && isWithinLastLetterWindow(input.recency) ? input.lastKind : null;
  if (kind) {
    const k = pick(catalogue.kind[kind], input);
    if (k) return k;
  }
  return input.recency ? pick(catalogue.recency[input.recency], input) : null;
}

function isWithinLastLetterWindow(band: RecencyBand): boolean {
  return band === 'r1' || band === 'r2';
}

/** A selector over a catalogue: layers first, the floor when no layer answers. Never throws, never empty. */
export function layeredSelector(catalogue: LayerCatalogue): KeySelector {
  return (input) => selectLayered(input, catalogue) ?? selectFloorOnly(input);
}
