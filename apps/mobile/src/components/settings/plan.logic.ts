/**
 * Settings, Plan (EXPERIENCE_PASS_2026-10 S41, package P6): what the screen shows, pure so test/settings-p6b.test.ts
 * runs it in Node. app/settings/plus.tsx draws it.
 *
 * - Plus off, nothing to say: no status card (`plan.off` is retired). The first row is "See what Plus adds" (Apple's
 *   store view), or, with no store on this device, the line that says why. Plus on (or Apple retrying a payment): the
 *   first row reads "Plus", with the plan's name and the dates StoreKit reports (Terms 14.6).
 * - The promise (`billingCopy.store.promise`, registered) is the section's footer, once. No sentence and no date is
 *   shown twice: a status sentence the open plan note or the restore result already says (the renewal date, the
 *   cancel-by date, "Plus is on.") is left out of the row, and a trial whose date the note says reads "Plus is on.".
 * - "Manage subscription" only when a subscription exists (the Terms and emails name "Settings, Plan, Manage
 *   subscription", so the label itself never changes). "Redeem a code" is a row here too.
 * - The restore result shows inline under its row; a failure carries the warning mark.
 *
 * - F5 (founder, 1 Nov 2026; PL-4): "What Plus includes" lists `billingCopy.store.features` before Apple's sheet
 *   (App Review 3.1.2(c)). Plus off and never had: the setup line (`membership.line`) is the section's footer in place
 *   of the promise, which would say "Your first two letters are free." a second time. Plus ended: the row "Plus ended on
 *   {date}. Every letter you kept is still yours." and no sales sentence (neither line nor promise).
 *
 * Registered words are used as they are today (in-app-disclosures.md section 3, the `billingCopy.plan.*` row). The
 * held switches are one line each, here or in packages/content, after counsel: see HELD below.
 */
import { billingCopy } from '@scribe/content';
import { fill } from '@/lib/copy';
import { localDateOf, type PlanDetails, type PlanLine } from '@/lib/billing/plan.logic';
import type { RestoreResult } from '@/lib/billing/actions';
import type { StoreViewSupport } from '../../../modules/scribe-store/types';

const p = billingCopy.plan;

/**
 * Held for counsel (registered `billingCopy.plan.*` group; spec S41; D-077). Today's words, until counsel clears the
 * new ones; then each switch is the one line named:
 * - `plan.monthly` "Monthly" to "Plus Monthly": packages/content, with `annual` below in the same change.
 * - `annual`: `p.yearly` ("Yearly") to `p.annual` ("Plus Annual", already in content).
 * - `restoreNothing`: `p.restoreNothing` to `p.restoreNone` ("This Apple Account has no Plus to restore."); then
 *   `plan.restoreNothing` retires.
 * `plan.payment`, `grace`, `retry` and `restoreFailed` switch in packages/content only: the screen reads the keys.
 */
export const HELD = {
  monthly: p.monthly,
  annual: p.yearly,
  restoreNothing: p.restoreNothing,
} as const;

/** The plan's name as App Store Connect shows it, or null when StoreKit reports no period. */
export function planName(period: PlanDetails['period']): string | null {
  return period === 'month' ? HELD.monthly : period === 'year' ? HELD.annual : null;
}

/** The status, sentence by sentence (registered words), for the first row when Plus is on or Apple is retrying. */
export function statusSentences(line: PlanLine, longDate: (ymd: string) => string): string[] {
  switch (line.kind) {
    case 'trial':
      return [fill(p.trial, { date: longDate(line.until) }), ...(line.cancelBy ? [fill(p.trialCancelBy, { cancelBy: longDate(line.cancelBy) })] : [])];
    case 'renews':
      return [fill(p.renews, { date: longDate(line.on) })];
    case 'ends':
      return [fill(p.ends, { date: longDate(line.on) })];
    case 'grace':
      return [p.grace];
    case 'retry':
      return [p.retry];
    case 'on':
      return [p.on];
    default:
      return [];
  }
}

/** A subscription exists (Apple can show it to manage): on trial, active, in grace or in Apple's billing retry. */
export function subscriptionExists(status: PlanDetails['status']): boolean {
  return status === 'trial' || status === 'active' || status === 'grace' || status === 'billing_retry';
}

/**
 * The person's own subscription, which Apple lets them manage and ask a refund for (SUB-07): their own purchase
 * (not Family Sharing) that still exists. After an expiry or a refund (`expired`, `revoked`) Apple has nothing to
 * refund, so the refund and save-a-copy rows go away instead of doing nothing.
 */
export function ownSubscription(details: Pick<PlanDetails, 'status' | 'ownership'>): boolean {
  return details.ownership === 'purchased' && subscriptionExists(details.status);
}

/** The day Plus ended, when it lapsed (StoreKit `expired`, with its end date) and is not on now; else null. */
export function endedOn(details: Pick<PlanDetails, 'status'> & { periodEnd?: string | null }, plusOn: boolean): string | null {
  return !plusOn && details.status === 'expired' && details.periodEnd ? details.periodEnd : null;
}

export type PlanScreen = {
  /** The first row when there is a status to say: "Plus", its sentences and the plan's name. Null when Plus is off. */
  status: { title: string; subtitle: string | null; value: string | null } | null;
  /** Plus off: "See what Plus adds" opens Apple's view; or the line that says why it cannot here. */
  seePlans: { kind: 'open'; title: string } | { kind: 'unavailable'; title: string } | null;
  /**
   * The section footer, once: the registered promise. Null in alpha, where the free-letter limit does not apply; null
   * while Plus is off and never had (the F5 line is the footer, `freeLine`); null after Plus ended (no sales sentence).
   */
  promise: string | null;
  /** F5: the setup line as the section footer while Plus is off and never had, in the store build. Else null. */
  freeLine: string | null;
  /** F5, PL-4: "What Plus includes" and its rows (`store.features`), in the store build. Null in alpha. */
  includes: { title: string; items: readonly string[] } | null;
  manage: boolean;
  redeem: boolean;
  /**
   * An alpha build (billing/alpha.ts PLUS_ALPHA; founder, 1 Nov 2026; Karma ruling on #552): the screen shows only the
   * alpha note (`seePlans.title`). No status, promise, payment line, Manage, Restore, Redeem, Save a copy or refund:
   * no StoreKit call can be reached from it.
   */
  alpha: boolean;
};

export function planScreen(input: {
  line: PlanLine;
  details: Pick<PlanDetails, 'status' | 'period' | 'ownership'> & { periodEnd?: string | null };
  plusOn: boolean;
  storeSupport: StoreViewSupport;
  /** The open plan note's sentences (noteLines), so the row never repeats them. */
  noteLines: readonly string[];
  /** The restore result on screen under its row ("Plus is on."), so the row never repeats it either. */
  restored?: string | null;
  longDate: (ymd: string) => string;
  /**
   * An alpha build (billing/alpha.ts PLUS_ALPHA): Plus products cannot load, so "See what Plus adds" becomes the note
   * that Plus is not part of this test, and Redeem a code is not offered. Defaults to false, the store build.
   */
  alpha?: boolean;
}): PlanScreen {
  if (input.alpha) {
    return {
      status: null,
      seePlans: { kind: 'unavailable', title: billingCopy.alpha.note },
      promise: null,
      freeLine: null,
      includes: null,
      manage: false,
      redeem: false,
      alpha: true,
    };
  }
  const said = new Set([...input.noteLines, ...(input.restored ? [input.restored] : [])]);
  const line = input.line;
  // A trial whose end date the open note already says ("Plus is free until {date}."): the row says only that Plus is
  // on, so the date is said once (lens A f1 on #313).
  const trialDateInNote = line.kind === 'trial' && input.noteLines.some((l) => l.includes(input.longDate(line.until)));
  const sentences = statusSentences(line, input.longDate)
    .map((s, i) => (trialDateInNote && i === 0 ? p.on : s))
    .filter((s) => !said.has(s));
  const shared = input.plusOn && input.details.ownership === 'familyShared' ? [p.shared] : [];
  // Plus ended (F5, PL-4): its own row with the day it ended; StoreKit's end instant, as the phone's own date.
  const ended = endedOn(input.details, input.plusOn);
  const status =
    input.line.kind === 'off'
      ? ended
        ? { title: p.statusTitle, subtitle: fill(billingCopy.membership.ended, { date: input.longDate(localDateOf(ended)) }), value: null }
        : null
      : { title: p.statusTitle, subtitle: [...sentences, ...shared].join(' ') || null, value: input.plusOn ? planName(input.details.period) : null };
  // Plus off and never had: the F5 line, said once, as the footer (the promise would repeat its first sentence).
  const neverHad = !input.plusOn && !ended && !subscriptionExists(input.details.status);
  const available = input.storeSupport === 'available';
  // Someone with Plus, or with a subscription Apple is retrying, is never offered it again.
  const seePlans = input.plusOn || subscriptionExists(input.details.status)
    ? null
    : available
      ? ({ kind: 'open', title: p.seePlans } as const)
      : ({ kind: 'unavailable', title: input.storeSupport === 'needs_ios_17' ? p.needsNewerIos : p.unavailable } as const);
  return {
    status,
    seePlans,
    promise: neverHad || ended ? null : billingCopy.store.promise,
    freeLine: neverHad ? billingCopy.membership.line : null,
    includes: { title: billingCopy.membership.includesTitle, items: billingCopy.store.features },
    // A Family Sharing member cannot change or cancel the organiser's plan in Apple's screen (SUB-08), so Manage is
    // shown only for the person's own subscription; the status row already says it is shared with them.
    manage: subscriptionExists(input.details.status) && input.details.ownership !== 'familyShared',
    redeem: !input.plusOn && available,
    alpha: false,
  };
}

/** The restore result, inline under its row. Cancelled says nothing. */
export function restoreResult(r: RestoreResult): { text: string; failed: boolean } | null {
  switch (r) {
    case 'restored':
      return { text: p.restored, failed: false };
    case 'nothing':
      return { text: HELD.restoreNothing, failed: false };
    case 'cancelled':
      return null;
    default:
      return { text: p.restoreFailed, failed: true };
  }
}
