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
  /** Light Edge Functions (invite redeem, Apple token, status report): cold start included. */
  edge_light: { p95Ms: 600, timeoutMs: 10_000, maxAttempts: 4, backoff: { baseMs: 1_000, capMs: 60_000 } },
  /**
   * Proposed ADR 0017 delta (R2 AR-15) [E]: the `escrow` function in its own
   * project. User-initiated and rare (under 1 an hour at launch, F16 9), with
   * a database round trip to the main project and an HPKE seal per key.
   */
  escrow: { p95Ms: 1_200, timeoutMs: 15_000, maxAttempts: 3, backoff: { baseMs: 2_000, capMs: 60_000 } },
  /**
   * Proposed ADR 0017 delta (R2 AR-15) [E]: one encrypted recording upload or
   * download (about 0.5 MB a minute of audio, at most 20 MB), resumable. The
   * budget is time to first byte acknowledged; the body runs on the timeout.
   */
  object_transfer: { p95Ms: 1_500, timeoutMs: 120_000, maxAttempts: 6, backoff: { baseMs: 2_000, capMs: 300_000 } },
} as const;
export type EndpointClass = keyof typeof ENDPOINT_CLASSES;

export type AuthRule =
  /** No credentials; the response holds no user data (public documents). */
  | 'public'
  /** The signed-in user's Supabase JWT; RLS or an in-function check decides. */
  | 'user_jwt'
  /** Server to server only (cron, store webhooks). Never callable from the app; no key for it ships in the app. */
  | 'server_only';

export interface RateLimit {
  /** Requests allowed per window per subject. */
  limit: number;
  windowSeconds: number;
  /** Who the limit counts: a user id, a hashed IP or install id (daily rotating salt), or the whole service. */
  per: 'user' | 'ip_hash' | 'device_hash' | 'global';
  /** Where it is enforced. `cdn` means the response is cached and the origin sees little traffic. */
  enforcedBy: 'cdn' | 'rpc' | 'edge_function' | 'supabase_auth' | 'client';
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
  /** The kill switch that stops it (ADR 0016), when one does. Every server-feature endpoint names one (08 section 8.3 item 2). */
  killSwitch?: 'sync' | 'invites' | 'photos' | 'packDownloads' | 'serverContent' | 'backupUploads' | 'escrow' | 'statusReport';
  /** Which build flag must be on for the app to call it (capabilities.ts). Public documents need none. */
  capability?: 'signIn' | 'sync' | 'coParent' | 'backup' | 'statusReport';
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
    idempotency: 'natural_id', rateLimit: { limit: 60, windowSeconds: 60, per: 'user', enforcedBy: 'rpc' }, status: 'live',
  },
  syncPull: {
    method: 'POST', path: '/rest/v1/rpc/sync_pull', class: 'read_rpc', auth: 'user_jwt',
    idempotency: 'safe_method', rateLimit: { limit: 120, windowSeconds: 60, per: 'user', enforcedBy: 'rpc' }, status: 'live',
  },
  createChild: {
    method: 'POST', path: '/rest/v1/rpc/create_child', class: 'write_rpc', auth: 'user_jwt',
    idempotency: 'natural_id', rateLimit: { limit: 20, windowSeconds: 86_400, per: 'user', enforcedBy: 'rpc' }, status: 'live',
  },
  createInvite: {
    method: 'POST', path: '/rest/v1/rpc/create_child_invite', class: 'write_rpc', auth: 'user_jwt',
    idempotency: 'idempotency_key', rateLimit: { limit: 20, windowSeconds: 86_400, per: 'user', enforcedBy: 'rpc' }, status: 'live',
  },
  recordPolicyAct: {
    method: 'POST', path: '/rest/v1/rpc/record_policy_act', class: 'write_rpc', auth: 'user_jwt',
    idempotency: 'idempotency_key', rateLimit: { limit: 60, windowSeconds: 3600, per: 'user', enforcedBy: 'rpc' }, status: 'live',
  },
  policyActionsNeeded: {
    method: 'POST', path: '/rest/v1/rpc/policy_actions_needed', class: 'read_rpc', auth: 'user_jwt',
    idempotency: 'safe_method', rateLimit: { limit: 60, windowSeconds: 3600, per: 'user', enforcedBy: 'client' }, status: 'live',
  },
  syncBooks: {
    method: 'POST', path: '/rest/v1/rpc/sync_books', class: 'read_rpc', auth: 'user_jwt',
    idempotency: 'safe_method', rateLimit: { limit: 120, windowSeconds: 60, per: 'user', enforcedBy: 'rpc' }, status: 'live',
    killSwitch: 'sync', capability: 'sync',
  },
  // ── Family (packages/api/src/server/family.ts) ──
  peekInvite: {
    method: 'POST', path: '/rest/v1/rpc/peek_invite', class: 'read_rpc', auth: 'user_jwt',
    idempotency: 'safe_method', rateLimit: { limit: 120, windowSeconds: 3600, per: 'user', enforcedBy: 'rpc' }, status: 'planned',
    killSwitch: 'invites', capability: 'coParent',
  },
  acceptInvite: {
    method: 'POST', path: '/rest/v1/rpc/accept_child_invite', class: 'write_rpc', auth: 'user_jwt',
    idempotency: 'natural_id', rateLimit: { limit: 120, windowSeconds: 3600, per: 'user', enforcedBy: 'rpc' }, status: 'live',
    killSwitch: 'invites', capability: 'coParent',
  },
  revokeInvite: {
    method: 'POST', path: '/rest/v1/rpc/revoke_invite', class: 'write_rpc', auth: 'user_jwt',
    idempotency: 'natural_id', rateLimit: { limit: 120, windowSeconds: 3600, per: 'user', enforcedBy: 'client' }, status: 'live',
    capability: 'coParent',
  },
  leaveChild: {
    method: 'POST', path: '/rest/v1/rpc/leave_child', class: 'write_rpc', auth: 'user_jwt',
    idempotency: 'natural_id', rateLimit: { limit: 120, windowSeconds: 3600, per: 'user', enforcedBy: 'rpc' }, status: 'live',
    capability: 'coParent',
  },
  removeChildMember: {
    method: 'POST', path: '/rest/v1/rpc/remove_child_member', class: 'write_rpc', auth: 'user_jwt',
    idempotency: 'natural_id', rateLimit: { limit: 120, windowSeconds: 3600, per: 'user', enforcedBy: 'rpc' }, status: 'live',
    capability: 'coParent',
  },
  undoParentJoin: {
    method: 'POST', path: '/rest/v1/rpc/undo_parent_join', class: 'write_rpc', auth: 'user_jwt',
    idempotency: 'natural_id', rateLimit: { limit: 120, windowSeconds: 3600, per: 'user', enforcedBy: 'rpc' }, status: 'planned',
    capability: 'coParent',
  },
  inviteRedeem: {
    method: 'POST', path: `/functions/v1/invite-redeem/${API_MAJOR}`, class: 'edge_light', auth: 'user_jwt',
    idempotency: 'natural_id', rateLimit: { limit: 10, windowSeconds: 3600, per: 'device_hash', enforcedBy: 'edge_function' }, status: 'this_change',
    killSwitch: 'invites', capability: 'coParent',
  },
  // ── Plus status report (packages/api/src/server/subscription-status.ts; D-080) ──
  statusReport: {
    method: 'POST', path: `/functions/v1/subscription-status/${API_MAJOR}/report`, class: 'edge_light', auth: 'user_jwt',
    idempotency: 'idempotency_key', rateLimit: { limit: 30, windowSeconds: 3600, per: 'user', enforcedBy: 'edge_function' }, status: 'this_change',
    killSwitch: 'statusReport', capability: 'statusReport',
  },
  statusSalt: {
    method: 'GET', path: `/functions/v1/subscription-status/${API_MAJOR}/salt`, class: 'edge_light', auth: 'user_jwt',
    idempotency: 'safe_method', rateLimit: { limit: 30, windowSeconds: 3600, per: 'user', enforcedBy: 'edge_function' }, status: 'this_change',
    killSwitch: 'statusReport', capability: 'statusReport',
  },
  // ── Recovery key (packages/api/src/server/recovery-key.ts; S05). The escrow routes are on the scribe-escrow project. ──
  backupRegisterDevice: {
    method: 'POST', path: '/rest/v1/rpc/backup_register_device', class: 'write_rpc', auth: 'user_jwt',
    idempotency: 'natural_id', rateLimit: { limit: 20, windowSeconds: 86_400, per: 'user', enforcedBy: 'rpc' }, status: 'planned',
    killSwitch: 'backupUploads', capability: 'backup',
  },
  backupStoreKey: {
    method: 'POST', path: '/rest/v1/rpc/backup_store_key', class: 'write_rpc', auth: 'user_jwt',
    idempotency: 'natural_id', rateLimit: { limit: 60, windowSeconds: 86_400, per: 'user', enforcedBy: 'rpc' }, status: 'planned',
    killSwitch: 'backupUploads', capability: 'backup',
  },
  escrowCreateRequest: {
    method: 'POST', path: `<escrow-project>/functions/v1/escrow/${API_MAJOR}/restore-requests`, class: 'escrow', auth: 'user_jwt',
    idempotency: 'idempotency_key', rateLimit: { limit: 3, windowSeconds: 30 * 86_400, per: 'user', enforcedBy: 'edge_function' }, status: 'planned',
    killSwitch: 'escrow', capability: 'backup',
  },
  escrowRelease: {
    method: 'POST', path: `<escrow-project>/functions/v1/escrow/${API_MAJOR}/restore-requests/:id/release`, class: 'escrow', auth: 'user_jwt',
    idempotency: 'natural_id', rateLimit: { limit: 20, windowSeconds: 86_400, per: 'user', enforcedBy: 'edge_function' }, status: 'planned',
    killSwitch: 'escrow', capability: 'backup',
  },
} as const satisfies Record<string, EndpointSpec>;

/**
 * Server-to-server endpoints (`server_only`): cron and webhooks with their own
 * secret. Listed so the standards hold for them too; never in ENDPOINTS, and
 * no key for them ships in the app.
 */
export const SERVER_ENDPOINTS = {
  purgeWorker: {
    method: 'POST', path: '/functions/v1/purge-worker', class: 'edge_light', auth: 'server_only',
    idempotency: 'idempotency_key', rateLimit: { limit: 60, windowSeconds: 3600, per: 'global', enforcedBy: 'edge_function' }, status: 'live',
  },
  pushSend: {
    method: 'POST', path: `/functions/v1/push-send/${API_MAJOR}`, class: 'edge_light', auth: 'server_only',
    idempotency: 'natural_id', rateLimit: { limit: 120, windowSeconds: 3600, per: 'global', enforcedBy: 'edge_function' }, status: 'planned',
  },
} as const satisfies Record<string, EndpointSpec>;

/**
 * Idempotency (ADR 0017 rule 3), one rule for every RPC and Edge Function:
 *  - inserts use the device-made UUIDv7 as the natural key (DATA-REQ-044);
 *  - every other mutation sends `idempotency-key: <uuid>` (v7 from the
 *    phone; lowercase hex with dashes);
 *  - the server keeps (person, function, key) with a hash of the arguments
 *    and the result for 24 hours;
 *  - a repeat with the same key and the same arguments answers the stored
 *    result without a second effect;
 *  - the same key with other arguments is `idempotency_conflict` (422; SQL
 *    raises 22023 as built in 20261005000000);
 *  - a malformed key is `bad_request`; where the endpoint requires a key, a
 *    missing one is `bad_request` too;
 *  - reuse a key only to retry a call whose answer never arrived.
 */
export const IDEMPOTENCY = {
  header: 'idempotency-key',
  retentionHours: 24,
  keyFormat: 'uuid',
} as const;

/** Header a 429 or a `paused` 503 carries: seconds to wait (HTTP-date is never sent, phone clocks drift). */
export const HEADER_RETRY_AFTER = 'retry-after';
/** How long a `paused` (kill switch) answer asks the app to wait before trying again. */
export const PAUSED_RETRY_AFTER_SECONDS = 300;
export type EndpointName = keyof typeof ENDPOINTS;

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
