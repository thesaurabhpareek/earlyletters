/**
 * Plus on the device (ADR 0013; founder decision 3, 3 Oct 2026). Pure
 * functions, no React Native, unit-tested in test/billing-plan.test.ts.
 *
 *  - planFromSnapshot: StoreKit 2 entitlements and statuses -> the engine's
 *    PlanView (packages/core/src/plan.ts) plus details for the Plan screen.
 *  - Membership gate (D-082, D-083): decideKeepLetter in packages/core is the only
 *    place the rule lives; lib/billing/gates.ts feeds it Plus and the letter ledger.
 *
 * What changed with "Apple only, checked on the device, no server":
 *  - Plus belongs to the Apple Account, not to our account. Buying needs no
 *    sign-in with us, so `signedIn` is always true for the engine.
 *  - A co-parent gets Plus through Apple Family Sharing. That arrives as their
 *    own (familyShared) entitlement, so `coveredByOtherParent` is always false:
 *    no server tells one parent's phone about the other parent's purchase.
 *  - Sandbox and Xcode transactions count (`isTester`). On the device a
 *    verified sandbox transaction exists only in TestFlight, a development
 *    build, or App Review, which buys in the sandbox; refusing it would show
 *    App Review a paid Plus that does not work.
 *  - Nothing here locks anything that exists: only keeping another letter is
 *    gated (FreeForever in packages/core).
 */
import { NO_PLAN, planActive, type PlanView } from '@scribe/core';
import type {
  NativeEntitlementSnapshot,
  NativeStatus,
  NativeTransaction,
  Ownership,
  RenewalStateName,
  StoreEnvironment,
} from '../../../modules/scribe-store/types';
import { isPlusProduct, periodOf } from './config';

const DAY_MS = 86_400_000;
/**
 * Apple still lists a subscription whose period end has passed (billing grace
 * without a date, or a renewal not yet on this phone): keep Plus on until the
 * next check, at most this long.
 */
const STILL_LISTED_MS = DAY_MS;
/** Subscription Terms: cancel at least 24 hours before a free trial or period ends. */
const CANCEL_LEAD_MS = DAY_MS;

export type PlanStatus = PlanView['state'];

/** What the Plan screen shows. Dates are ISO instants from Apple. */
export interface PlanDetails {
  status: PlanStatus;
  productId: string | null;
  period: 'month' | 'year' | null;
  ownership: Ownership | null;
  willAutoRenew: boolean | null;
  /** When the current period or free trial ends (renews, unless cancelled). */
  periodEnd: string | null;
  /** End of Apple's billing grace period, while in it. */
  graceEnd: string | null;
  /** periodEnd minus 24 hours, when it will renew and the person bought it. */
  cancelBy: string | null;
}

export interface PlanState {
  /** The engine's view (packages/core PlanView). */
  view: PlanView;
  details: PlanDetails;
  /** When StoreKit was last read on this phone; null when it never was. */
  checkedAt: string | null;
}

const NO_DETAILS: PlanDetails = {
  status: 'none',
  productId: null,
  period: null,
  ownership: null,
  willAutoRenew: null,
  periodEnd: null,
  graceEnd: null,
  cancelBy: null,
};

/** Never read StoreKit (Expo Go, web, Android, first launch offline): Free, nothing locked. */
export const EMPTY_PLAN: PlanState = { view: NO_PLAN, details: NO_DETAILS, checkedAt: null };

// ── Snapshot validation (native results and the device cache) ───────────

const ENVIRONMENTS: ReadonlySet<string> = new Set(['production', 'sandbox', 'xcode']);
const STATES: ReadonlySet<string> = new Set(['subscribed', 'inGracePeriod', 'inBillingRetryPeriod', 'expired', 'revoked', 'unknown']);

const isoOrUndefined = (v: unknown): string | undefined =>
  typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : undefined;

function transactionOf(raw: unknown): NativeTransaction | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.productId !== 'string' || !isPlusProduct(r.productId)) return null;
  const tx: NativeTransaction = {
    productId: r.productId,
    ownership: r.ownership === 'familyShared' ? 'familyShared' : 'purchased',
    environment: typeof r.environment === 'string' && ENVIRONMENTS.has(r.environment) ? (r.environment as StoreEnvironment) : 'production',
    isTrial: r.isTrial === true,
    isUpgraded: r.isUpgraded === true,
  };
  const expiresAt = isoOrUndefined(r.expiresAt);
  const purchasedAt = isoOrUndefined(r.purchasedAt);
  const revokedAt = isoOrUndefined(r.revokedAt);
  if (expiresAt) tx.expiresAt = expiresAt;
  if (purchasedAt) tx.purchasedAt = purchasedAt;
  if (revokedAt) tx.revokedAt = revokedAt;
  return tx;
}

function statusOf(raw: unknown): NativeStatus | null {
  const tx = transactionOf(raw);
  if (!tx) return null;
  const r = raw as Record<string, unknown>;
  const status: NativeStatus = {
    ...tx,
    state: typeof r.state === 'string' && STATES.has(r.state) ? (r.state as RenewalStateName) : 'unknown',
  };
  if (typeof r.willAutoRenew === 'boolean') status.willAutoRenew = r.willAutoRenew;
  const grace = isoOrUndefined(r.gracePeriodExpiresAt);
  if (grace) status.gracePeriodExpiresAt = grace;
  return status;
}

/** Keeps only well-formed Plus entries. Returns null when the whole thing is unusable. Never throws. */
export function sanitizeSnapshot(raw: unknown): NativeEntitlementSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const checkedAt = isoOrUndefined(r.checkedAt);
  if (!checkedAt) return null;
  const list = <T>(v: unknown, f: (x: unknown) => T | null): T[] =>
    Array.isArray(v) ? v.map(f).filter((x): x is T => x !== null) : [];
  return { entitlements: list(r.entitlements, transactionOf), statuses: list(r.statuses, statusOf), checkedAt };
}

// ── Device cache ─────────────────────────────────────────────────────────

const CACHE_VERSION = 1;

export function serializePlanCache(s: NativeEntitlementSnapshot): string {
  return JSON.stringify({ v: CACHE_VERSION, s });
}

export function parsePlanCache(raw: string | null): NativeEntitlementSnapshot | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as { v?: unknown; s?: unknown };
    return o && o.v === CACHE_VERSION ? sanitizeSnapshot(o.s) : null;
  } catch {
    return null;
  }
}

/** Same entitlements and statuses, ignoring when they were read. */
export function sameEntitlements(a: NativeEntitlementSnapshot | null, b: NativeEntitlementSnapshot | null): boolean {
  if (!a || !b) return a === b;
  return JSON.stringify([a.entitlements, a.statuses]) === JSON.stringify([b.entitlements, b.statuses]);
}

// ── Snapshot -> plan ─────────────────────────────────────────────────────

interface Live {
  tx: NativeTransaction;
  status?: NativeStatus;
  /** ms; null = no end. */
  until: number | null;
  inGrace: boolean;
}

const sameSubscription = (a: NativeTransaction, b: NativeTransaction) => a.productId === b.productId && a.ownership === b.ownership;
const toIso = (ms: number) => new Date(ms).toISOString();
const latestFirst = (a: NativeTransaction, b: NativeTransaction) =>
  (Date.parse(b.expiresAt ?? '') || 0) - (Date.parse(a.expiresAt ?? '') || 0);

function liveOf(tx: NativeTransaction, status: NativeStatus | undefined, checkedMs: number): Live {
  const inGrace = status?.state === 'inGracePeriod';
  const exp = tx.expiresAt ? Date.parse(tx.expiresAt) : null;
  if (exp === null) return { tx, status, until: null, inGrace };
  const graceEnd = status?.gracePeriodExpiresAt ? Date.parse(status.gracePeriodExpiresAt) : null;
  let until = exp;
  if (inGrace) until = Math.max(exp, graceEnd ?? checkedMs + STILL_LISTED_MS);
  else if (exp <= checkedMs) until = checkedMs + STILL_LISTED_MS;
  return { tx, status, until, inGrace };
}

/**
 * StoreKit 2 snapshot -> PlanState. Live means Apple lists it in
 * Transaction.currentEntitlements (subscribed or in billing grace), or a
 * verified status says so. The person's own purchase is shown before a Family
 * Sharing one; Plus is on while any of them is live.
 */
export function planFromSnapshot(snap: NativeEntitlementSnapshot | null): PlanState {
  if (!snap) return EMPTY_PLAN;
  const checkedMs = Date.parse(snap.checkedAt);
  const statusFor = (tx: NativeTransaction) => snap.statuses.find((s) => sameSubscription(s, tx));

  const live: Live[] = [];
  for (const tx of snap.entitlements) {
    if (!tx.isUpgraded && !tx.revokedAt) live.push(liveOf(tx, statusFor(tx), checkedMs));
  }
  for (const s of snap.statuses) {
    const on = s.state === 'subscribed' || s.state === 'inGracePeriod';
    if (on && !s.isUpgraded && !s.revokedAt && !live.some((l) => sameSubscription(l.tx, s))) live.push(liveOf(s, s, checkedMs));
  }

  if (live.length > 0) {
    const rank = (l: Live) => (l.until === null ? Number.POSITIVE_INFINITY : l.until);
    const best = [...live].sort((a, b) => {
      if (a.tx.ownership !== b.tx.ownership) return a.tx.ownership === 'purchased' ? -1 : 1;
      return rank(b) - rank(a);
    })[0];
    const untilAll = live.some((l) => l.until === null) ? null : Math.max(...live.map((l) => l.until as number));
    const state: PlanStatus = best.inGrace ? 'grace' : best.tx.isTrial ? 'trial' : 'active';
    const willAutoRenew = best.status?.willAutoRenew ?? null;
    const periodEnd = best.tx.expiresAt ?? null;
    const cancelBy =
      periodEnd && willAutoRenew !== false && best.tx.ownership === 'purchased' && (state === 'trial' || state === 'active')
        ? toIso(Date.parse(periodEnd) - CANCEL_LEAD_MS)
        : null;
    return {
      view: {
        state,
        effectiveUntil: untilAll === null ? null : toIso(untilAll),
        verifiedAt: snap.checkedAt,
        environment: best.tx.environment,
        isTester: best.tx.environment !== 'production',
      },
      details: {
        status: state,
        productId: best.tx.productId,
        period: periodOf(best.tx.productId),
        ownership: best.tx.ownership,
        willAutoRenew,
        periodEnd,
        graceEnd: best.inGrace ? (best.status?.gracePeriodExpiresAt ?? null) : null,
        cancelBy,
      },
      checkedAt: snap.checkedAt,
    };
  }

  // Not entitled. Say why, for the Plan screen; the engine treats all of these as Free.
  const byState = (want: RenewalStateName) => snap.statuses.filter((s) => s.state === want).sort(latestFirst)[0];
  const retry = byState('inBillingRetryPeriod');
  const revoked = byState('revoked') ?? snap.statuses.filter((s) => s.revokedAt).sort(latestFirst)[0];
  const expired = byState('expired');
  const [status, why]: [PlanStatus, NativeStatus | undefined] = retry
    ? ['billing_retry', retry]
    : revoked
      ? ['revoked', revoked]
      : expired
        ? ['expired', expired]
        : ['none', undefined];
  if (!why) return { view: { ...NO_PLAN, verifiedAt: snap.checkedAt }, details: NO_DETAILS, checkedAt: snap.checkedAt };
  return {
    view: {
      state: status,
      effectiveUntil: why.expiresAt ?? null,
      verifiedAt: snap.checkedAt,
      environment: why.environment,
      isTester: why.environment !== 'production',
    },
    details: {
      ...NO_DETAILS,
      status,
      productId: why.productId,
      period: periodOf(why.productId),
      ownership: why.ownership,
      willAutoRenew: why.willAutoRenew ?? null,
      periodEnd: why.expiresAt ?? null,
    },
    checkedAt: snap.checkedAt,
  };
}

/** Plus extras are on at `now` (trial, active or grace, before its end). */
export function plusOn(plan: PlanState, now: string): boolean {
  return planActive(plan.view, now);
}

// ── Plan screen line ─────────────────────────────────────────────────────

export type PlanLine =
  | { kind: 'off' }
  | { kind: 'retry' }
  | { kind: 'grace' }
  | { kind: 'trial'; until: string; cancelBy: string | null }
  | { kind: 'renews'; on: string }
  | { kind: 'ends'; on: string }
  | { kind: 'on' };

/** YYYY-MM-DD of an instant in the phone's own time zone (what a person calls "the date"). */
export function localDateOf(isoInstant: string): string {
  const d = new Date(isoInstant);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function planLine(plan: PlanState, now: string): PlanLine {
  const d = plan.details;
  if (!plusOn(plan, now)) return d.status === 'billing_retry' ? { kind: 'retry' } : { kind: 'off' };
  if (d.status === 'grace') return { kind: 'grace' };
  if (!d.periodEnd) return { kind: 'on' };
  const end = localDateOf(d.periodEnd);
  if (d.willAutoRenew === false) return { kind: 'ends', on: end };
  if (d.status === 'trial') return { kind: 'trial', until: end, cancelBy: d.cancelBy ? localDateOf(d.cancelBy) : null };
  return { kind: 'renews', on: end };
}

// ── Gates ────────────────────────────────────────────────────────────────
//
// Membership (D-082, D-083): the Keep step is the one gate, decided by
// decideKeepLetter in packages/core from Plus on this phone and the letter
// ledger (letter-ledger.ts). Starting a book and Read together are no longer
// gated, so the old start_book and read_together inputs are gone.

/** What the phone knows about one book. */
export interface BookFacts {
  /**
   * false for a book joined as co-parent (sync_books `created_by_me`).
   * Undefined means it was started on this phone.
   */
  createdByMe?: boolean;
  /** In the 30-day delete window. Hidden books are not deleted: they count. */
  deleted?: boolean;
  /** YYYY-MM-DD, or null while expecting. */
  birthday: string | null;
  /** This person's role in the book. v1.0 has parents and co-parents only. */
  role?: 'parent' | 'contributor';
}

/** A book joined as a co-parent. */
export function isJoinedBook(book: Pick<BookFacts, 'createdByMe'>): boolean {
  return book.createdByMe === false;
}
