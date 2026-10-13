/**
 * API standards as data (ADR 0017, founder decision 17). The ADR explains the
 * numbers; this file is the one place code reads them, and
 * `test/standards.test.ts` checks that every endpoint the app calls has a p95
 * budget, an auth rule, a retry rule and a rate limit.
 *
 * Edge Functions import this file directly (`../../../packages/api/src/standards.ts`,
 * Deno, `supabase functions deploy --use-api`), so it must stay a leaf module:
 * no relative imports, no package imports.
 */

export const ENDPOINT_CLASSES = {
  /** Signed public documents (config, content, pack manifest): CDN or edge, cacheable, no auth. */
  public_document: { p95Ms: 300, timeoutMs: 5_000, maxAttempts: 3, backoff: { baseMs: 1_000, capMs: 30_000 } },
  /** Large pack files, one HTTP Range request each. Budget is first byte. */
  pack_file: { p95Ms: 1_000, timeoutMs: 60_000, maxAttempts: 6, backoff: { baseMs: 2_000, capMs: 300_000 } },
  /** Supabase Auth: sign in, refresh. User-initiated, so few retries. */
  auth: { p95Ms: 1_500, timeoutMs: 15_000, maxAttempts: 2, backoff: { baseMs: 1_000, capMs: 5_000 } },
  /** Read RPCs under RLS (policy_actions_needed, get_plan_state, sync pulls of one page). */
  read_rpc: { p95Ms: 300, timeoutMs: 10_000, maxAttempts: 4, backoff: { baseMs: 1_000, capMs: 60_000 } },
  /** Write RPCs under RLS (create_child, delete_entry, invites). Safe to retry: idempotent by id or key. */
  write_rpc: { p95Ms: 500, timeoutMs: 15_000, maxAttempts: 8, backoff: { baseMs: 1_000, capMs: 300_000 } },
  /** Upload batch of up to 50 ops (sync_push). */
  sync_batch: { p95Ms: 800, timeoutMs: 30_000, maxAttempts: 10, backoff: { baseMs: 1_000, capMs: 300_000 } },
  /** Light Edge Functions (invite redeem, Apple token): cold start included. */
  edge_light: { p95Ms: 600, timeoutMs: 10_000, maxAttempts: 4, backoff: { baseMs: 1_000, capMs: 60_000 } },
} as const;
export type EndpointClass = keyof typeof ENDPOINT_CLASSES;

export type AuthRule =
  /** No credentials; the response holds no user data (public documents). */
  | 'public'
  /** The signed-in user's Supabase JWT; RLS or an in-function check decides. */
  | 'user_jwt'
  /** Server to server only (cron, store webhooks). Never callable from the app; no key for it ships in the app. */
  | 'server_only';

/** Shared per-person counters inside `public.rate_hit(bucket)` (migration 20261005000000). */
export type RateBucket = 'pull' | 'push' | 'policy_actions' | 'membership';

export interface RateLimit {
  /** Requests allowed per window per subject. */
  limit: number;
  windowSeconds: number;
  /** Who the limit counts: a user id, a hashed IP (rotating salt), or the whole service. */
  per: 'user' | 'ip_hash' | 'global';
  /**
   * Where it is enforced. `cdn` means the response is cached and the origin
   * sees little traffic. `client` means the server does not enforce it yet:
   * every such endpoint must be listed in `RATE_LIMIT_GAPS` (and ADR 0017
   * section 6), and `standards.test.ts` fails otherwise.
   */
  enforcedBy: 'cdn' | 'rpc' | 'edge_function' | 'supabase_auth' | 'client';
  /** For `rpc` limits counted by `rate_hit()`: the shared bucket. Endpoints in one bucket share one counter. */
  bucket?: RateBucket;
}

export interface EndpointSpec {
  method: 'GET' | 'POST';
  /** Path below the Supabase project URL, or a CDN path. */
  path: string;
  class: EndpointClass;
  auth: AuthRule;
  /** Mutations must be safe under retries: idempotent by natural id or by `idempotency-key`. */
  idempotency: 'safe_method' | 'natural_id' | 'idempotency_key';
  rateLimit: RateLimit;
  status: 'live' | 'this_change' | 'planned';
}

/** Major version segment for our own Edge Function routes. A breaking change adds /v2 and keeps /v1 until its sunset date. */
export const API_MAJOR = 'v1';

export const ENDPOINTS = {
  remoteConfig: {
    method: 'GET', path: `/functions/v1/config/${API_MAJOR}/remote-config`, class: 'public_document', auth: 'public',
    idempotency: 'safe_method', rateLimit: { limit: 60, windowSeconds: 3600, per: 'ip_hash', enforcedBy: 'cdn' }, status: 'this_change',
  },
  packManifest: {
    method: 'GET', path: `/functions/v1/config/${API_MAJOR}/packs`, class: 'public_document', auth: 'public',
    idempotency: 'safe_method', rateLimit: { limit: 60, windowSeconds: 3600, per: 'ip_hash', enforcedBy: 'cdn' }, status: 'this_change',
  },
  contentBundle: {
    method: 'GET', path: `/functions/v1/content/${API_MAJOR}/bundle`, class: 'public_document', auth: 'public',
    idempotency: 'safe_method', rateLimit: { limit: 60, windowSeconds: 3600, per: 'ip_hash', enforcedBy: 'cdn' }, status: 'this_change',
  },
  packFile: {
    method: 'GET', path: '/<pack-host>/<kind>/<id>/<version>/<fileName>', class: 'pack_file', auth: 'public',
    idempotency: 'safe_method', rateLimit: { limit: 600, windowSeconds: 3600, per: 'ip_hash', enforcedBy: 'cdn' }, status: 'this_change',
  },
  signIn: {
    method: 'POST', path: '/auth/v1/token', class: 'auth', auth: 'public',
    idempotency: 'safe_method', rateLimit: { limit: 30, windowSeconds: 300, per: 'ip_hash', enforcedBy: 'supabase_auth' }, status: 'live',
  },
  syncPush: {
    method: 'POST', path: '/rest/v1/rpc/sync_push', class: 'sync_batch', auth: 'user_jwt',
    idempotency: 'natural_id', rateLimit: { limit: 60, windowSeconds: 60, per: 'user', enforcedBy: 'rpc', bucket: 'push' }, status: 'live',
  },
  syncPull: {
    method: 'POST', path: '/rest/v1/rpc/sync_pull', class: 'read_rpc', auth: 'user_jwt',
    idempotency: 'safe_method', rateLimit: { limit: 120, windowSeconds: 60, per: 'user', enforcedBy: 'rpc', bucket: 'pull' }, status: 'live',
  },
  /** The books this account belongs to, with members (sync and account deletion). */
  syncBooks: {
    method: 'POST', path: '/rest/v1/rpc/sync_books', class: 'read_rpc', auth: 'user_jwt',
    idempotency: 'safe_method', rateLimit: { limit: 120, windowSeconds: 60, per: 'user', enforcedBy: 'client' }, status: 'live',
  },
  createChild: {
    method: 'POST', path: '/rest/v1/rpc/create_child', class: 'write_rpc', auth: 'user_jwt',
    idempotency: 'natural_id', rateLimit: { limit: 20, windowSeconds: 86_400, per: 'user', enforcedBy: 'rpc' }, status: 'live',
  },
  createInvite: {
    method: 'POST', path: '/rest/v1/rpc/create_child_invite', class: 'write_rpc', auth: 'user_jwt',
    idempotency: 'idempotency_key', rateLimit: { limit: 20, windowSeconds: 86_400, per: 'user', enforcedBy: 'rpc' }, status: 'live',
  },
  /**
   * "Ask before joining" (security review H2, G-02, G-13): what the invite
   * says before the person agrees. Returns only the inviter's sign-off name,
   * never the child's, and never joins. Same counter as the other membership calls.
   */
  peekInvite: {
    method: 'POST', path: '/rest/v1/rpc/peek_invite', class: 'read_rpc', auth: 'user_jwt',
    idempotency: 'safe_method', rateLimit: { limit: 120, windowSeconds: 3600, per: 'user', enforcedBy: 'rpc', bucket: 'membership' }, status: 'this_change',
  },
  /** A repeat by the same person after a lost response returns the same book (natural id: the token). */
  acceptInvite: {
    method: 'POST', path: '/rest/v1/rpc/accept_child_invite', class: 'write_rpc', auth: 'user_jwt',
    idempotency: 'natural_id', rateLimit: { limit: 120, windowSeconds: 3600, per: 'user', enforcedBy: 'rpc', bucket: 'membership' }, status: 'live',
  },
  revokeInvite: {
    method: 'POST', path: '/rest/v1/rpc/revoke_invite', class: 'write_rpc', auth: 'user_jwt',
    idempotency: 'natural_id', rateLimit: { limit: 20, windowSeconds: 3600, per: 'user', enforcedBy: 'client' }, status: 'live',
  },
  /** Any member leaves; `p_keep_in_book` false takes their letters out of the book (never deletes them). Repeat: 'not_member'. */
  leaveChild: {
    method: 'POST', path: '/rest/v1/rpc/leave_child', class: 'write_rpc', auth: 'user_jwt',
    idempotency: 'natural_id', rateLimit: { limit: 120, windowSeconds: 3600, per: 'user', enforcedBy: 'rpc', bucket: 'membership' }, status: 'this_change',
  },
  /** A parent removes a family member (never a parent). Repeat: 'not_member'. */
  removeChildMember: {
    method: 'POST', path: '/rest/v1/rpc/remove_child_member', class: 'write_rpc', auth: 'user_jwt',
    idempotency: 'natural_id', rateLimit: { limit: 120, windowSeconds: 3600, per: 'user', enforcedBy: 'rpc', bucket: 'membership' }, status: 'this_change',
  },
  /** Consent gate after sign-in: whether Terms and sensitive-data consent are current. */
  mySyncGate: {
    method: 'POST', path: '/rest/v1/rpc/my_sync_gate', class: 'read_rpc', auth: 'user_jwt',
    idempotency: 'safe_method', rateLimit: { limit: 60, windowSeconds: 3600, per: 'user', enforcedBy: 'client' }, status: 'live',
  },
  recordPolicyAct: {
    method: 'POST', path: '/rest/v1/rpc/record_policy_act', class: 'write_rpc', auth: 'user_jwt',
    idempotency: 'idempotency_key', rateLimit: { limit: 60, windowSeconds: 3600, per: 'user', enforcedBy: 'rpc' }, status: 'live',
  },
  policyActionsNeeded: {
    method: 'POST', path: '/rest/v1/rpc/policy_actions_needed', class: 'read_rpc', auth: 'user_jwt',
    idempotency: 'safe_method', rateLimit: { limit: 60, windowSeconds: 3600, per: 'user', enforcedBy: 'rpc', bucket: 'policy_actions' }, status: 'live',
  },
  /** A repeat while a request is open returns it (and is not counted). */
  requestAccountDeletion: {
    method: 'POST', path: '/rest/v1/rpc/request_account_deletion', class: 'write_rpc', auth: 'user_jwt',
    idempotency: 'natural_id', rateLimit: { limit: 5, windowSeconds: 86_400, per: 'user', enforcedBy: 'rpc' }, status: 'live',
  },
  /** Nothing to cancel returns false (and is not counted). */
  cancelAccountDeletion: {
    method: 'POST', path: '/rest/v1/rpc/cancel_account_deletion', class: 'write_rpc', auth: 'user_jwt',
    idempotency: 'natural_id', rateLimit: { limit: 5, windowSeconds: 86_400, per: 'user', enforcedBy: 'rpc' }, status: 'live',
  },
  /**
   * Sign in with Apple: exchanges the one-time authorization code for a refresh
   * token kept for revocation at account deletion (review H3, G-03; App Store
   * 5.1.1(v)). The code is single use, so a repeat fails harmlessly.
   */
  appleToken: {
    method: 'POST', path: '/functions/v1/apple-token/v1', class: 'edge_light', auth: 'user_jwt',
    idempotency: 'natural_id', rateLimit: { limit: 10, windowSeconds: 3600, per: 'user', enforcedBy: 'edge_function' }, status: 'this_change',
  },
  /** At deletion request: asks PostHog to delete this device's analytics ids (TDD 05 X-02). Deleting twice is harmless. */
  analyticsForget: {
    method: 'POST', path: '/functions/v1/analytics-forget/v1', class: 'edge_light', auth: 'user_jwt',
    idempotency: 'natural_id', rateLimit: { limit: 5, windowSeconds: 86_400, per: 'user', enforcedBy: 'edge_function' }, status: 'live',
  },
  inviteRedeem: {
    method: 'POST', path: '/functions/v1/invite-redeem', class: 'edge_light', auth: 'user_jwt',
    idempotency: 'natural_id', rateLimit: { limit: 10, windowSeconds: 3600, per: 'ip_hash', enforcedBy: 'edge_function' }, status: 'planned',
  },
} as const satisfies Record<string, EndpointSpec>;
export type EndpointName = keyof typeof ENDPOINTS;

/**
 * Endpoints the app calls whose limit the server does not enforce yet (ADR
 * 0017 section 6). Each is cheap, answers only for the caller and is called
 * at most a few times per session; the numbers above are what the client
 * keeps to. `standards.test.ts` fails if an endpoint says `client` without
 * being listed here, or is listed here but enforced elsewhere.
 */
export const RATE_LIMIT_GAPS: readonly EndpointName[] = ['syncBooks', 'revokeInvite', 'mySyncGate'];

/** Cache-Control for responses we serve. `stale-if-error` keeps the CDN answering through an origin outage. */
export const CACHE_POLICY = {
  /**
   * Kill switches must reach active apps within 5 minutes of publishing (LEGAL-REQ-040):
   * at most 60 s in any cache plus the app's 4-minute refresh = 5 minutes.
   */
  remoteConfig: 'public, max-age=60, stale-while-revalidate=3600, stale-if-error=604800',
  packManifest: 'public, max-age=900, stale-while-revalidate=86400, stale-if-error=604800',
  contentBundle: 'public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800',
  /** Pack files live at versioned paths and never change. */
  packFile: 'public, max-age=31536000, immutable',
  /** Errors are never cached. */
  error: 'no-store',
} as const;

/** How often the app asks for each document (never before the first frame; then on foreground and every minute while open, each at most this often). */
export const CLIENT_REFRESH_MS = {
  remoteConfig: 4 * 60_000,
  packManifest: 6 * 3600_000,
  contentBundle: 6 * 3600_000,
} as const;

/**
 * Exponential backoff with full jitter (AWS Architecture Blog, "Exponential
 * Backoff and Jitter"). `attempt` starts at 1 for the first retry. A server
 * `Retry-After` (seconds) wins when present, capped by the class cap.
 */
export function retryDelayMs(
  cls: EndpointClass,
  attempt: number,
  random: () => number = Math.random,
  retryAfterSeconds?: number | null,
): number {
  const { baseMs, capMs } = ENDPOINT_CLASSES[cls].backoff;
  if (retryAfterSeconds != null && Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return Math.min(capMs, Math.round(retryAfterSeconds * 1000));
  }
  const ceiling = Math.min(capMs, baseMs * 2 ** Math.max(0, attempt - 1));
  return Math.round(random() * ceiling);
}

/** Parses `Retry-After` given in seconds (the HTTP-date form is ignored: clocks on phones drift). */
export function parseRetryAfter(header: string | null | undefined): number | null {
  if (!header || !/^[0-9]{1,6}$/.test(header.trim())) return null;
  return Number(header.trim());
}
