/**
 * The D-080 status report, pure part (WP-F14-15a; F14 6.6 "Rules for the status report";
 * contract packages/api/src/server/subscription-status.ts, S07). No React Native, no clock,
 * no network: tested in test/billing-status-report.test.ts.
 *
 * What a report carries, and nothing more (F14-REQ-014): `sub_ref` (made in Swift from this
 * account's salt; JavaScript never holds a transaction id), `environment`, `plan`,
 * `trial_end`, `renewal_date`, `cancelled`, `reported_at`, and on the first report after a
 * purchase in the app the D-081 consent facts (product, offer type, Subscription Terms
 * version shown, time). `free_period_days` is optional in contract v1 and open with counsel,
 * so this build never sends it.
 *
 * Who reports: only the person's own purchase (ownership `purchased`). Family Sharing members
 * never report (F14-REQ-006). When: when a status changed since the last report this phone
 * stored for this account, or when consent facts are waiting. Signed out, nothing is sent;
 * consent facts wait on the phone until sign-in (F14-REQ-043).
 *
 * Kept on the phone (device settings `plus.statusReport`, L2): the account the sent marks
 * belong to, a fingerprint per purchase (keyed by product and first-purchase date, never by
 * an id or a `sub_ref`), and the waiting consent facts. Never the salt or a `sub_ref`.
 *
 * Loaded only behind `capabilities.statusReport` (a dynamic import from plan-store and
 * actions), so a build with the flag off never evaluates the server contract (M14 rule in
 * packages/api/test/server-features-off.test.ts).
 */
import {
  CONSENT_OUTCOMES,
  OFFER_TYPES,
  parseStatusReport,
  SALT_RE,
  STATUS_REPORT_PATH,
  STATUS_REPORT_SCHEMA_VERSION,
  STATUS_SALT_PATH,
  STORED_OUTCOMES,
  statusFingerprint,
  TERMS_NONE_OUTSIDE_APP,
  type ConsentFacts,
  type OfferType,
  type StatusReport,
} from '@scribe/api/server';
import type { NativeOfferType, NativeStatusRef, RenewalStateName } from '../../../modules/scribe-store/types';
import type { AuthState } from '../auth/machine.logic';
import { isPlusProduct } from './config';

/** Edge Function names for supabase-js `functions.invoke`, from the contract's paths. */
export const REPORT_FUNCTION = STATUS_REPORT_PATH.replace(/^\/functions\/v1\//, '');
export const SALT_FUNCTION = STATUS_SALT_PATH.replace(/^\/functions\/v1\//, '');

/** Device settings key for what this phone has reported (L2, no ids). */
export const STATUS_REPORT_STATE_KEY = 'plus.statusReport';
/** At most this many purchases waiting for their first report; older ones are dropped first. */
export const MAX_PENDING = 8;
/** Consent facts that never met their purchase (refunded before sign-in) are dropped after this. */
export const PENDING_MAX_AGE_MS = 400 * 86_400_000;

const STATE_VERSION = 1;
const SUB_REF_RE = /^[0-9a-f]{64}$/;
const LIVE_STATES: ReadonlySet<RenewalStateName> = new Set(['subscribed', 'inGracePeriod', 'inBillingRetryPeriod', 'unknown']);
const ENDED_STATES: ReadonlySet<RenewalStateName> = new Set(['expired', 'revoked']);
const ENVIRONMENTS = new Set(['production', 'sandbox', 'xcode']);
const NATIVE_OFFERS: ReadonlySet<string> = new Set(['none', 'introductory', 'promotional', 'offer_code', 'win_back', 'other']);

/** Consent facts waiting for the purchase's first report. Matched by product and first-purchase date. */
export interface PendingConsent {
  productId: string;
  originalPurchasedAt: string;
  termsVersion: string;
  shownAt: string;
  queuedAt: string;
}

export interface ReportState {
  /** The account the `sent` and `consented` marks belong to; another account starts afresh. */
  owner: string | null;
  /** Fingerprint of the last status the server stored, per purchase key. */
  sent: Record<string, string>;
  /** Purchase keys whose consent facts the server has (recorded or already recorded). */
  consented: string[];
  pending: PendingConsent[];
}

export const EMPTY_REPORT_STATE: ReportState = { owner: null, sent: {}, consented: [], pending: [] };

const isIso = (v: unknown): v is string => typeof v === 'string' && v.length <= 40 && !Number.isNaN(Date.parse(v));

/**
 * The account a report goes to: a `ready` session whose claim on this phone's letters is
 * settled (PR #139, BL-347). While the claim screen waits for "Keep them here", the session
 * may be someone else's account, so this phone's purchase is not reported to it; the report
 * goes once the person confirms, or at once when no claim is needed. The content consent
 * (`sync` on or off) does not gate it: a report carries no letter, as before. `claimPending`
 * is asked only for a ready session.
 */
export function reportingUserOf(state: AuthState, claimPending: () => boolean): string | null {
  if (state.status !== 'ready') return null;
  return claimPending() ? null : state.userId;
}

/** The local key of one purchase: product and first-purchase date. Not an id, and not sent anywhere. */
export function purchaseKey(productId: string, originalPurchasedAt: string): string {
  return `${productId}|${originalPurchasedAt}`;
}

export function parseReportState(raw: string | null | undefined): ReportState {
  if (!raw) return EMPTY_REPORT_STATE;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (!o || o.v !== STATE_VERSION) return EMPTY_REPORT_STATE;
    const sent: Record<string, string> = {};
    if (o.sent && typeof o.sent === 'object') {
      for (const [k, v] of Object.entries(o.sent as Record<string, unknown>)) if (typeof v === 'string' && k.length <= 120) sent[k] = v;
    }
    const consented = Array.isArray(o.consented) ? o.consented.filter((k): k is string => typeof k === 'string').slice(-50) : [];
    const pending = Array.isArray(o.pending)
      ? o.pending.filter((p): p is PendingConsent => {
          const x = p as Record<string, unknown>;
          return !!x && typeof x.productId === 'string' && isPlusProduct(x.productId) && isIso(x.originalPurchasedAt)
            && typeof x.termsVersion === 'string' && isIso(x.shownAt) && isIso(x.queuedAt);
        }).slice(-MAX_PENDING)
      : [];
    return { owner: typeof o.owner === 'string' ? o.owner : null, sent, consented, pending };
  } catch {
    return EMPTY_REPORT_STATE;
  }
}

export function serializeReportState(s: ReportState): string {
  return JSON.stringify({ v: STATE_VERSION, owner: s.owner, sent: s.sent, consented: s.consented.slice(-50), pending: s.pending.slice(-MAX_PENDING) });
}

/** Keeps only well-formed own Plus items from the native module. Never throws. */
export function sanitizeRefs(raw: unknown): NativeStatusRef[] {
  if (!Array.isArray(raw)) return [];
  const out: NativeStatusRef[] = [];
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue;
    const r = x as Record<string, unknown>;
    if (typeof r.subRef !== 'string' || !SUB_REF_RE.test(r.subRef)) continue;
    if (typeof r.productId !== 'string' || !isPlusProduct(r.productId)) continue;
    if (r.ownership !== 'purchased') continue; // Family Sharing never reports (F14-REQ-006)
    if (typeof r.environment !== 'string' || !ENVIRONMENTS.has(r.environment)) continue;
    const item: NativeStatusRef = {
      subRef: r.subRef,
      productId: r.productId,
      ownership: 'purchased',
      environment: r.environment as NativeStatusRef['environment'],
      isTrial: r.isTrial === true,
      isUpgraded: r.isUpgraded === true,
      state: typeof r.state === 'string' ? (r.state as RenewalStateName) : 'unknown',
    };
    if (isIso(r.expiresAt)) item.expiresAt = r.expiresAt;
    if (isIso(r.purchasedAt)) item.purchasedAt = r.purchasedAt;
    if (isIso(r.originalPurchasedAt)) item.originalPurchasedAt = r.originalPurchasedAt;
    if (isIso(r.revokedAt)) item.revokedAt = r.revokedAt;
    if (typeof r.willAutoRenew === 'boolean') item.willAutoRenew = r.willAutoRenew;
    if (typeof r.offerType === 'string' && NATIVE_OFFERS.has(r.offerType)) item.offerType = r.offerType as NativeOfferType;
    if (typeof r.freePeriod === 'boolean') item.freePeriod = r.freePeriod;
    out.push(item);
  }
  return out;
}

/**
 * The contract's offer type. A win-back offer is `win_back` (S07 added it to OFFER_TYPES
 * for #178; Plus configures none). Only a kind newer than this build (`other`, none
 * exists as of iOS 18) is reported as `promotional`, the nearest kind, until the contract
 * names it.
 */
export function offerTypeOf(native: NativeOfferType | undefined): OfferType {
  if (native === 'other') return 'promotional';
  return native && (OFFER_TYPES as readonly string[]).includes(native) ? (native as OfferType) : 'none';
}

/** The D-080 fields of one own subscription. Null when the plan is not one we sell. */
export function statusFieldsOf(item: NativeStatusRef): Omit<StatusReport, 'schema_version' | 'sub_ref' | 'reported_at' | 'consent'> | null {
  const plan = item.productId === 'plus.monthly' ? 'monthly' : item.productId === 'plus.annual' ? 'annual' : null;
  if (!plan) return null;
  const ended = ENDED_STATES.has(item.state) || !!item.revokedAt;
  const live = !ended && LIVE_STATES.has(item.state);
  const end = item.expiresAt ?? null;
  return {
    environment: item.environment,
    plan,
    // The end of a free period: an introductory trial, or an offer code with a free period (F14-REQ-044).
    trial_end: live && end && (item.freePeriod ?? item.isTrial) ? end : null,
    // The end of the current period: the next renewal, or the end when cancelled; null once it ended.
    renewal_date: live ? end : null,
    // Renewal off, or the plan has ended or was refunded (nothing will renew).
    cancelled: item.willAutoRenew === false || ended,
  };
}

/** Records consent facts at a purchase in the app, before any sign-in or salt. Replaces facts for the same purchase. */
export function addPendingConsent(state: ReportState, p: PendingConsent): ReportState {
  const key = purchaseKey(p.productId, p.originalPurchasedAt);
  const rest = state.pending.filter((x) => purchaseKey(x.productId, x.originalPurchasedAt) !== key);
  return { ...state, pending: [...rest, p].slice(-MAX_PENDING) };
}

export interface PlannedReport {
  key: string;
  report: StatusReport;
  fingerprint: string;
}

/**
 * What to send now: one report per own purchase whose status changed since the server last
 * stored it for this account, or whose consent facts are waiting. A purchase made through
 * an offer code with no consent facts of ours carries `none_outside_app` once (we showed no
 * Subscription Terms there; F14-U43, F14-REQ-044). Reports that fail the contract's own
 * parser are never sent.
 */
export function planReports(items: readonly NativeStatusRef[], state: ReportState, ctx: { owner: string; now: string }): PlannedReport[] {
  const fresh = state.owner === ctx.owner;
  const sent = fresh ? state.sent : {};
  const consented = new Set(fresh ? state.consented : []);
  const out: PlannedReport[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.subRef)) continue;
    seen.add(item.subRef);
    const fields = statusFieldsOf(item);
    if (!fields || !item.originalPurchasedAt) continue;
    const key = purchaseKey(item.productId, item.originalPurchasedAt);
    const fingerprint = statusFingerprint(fields);
    let consent: ConsentFacts | undefined;
    if (!consented.has(key)) {
      const waiting = state.pending.find((p) => purchaseKey(p.productId, p.originalPurchasedAt) === key);
      if (waiting) {
        consent = { product_id: item.productId, offer_type: offerTypeOf(item.offerType), terms_shown: waiting.termsVersion, shown_at: waiting.shownAt };
      } else if (item.offerType === 'offer_code') {
        consent = { product_id: item.productId, offer_type: 'offer_code', terms_shown: TERMS_NONE_OUTSIDE_APP, shown_at: item.purchasedAt ?? item.originalPurchasedAt };
      }
    }
    if (sent[key] === fingerprint && !consent) continue;
    const report: StatusReport = {
      schema_version: STATUS_REPORT_SCHEMA_VERSION,
      sub_ref: item.subRef,
      ...fields,
      reported_at: ctx.now,
      ...(consent ? { consent } : {}),
    };
    const parsed = parseStatusReport(report);
    if (!parsed.ok) continue;
    out.push({ key, report: parsed.value, fingerprint });
  }
  return out;
}

/** After the server stored a report (any `stored` outcome): mark it, and drop its waiting consent facts once they are in. */
export function afterStored(state: ReportState, owner: string, planned: PlannedReport, consentOutcome: 'recorded' | 'already_recorded' | 'none'): ReportState {
  const base = state.owner === owner ? state : { ...state, owner, sent: {}, consented: [] };
  const sent = { ...base.sent, [planned.key]: planned.fingerprint };
  if (!planned.report.consent || consentOutcome === 'none') return { ...base, owner, sent };
  return {
    owner,
    sent,
    consented: [...base.consented.filter((k) => k !== planned.key), planned.key],
    pending: base.pending.filter((p) => purchaseKey(p.productId, p.originalPurchasedAt) !== planned.key),
  };
}

/** Drops waiting consent facts that never met their purchase (for example refunded before any sign-in). */
export function prunePending(state: ReportState, now: string): ReportState {
  const t = Date.parse(now);
  const pending = state.pending.filter((p) => t - Date.parse(p.queuedAt) < PENDING_MAX_AGE_MS);
  return pending.length === state.pending.length ? state : { ...state, pending };
}

/**
 * The Subscription Terms version the consent record names (F14-REQ-011, D-081):
 * `<document version>+<8 hex of the store sheet text>`, so any change to
 * `billingCopy.store` or to the Subscription Terms version gives a new value in CI.
 * FNV-1a over the JSON of the copy: a change detector, not a security hash.
 */
export function termsVersionOf(documentVersion: string, storeCopy: unknown): string {
  const text = JSON.stringify(storeCopy);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${documentVersion}+${h.toString(16).padStart(8, '0')}`;
}

/** The salt answer envelope `{ok: true, data: {salt}}`, or null. */
export function saltFromAnswer(body: unknown): string | null {
  const b = body as { ok?: unknown; data?: { salt?: unknown } } | null;
  const salt = b && b.ok === true ? b.data?.salt : undefined;
  return typeof salt === 'string' && SALT_RE.test(salt) ? salt : null;
}

/** The report answer envelope `{ok: true, data: {stored, consent}}`, or null. Nothing about membership comes back. */
export function storedFromAnswer(body: unknown): { stored: (typeof STORED_OUTCOMES)[number]; consent: (typeof CONSENT_OUTCOMES)[number] } | null {
  const b = body as { ok?: unknown; data?: { stored?: unknown; consent?: unknown } } | null;
  if (!b || b.ok !== true || !b.data) return null;
  const { stored, consent } = b.data;
  if (typeof stored !== 'string' || !(STORED_OUTCOMES as readonly string[]).includes(stored)) return null;
  if (typeof consent !== 'string' || !(CONSENT_OUTCOMES as readonly string[]).includes(consent)) return null;
  return { stored: stored as (typeof STORED_OUTCOMES)[number], consent: consent as (typeof CONSENT_OUTCOMES)[number] };
}

/** The error code of a refused answer envelope `{ok: false, error: {code}}`, or 'unavailable'. */
export function errorCodeFromAnswer(body: unknown): string {
  const b = body as { ok?: unknown; error?: { code?: unknown } } | null;
  const code = b && b.ok === false ? b.error?.code : undefined;
  return typeof code === 'string' && /^[a-z_]{1,40}$/.test(code) ? code : 'unavailable';
}
