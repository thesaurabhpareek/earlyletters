/**
 * Typed days (NS-18, BL-982): a parent types a future day and a few words of their own; on that day one reminder comes.
 *
 * Where they live (NS-18 section 10, 11): phone settings only, one key a day, `typedDay.<yyyy-mm-dd>`, the value the
 * words exactly as typed. Never synced, never exported, never in analytics, a log, a crash report or a URL (NS-18-R8,
 * J-N18): nothing in this file logs, and no error it returns carries the words.
 *
 * - The words are L4 free text and may hold a name. A reminder shows the fixed line by default; the words reach the
 *   lock screen only when the one day-names switch is on, names on the lock screen is on and App lock is off
 *   (NS-18-R3, CL-119, E45, FR-NTC-11, CPrivO-58; prefs.ts `dayNamesOn` and `lockScreenNamesOn`). The app never
 *   adds to, completes or trims the words (section 14).
 * - 1 to 80 characters, counted as a person sees them (graphemes), any script (NS-18-R5, PROPOSED). Words of only
 *   spaces are empty.
 * - A day before today is refused (section 5). Today is accepted; the planner skips it if its time has passed.
 * - A day more than a year ahead is refused (`TYPED_DAY_HORIZON_DAYS`, PROPOSED, BL-2247, CPO-101): today and the 366
 *   days after are kept, so the same date next year always is, leap years included. It catches a mistyped year and
 *   bounds how long the words wait on the phone. It is the typed day's own limit, not a plan horizon: the planner
 *   plans typed days without one. The Add a day sheet's picker offers no later day (D-S08, another row).
 * - Deleted the day after delivery (NS-18-R7): `sweepPastTypedDays` removes every day before today, and runs before
 *   every plan (scheduler.ts). A day kept for today lets Home show the words after the tap.
 * - Removed at sign-out and account deletion (session.ts `endReminderSession`) and by Erase everything, which deletes
 *   every setting (NS-18-R6).
 * - Build switch `EXPO_PUBLIC_TYPED_DAYS=on` (PROPOSED flag). Off: nothing is planned, so a pending typed-day reminder
 *   is cancelled at the next plan; the stored days are kept and still swept.
 *
 * Not here: the Days page, the Add a day sheet and the Home line (screens, C-S24, D-S08, D-S09; another row).
 */
import { deleteSetting, deleteSettings, getSetting, setSetting, settingKeysWithPrefix } from '../store';
import { addDays, isoDate, parseIsoDate } from './tz';
import type { TypedDayNote } from './planner';

export const TYPED_DAY_PREFIX = 'typedDay.';
/** The most characters a typed day holds (NS-18-R5, PROPOSED). */
export const TYPED_WORDS_MAX = 80;
/** A typed day may fall on today or up to this many days counted from today, today included: today and the 366 days
 * after (PROPOSED, BL-2247, CPO-101). */
export const TYPED_DAY_HORIZON_DAYS = 367;

const DATE_KEY = /^typedDay\.(\d{4}-\d{2}-\d{2})$/;

export type TypedDayError = 'typed_day_empty' | 'typed_day_too_long' | 'typed_day_past' | 'typed_day_too_far' | 'typed_day_bad_date';
export type TypedDayCheck = { ok: true } | { ok: false; code: TypedDayError };

export const parseTypedDaysFlag = (raw: string | undefined | null): boolean => (raw ?? '').trim().toLowerCase() === 'on';
/** Inlined at bundle time: Expo only inlines `process.env.EXPO_PUBLIC_*` written out in full. */
const TYPED_DAYS_BUILD_VALUE: boolean = parseTypedDaysFlag(process.env.EXPO_PUBLIC_TYPED_DAYS);
let buildOverride: boolean | null = null;

/** Tests only. */
export function setTypedDaysBuildForTest(value: boolean | null): void {
  buildOverride = value;
}

export const typedDaysBuildEnabled = (): boolean => buildOverride ?? TYPED_DAYS_BUILD_VALUE;

/**
 * How many characters a person sees: grapheme clusters where the engine can split them (a flag or a family emoji is
 * one), code points otherwise. Hermes support for `Intl.Segmenter` is not verified on a device; code points never
 * undercount a grapheme, so the fallback can only refuse early, never let more than 80 through.
 */
export function typedWordsLength(words: string): number {
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: 'grapheme' }) => { segment(s: string): Iterable<unknown> } }).Segmenter;
  if (typeof Seg === 'function') {
    try {
      let n = 0;
      for (const _ of new Seg(undefined, { granularity: 'grapheme' }).segment(words)) n++;
      return n;
    } catch {
      // fall through to code points
    }
  }
  return Array.from(words).length;
}

/** The date key, `YYYY-MM-DD`, or null for anything that is not a real calendar date. */
export function normalTypedDate(date: string): string | null {
  const d = parseIsoDate(date);
  return d && isoDate(d) === date ? date : null;
}

/** The last day a typed day may fall on, today plus 366 (`TYPED_DAY_HORIZON_DAYS`), or null when `today` is not a date. */
function lastTypedDay(today: string): string | null {
  const from = parseIsoDate(today);
  return from ? isoDate(addDays(from, TYPED_DAY_HORIZON_DAYS - 1)) : null;
}

/**
 * The days the Add a day sheet's picker offers (D-S08, CPO-101): from tomorrow (today is not offered, G-D10) to the
 * same last day `checkTypedDay` keeps, so the picker never offers a day the save would refuse. Null when `today` is
 * not a date. `typed_day_past` and `typed_day_too_far` stay as guards for a sheet left open past midnight.
 */
export function typedDayPickerBounds(today: string): { min: string; max: string } | null {
  const from = parseIsoDate(today);
  const max = lastTypedDay(today);
  return from && max ? { min: isoDate(addDays(from, 1)), max } : null;
}

/** May these words be kept for this date, with `today` the phone's local date? The words are never part of the answer. */
export function checkTypedDay(date: string, words: string, today: string): TypedDayCheck {
  if (normalTypedDate(date) === null) return { ok: false, code: 'typed_day_bad_date' };
  if (date < today) return { ok: false, code: 'typed_day_past' };
  const last = lastTypedDay(today);
  if (last !== null && date > last) return { ok: false, code: 'typed_day_too_far' };
  if (words.trim().length === 0) return { ok: false, code: 'typed_day_empty' };
  if (typedWordsLength(words) > TYPED_WORDS_MAX) return { ok: false, code: 'typed_day_too_long' };
  return { ok: true };
}

/** Every typed day on this phone, earliest first. A key that is not a real date, or an empty value, is skipped. */
export function readTypedDays(): TypedDayNote[] {
  const out: TypedDayNote[] = [];
  for (const key of settingKeysWithPrefix(TYPED_DAY_PREFIX)) {
    const m = DATE_KEY.exec(key);
    if (!m || normalTypedDate(m[1]!) === null) continue;
    const words = getSetting(key);
    if (words != null && words.length > 0) out.push({ date: m[1]!, words });
  }
  return out;
}

/** The words for one date, as typed, or null. Home reads this after the tap (NS-18-R1). */
export function typedDayWords(date: string): string | null {
  return normalTypedDate(date) === null ? null : getSetting(`${TYPED_DAY_PREFIX}${date}`);
}

/**
 * Keeps a typed day. One a date: a second save on the same date replaces the words. The words are stored exactly as
 * given. The write fires the store listeners, which re-plan (scheduler.ts).
 */
export function saveTypedDay(date: string, words: string, today: string): TypedDayCheck {
  const check = checkTypedDay(date, words, today);
  if (check.ok) setSetting(`${TYPED_DAY_PREFIX}${date}`, words);
  return check;
}

/** Deleting a day cancels its reminder at the re-plan the write starts (section 5). */
export function deleteTypedDay(date: string): void {
  if (normalTypedDate(date) !== null) deleteSetting(`${TYPED_DAY_PREFIX}${date}`);
}

/** Every `typedDay.*` key, words and all. Sign-out and account deletion call it (session.ts). */
export function clearTypedDays(): void {
  deleteSettings(settingKeysWithPrefix(TYPED_DAY_PREFIX));
}

/**
 * NS-18-R7: a day's words go the day after it. Removes every typed day before `today` (local date), and any key in the
 * family that is not a real date. Returns how many went. A run that finds nothing writes nothing, so it does not wake
 * the store listeners.
 */
export function sweepPastTypedDays(today: string): number {
  const gone = settingKeysWithPrefix(TYPED_DAY_PREFIX).filter((key) => {
    const m = DATE_KEY.exec(key);
    return !m || normalTypedDate(m[1]!) === null || m[1]! < today;
  });
  deleteSettings(gone);
  return gone.length;
}

