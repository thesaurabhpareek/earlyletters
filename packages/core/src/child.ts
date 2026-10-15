/**
 * Child details: the rules for a name, a birthday, a due date and a signature, shared by
 * first run, "Add a child" and the child settings screen, so all three agree.
 *
 * Dates are ISO calendar days (YYYY-MM-DD) with no time zone, like age.ts, which stays the
 * only place age and month-of-age are computed. Nothing here touches a letter: a letter
 * keeps its own captured date, raw transcript and signature; the month chapter a letter
 * sits in is worked out from the child's birthday each time it is shown (chapterOf), so
 * changing the birthday re-chapters letters without writing to them.
 */
import { ageOn } from './age';

/** Matches children.name check (char_length between 1 and 60) in supabase/migrations. */
export const CHILD_NAME_MAX = 60;
/** Matches entries.author_signs_as check (char_length <= 30). */
export const SIGNS_AS_MAX = 30;
/** A due date can be at most this many days ahead (first run's date picker). */
export const DUE_DATE_MAX_DAYS = 305;
/** The database refuses a birthday before this (create_child: date_of_birth >= 1900-01-01). */
export const EARLIEST_BIRTHDAY = '1900-01-01';
/** Show the soft "limit" hint once a field is this close to its cap. */
export const LIMIT_HINT_FROM = 10;

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

function dayNumber(iso: string): number {
  const m = ISO.exec(iso);
  if (!m) throw new Error(`Invalid ISO date: ${iso}`);
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(y, mo - 1, d);
  // Reject 2026-02-31 style dates, which Date.UTC would roll over.
  const back = new Date(t);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) throw new Error(`Invalid ISO date: ${iso}`);
  return t / 86_400_000;
}

/** True for a real calendar day written YYYY-MM-DD. */
export function isIsoDate(iso: string): boolean {
  try {
    dayNumber(iso);
    return true;
  } catch {
    return false;
  }
}

/** ISO day `days` after (or before, when negative) `iso`. */
export function addDaysISO(iso: string, days: number): string {
  return new Date((dayNumber(iso) + days) * 86_400_000).toISOString().slice(0, 10);
}

/** Whole days from `fromISO` to `toISO` (negative when `toISO` is earlier). */
export function daysBetweenISO(fromISO: string, toISO: string): number {
  return dayNumber(toISO) - dayNumber(fromISO);
}

/**
 * Cuts to at most `max` characters a person would count (code points, never half a
 * surrogate pair or an emoji), and normalises to NFC so a name typed two ways is stored one way.
 */
export function clampText(raw: string, max: number): string {
  const chars = Array.from(raw.normalize('NFC'));
  return chars.length <= max ? chars.join('') : chars.slice(0, max).join('');
}

/** Characters a person would count (code points after NFC). */
export function textLength(raw: string): number {
  return Array.from(raw.normalize('NFC')).length;
}

export type FieldCheck<R extends string> = { ok: true; value: string } | { ok: false; reason: R };

/** A child's name: trimmed, 1 to 60 characters. Over the limit is reported, never silently cut. */
export function checkChildName(raw: string): FieldCheck<'empty' | 'tooLong'> {
  const value = raw.normalize('NFC').trim();
  if (!value) return { ok: false, reason: 'empty' };
  if (textLength(value) > CHILD_NAME_MAX) return { ok: false, reason: 'tooLong' };
  return { ok: true, value };
}

/** What the child calls the parent ("Papa"): trimmed, 1 to 30 characters. */
export function checkSignsAs(raw: string): FieldCheck<'empty' | 'tooLong'> {
  const value = raw.normalize('NFC').trim();
  if (!value) return { ok: false, reason: 'empty' };
  if (textLength(value) > SIGNS_AS_MAX) return { ok: false, reason: 'tooLong' };
  return { ok: true, value };
}

/** True when a field of `max` characters holds `length` and is close enough to say so softly. */
export function nearLimit(length: number, max: number): boolean {
  return length >= max - LIMIT_HINT_FROM;
}

/** A birthday: a real day, today or earlier. */
export function checkBirthday(iso: string | null, todayISO: string): FieldCheck<'missing' | 'invalid' | 'future'> {
  if (!iso) return { ok: false, reason: 'missing' };
  if (!isIsoDate(iso) || iso < EARLIEST_BIRTHDAY) return { ok: false, reason: 'invalid' };
  if (daysBetweenISO(todayISO, iso) > 0) return { ok: false, reason: 'future' };
  return { ok: true, value: iso };
}

/** A due date: a real day from today up to DUE_DATE_MAX_DAYS ahead (the first-run picker's range). */
export function checkDueDate(iso: string | null, todayISO: string): FieldCheck<'missing' | 'invalid' | 'past' | 'tooFar'> {
  if (!iso) return { ok: false, reason: 'missing' };
  if (!isIsoDate(iso)) return { ok: false, reason: 'invalid' };
  const ahead = daysBetweenISO(todayISO, iso);
  if (ahead < 0) return { ok: false, reason: 'past' };
  if (ahead > DUE_DATE_MAX_DAYS) return { ok: false, reason: 'tooFar' };
  return { ok: true, value: iso };
}

/** The latest due date the picker offers today. */
export function latestDueDate(todayISO: string): string {
  return addDaysISO(todayISO, DUE_DATE_MAX_DAYS);
}

/** After the due date has gone by (the day itself still counts as "due"). */
export function dueDatePassed(dueISO: string | null, todayISO: string): boolean {
  return !!dueISO && isIsoDate(dueISO) && daysBetweenISO(dueISO, todayISO) > 0;
}

/** The stored fields a child's date lives in. */
export interface ChildDates {
  birthday: string | null;
  dueDate: string | null;
}

/**
 * "Asha was born": the due date becomes the birthday. Returns the patch to store, or why not.
 * The due date is cleared in the same step so a child never has both. Letters are not touched.
 */
export function bornPatch(current: ChildDates, birthdayISO: string, todayISO: string): { ok: true; patch: ChildDates } | { ok: false; reason: 'alreadyBorn' | 'missing' | 'invalid' | 'future' } {
  if (current.birthday) return { ok: false, reason: 'alreadyBorn' };
  const c = checkBirthday(birthdayISO, todayISO);
  if (!c.ok) return { ok: false, reason: c.reason };
  return { ok: true, patch: { birthday: c.value, dueDate: null } };
}

/** Where the birthday picker starts when a due date has passed: the due date itself (never after today). */
export function bornPickerStart(dueISO: string | null, todayISO: string): string {
  return dueISO && isIsoDate(dueISO) && daysBetweenISO(dueISO, todayISO) >= 0 ? dueISO : todayISO;
}

/**
 * The age shown for a child on a day, or null before a birthday is known.
 * One answer for every screen (and the tests that pin it): months of age, from age.ts.
 */
export function monthOfAgeOn(birthdayISO: string | null, onISO: string): number | null {
  if (!birthdayISO) return null;
  const a = ageOn(birthdayISO, onISO);
  return a.days < 0 ? null : a.months;
}
