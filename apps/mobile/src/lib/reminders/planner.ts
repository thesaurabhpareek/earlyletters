/**
 * Reminder schedule planner (PRD C F1, F2; C-REQ-002, -003, -004, -006,
 * -009, -011). Pure: given the preferences, the children, the clock, the
 * time zone and the last save, it returns exactly which local notifications
 * should exist. The scheduler (scheduler.ts) cancels ours and schedules this
 * list again on every change, so the planner is the whole policy.
 *
 * Rules:
 * - Evening nudges on the chosen weekdays at the chosen time, never outside
 *   07:00 to 21:30 local time (C-REQ-003; `window` can narrow it). Times are
 *   clamped to that window in 15-minute steps, birthdays included.
 * - Smart quiet (F2): no nudge within 20 hours of the user's last save, or
 *   within 2 hours of the app being open.
 * - Month notes on each included child's month-day at the reminder time; on
 *   a birthday, the birthday note at 09:00 instead (C-REQ-011). A month-day
 *   that does not exist (born on the 31st) falls on the month's last day,
 *   matching packages/core ageOn. Children with only a due date get none
 *   until they are born.
 * - At most one note a day, by rank (budget.ts `chooseOnePerDay`): a birthday beats a month note beats the evening
 *   nudge on the same date (F2 "not the birthday"; NS-32-R1b). At most 60 pending in total, plan notices first.
 * - Copy rotates through the built evening variants by slot order (NS-48
 *   phase 1: `select`, `@scribe/core` notification-key; evening-worded ones
 *   only from 17:00), so no variant repeats within the pool and no title shows twice in a row (C-REQ-006).
 * - No child name unless the user turned "Names in notifications" on
 *   (D-025). Never any letter text.
 * - A quieted book adds nothing (F12-REQ-011; NS-13-R12, NS-32-R14): no
 *   month or birthday note, never named, and while every book is quiet no
 *   evening nudge either.
 * - Typed days (NS-18, BL-982; `typedDays`): one note on the day, at the reminder time, and it outranks every other
 *   note that day (NS-13-R29, NS-18-R2). The back-off, smart quiet and quiet books never drop it (NS-18-R4), and it
 *   comes with Reminders off too, while notifications are allowed (GAP-LOG D W-G7, G-D09). Title and body are the
 *   fixed line unless `dayNamesOn` and names on the lock screen are both on (NS-18-R3 with FR-NTC-11, CPrivO-58);
 *   then the body is the parent's words unchanged. The words may hold a child's name, so names off always means the
 *   fixed line. More typed days than slots: nearest first, the rest at a later plan.
 *
 * - Back-off (NS-13 section 3a; R3, R4, R18): counted from the anchor day (`anchorAt`). Evening nudges follow the
 *   cadence on days 1 to 7, then at most one in each 7-day block on days 8 to 35, then nothing. Month and birthday
 *   notes only on days 0 to 35. A parent who never opens the app gets nothing after day 35. No screen says so.
 *
 * Not here (P1, later): `gentleReturn`, plan notices, per-book "pause celebrations".
 */
import { en } from '@scribe/content';
import { eligibleFloorIndexes, floorIndexOfKey, recencyBand, selectNotificationKey, type KeyInput, type KeySelector, type LastLetterKind } from '@scribe/core';
import { childLabel, fill } from '../copy';
import { budgetedSlots, chooseOnePerDay, heldDays, PLAN_MAX, TOTAL_MAX } from './budget';
import { reminderCopy } from './copy';
import {
  addDays,
  dayNumber,
  isoDate,
  monthDay,
  parseIsoDate,
  weekdayOf,
  zonedParts,
  zonedToEpoch,
  type CalendarDate,
} from './tz';

export type Cadence = 'off' | 'weekly' | 'fewTimes' | 'everyEvening';

export interface ReminderTime {
  hour: number;
  minute: number;
}

export interface ReminderPrefs {
  /** The user turned reminders on (the OS permission is checked separately). */
  enabled: boolean;
  /** "Pause all reminders" (C-REQ-007): nothing at all while on. */
  paused: boolean;
  /** 'off' keeps month notes but no evening nudges. */
  cadence: Cadence;
  /** Weekdays (0 = Sunday) for "A few times a week". */
  days: number[];
  /** The one weekday for "Weekly". */
  weeklyDay: number;
  time: ReminderTime;
  monthNotes: boolean;
  /** "Names in notifications" (C-REQ-009); off by default (D-025). */
  namesOnLockScreen: boolean;
}

export interface PlannerChild {
  id: string;
  name: string;
  /** YYYY-MM-DD, or null while expecting (due date only). */
  birthday: string | null;
  /** "Include {child} in my reminders" (Child.remindersOn). */
  included: boolean;
  /** "Quiet this book" is on for this person (Child.quiet): the book adds no notification of any kind. */
  quiet?: boolean;
}

/** A day the parent typed (typed-days.ts): its local date and their words, exactly as typed. */
export interface TypedDayNote {
  date: string;
  words: string;
}

/** The newest made letter as the layers read it (NS-48-R27): epoch ms of `captured_at` and its kind, null when unknown. */
export interface LastLetter {
  at: number;
  kind: LastLetterKind | null;
}

export interface PlanInput {
  /** The newest letter this phone's user made (prefs.ts `lastMadeLetter`). Absent: the layers do not run (the floor). */
  lastLetter?: LastLetter | null;
  now: number;
  timeZone: string;
  prefs: ReminderPrefs;
  children: PlannerChild[];
  /** Newest save by this user (epoch ms), for smart quiet. */
  lastSaveAt?: number | null;
  /** When the app last came to the foreground (epoch ms). */
  lastForegroundAt?: number | null;
  /**
   * The anchor (NS-13 section 3a, R27): the later of the newest made letter (kept, or a draft waiting at Keep or held)
   * and the moment reminders were last turned on, epoch ms. Its local date is day 0 of the back-off. Null or absent:
   * no anchor is known, so no back-off is applied (prefs.ts `anchorAt` always has one once reminders are on).
   */
  anchorAt?: number | null;
  /** Evening nudges are planned this many days ahead (default 21). */
  horizonDays?: number;
  /** Month and birthday notes are planned this many days ahead (default 92). */
  monthHorizonDays?: number;
  /** Fewer budgeted notes than the budget allows, for tests and narrow plans. Never more: the total stays at `TOTAL_MAX` (60). */
  maxNotifications?: number;
  /**
   * How many plan notices (trial and renewal, `plan.` ids, owned by lib/billing) are pending. They come first inside
   * the 60 in total, so the planner leaves them their slots (CR-69 A1, NS-32-R4b). Default `PLAN_MAX` (4): the most they
   * can be, so the total is at most 60 even before the scheduler passes the real count.
   */
  planPending?: number;
  /**
   * The hours reminders may use, in local minutes of the day (default 07:00 to
   * 21:30). Remote config may narrow it later (C-NFR-009); an invalid window
   * falls back to the default.
   */
  window?: ReminderWindow;
  /** Days the parent typed (typed-days.ts `readTypedDays`). Absent or empty: none. */
  typedDays?: readonly TypedDayNote[];
  /**
   * The one day-names switch, effective value (prefs.ts `dayNamesOn`: stored on and App lock off). Off or absent: a
   * typed day's body is the fixed line and never the words (NS-18-R3, CL-119). On is not enough by itself: the words
   * show only when `prefs.namesOnLockScreen` is on too, because they may name a child (FR-NTC-11, CPrivO-58).
   */
  dayNamesOn?: boolean;
  /**
   * Picks the catalogue key for each evening nudge (NS-48-R2): the planner
   * has already decided the note, this only chooses its words. Tests inject
   * another selector to prove volume does not depend on it; an unknown key
   * or a throw falls back to the floor (NS-48-R15).
   */
  select?: KeySelector;
}

/** Local minutes of the day, inclusive: reminders fire only between `earliest` and `latest`. */
export interface ReminderWindow {
  earliest: number;
  latest: number;
}

export type PlannedKind = 'evening' | 'monthAge' | 'birthday' | 'typedDay';

export interface PlannedNotification {
  /** Stable per day and kind, so a re-plan that changes nothing changes no ids. */
  id: string;
  kind: PlannedKind;
  /** Local calendar date and wall-clock time; iOS fires it at this local time wherever the phone is. */
  date: string;
  hour: number;
  minute: number;
  /** The instant in `timeZone` (ordering, quiet checks, Android triggers). */
  fireAt: number;
  title: string;
  body: string;
  /** Catalogue key of the words (NS-48). Never sent in the payload (NS-48-R31). */
  key?: string;
  /** Index into the evening variants. */
  variant?: number;
  /** Month of age for month notes; years for birthdays. */
  month?: number;
}

export const ID_PREFIX = 'el.';
export const EARLIEST_MINUTES = 7 * 60; // 07:00
export const LATEST_MINUTES = 21 * 60 + 30; // 21:30
export const STEP_MINUTES = 15;
export const DEFAULT_WINDOW: ReminderWindow = { earliest: EARLIEST_MINUTES, latest: LATEST_MINUTES };
export const DEFAULT_TIME: ReminderTime = { hour: 20, minute: 30 };
export const DEFAULT_DAYS = [2, 6]; // Tuesday and Saturday (C-REQ-002)
export const DEFAULT_WEEKLY_DAY = 6; // Saturday (F13 section 6, K-03)
export const BIRTHDAY_TIME: ReminderTime = { hour: 9, minute: 0 };
export const RECENT_SAVE_QUIET_MS = 20 * 3_600_000;
/** Last day, counted from the anchor, that an evening nudge, month note or birthday note may fall on (R4, R18). */
export const BACKOFF_LAST_DAY = 35;
/** Days 1 to this many follow the chosen cadence; later days are one a 7-day block (R3). */
export const CADENCE_DAYS = 7;
export const FOREGROUND_QUIET_MS = 2 * 3_600_000;
const MIN_LEAD_MS = 60_000;

const VARIANTS = en.notifications.evening.length;

export const DEFAULT_PREFS: ReminderPrefs = {
  enabled: false,
  paused: false,
  cadence: 'fewTimes',
  days: DEFAULT_DAYS,
  weeklyDay: DEFAULT_WEEKLY_DAY,
  time: DEFAULT_TIME,
  monthNotes: true,
  namesOnLockScreen: false,
};

/** A usable window: whole minutes, inside the day, at least an hour long; anything else is the default. */
export function normalizeWindow(window: ReminderWindow | null | undefined): ReminderWindow {
  if (!window) return DEFAULT_WINDOW;
  const { earliest, latest } = window;
  const ok = Number.isInteger(earliest) && Number.isInteger(latest) && earliest >= 0 && latest <= 23 * 60 + 59 && latest - earliest >= 60;
  return ok ? { earliest, latest } : DEFAULT_WINDOW;
}

/** True for a wall-clock time inside the quiet hours (by default after 21:30 or before 07:00). */
export function isQuietTime(hour: number, minute: number, window: ReminderWindow = DEFAULT_WINDOW): boolean {
  const w = normalizeWindow(window);
  const t = hour * 60 + minute;
  return t < w.earliest || t > w.latest;
}

/**
 * Snap to 15-minute steps and keep inside the window, 07:00 to 21:30 by
 * default (C-REQ-003). `clamped` is true when the asked time was outside the
 * window, so the screen can say "We keep late nights quiet."
 */
export function clampReminderTime(time: ReminderTime, window: ReminderWindow = DEFAULT_WINDOW): { time: ReminderTime; clamped: boolean } {
  const w = normalizeWindow(window);
  const asked = Math.max(0, Math.min(23 * 60 + 59, Math.round(time.hour) * 60 + Math.round(time.minute)));
  const stepped = Math.round(asked / STEP_MINUTES) * STEP_MINUTES;
  // Step inside the window: round the edges inwards so a clamped time is still on a 15-minute step.
  const lo = Math.ceil(w.earliest / STEP_MINUTES) * STEP_MINUTES;
  const hi = Math.floor(w.latest / STEP_MINUTES) * STEP_MINUTES;
  const clampedMinutes = Math.max(lo, Math.min(hi, stepped));
  return {
    time: { hour: Math.floor(clampedMinutes / 60), minute: clampedMinutes % 60 },
    clamped: asked < w.earliest || asked > w.latest,
  };
}

/** Weekdays an evening nudge may fall on, for a cadence. */
export function activeWeekdays(prefs: Pick<ReminderPrefs, 'cadence' | 'days' | 'weeklyDay'>): number[] {
  switch (prefs.cadence) {
    case 'everyEvening':
      return [0, 1, 2, 3, 4, 5, 6];
    case 'weekly':
      return [normalizeWeekday(prefs.weeklyDay, DEFAULT_WEEKLY_DAY)];
    case 'fewTimes': {
      const days = [...new Set(prefs.days.map((d) => normalizeWeekday(d, -1)).filter((d) => d >= 0))].sort((a, b) => a - b);
      return days.length > 0 ? days : DEFAULT_DAYS;
    }
    default:
      return [];
  }
}

function normalizeWeekday(d: number, fallback: number): number {
  return Number.isInteger(d) && d >= 0 && d <= 6 ? d : fallback;
}

/**
 * How many nudge days (of the selected weekdays) come strictly before this
 * date, counted from 1970-01-01. Consecutive nudges get consecutive numbers
 * whatever the weekday pattern, which drives the copy rotation and the order
 * in which children are named.
 */
export function slotOrdinal(date: CalendarDate, weekdays: number[]): number {
  const n = dayNumber(date);
  const full = Math.floor(n / 7);
  const rem = n - full * 7;
  const epochWeekday = 4; // 1970-01-01 was a Thursday
  let partial = 0;
  for (let j = 0; j < rem; j++) if (weekdays.includes((epochWeekday + j) % 7)) partial++;
  return full * weekdays.length + partial;
}

const NAMES_CHILD = en.notifications.evening.map((v) => /\{child\}/.test(`${v.title} ${v.body}`));
const ALL_VARIANTS: readonly number[] = Array.from({ length: VARIANTS }, (_, i) => i);

/**
 * How many name-bearing nudges come before this one. Children are named in
 * turn by this count, so a variant without a name ("Tonight's letter") never
 * makes one child come up twice in a row or less often (PRD C F1, K-12).
 * DEVIATES from NS-48-R20 as written (erratum to be filed): R20 says ordinal
 * modulo the books, whatever the pool. This counts name-bearing nudges over the
 * eligible pool; from 17:00 that is the built rotation (R23), so it stays.
 */
export function namedSlotIndex(ordinal: number, pool: readonly number[] = ALL_VARIANTS): number {
  const named = pool.filter((v) => NAMES_CHILD[v]).length;
  const cycle = Math.floor(ordinal / pool.length);
  let before = 0;
  for (let p = 0; p < ordinal % pool.length; p++) if (NAMES_CHILD[pool[p]]) before++;
  return cycle * named + before;
}

/** "Asha", "Asha and Dev", "Asha, Dev and Nina". */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function eveningCopy(variant: number, date: CalendarDate, childName: string | null): { title: string; body: string } {
  const values = { child: childName ?? '', weekday: reminderCopy.weekdays[weekdayOf(date)] };
  const v = childName ? en.notifications.evening[variant] : reminderCopy.neutral.evening[variant];
  return { title: fill(v.title, values), body: fill(v.body, values) };
}

interface DayNote {
  kind: 'monthAge' | 'birthday';
  date: CalendarDate;
  children: { child: PlannerChild; months: number }[];
}

function monthNoteCopy(note: DayNote, names: boolean): { title: string; body: string } {
  const childNames = joinNames(note.children.map((c) => childLabel(c.child.name)));
  const months = note.children[0].months;
  if (note.kind === 'birthday') {
    if (names) return { title: fill(en.notifications.birthday.title, { child: childNames }), body: en.notifications.birthday.body };
    return note.children.length > 1 ? { ...reminderCopy.neutral.birthdays } : { ...reminderCopy.neutral.birthday };
  }
  if (note.children.length === 1) {
    const v = names ? en.notifications.monthOpen : reminderCopy.neutral.monthOpen;
    return { title: fill(v.title, { month: months, child: childNames }), body: fill(v.body, { month: months, child: childNames }) };
  }
  const t = reminderCopy.together;
  const sameMonth = note.children.every((c) => c.months === months);
  return {
    // Names off: no month number on a lock screen, the age would leak (E82, NS-32-R12).
    title: names ? (sameMonth ? fill(en.notifications.monthOpen.title, { month: months }) : t.monthTitle) : reminderCopy.neutral.monthOpen.title,
    body: names ? fill(t.monthBodyNames, { child: childNames }) : reminderCopy.neutral.lockBody,
  };
}

/**
 * The typed day's words for the lock screen: the fixed line by default. The words, unchanged, only with day names on
 * and names on (both already false under App lock). The parent's words may hold a child's name, and names off means no
 * name on a lock screen in any note (FR-NTC-11, NS-48-R11, CPrivO-58). The words are never read or searched here.
 */
function typedDayCopy(t: TypedDayNote, dayNamesOn: boolean, namesOn: boolean): { title: string; body: string } {
  const fixed = reminderCopy.neutral.typedDay;
  return { title: fixed.title, body: dayNamesOn && namesOn ? t.words : fixed.body };
}

/** The typed days worth planning: a real date, today or later, words present (not only spaces), one a date (the first given wins). */
function typedCandidates(typed: readonly TypedDayNote[] | undefined, today: CalendarDate): { source: 'typedDay'; date: string; typed: TypedDayNote }[] {
  const seen = new Set<string>();
  const out: { source: 'typedDay'; date: string; typed: TypedDayNote }[] = [];
  for (const t of typed ?? []) {
    const d = parseIsoDate(t.date);
    if (!d || isoDate(d) !== t.date || dayNumber(d) < dayNumber(today) || seen.has(t.date) || t.words.trim().length === 0) continue;
    seen.add(t.date);
    out.push({ source: 'typedDay', date: t.date, typed: t });
  }
  return out;
}

function at(date: CalendarDate, time: ReminderTime, timeZone: string): number {
  return zonedToEpoch({ ...date, hh: time.hour, mm: time.minute }, timeZone);
}

/** Drops anything that would land in quiet hours in this zone (C-REQ-004: a zone shift never wakes anyone). */
function inQuietHours(fireAt: number, timeZone: string, window: ReminderWindow): boolean {
  const p = zonedParts(fireAt, timeZone);
  return isQuietTime(p.hh, p.mm, window);
}

/** The injected selector's key if it is one of ours; otherwise the floor, so a note is never without words. */
function chooseKey(select: KeySelector, slot: number, minutesOfDay: number, layers: Pick<KeyInput, 'recency' | 'lastKind'> = {}): string {
  try {
    const key = select({ slotOrdinal: slot, minutesOfDay, ...layers });
    const index = floorIndexOfKey(key); // eligible now only: no evening-worded key before 17:00 (NS-48-R12)
    if (index !== null && eligibleFloorIndexes(minutesOfDay).includes(index)) return key;
  } catch {
    // fall through to the floor
  }
  return selectNotificationKey({ slotOrdinal: slot, minutesOfDay });
}

/**
 * Back-off for one evening date (NS-13 section 3a, R3): `offset` is days after the anchor. Days 1 to 7 take every chosen
 * weekday; days 8 to 35 take only the first chosen weekday of each 7-day block (8 to 14, 15 to 21, 22 to 28, 29 to 35);
 * day 0 (the anchor itself) and anything past day 35 take none.
 */
export function eveningDayAllowed(offset: number, date: CalendarDate, weekdays: number[]): boolean {
  if (offset < 1 || offset > BACKOFF_LAST_DAY) return false;
  if (offset <= CADENCE_DAYS) return true;
  const blockStart = CADENCE_DAYS + 1 + Math.floor((offset - CADENCE_DAYS - 1) / 7) * 7;
  for (let k = blockStart; k < blockStart + 7; k++) {
    if (weekdays.includes(weekdayOf(addDays(date, k - offset)))) return k === offset;
  }
  return false;
}

export function planReminders(input: PlanInput): PlannedNotification[] {
  const { now, timeZone, prefs } = input;
  const select = input.select ?? selectNotificationKey;
  const max = Math.max(0, Math.min(input.maxNotifications ?? TOTAL_MAX, budgetedSlots(input.planPending ?? PLAN_MAX)));
  const window = normalizeWindow(input.window);
  const time = clampReminderTime(prefs.time, window).time;
  const todayParts = zonedParts(now, timeZone);
  const today: CalendarDate = { y: todayParts.y, m: todayParts.m, d: todayParts.d };
  const typed = typedCandidates(input.typedDays, today);
  /** A typed day's note, or null when its time has passed or lands in quiet hours. Never dropped by the back-off. */
  const typedNote = (t: TypedDayNote): PlannedNotification | null => {
    const date = parseIsoDate(t.date)!;
    const fireAt = at(date, time, timeZone);
    if (fireAt <= now + MIN_LEAD_MS || inQuietHours(fireAt, timeZone, window)) return null;
    const c = typedDayCopy(t, input.dayNamesOn === true, prefs.namesOnLockScreen === true);
    return { id: `${ID_PREFIX}typed.${t.date}`, kind: 'typedDay', date: t.date, hour: time.hour, minute: time.minute, fireAt, title: c.title, body: c.body };
  };
  // Reminders off (or the old pause): a typed day is the parent's own ask, so it still comes (W-G7). Nothing else does.
  if (!prefs.enabled || prefs.paused) {
    const only = typed.map((c) => typedNote(c.typed)).filter((n): n is PlannedNotification => n !== null);
    return only.sort((a, b) => a.fireAt - b.fireAt || a.id.localeCompare(b.id)).slice(0, max);
  }

  const horizon = Math.max(1, input.horizonDays ?? 21);
  const monthHorizon = Math.max(horizon, input.monthHorizonDays ?? 92);
  const birthdayTime = clampReminderTime(BIRTHDAY_TIME, window).time;
  // The back-off, when an anchor is known: day 0 is the anchor's local date, nothing after day 35 (replaces the horizons).
  const anchorDay = input.anchorAt != null && Number.isFinite(input.anchorAt) ? dayNumber(zonedParts(input.anchorAt, timeZone)) : null;
  const lastDay = anchorDay !== null ? anchorDay + BACKOFF_LAST_DAY : dayNumber(today) + monthHorizon - 1;
  const eveningLastDay = anchorDay !== null ? anchorDay + BACKOFF_LAST_DAY : dayNumber(today) + horizon - 1;
  const lastLetterDay = input.lastLetter && Number.isFinite(input.lastLetter.at) ? dayNumber(zonedParts(input.lastLetter.at, timeZone)) : null;
  const awake = input.children.filter((c) => !c.quiet);
  const included = awake.filter((c) => c.included);
  const out: PlannedNotification[] = [];

  // Month and birthday notes, grouped by day and kind.
  const notes = new Map<string, DayNote>();
  if (prefs.monthNotes) {
    for (const child of included) {
      const birth = child.birthday ? parseIsoDate(child.birthday) : null;
      if (!birth || dayNumber(birth) > dayNumber(today)) continue; // still expecting, or a future date: nothing yet
      for (let k = 1; k < 12 * 120; k++) {
        const date = monthDay(birth, k);
        const n = dayNumber(date);
        if (n > lastDay) break;
        if (n < dayNumber(today) || (anchorDay !== null && n < anchorDay)) continue;
        const kind = k % 12 === 0 ? 'birthday' : 'monthAge';
        const key = `${kind}:${isoDate(date)}`;
        const note = notes.get(key) ?? { kind, date, children: [] };
        note.children.push({ child, months: kind === 'birthday' ? k / 12 : k });
        notes.set(key, note);
      }
    }
  }
  // One budgeted note a local day (NS-32-R1, R1b, R3): a birthday and a month-day on one date are one note, the
  // birthday. The day's one note is chosen BEFORE the lead-time and quiet-hour drops, so a passed birthday note still
  // holds its day and nothing of lower rank fills it in.
  // A typed day is in the same choice, so it holds its day against a birthday or month note (NS-18-R2, NS-13-R29).
  const chosenNotes = chooseOnePerDay<{ source: 'typedDay' | DayNote['kind']; date: string; note?: DayNote; typed?: TypedDayNote }>([
    ...typed,
    ...[...notes.values()].map((note) => ({ source: note.kind, date: isoDate(note.date), note })),
  ]);
  // Every chosen day note holds its day, even one dropped below for lead time or quiet hours (budget.ts `heldDays`).
  const noteDays = heldDays(chosenNotes);
  for (const chosen of chosenNotes) {
    if (chosen.typed) {
      const n = typedNote(chosen.typed);
      if (n) out.push(n);
      continue;
    }
    const note = chosen.note!;
    const t = note.kind === 'birthday' ? birthdayTime : time;
    const fireAt = at(note.date, t, timeZone);
    if (fireAt <= now + MIN_LEAD_MS || inQuietHours(fireAt, timeZone, window)) continue;
    const c = monthNoteCopy(note, prefs.namesOnLockScreen);
    out.push({
      id: `${ID_PREFIX}${note.kind === 'birthday' ? 'birthday' : 'month'}.${isoDate(note.date)}`,
      kind: note.kind,
      date: isoDate(note.date),
      hour: t.hour,
      minute: t.minute,
      fireAt,
      title: c.title,
      body: c.body,
      month: note.children[0].months,
    });
  }

  // Evening nudges. While every book is quiet, none: a nudge would be for a book this person quieted.
  const allQuiet = input.children.length > 0 && awake.length === 0;
  const weekdays = allQuiet ? [] : activeWeekdays(prefs);
  if (weekdays.length > 0) {
    const quietUntil = Math.max(
      input.lastSaveAt != null ? input.lastSaveAt + RECENT_SAVE_QUIET_MS : -Infinity,
      input.lastForegroundAt != null ? input.lastForegroundAt + FOREGROUND_QUIET_MS : -Infinity,
    );
    for (let n = dayNumber(today); n <= eveningLastDay; n++) {
      const date = addDays(today, n - dayNumber(today));
      if (!weekdays.includes(weekdayOf(date))) continue;
      if (anchorDay !== null && !eveningDayAllowed(n - anchorDay, date, weekdays)) continue;
      if (noteDays.has(isoDate(date))) continue; // the typed day, month or birthday note is today's one note
      const fireAt = at(date, time, timeZone);
      if (fireAt <= now + MIN_LEAD_MS || fireAt < quietUntil || inQuietHours(fireAt, timeZone, window)) continue;
      const ordinal = slotOrdinal(date, weekdays);
      const minutesOfDay = time.hour * 60 + time.minute;
      // Recency is the fire date minus the newest made letter's date in this zone, at plan time (NS-48-R3).
      const band = lastLetterDay !== null ? recencyBand(n, lastLetterDay) : null;
      const key = chooseKey(select, ordinal, minutesOfDay, { recency: band, lastKind: input.lastLetter?.kind ?? null });
      const variant = floorIndexOfKey(key) ?? 0;
      const nameIdx = namedSlotIndex(ordinal, eligibleFloorIndexes(minutesOfDay));
      const named = prefs.namesOnLockScreen && included.length > 0 ? included[nameIdx % included.length].name : null;
      const c = eveningCopy(variant, date, named);
      out.push({
        id: `${ID_PREFIX}evening.${isoDate(date)}`,
        kind: 'evening',
        date: isoDate(date),
        hour: time.hour,
        minute: time.minute,
        fireAt,
        title: c.title,
        body: c.body,
        key,
        variant,
      });
    }
  }

  // The invariant, whatever produced `out`: one budgeted note a local day, then at most `max` of them, earliest kept.
  const oneADay = chooseOnePerDay(out.map((n) => ({ source: n.kind, date: n.date, n }))).map((c) => c.n);
  return oneADay.sort((a, b) => a.fireAt - b.fireAt || a.id.localeCompare(b.id)).slice(0, max);
}

/** A short fingerprint of a plan, so re-planning that changes nothing touches nothing. */
export function planSignature(plan: PlannedNotification[]): string {
  return plan.map((p) => `${p.id}|${p.date}|${p.hour}:${p.minute}|${p.fireAt}|${p.title}|${p.body}`).join('\n');
}
