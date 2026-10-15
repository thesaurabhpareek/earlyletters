/**
 * Response envelope, error codes and the SQLSTATE mapping (ADR 0017).
 *
 * - JSON endpoints answer `{ ok: true, data, requestId }` or
 *   `{ ok: false, error: { code, retryable, sqlstate? }, requestId }`.
 * - Public signed documents (config, content, pack manifest) are served as
 *   the bare `SignedDocument` so any CDN can cache them byte for byte; their
 *   request id travels in the `x-request-id` header, and their errors use the
 *   failure envelope.
 * - An error never carries a message, row, path, id or any user text: only a
 *   closed code, whether to retry, and (for Postgres) the SQLSTATE.
 *
 * Edge Functions import this file directly (`../../../packages/api/src/envelope.ts`,
 * Deno, `supabase functions deploy --use-api`), so it must stay a leaf module:
 * no relative imports, and no package import except `valibot`.
 */
import * as v from 'valibot';

/** `x-request-id`: 12 lowercase hex characters, random, never derived from a user (TDD 06 5.3). */
export const REQUEST_ID_RE = /^[0-9a-f]{12}$/;
export const HEADER_REQUEST_ID = 'x-request-id';
/** Mutating requests carry a client-made UUID (v7 on the phone) so a retry is applied once. */
export const HEADER_IDEMPOTENCY_KEY = 'idempotency-key';
export const IDEMPOTENCY_KEY_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** The app's version, so the server can answer `upgrade_required` and count versions without user data. */
export const HEADER_APP_VERSION = 'x-app-version';
/** RFC 8594 and RFC 9745 headers used when an endpoint version is retired. */
export const HEADER_DEPRECATION = 'deprecation';
export const HEADER_SUNSET = 'sunset';

/**
 * Error codes are versioned (ADR 0017 rule 8): the list is append-only, each
 * code records the version that added it, and a client built against an
 * older version reads an unknown code as `internal` (the schema's fallback),
 * which it treats as permanent, so a newer server never makes an older app
 * loop. Removing or renaming a code is a breaking change: a new route major.
 */
export const API_ERROR_CODES_VERSION = 2;

export const API_ERROR_CODES = [
  'bad_request',
  'unauthorized',
  'forbidden',
  'not_found',
  'conflict',
  'gone',
  'payload_too_large',
  'upgrade_required',
  'rate_limited',
  'timeout',
  'unavailable',
  'internal',
  'network',
  // Domain codes from our own SQLSTATEs (supabase/APPLY.md).
  'consent_required',
  'immutable',
  'tombstoned',
  'last_parent',
  'deleted',
  'not_parent',
  'invite_unusable',
  'plus_required',
  'anonymous_refused',
  // Version 2 (15 Oct 2026, S07 platform contracts).
  /** SCCAP: the book already has the most parents allowed (D-069, F11-REQ-026). Never retried. */
  'parents_full',
  /** A server-side kill switch is on (ADR 0016): local work continues; retry after `Retry-After`. */
  'paused',
  /** The same `idempotency-key` arrived with different arguments within its 24 hours. A client bug: never retried. */
  'idempotency_conflict',
  /** The action needs a sign-in in the last few minutes (escrow step-up, F08 6.5 C1). */
  'reauth_required',
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/** The error-code version that added each code. A test fails if a code has none or a v1 code changed version. */
export const ERROR_CODE_SINCE: Readonly<Record<ApiErrorCode, 1 | 2>> = {
  bad_request: 1, unauthorized: 1, forbidden: 1, not_found: 1, conflict: 1, gone: 1, payload_too_large: 1,
  upgrade_required: 1, rate_limited: 1, timeout: 1, unavailable: 1, internal: 1, network: 1,
  consent_required: 1, immutable: 1, tombstoned: 1, last_parent: 1, deleted: 1, not_parent: 1,
  invite_unusable: 1, plus_required: 1, anonymous_refused: 1,
  parents_full: 2, paused: 2, idempotency_conflict: 2, reauth_required: 2,
};

/**
 * Closed detail values an error may carry, so a client can say the right
 * calm line without ever reading a server message. The family and recovery
 * contracts (`@scribe/api/server`) use subsets; a test pins them inside this
 * list. Anything else is dropped by `failure()` and by the schema.
 */
export const ERROR_DETAILS = [
  // SCINV (family.ts INVITE_UNUSABLE_DETAILS)
  'expired', 'used', 'revoked', 'already_member', 'not_found', 'role_disabled', 'code_taken', 'token_taken', 'closed',
  // SCCON (sync.ts CONSENT_KINDS)
  'terms', 'age', 'sensitive-data', 'family-share', 'backup',
  // SCDEL
  'purged',
  // Escrow (recovery-key.ts ESCROW_ERROR_DETAILS)
  'step_up_required', 'device_unknown', 'device_revoked', 'on_hold', 'cancelled', 'deletion_pending',
  'limit_restores', 'limit_keys',
  // Kill switches (remote-config.ts KILL_SWITCH_KEYS), for `paused`
  'sync', 'invites', 'photos', 'packDownloads', 'serverContent', 'backupUploads', 'escrow', 'statusReport',
  // invite-redeem's global brake (F11-REQ-007)
  'codes_paused',
] as const;
export type ErrorDetail = (typeof ERROR_DETAILS)[number];

export function isErrorDetail(x: unknown): x is ErrorDetail {
  return typeof x === 'string' && (ERROR_DETAILS as readonly string[]).includes(x);
}

/** What a client does with a failure. */
export type ErrorAction =
  /** Transient: back off and retry (keep queue order). */
  | 'retry'
  /** Refresh the session, then retry once. */
  | 'reauth'
  /** Keep the operation, pause the queue, ask for consent (SCCON). */
  | 'pause_for_consent'
  /** Tell the person in plain words; do not retry automatically. */
  | 'tell_user'
  /** Permanent: move the op to `rejected_writes`, keep content on the phone, continue the queue. */
  | 'reject';

export interface ApiError {
  code: ApiErrorCode;
  retryable: boolean;
  sqlstate?: string;
  /** A closed value from ERROR_DETAILS; never free text. */
  detail?: ErrorDetail;
}

export const ApiErrorSchema = v.object({
  code: v.fallback(v.picklist(API_ERROR_CODES), 'internal'),
  retryable: v.boolean(),
  sqlstate: v.optional(v.pipe(v.string(), v.regex(/^[0-9A-Z]{5}$/))),
  detail: v.fallback(v.optional(v.picklist(ERROR_DETAILS)), undefined),
});

export const ApiFailureSchema = v.object({
  ok: v.literal(false),
  error: ApiErrorSchema,
  requestId: v.pipe(v.string(), v.regex(REQUEST_ID_RE)),
});

export type ApiSuccess<T> = { ok: true; data: T; requestId: string };
export type ApiFailure = v.InferOutput<typeof ApiFailureSchema>;
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function success<T>(data: T, requestId: string): ApiSuccess<T> {
  return { ok: true, data, requestId };
}

export function failure(error: ApiError, requestId: string): ApiFailure {
  const out: ApiFailure = { ok: false, error: { code: error.code, retryable: error.retryable }, requestId };
  if (error.sqlstate && /^[0-9A-Z]{5}$/.test(error.sqlstate)) out.error.sqlstate = error.sqlstate;
  if (isErrorDetail(error.detail)) out.error.detail = error.detail;
  return out;
}

/** A random request id (crypto quality where available). */
export function newRequestId(random: (n: number) => Uint8Array = defaultRandom): string {
  return Array.from(random(6), (b) => b.toString(16).padStart(2, '0')).join('');
}

function defaultRandom(n: number): Uint8Array {
  const out = new Uint8Array(n);
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (c?.getRandomValues) return c.getRandomValues(out);
  for (let i = 0; i < n; i++) out[i] = Math.floor(Math.random() * 256);
  return out;
}

// ---------------------------------------------------------------------------
// SQLSTATE mapping (supabase/APPLY.md "Error codes the app must handle"; TDD 02 3.5)
// ---------------------------------------------------------------------------

export interface ErrorRule {
  code: ApiErrorCode;
  action: ErrorAction;
  retryable: boolean;
}

const rule = (code: ApiErrorCode, action: ErrorAction): ErrorRule => ({ code, action, retryable: action === 'retry' || action === 'reauth' });

export const SQLSTATE_RULES: Readonly<Record<string, ErrorRule>> = {
  SCCON: rule('consent_required', 'pause_for_consent'),
  // D-069, F11-REQ-026: a full book is told, never retried.
  SCCAP: rule('parents_full', 'tell_user'),
  // F16-REQ-019 (planned, WP-F16-16): this build's sync API version is no longer served; `sync.updateNeeded`.
  SCVER: rule('upgrade_required', 'tell_user'),
  // Planned (request to S02): an SQL-side kill switch, so `invites` and `sync` also stop the PostgREST paths
  // (accept_child_invite, create_child_invite, sync_push) that no Edge Function sits in front of.
  SCKIL: rule('paused', 'retry'),
  SCANO: rule('anonymous_refused', 'reject'),
  '28000': rule('unauthorized', 'reauth'),
  SCRAT: rule('rate_limited', 'tell_user'),
  // Founder decision 3 (Oct 3): the server stops enforcing Plus; kept until the migration removing it lands.
  SCPLS: rule('plus_required', 'tell_user'),
  SCCID: rule('bad_request', 'reject'),
  SCINV: rule('invite_unusable', 'tell_user'),
  SCAPR: rule('forbidden', 'reject'),
  SCIMM: rule('immutable', 'reject'),
  SCTMB: rule('tombstoned', 'reject'),
  SCLPG: rule('last_parent', 'reject'),
  SCDEL: rule('deleted', 'reject'),
  SCPAR: rule('not_parent', 'reject'),
  P0002: rule('not_found', 'reject'),
  '22023': rule('bad_request', 'reject'),
  '42501': rule('forbidden', 'reject'),
  '23505': rule('conflict', 'reject'),
  '40001': rule('conflict', 'retry'),
  '40P01': rule('conflict', 'retry'),
  '57014': rule('timeout', 'retry'),
  '55P03': rule('conflict', 'retry'),
};

/**
 * Classes that are transient as a whole. The same list `sync_push` uses to
 * stop a batch instead of rejecting an op (F16 6.2 A step 6): 40 transaction
 * rollback, 53 resources, 55 object state (locks), 57 operator intervention,
 * 58 system error, XX internal; plus 08 connection. (ADR 0017 section 3 named
 * 08, 53, 57, 58 and four exact codes; aligned with F16 on 15 Oct 2026.)
 */
const TRANSIENT_CLASSES = new Set(['08', '40', '53', '55', '57', '58', 'XX']);

/**
 * Where an error arrived. `request`: a call a person is waiting on (an invite,
 * a consent act). `queue`: a background queue such as the sync outbox, where
 * SCRAT means "back off and retry in order", never a notice (F16-U06).
 */
export type ErrorContext = 'request' | 'queue';

/**
 * Maps a Postgres SQLSTATE to a client action. Our own `SC***` codes and
 * integrity (`23***`) errors are permanent; transient classes retry;
 * anything unknown is treated as permanent so a deterministic failure never
 * loops (the content stays on the phone either way).
 */
export function classifySqlstate(sqlstate: string | null | undefined, context: ErrorContext = 'request'): ErrorRule {
  if (!sqlstate || !/^[0-9A-Z]{5}$/.test(sqlstate)) return rule('internal', 'reject');
  if (sqlstate === 'SCRAT' && context === 'queue') return rule('rate_limited', 'retry');
  const exact = SQLSTATE_RULES[sqlstate];
  if (exact) return exact;
  if (sqlstate.startsWith('SC')) return rule('bad_request', 'reject');
  if (sqlstate.startsWith('23') || sqlstate.startsWith('22')) return rule('bad_request', 'reject');
  if (TRANSIENT_CLASSES.has(sqlstate.slice(0, 2))) return rule('unavailable', 'retry');
  return rule('internal', 'reject');
}

/** Maps an HTTP status (0 = no response) to a client action, for responses without a SQLSTATE. */
export function classifyHttpStatus(status: number): ErrorRule {
  if (status === 0) return rule('network', 'retry');
  if (status === 400 || status === 422) return rule('bad_request', 'reject');
  if (status === 401) return rule('unauthorized', 'reauth');
  if (status === 403) return rule('forbidden', 'reject');
  if (status === 404) return rule('not_found', 'reject');
  if (status === 408) return rule('timeout', 'retry');
  if (status === 409) return rule('conflict', 'reject');
  if (status === 410) return rule('gone', 'reject');
  if (status === 413) return rule('payload_too_large', 'reject');
  if (status === 426) return rule('upgrade_required', 'tell_user');
  if (status === 429) return rule('rate_limited', 'retry');
  if (status >= 500 && status <= 599) return rule('unavailable', 'retry');
  return rule('internal', 'reject');
}

/** HTTP status an Edge Function should answer for one of our error codes. */
export function httpStatusFor(code: ApiErrorCode): number {
  switch (code) {
    case 'bad_request':
      return 400;
    case 'unauthorized':
      return 401;
    case 'forbidden':
    case 'anonymous_refused':
    case 'not_parent':
      return 403;
    case 'not_found':
      return 404;
    case 'conflict':
    case 'immutable':
    case 'tombstoned':
    case 'last_parent':
    case 'invite_unusable':
    case 'parents_full':
      return 409;
    case 'idempotency_conflict':
      return 422;
    case 'reauth_required':
      return 401;
    case 'gone':
    case 'deleted':
      return 410;
    case 'payload_too_large':
      return 413;
    case 'upgrade_required':
      return 426;
    case 'consent_required':
    case 'plus_required':
      return 403;
    case 'rate_limited':
      return 429;
    case 'timeout':
      return 504;
    case 'unavailable':
    case 'network':
    case 'paused':
      return 503;
    default:
      return 500;
  }
}
