/**
 * Plan reminders on the phone: scheduling (BL-342, WP-F14-07; F14 6.6 "Rules for the phone").
 *
 * Re-plans from the StoreKit plan and replaces every pending plan reminder. Called at launch,
 * on foreground, on every transaction update, after a purchase, a restore and the manage sheet
 * (all of which re-read the plan, see plan-reminders.native.ts). A reinstall replans on the
 * first launch from StoreKit's own entitlements (F14-REQ-020). Renewal off cancels them all.
 *
 * Only plan reminders are touched: they carry `source: PLAN_REMINDER_SOURCE` and an id starting
 * `plan.`, so the letter reminder scheduler (lib/reminders/scheduler.ts, which cancels only
 * `scribe.reminders` items and `el.` ids) and this one never cancel each other's.
 *
 * No React Native or Expo import here: the notification calls come through `NotificationPort`,
 * so this file is tested in Node with a fake (plan-reminders.test.ts).
 */
import {
  MAX_PENDING_PLAN_NOTICES,
  PLAN_NOTICE_ID_PREFIX,
  pendingPlanNotices,
  planNoticeCard,
  planNoticeDays,
  planNoticeSignature,
  planNotices,
  type PlannedPlanNotice,
} from '@scribe/core/src/plan-notices';
import { noticeSubscriptionOf, noticeText } from './plan-notices.logic';
import type { PlanState } from './plan.logic';

/** Marks plan reminders in `content.data`. Enums only: no names, no text, nothing about a letter. */
export const PLAN_REMINDER_SOURCE = 'scribe.plan';

export interface ScheduledItem {
  identifier: string;
  data: unknown;
}

export interface PlanReminderRequest {
  identifier: string;
  title: string;
  body: string;
  data: { source: typeof PLAN_REMINDER_SOURCE; kind: PlannedPlanNotice['kind'] };
  /** Local wall-clock time (iOS calendar trigger, no time zone) and the same moment as an instant. */
  at: { date: string; hour: number; minute: number; instant: string };
}

/** The notification calls this scheduler needs. Wired to expo-notifications in plan-reminders.native.ts. */
export interface NotificationPort {
  /** Whether notifications may show (granted or provisional). Never prompts. */
  allowed(): Promise<boolean>;
  scheduled(): Promise<ScheduledItem[]>;
  cancel(identifier: string): Promise<void>;
  schedule(request: PlanReminderRequest): Promise<void>;
}

export function isPlanReminder(item: ScheduledItem): boolean {
  const d = item.data as { source?: unknown } | null;
  return (!!d && typeof d === 'object' && d.source === PLAN_REMINDER_SOURCE) || item.identifier.startsWith(PLAN_NOTICE_ID_PREFIX);
}

export interface ReplanInput {
  plan: PlanState;
  now: string;
  timeZone: string;
  locale?: string;
}

/** Every notice for this plan now (notifications and cards). */
export function noticesFor(input: ReplanInput): PlannedPlanNotice[] {
  return planNotices({ now: input.now, timeZone: input.timeZone, subscription: noticeSubscriptionOf(input.plan) });
}

/** The requests to schedule for this plan now: at most 4, soonest first (F14-REQ-008). */
export function requestsFor(input: ReplanInput): PlanReminderRequest[] {
  return pendingPlanNotices(noticesFor(input), MAX_PENDING_PLAN_NOTICES).map((n) => {
    const t = noticeText(n, input.plan.details.period, input.locale);
    return {
      identifier: n.id,
      title: t.title,
      body: t.body,
      data: { source: PLAN_REMINDER_SOURCE, kind: n.kind },
      at: { ...n.fireLocal!, instant: n.fireAt! },
    };
  });
}

/** The card to show on Tonight and in Plan now, or null (F14-REQ-010). Independent of notification permission. */
export function cardFor(input: ReplanInput, seen: ReadonlySet<string>): PlannedPlanNotice | null {
  return planNoticeCard(noticesFor(input), input.now, seen);
}

/** Local dates with a plan reminder, so a letter reminder is not planned on them (F13-REQ-015; request to S14). */
export function planReminderDays(input: ReplanInput): string[] {
  return planNoticeDays(noticesFor(input));
}

/**
 * Replace every pending plan reminder with the plan for now. Returns the signature applied.
 * Skips all work when the signature equals `lastSignature` and nothing of ours is missing.
 * Never throws: a failed call leaves the next replan to repair it.
 */
export async function replanReminders(port: NotificationPort, input: ReplanInput, lastSignature: string | null = null): Promise<string | null> {
  try {
    const allowed = await port.allowed();
    const requests = allowed ? requestsFor(input) : [];
    const signature = planNoticeSignature(requests.map((r) => ({ id: r.identifier, fireAt: r.at.instant }) as PlannedPlanNotice));
    const ours = (await port.scheduled()).filter(isPlanReminder);
    const sameSet = ours.length === requests.length && requests.every((r) => ours.some((o) => o.identifier === r.identifier));
    if (signature === lastSignature && sameSet) return signature;
    for (const o of ours) await port.cancel(o.identifier).catch(() => {});
    for (const r of requests) await port.schedule(r);
    return signature;
  } catch {
    return null;
  }
}
