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
 * - At most one note a day: a month or birthday note replaces that day's
 *   evening nudge (F2 "not the birthday"; C-REQ-002 counts them apart).
 * - Copy rotates through the 8 evening variants by slot order, so no variant
 *   repeats within 8 nudges and no title shows twice in a row (C-REQ-006).
 * - No child name unless the user turned "Names in notifications" on
 *   (D-025). Never any letter text.
 *
 * Not here (P1, later): back-off after unopened nudges (C-REQ-008),
 * `gentleReturn`, plan notices, per-book "pause celebrations".
 */
import { en } from '@scribe/content';
import { renderTemplate } from '@scribe/core';
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
}

export interface PlanInput {
  now: number;
  timeZone: string;
  prefs: ReminderPrefs;
  children: PlannerChild[];
  /** Newest save by this user (epoch ms), for smart quiet. */
  lastSaveAt?: number | null;
  /** When the app last came to the foreground (epoch ms). */
  lastForegroundAt?: number | null;
  /** Evening nudges are planned this many days ahead (default 21). */
  horizonDays?: number;
  /** Month and birthday notes are planned this many days ahead (default 92). */
  monthHorizonDays?: number;
  /** iOS keeps at most 64 pending local notifications; we stay under it (default 60). */
  maxNotifications?: number;
  /**
   * The hours reminders may use, in local minutes of the day (default 07:00 to
   * 21:30). Remote config may narrow it later (C-NFR-009); an invalid window
   * falls back to the default.
   */
  window?: ReminderWindow;
}

/** Local minutes of the day, inclusive: reminders fire only between `earliest` and `latest`. */
export interface ReminderWindow {
  earliest: number;
  latest: number;
}

export type PlannedKind = 'evening' | 'monthAge' | 'birthday';

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
export const DEFAULT_WEEKLY_DAY = 0; // Sunday
export const BIRTHDAY_TIME: ReminderTime = { hour: 9, minute: 0 };
export const RECENT_SAVE_QUIET_MS = 20 * 3_600_000;
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
const NAMED_PER_CYCLE = NAMES_CHILD.filter(Boolean).length;

/**
 * How many name-bearing nudges come before this one. Children are named in
 * turn by this count, so a variant without a name ("Tonight's letter") never
 * makes one child come up twice in a row or less often (PRD C F1, K-12).
 */
export function namedSlotIndex(ordinal: number): number {
  const cycle = Math.floor(ordinal / VARIANTS);
  let before = 0;
  for (let v = 0; v < ordinal % VARIANTS; v++) if (NAMES_CHILD[v]) before++;
  return cycle * NAMED_PER_CYCLE + before;
}

/** "Asha", "Asha and Dev", "Asha, Dev and Nina". */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function fill(text: string, values: Record<string, string | number>): string {
  return renderTemplate(text, values);
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
  const childNames = joinNames(note.children.map((c) => c.child.name));
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
    title: sameMonth ? fill(en.notifications.monthOpen.title, { month: months }) : t.monthTitle,
    body: names ? fill(t.monthBodyNames, { child: childNames }) : t.monthBodyNeutral,
  };
}

function at(date: CalendarDate, time: ReminderTime, timeZone: string): number {
  return zonedToEpoch({ ...date, hh: time.hour, mm: time.minute }, timeZone);
}

/** Drops anything that would land in quiet hours in this zone (C-REQ-004: a zone shift never wakes anyone). */
function inQuietHours(fireAt: number, timeZone: string, window: ReminderWindow): boolean {
  const p = zonedParts(fireAt, timeZone);
  return isQuietTime(p.hh, p.mm, window);
}

export function planReminders(input: PlanInput): PlannedNotification[] {
  const { now, timeZone, prefs } = input;
  if (!prefs.enabled || prefs.paused) return [];

  const horizon = Math.max(1, input.horizonDays ?? 21);
  const monthHorizon = Math.max(horizon, input.monthHorizonDays ?? 92);
  const max = input.maxNotifications ?? 60;
  const window = normalizeWindow(input.window);
  const time = clampReminderTime(prefs.time, window).time;
  const birthdayTime = clampReminderTime(BIRTHDAY_TIME, window).time;
  const todayParts = zonedParts(now, timeZone);
  const today: CalendarDate = { y: todayParts.y, m: todayParts.m, d: todayParts.d };
  const lastDay = dayNumber(today) + monthHorizon - 1;
  const eveningLastDay = dayNumber(today) + horizon - 1;
  const included = input.children.filter((c) => c.included);
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
        if (n < dayNumber(today)) continue;
        const kind = k % 12 === 0 ? 'birthday' : 'monthAge';
        const key = `${kind}:${isoDate(date)}`;
        const note = notes.get(key) ?? { kind, date, children: [] };
        note.children.push({ child, months: kind === 'birthday' ? k / 12 : k });
        notes.set(key, note);
      }
    }
  }
  const noteDays = new Set<number>();
  for (const note of notes.values()) {
    const t = note.kind === 'birthday' ? birthdayTime : time;
    const fireAt = at(note.date, t, timeZone);
    noteDays.add(dayNumber(note.date));
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

  // Evening nudges.
  const weekdays = activeWeekdays(prefs);
  if (weekdays.length > 0) {
    const quietUntil = Math.max(
      input.lastSaveAt != null ? input.lastSaveAt + RECENT_SAVE_QUIET_MS : -Infinity,
      input.lastForegroundAt != null ? input.lastForegroundAt + FOREGROUND_QUIET_MS : -Infinity,
    );
    for (let n = dayNumber(today); n <= eveningLastDay; n++) {
      const date = addDays(today, n - dayNumber(today));
      if (!weekdays.includes(weekdayOf(date))) continue;
      if (noteDays.has(n)) continue; // the month or birthday note is today's one note
      const fireAt = at(date, time, timeZone);
      if (fireAt <= now + MIN_LEAD_MS || fireAt < quietUntil || inQuietHours(fireAt, timeZone, window)) continue;
      const ordinal = slotOrdinal(date, weekdays);
      const variant = ordinal % VARIANTS;
      const named = prefs.namesOnLockScreen && included.length > 0 ? included[namedSlotIndex(ordinal) % included.length].name : null;
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
        variant,
      });
    }
  }

  return out.sort((a, b) => a.fireAt - b.fireAt || a.id.localeCompare(b.id)).slice(0, max);
}

/** A short fingerprint of a plan, so re-planning that changes nothing touches nothing. */
export function planSignature(plan: PlannedNotification[]): string {
  return plan.map((p) => `${p.id}|${p.date}|${p.hour}:${p.minute}|${p.fireAt}|${p.title}|${p.body}`).join('\n');
}
