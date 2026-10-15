/**
 * Subscription status report and consent record, version 1 (D-080, D-081;
 * F14 6.6 "Rules for the status report", F14-REQ-014, -032, -043, -044, -046,
 * LEGAL-REQ-049; R2 AR-13; WP-F14-15a to c).
 *
 * The phone tells our server only enough to send the reminder emails that
 * auto-renewal laws require: which plan, when a free period ends, when the
 * plan renews, whether renewal is off. The first report after a purchase in
 * the app also carries the consent facts (D-081). The server never enforces
 * Plus and never answers "is this person a member" (D-080).
 *
 * Never on the wire (F14-REQ-014): receipts, signed transactions (JWS),
 * transaction ids in clear, `appAccountToken`, prices, card or payment data.
 * The request schema is strict, so a body with any other key is refused
 * (400) instead of being stored; `test/subscription-status.test.ts` fails if a
 * key that looks like purchase data is ever added.
 *
 * Who reports: only a phone whose transaction ownership is `purchased`;
 * Family Sharing members never report and get no billing email
 * (F14-REQ-006). A report made while signed out waits in the outbox until
 * sign-in (F14-REQ-043): `PendingPurchase` while there is no salt, then
 * `enqueueStatusReport` keeps one report per purchase.
 *
 * Server-feature contract: imported only through `@scribe/api/server`.
 * Edge Functions import this file directly (Deno), so it stays a leaf module:
 * no relative imports, no package import except `valibot`.
 */
import * as v from 'valibot';

export const STATUS_REPORT_SCHEMA_VERSION = 1;

/** `POST /functions/v1/subscription-status/v1/report` and `GET .../v1/salt`. Pinned to ENDPOINTS by a test. */
export const STATUS_REPORT_PATH = '/functions/v1/subscription-status/v1/report';
export const STATUS_SALT_PATH = '/functions/v1/subscription-status/v1/salt';

/** StoreKit's environment for the transaction (R2 AR-13). The server sends emails only for `production`. */
export const STORE_ENVIRONMENTS = ['production', 'sandbox', 'xcode'] as const;
export type StoreEnvironment = (typeof STORE_ENVIRONMENTS)[number];

/** The plan's billing period. The published price for the email comes from `packages/content/src/pricing.ts`, never from the phone. */
export const PLAN_PERIODS = ['monthly', 'annual'] as const;
export type PlanPeriod = (typeof PLAN_PERIODS)[number];

/** How the free period (if any) was offered (R4 PT-10, F14-REQ-044). */
export const OFFER_TYPES = ['none', 'introductory', 'promotional', 'offer_code'] as const;
export type OfferType = (typeof OFFER_TYPES)[number];

/** `terms_version` for an offer code redeemed outside the app, where we showed no terms (F14-REQ-044). */
export const TERMS_NONE_OUTSIDE_APP = 'none_outside_app';
/** A build-time constant from `billingCopy.store` and the Subscription Terms (F14-REQ-011), or `none_outside_app`. */
export const TERMS_VERSION_RE = /^(?:none_outside_app|[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}(?:\+[0-9a-f]{8})?)$/;

/** `sub_ref`: 64 lowercase hex; SHA-256 of the per-account salt then the original transaction id (see `subRefReference`). */
export const SUB_REF_RE = /^[0-9a-f]{64}$/;
/** StoreKit product ids we sell (`plus.monthly`, `plus.annual`; docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md). */
export const PRODUCT_ID_RE = /^[a-z0-9][a-z0-9._-]{0,99}$/;

const isoTime = v.pipe(v.string(), v.maxLength(40), v.isoTimestamp());

/** D-081 consent facts, on the first report after a purchase or trial in the app. One record per original purchase. */
export const ConsentFactsSchema = v.strictObject({
  product_id: v.pipe(v.string(), v.regex(PRODUCT_ID_RE)),
  offer_type: v.picklist(OFFER_TYPES),
  terms_version: v.pipe(v.string(), v.regex(TERMS_VERSION_RE)),
  /** When the terms were shown and the purchase confirmed (device clock). */
  shown_at: isoTime,
});
export type ConsentFacts = v.InferOutput<typeof ConsentFactsSchema>;

/**
 * The report. D-080's four facts (`plan`, `trial_end`, `renewal_date`,
 * `cancelled`) plus R2 AR-13's identity and freshness (`sub_ref`,
 * `environment`, `reported_at`). `free_period_days` is the one addition the
 * email windows need (trial week versus trial long key on the free period's
 * length, not on the product, F14 6.6 and F14-REQ-044); it is an open item
 * for counsel with D-080 (listed in the PR) and optional until then.
 */
export const StatusReportSchema = v.strictObject({
  schema_version: v.literal(STATUS_REPORT_SCHEMA_VERSION),
  sub_ref: v.pipe(v.string(), v.regex(SUB_REF_RE)),
  environment: v.picklist(STORE_ENVIRONMENTS),
  plan: v.picklist(PLAN_PERIODS),
  /** End of the current free period, or null when not in one. */
  trial_end: v.nullable(isoTime),
  /** End of the current paid or free period: the next renewal, or the end when cancelled. Null after it ended. */
  renewal_date: v.nullable(isoTime),
  /** Auto-renew is off (`willAutoRenew` false). The scheduler skips pending trial and renewal emails (F14-REQ-033). */
  cancelled: v.boolean(),
  free_period_days: v.optional(v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(366)))),
  /** When the phone observed these values (device clock). The server keeps the newest per (profile, sub_ref). */
  reported_at: isoTime,
  consent: v.optional(ConsentFactsSchema),
});
export type StatusReport = v.InferOutput<typeof StatusReportSchema>;

export const STORED_OUTCOMES = ['created', 'updated', 'unchanged', 'older'] as const;
export type StoredOutcome = (typeof STORED_OUTCOMES)[number];
export const CONSENT_OUTCOMES = ['recorded', 'already_recorded', 'none'] as const;
export type ConsentOutcome = (typeof CONSENT_OUTCOMES)[number];

/** `data` of a success envelope. Nothing about membership comes back (D-080 rule 4). */
export const StatusReportResultSchema = v.object({
  stored: v.picklist(STORED_OUTCOMES),
  consent: v.picklist(CONSENT_OUTCOMES),
});
export type StatusReportResult = v.InferOutput<typeof StatusReportResultSchema>;

/** `data` of the salt answer: 32 random bytes per account, base64url without padding. Made on the first call, then stable. */
export const SALT_RE = /^[A-Za-z0-9_-]{43}$/;
export const StatusSaltSchema = v.object({ salt: v.pipe(v.string(), v.regex(SALT_RE)) });
export type StatusSalt = v.InferOutput<typeof StatusSaltSchema>;

/** Per user per rolling hour, enforced in the SQL (`status_report_store`, SCRAT; one request per change, F14 section 9). */
export const STATUS_REPORTS_PER_HOUR = 30;
/** The body is small; anything larger is refused before parsing. */
export const STATUS_REPORT_MAX_BYTES = 2_048;

export function parseStatusReport(input: unknown): { ok: true; value: StatusReport } | { ok: false } {
  const r = v.safeParse(StatusReportSchema, input);
  if (!r.success) return { ok: false };
  const x = r.output;
  // A cancelled plan still has its end date; a free period ends no later than the period it sits in.
  if (x.trial_end !== null && x.renewal_date !== null && Date.parse(x.trial_end) > Date.parse(x.renewal_date) + 86_400_000) return { ok: false };
  return { ok: true, value: x };
}

/**
 * Fields the scheduler compares to decide `unchanged` (the consent facts and
 * `reported_at` are not status). Reference for S06's SQL, which computes it
 * itself: a client never supplies it.
 */
export function statusFingerprint(r: Pick<StatusReport, 'environment' | 'plan' | 'trial_end' | 'renewal_date' | 'cancelled' | 'free_period_days'>): string {
  return [r.environment, r.plan, r.trial_end ?? '-', r.renewal_date ?? '-', r.cancelled ? '1' : '0', r.free_period_days ?? '-'].join('|');
}

/**
 * The outbox for reports (F14-REQ-043): one report per purchase (`sub_ref`).
 * A newer observation replaces the status; consent facts are kept from
 * whichever report carried them first (D-081 records the purchase moment),
 * and a report for another purchase never displaces this one.
 */
export function enqueueStatusReport(queue: readonly StatusReport[], next: StatusReport): StatusReport[] {
  const i = queue.findIndex((q) => q.sub_ref === next.sub_ref);
  if (i < 0) return [...queue, next];
  const prev = queue[i];
  const newer = Date.parse(next.reported_at) >= Date.parse(prev.reported_at) ? next : prev;
  const consent = prev.consent ?? next.consent;
  const merged: StatusReport = consent ? { ...newer, consent } : { ...newer, consent: undefined };
  return queue.map((q, j) => (j === i ? merged : q));
}

/**
 * Signed out, there is no salt yet, so no `sub_ref` can be made. What waits
 * on the phone instead is the consent moment, keyed by an opaque handle the
 * native store module makes (a random UUID it maps to the transaction inside
 * Swift and the Keychain; JavaScript never sees a transaction id,
 * F14-REQ-014). At sign-in the app fetches the salt, asks the module for the
 * `sub_ref` and current status of each handle, attaches the consent facts and
 * enqueues the report. Only `purchased` ownership makes a pending notice.
 */
export const LOCAL_REF_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const PendingPurchaseSchema = v.strictObject({
  local_ref: v.pipe(v.string(), v.regex(LOCAL_REF_RE)),
  consent: ConsentFactsSchema,
  queued_at: isoTime,
});
export type PendingPurchase = v.InferOutput<typeof PendingPurchaseSchema>;

/** Builds the first report for a pending purchase once the native module has its `sub_ref` and status. */
export function reportFromPending(
  pending: PendingPurchase,
  status: Omit<StatusReport, 'schema_version' | 'consent'>,
): StatusReport {
  return { schema_version: STATUS_REPORT_SCHEMA_VERSION, ...status, consent: pending.consent };
}

/**
 * Reference for `sub_ref`, for tests and for the Swift implementation to
 * match: hex(SHA-256(base64url-decoded salt bytes || UTF-8 original
 * transaction id)). The app's JavaScript never holds a transaction id
 * (F14-REQ-014): the native store module computes this and hands JS only the
 * hex. Uses WebCrypto (Node, Deno), so it is not for Hermes.
 */
export async function subRefReference(saltB64url: string, originalTransactionId: string): Promise<string> {
  const salt = base64UrlToBytes(saltB64url);
  const id = new TextEncoder().encode(originalTransactionId);
  const buf = new Uint8Array(salt.length + id.length);
  buf.set(salt, 0);
  buf.set(id, salt.length);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
  return Array.from(digest, (b) => b.toString(16).padStart(2, '0')).join('');
}

function base64UrlToBytes(s: string): Uint8Array {
  if (!SALT_RE.test(s)) throw new Error('invalid_salt');
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '=';
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
