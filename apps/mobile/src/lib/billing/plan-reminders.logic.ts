/**
 * Plan reminders on this iPhone (G-15; Q-003 memo section 5; LEGAL-REQ-047).
 * Ship in v1.0 by the decision of 15 Oct 2026 (delegated by the founder), as a
 * courtesy: local notifications can be off, delayed or lost with the app, so
 * Apple's own emails and Settings, Plan stay the record of every date. Words
 * follow D-083: no price, no "free trial", no "we will email you". Ported from
 * auto/2026-10-05-fixes (d1cbddb) onto the D-082 membership engine. Pure: no
 * React Native, no clock, no time zone of its own. Tested in
 * test/billing-plan-reminders.test.ts.
 *
 * Built only from what StoreKit reports on this phone (PlanState, from
 * Transaction.currentEntitlements and the subscription status): the period or
 * trial end `E`, the free-trial flag, the plan's period, `willAutoRenew`, the
 * ownership type and the first purchase date. Nothing leaves the phone.
 *
 * Rules (the windows are data, `PLAN_REMINDER_RULES`):
 * - Only the purchaser's phones: ownership `purchased`. A family member who
 *   gets Plus through Family Sharing is not billed and cannot cancel, so gets
 *   none.
 * - Only while it will renew: trial or active, `willAutoRenew` not false, `E`
 *   in the future. Grace, billing retry, expired, revoked or auto-renew off:
 *   no reminders, and the scheduler cancels any pending ones.
 * - Each reminder fires inside its hard window [E - a, E - b] (absolute
 *   instants, so travel or a time zone change can never move it outside), at
 *   10:00 local time when the window has one, otherwise the slot nearest the
 *   target, and never in quiet hours (07:00 to 21:30 local, the reminders
 *   default). A missed window is skipped, never sent late.
 * - The yearly reminder (California 17602(h), read broadly) falls on each
 *   anniversary of the first purchase, for monthly plans too, while the
 *   subscription is known to be live (on or before E's date), and gives way
 *   to another plan reminder on the same day.
 * - Lock-screen text names no child and no price.
 */
import { DEFAULT_WINDOW, isQuietTime, normalizeWindow, type ReminderWindow } from '../reminders/planner';
import { addDays, dayNumber, isoDate, monthDay, zonedParts, zonedToEpoch, type CalendarDate } from '../reminders/tz';
import type { PlanDetails, PlanState } from './plan.logic';

export const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
/** Subscription Terms: cancel at least 24 hours before a free trial or period ends. */
export const CANCEL_LEAD_MS = DAY_MS;
/** A notification is never scheduled less than this far ahead. */
const MIN_LEAD_MS = 60_000;
/** The calm local time a plan reminder prefers. */
export const PREFERRED_TIME = { hour: 10, minute: 0 };
const STEP_MINUTES = 15;
/** iOS keeps 64 pending local notifications in all; evening reminders use up to 60 (see report). */
export const MAX_PLAN_NOTIFICATIONS = 4;
/** Notification ids start with this, so the evening reminders (`el.`) and ours never touch each other. */
export const PLAN_ID_PREFIX = 'plan.';
/** A trial longer than this is a "long" trial (California 17602(b)(1): over 31 days). */
export const LONG_TRIAL_DAYS = 31;

export type PlanReminderKind = 'trialLong' | 'trialWeek' | 'trialFinal' | 'annualLong' | 'annualShort' | 'yearly';

export interface PlanReminderRule {
  /** Target instant: E minus this. */
  targetBeforeMs: number;
  /** Hard window, inclusive: [E - windowStartBeforeMs, E - windowEndBeforeMs]. */
  windowStartBeforeMs: number;
  windowEndBeforeMs: number;
}

/** Q-003 memo section 5 and LEGAL-REQ-047, as data. The yearly reminder is a calendar day, not an offset. */
export const PLAN_REMINDER_RULES: Record<Exclude<PlanReminderKind, 'yearly'>, PlanReminderRule> = {
  /** Trial over 31 days (the annual plan's 2 months): CA, NY, VA, UT, MA, NYC. */
  trialLong: { targetBeforeMs: 18 * DAY_MS, windowStartBeforeMs: 21 * DAY_MS, windowEndBeforeMs: 16 * DAY_MS },
  /** Trial of 31 days or less (the monthly plan's 1 month): VA if over 30 days, UT, courtesy. */
  trialWeek: { targetBeforeMs: 7 * DAY_MS, windowStartBeforeMs: 8 * DAY_MS, windowEndBeforeMs: 5 * DAY_MS },
  /** Every trial that will convert: UT (at least 3 days before), courtesy. */
  trialFinal: { targetBeforeMs: 4 * DAY_MS + 12 * HOUR_MS, windowStartBeforeMs: 5 * DAY_MS, windowEndBeforeMs: 4 * DAY_MS },
  /** Annual plan, will renew, not in a trial: UT 30 to 60 and MA at most 30 before C meet only here. */
  annualLong: { targetBeforeMs: 30 * DAY_MS + 12 * HOUR_MS, windowStartBeforeMs: 31 * DAY_MS, windowEndBeforeMs: 30 * DAY_MS },
  /** Annual plan, will renew: courtesy. */
  annualShort: { targetBeforeMs: 7 * DAY_MS, windowStartBeforeMs: 8 * DAY_MS, windowEndBeforeMs: 6 * DAY_MS },
};

/** What the reminders need from the plan. */
export interface PlanReminderSubject {
  productId: string | null;
  period: 'month' | 'year' | null;
  ownership: PlanDetails['ownership'];
  status: PlanDetails['status'];
  willAutoRenew: boolean | null;
  /** E: trial or period end (ISO instant). */
  periodEnd: string | null;
  /** Start of the current trial or period (for the trial's length). */
  purchasedAt: string | null;
  /** First purchase (for the anniversary). */
  originalPurchasedAt: string | null;
}

export function subjectOf(plan: PlanState): PlanReminderSubject {
  const d = plan.details;
  return {
    productId: d.productId,
    period: d.period,
    ownership: d.ownership,
    status: d.status,
    willAutoRenew: d.willAutoRenew,
    periodEnd: d.periodEnd,
    purchasedAt: d.purchasedAt,
    originalPurchasedAt: d.originalPurchasedAt,
  };
}

const ms = (iso: string | null): number | null => {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
};

/**
 * Whole days of the free trial, from StoreKit's own dates. Without a start
 * date it falls back to the plan's offer (1 month monthly, 2 months annual).
 */
export function trialDays(s: PlanReminderSubject): number {
  const start = ms(s.purchasedAt);
  const end = ms(s.periodEnd);
  if (start !== null && end !== null && end > start) return Math.round((end - start) / DAY_MS);
  return s.period === 'year' ? 61 : 30;
}

/** trialDays for a whole PlanState (screens). */
export function trialDaysOf(plan: PlanState): number {
  return trialDays(subjectOf(plan));
}

/** Plan reminders apply: the purchaser's own subscription, trial or active, still set to renew, ending in the future. */
export function remindersApply(s: PlanReminderSubject, now: number): boolean {
  const end = ms(s.periodEnd);
  return (
    s.ownership === 'purchased' &&
    (s.status === 'trial' || s.status === 'active') &&
    s.willAutoRenew !== false &&
    end !== null &&
    end > now
  );
}

/** The offset reminders this subscription gets (yearly anniversaries are added separately). */
export function offsetKinds(s: PlanReminderSubject): Exclude<PlanReminderKind, 'yearly'>[] {
  if (s.status === 'trial') return [trialDays(s) > LONG_TRIAL_DAYS ? 'trialLong' : 'trialWeek', 'trialFinal'];
  if (s.period === 'year') return ['annualLong', 'annualShort'];
  return [];
}

export interface ReminderWindowAbs {
  kind: PlanReminderKind;
  /** Inclusive instants. */
  start: number;
  end: number;
  target: number;
  /** Local calendar date (YYYY-MM-DD) the id is keyed on: E's date, or the anniversary. */
  key: string;
}

const localDate = (t: number, timeZone: string): CalendarDate => {
  const p = zonedParts(t, timeZone);
  return { y: p.y, m: p.m, d: p.d };
};

/** Every window this subscription has from now on (some may already be past). */
export function reminderWindows(s: PlanReminderSubject, now: number, timeZone: string): ReminderWindowAbs[] {
  if (!remindersApply(s, now)) return [];
  const end = ms(s.periodEnd) as number;
  const endKey = isoDate(localDate(end, timeZone));
  const out: ReminderWindowAbs[] = offsetKinds(s).map((kind) => {
    const r = PLAN_REMINDER_RULES[kind];
    return { kind, start: end - r.windowStartBeforeMs, end: end - r.windowEndBeforeMs, target: end - r.targetBeforeMs, key: endKey };
  });

  // Yearly: each anniversary of the first purchase, on or before E's local date.
  const first = ms(s.originalPurchasedAt) ?? ms(s.purchasedAt);
  if (first !== null) {
    const anchor = localDate(first, timeZone);
    const today = dayNumber(localDate(now, timeZone));
    const lastDay = dayNumber(localDate(end, timeZone));
    for (let k = 1; k <= 200; k++) {
      // Born-on-the-29th rule from the reminders: Feb 29 falls on Feb 28 in other years.
      const date = monthDay(anchor, 12 * k);
      const n = dayNumber(date);
      if (n > lastDay) break;
      if (n < today) continue;
      const dayStart = zonedToEpoch({ ...date, hh: 0, mm: 0 }, timeZone);
      const next = addDays(date, 1);
      // Only while known to be live: never after E, even on E's own day.
      const dayEnd = Math.min(zonedToEpoch({ ...next, hh: 0, mm: 0 }, timeZone) - 1, end - 1);
      if (dayEnd < dayStart) continue;
      out.push({ kind: 'yearly', start: dayStart, end: dayEnd, target: zonedToEpoch({ ...date, hh: PREFERRED_TIME.hour, mm: PREFERRED_TIME.minute }, timeZone), key: isoDate(date) });
    }
  }
  return out;
}

/**
 * The instant to fire inside [start, end], or null when no allowed slot is
 * left (missed windows are skipped, never sent late). Slots are 15-minute
 * steps of local time inside the quiet-hours window; 10:00 wins when the
 * window has one, else the slot nearest the target (earlier on a tie).
 */
export function pickSlot(win: { start: number; end: number; target: number }, now: number, timeZone: string, quiet: ReminderWindow = DEFAULT_WINDOW): number | null {
  const w = normalizeWindow(quiet);
  const lo = Math.max(win.start, now + MIN_LEAD_MS);
  if (lo > win.end) return null;
  const firstDay = localDate(lo, timeZone);
  const lastDay = localDate(win.end, timeZone);
  const preferredMinutes = PREFERRED_TIME.hour * 60 + PREFERRED_TIME.minute;
  let best: number | null = null;
  let bestPreferred: number | null = null;
  const better = (cand: number, cur: number | null) =>
    cur === null || Math.abs(cand - win.target) < Math.abs(cur - win.target) || (Math.abs(cand - win.target) === Math.abs(cur - win.target) && cand < cur);
  for (let n = dayNumber(firstDay); n <= dayNumber(lastDay); n++) {
    const date = addDays(firstDay, n - dayNumber(firstDay));
    const fromMin = Math.ceil(w.earliest / STEP_MINUTES) * STEP_MINUTES;
    // One zone lookup per day, then plain steps; the wall clock of each step is checked below.
    const base = zonedToEpoch({ ...date, hh: Math.floor(fromMin / 60), mm: fromMin % 60 }, timeZone);
    if (base > win.end) break;
    for (let m = fromMin; m <= w.latest; m += STEP_MINUTES) {
      const t = base + (m - fromMin) * 60_000;
      if (t < lo || t > win.end) continue;
      // A skipped or repeated hour can move the instant: check the wall clock it really shows.
      const p = zonedParts(t, timeZone);
      if (isQuietTime(p.hh, p.mm, w) || p.d !== date.d) continue;
      if (better(t, best)) best = t;
      if (p.hh * 60 + p.mm === preferredMinutes && better(t, bestPreferred)) bestPreferred = t;
    }
  }
  return bestPreferred ?? best;
}

export interface PlannedPlanReminder {
  /** `plan.<kind>.<YYYY-MM-DD>`: stable, so a re-plan that changes nothing changes no ids. */
  id: string;
  kind: PlanReminderKind;
  /** Exact instant (a date trigger, not wall-clock: the legal window is absolute). */
  fireAt: number;
  windowStart: number;
  windowEnd: number;
  title: string;
  body: string;
}

/** The words, injected so the planner stays free of the content package's shape. */
export interface PlanReminderWords {
  title: string;
  trialOneMonth: string;
  trialMonths: string;
  renews: string;
  yearly: string;
}

export interface PlanRemindersInput {
  now: number;
  timeZone: string;
  subject: PlanReminderSubject;
  words: PlanReminderWords;
  /** YYYY-MM-DD -> the date as people read it (lib/dates longDate in the app). */
  formatDay?: (ymd: string) => string;
  quiet?: ReminderWindow;
  max?: number;
}

const fill = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? values[k] : m));
const fillDate = (text: string, date: string) => fill(text, { date });

function bodyFor(kind: PlanReminderKind, s: PlanReminderSubject, words: PlanReminderWords, date: string): string {
  if (kind === 'yearly') return words.yearly;
  if (kind === 'trialLong' || kind === 'trialWeek' || kind === 'trialFinal') {
    return fillDate(trialDays(s) > LONG_TRIAL_DAYS ? words.trialMonths : words.trialOneMonth, date);
  }
  return fillDate(words.renews, date);
}

/** Exactly which plan notifications should exist now. Empty means cancel every pending one. */
export function planPlanReminders(input: PlanRemindersInput): PlannedPlanReminder[] {
  const { now, timeZone, subject, words } = input;
  const formatDay = input.formatDay ?? ((ymd: string) => ymd);
  const end = ms(subject.periodEnd);
  if (end === null || !remindersApply(subject, now)) return [];
  const endDate = formatDay(isoDate(localDate(end, timeZone)));

  const picked: PlannedPlanReminder[] = [];
  const windows = reminderWindows(subject, now, timeZone);
  // Offset reminders first, so the yearly note gives way to them on a shared day.
  for (const w of [...windows.filter((x) => x.kind !== 'yearly'), ...windows.filter((x) => x.kind === 'yearly')]) {
    const fireAt = pickSlot(w, now, timeZone, input.quiet);
    if (fireAt === null) continue;
    const day = isoDate(localDate(fireAt, timeZone));
    if (w.kind === 'yearly' && picked.some((p) => isoDate(localDate(p.fireAt, timeZone)) === day)) continue;
    picked.push({
      id: `${PLAN_ID_PREFIX}${w.kind}.${w.key}`,
      kind: w.kind,
      fireAt,
      windowStart: w.start,
      windowEnd: w.end,
      title: words.title,
      body: bodyFor(w.kind, subject, words, endDate),
    });
  }
  return picked.sort((a, b) => a.fireAt - b.fireAt || a.id.localeCompare(b.id)).slice(0, input.max ?? MAX_PLAN_NOTIFICATIONS);
}

/** Fingerprint, so a re-plan that changes nothing touches nothing. */
export function planReminderSignature(list: PlannedPlanReminder[]): string {
  return list.map((p) => `${p.id}|${p.fireAt}|${p.title}|${p.body}`).join('\n');
}

// ── The same reminder inside the app ────────────────────────────────────

export interface PlanNote {
  /** Same id as the notification, so "seen" is per reminder. */
  id: string;
  kind: PlanReminderKind;
  /** E (ISO). */
  endsAt: string;
  /** E minus 24 hours (ISO): the cancel-by date. */
  cancelBy: string;
  trial: boolean;
  oneMonthTrial: boolean;
}

/**
 * The note to show now, if any: a reminder whose window has opened and whose
 * date (E, or the anniversary day for the yearly note) has not passed. This is
 * what Settings, Plan shows, and what the app shows once on the next open
 * inside the window, with or without notifications.
 */
export function activePlanNote(s: PlanReminderSubject, now: number, timeZone: string): PlanNote | null {
  const end = ms(s.periodEnd);
  if (end === null || !remindersApply(s, now)) return null;
  const open = reminderWindows(s, now, timeZone)
    .filter((w) => w.start <= now && now < (w.kind === 'yearly' ? w.end : end))
    .sort((a, b) => b.start - a.start || (a.kind === 'yearly' ? 1 : -1));
  const w = open[0];
  if (!w) return null;
  const trial = s.status === 'trial';
  return {
    id: `${PLAN_ID_PREFIX}${w.kind}.${w.key}`,
    kind: w.kind,
    endsAt: new Date(end).toISOString(),
    cancelBy: new Date(end - CANCEL_LEAD_MS).toISOString(),
    trial,
    oneMonthTrial: trial && trialDays(s) <= LONG_TRIAL_DAYS,
  };
}

export interface NoteWords {
  trialOneMonth: string;
  trialMonths: string;
  renews: string;
  yearly: string;
  cancelByTrial: string;
  cancelByRenewal: string;
}

/** The note's sentences: the date and the cancel-by date. No price (D-083): Apple's screen and receipts show it. */
export function noteLines(note: PlanNote, words: NoteWords, opts: { timeZone: string; formatDay?: (ymd: string) => string }): string[] {
  const formatDay = opts.formatDay ?? ((ymd: string) => ymd);
  const day = (iso: string) => formatDay(isoDate(localDate(Date.parse(iso), opts.timeZone)));
  const date = day(note.endsAt);
  const cancelBy = day(note.cancelBy);
  const lines: string[] = [];
  if (note.kind === 'yearly') lines.push(words.yearly, fill(words.renews, { date }));
  else if (note.trial) lines.push(fill(note.oneMonthTrial ? words.trialOneMonth : words.trialMonths, { date }));
  else lines.push(fill(words.renews, { date }));
  lines.push(fill(note.trial ? words.cancelByTrial : words.cancelByRenewal, { cancelBy }));
  return lines;
}

// ── Purchase confirmation and its saved copy ────────────────────────────

/** Words for the confirmation (packages/content billingCopy.confirmation). */
export interface ConfirmationWords {
  title: string;
  planMonthly: string;
  planAnnual: string;
  trial: string;
  paid: string;
  cancelByTrial: string;
  cancelByRenewal: string;
  renewal: string;
  howToCancel: string;
  apple: string;
  family: string;
  reminders: string;
  summary: { heading: string; plan: string; trialEnd: string; renewsOn: string; cancelBy: string; terms: string; saved: string };
}

export interface ConfirmationInput {
  details: Pick<PlanDetails, 'productId' | 'period' | 'status' | 'periodEnd' | 'cancelBy' | 'willAutoRenew'>;
  appName: string;
  termsUrl: string;
  timeZone: string;
  now: number;
  words: ConfirmationWords;
  formatDay?: (ymd: string) => string;
}

export interface Confirmation {
  /** The lines the sheet shows, in order. */
  lines: string[];
  /** Plain text for "Save a copy". */
  summary: string;
  /** The plan's name ("Plus Annual"). */
  planName: string;
}

/**
 * What the person agreed to, from StoreKit on this phone (in-app-disclosures
 * section 3): the plan, the trial end or renewal date, the cancel-by date,
 * automatic renewal, how to cancel, Apple's role, Family Sharing and the
 * courtesy reminders. No price (D-083): Apple's subscription screen showed it
 * and Apple's receipt email holds it. The saved copy adds a heading, the Terms
 * link and the day it was saved.
 */
export function purchaseConfirmation(input: ConfirmationInput): Confirmation {
  const { details: d, words, timeZone } = input;
  const formatDay = input.formatDay ?? ((ymd: string) => ymd);
  const day = (iso: string | null) => (iso && Number.isFinite(Date.parse(iso)) ? formatDay(isoDate(localDate(Date.parse(iso), timeZone))) : null);
  const planName = d.period === 'year' ? words.planAnnual : words.planMonthly;
  const end = day(d.periodEnd);
  const cancelBy = day(d.cancelBy ?? (d.periodEnd ? new Date(Date.parse(d.periodEnd) - CANCEL_LEAD_MS).toISOString() : null));
  const trial = d.status === 'trial';
  const values = { app: input.appName, date: end ?? '', cancelBy: cancelBy ?? '', name: planName };

  const lines: string[] = [];
  if (end) lines.push(fill(trial ? words.trial : words.paid, values));
  if (cancelBy && d.willAutoRenew !== false) lines.push(fill(trial ? words.cancelByTrial : words.cancelByRenewal, values));
  lines.push(words.renewal, fill(words.howToCancel, values), words.apple, words.family, words.reminders);

  const s = words.summary;
  const summary = [
    fill(s.heading, values),
    '',
    fill(s.plan, values),
    ...(end ? [fill(trial ? s.trialEnd : s.renewsOn, values)] : []),
    ...(cancelBy && d.willAutoRenew !== false ? [fill(s.cancelBy, values)] : []),
    '',
    words.renewal,
    fill(words.howToCancel, values),
    words.apple,
    words.family,
    words.reminders,
    '',
    `${s.terms} ${input.termsUrl}`,
    fill(s.saved, { date: formatDay(isoDate(localDate(input.now, timeZone))) }),
  ].join('\n');
  return { lines, summary, planName };
}
