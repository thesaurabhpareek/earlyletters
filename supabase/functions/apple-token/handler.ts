/**
 * apple-token: keeps a way to revoke Sign in with Apple when an account is
 * deleted (BL-330, security review H3; F02-REQ-004, F02-REQ-022; App Store
 * 5.1.1(v), A-NFR-011, DATA-REQ-019, DATA-REQ-033; TDD 04 3.1.1 and 3.9).
 *
 * Ported from Line B (`auto/2026-10-05-fixes` at d1cbddb, gap G-03), with three
 * changes: success is 204 with no body (F02-REQ-004: "returns 204 with no token
 * echoed"); a valid client `x-request-id` is echoed (ADR 0017 rule 6); and the
 * client ids it accepts are the ones the purge worker can revoke for.
 *
 * Right after Sign in with Apple, the app sends Apple's one-time authorization
 * code here (apps/mobile/src/lib/auth/apple.ts). This function:
 *  1. checks the caller's session (GET /auth/v1/user with their JWT): a real,
 *     non-anonymous account with an Apple identity;
 *  2. exchanges the code at https://appleid.apple.com/auth/token
 *     (grant_type=authorization_code) with a 10-minute ES256 client secret
 *     signed by the Sign in with Apple key (purge-worker/lib/apple.ts);
 *  3. checks that the id_token in Apple's answer is for the same Apple user
 *     and for the client id the code was issued to;
 *  4. wraps the refresh token with AES-256-GCM under the newest TOKEN_KEK_V<n>
 *     (AAD = profile id, wrapAppleToken) and stores it with
 *     ops_apple_token_put (service role only).
 * The purge worker's apple_token_revoke step later unwraps and revokes it.
 *
 * POST /functions/v1/apple-token/v1
 *   Authorization: Bearer <the signed-in user's access token>
 *   {"code": "<authorizationCode>", "clientId": "<bundle id the code was issued to>"}
 * 204 (no body, x-request-id header); errors use the packages/api envelope.
 *
 * Never logged, never returned, never stored in the clear: the code, the
 * tokens, the person's id, email or Apple user id. Log lines carry closed
 * enums and statuses only (_shared/log).
 *
 * Rate limit: 10 calls per person per hour, twice over: per function instance
 * (memory), and in the database through `rate_hit('apple_token')` called with
 * the person's own JWT (S02, migration 20261015000000 on feat/db-v1-gate).
 * SCRAT from the database is a 429. Until that migration is applied the call
 * answers "unknown bucket" or "no such function", and the instance limit
 * alone holds (logged, never fatal). Apple's own rule still applies on top:
 * a code works once and lives five minutes.
 *
 * Apple's token endpoint (form encoding, client secret and error shape as the
 * revoke sibling, verified 3 Oct 2026): POST form-encoded client_id,
 * client_secret, code, grant_type. 200 JSON {access_token, token_type,
 * expires_in, refresh_token, id_token}. 400 {"error": "invalid_grant" |
 * "invalid_client" | ...}.
 */
import { failure, HEADER_REQUEST_ID, httpStatusFor, type ApiErrorCode } from '../../../packages/api/src/envelope.ts';
import { bundleId } from '../../../packages/brand/index.ts';
import { createLogger, type ErrorCode, type FunctionName, type LogSink, type Provider } from '../_shared/log/log.ts';
import { APPLE_AUDIENCE, makeClientSecret, wrapAppleToken, type AppleKeyConfig } from '../purge-worker/lib/apple.ts';

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;
export type EnvGetter = (name: string) => string | undefined;

export const APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token';
export const HOURLY_CALLS = 10;
/** The database bucket (rate_hit, 10 per person per hour). */
export const RATE_BUCKET = 'apple_token';
const ROUTE_RE = /\/apple-token\/v1\/?$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Apple authorization codes are opaque; this bounds the shape without assuming more. */
const CODE_RE = /^[A-Za-z0-9._-]{16,512}$/;
const CLIENT_RE = /^[A-Za-z0-9.-]{3,155}$/;
const MAX_BODY = 4096;
// Until _shared/log lists this function by name its lines say fn "unknown" (requested from S07).
const FN = 'apple-token' as string as FunctionName;

const LOG_CODE: Partial<Record<ApiErrorCode, ErrorCode>> = {
  bad_request: 'invalid_input', rate_limited: 'quota', unauthorized: 'unauthorized', forbidden: 'forbidden',
  payload_too_large: 'payload_too_large', not_found: 'not_found', gone: 'invalid_grant',
};

export interface AppleTokenConfig {
  supabaseUrl: string;
  serviceKey: string;
  /** Injected by Supabase. Calls made as the person (rate_hit) carry it with their JWT, never the service key. Null: skip them. */
  anonKey: string | null;
  apple: AppleKeyConfig;
  /**
   * Client ids a code may be issued to: exactly the ones the purge worker can
   * revoke for today (purge-worker/config.ts: the production bundle id and
   * APPLE_SERVICES_ID), so no token is ever stored that deletion cannot revoke.
   * APPLE_EXTRA_CLIENT_IDS (internal builds) waits for the purge worker to read
   * it too: request to S07 in PR #139 (AUTH_SETUP 2.7).
   */
  clientIds: string[];
  kek: string;
  kekVersion: number;
}

export function readAppleTokenConfig(get: EnvGetter): AppleTokenConfig | null {
  const v = (n: string) => (get(n) ?? '').trim();
  const supabaseUrl = v('SUPABASE_URL').replace(/\/+$/, '');
  const serviceKey = v('SUPABASE_SERVICE_ROLE_KEY');
  const teamId = v('APPLE_TEAM_ID');
  const keyId = v('APPLE_SIGNIN_KEY_ID');
  const privateKeyPem = get('APPLE_SIGNIN_PRIVATE_KEY') ?? '';
  let kek = '';
  let kekVersion = 0;
  // The newest key wraps; the purge worker keeps every version to unwrap older rows.
  for (let n = 9; n >= 1; n--) {
    const k = v(`TOKEN_KEK_V${n}`);
    if (k) {
      kek = k;
      kekVersion = n;
      break;
    }
  }
  if (!supabaseUrl || !serviceKey || !teamId || !keyId || !privateKeyPem.trim() || !kek) return null;
  // The purge worker's list, no more (a test compares the two).
  const services = v('APPLE_SERVICES_ID');
  const anonKey = v('SUPABASE_ANON_KEY') || null;
  const clientIds = [...new Set([bundleId(), ...(CLIENT_RE.test(services) ? [services] : [])])];
  return { supabaseUrl, serviceKey, anonKey, apple: { teamId, keyId, privateKeyPem }, clientIds, kek, kekVersion };
}

export interface AppleTokenOptions {
  fetch?: FetchFn;
  logSink?: LogSink;
  timeoutMs?: number;
  now?: () => number;
}

async function timed(fetchFn: FetchFn, url: string, init: RequestInit, timeoutMs: number): Promise<Response | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetchFn(url, { ...init, signal: ctrl.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function discard(res: Response | null): Promise<void> {
  try {
    await res?.arrayBuffer();
  } catch {
    // ignore
  }
}

/** The claims of a JWT that came straight from Apple over TLS (read, not verified: we asked Apple for it). */
export function jwtClaims(jwt: unknown): Record<string, unknown> | null {
  if (typeof jwt !== 'string') return null;
  const parts = jwt.split('.');
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    const v = JSON.parse(json);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

interface AuthUser {
  id?: unknown;
  is_anonymous?: unknown;
  identities?: { provider?: unknown; provider_id?: unknown; identity_data?: { sub?: unknown } }[];
}

/** The Apple user ids (`sub`) linked to this account. */
export function appleSubjects(u: AuthUser): string[] {
  const out: string[] = [];
  for (const i of Array.isArray(u.identities) ? u.identities : []) {
    if (i?.provider !== 'apple') continue;
    for (const s of [i.identity_data?.sub, i.provider_id]) if (typeof s === 'string' && s) out.push(s);
  }
  return out;
}

export function makeAppleTokenHandler(env: EnvGetter, opts: AppleTokenOptions = {}): (req: Request) => Promise<Response> {
  const fetchFn: FetchFn = opts.fetch ?? ((i, init) => fetch(i, init));
  const timeoutMs = opts.timeoutMs ?? 10_000;
  const now = opts.now ?? (() => Date.now());
  // Per-instance window: person id -> call times in the last hour. Memory only, never logged.
  const calls = new Map<string, number[]>();

  return async (req: Request) => {
    const started = now();
    // ADR 0017 rule 6: echo the phone's request id when it is well formed (createLogger checks it).
    const log = createLogger({ fn: FN, version: '1', sink: opts.logSink, reqId: req.headers.get(HEADER_REQUEST_ID) ?? undefined });
    const reply = (status: number, body: unknown, extra: Record<string, string> = {}) =>
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', [HEADER_REQUEST_ID]: log.reqId, ...extra } });
    const fail = (code: ApiErrorCode, retryable: boolean, status = httpStatusFor(code), extra: Record<string, string> = {}) => {
      log.warn('request.refused', { code: LOG_CODE[code] ?? 'error', status });
      return reply(status, failure({ code, retryable }, log.reqId), extra);
    };
    const unavailable = (provider: Provider, status: number, code: ErrorCode) => {
      log.error('request.failed', { provider, status, code });
      return reply(503, failure({ code: 'unavailable', retryable: true }, log.reqId));
    };

    if (req.method !== 'POST') return fail('bad_request', false, 405);
    if (!ROUTE_RE.test(new URL(req.url).pathname)) return fail('not_found', false);

    const cfg = readAppleTokenConfig(env);
    if (!cfg) {
      log.error('request.failed', { code: 'config' });
      return reply(503, failure({ code: 'unavailable', retryable: false }, log.reqId));
    }

    const declared = Number(req.headers.get('content-length') ?? '0');
    if (Number.isFinite(declared) && declared > MAX_BODY) return fail('payload_too_large', false);
    const raw = await req.text();
    if (raw.length > MAX_BODY) return fail('payload_too_large', false);
    let code: string;
    let clientId: string;
    try {
      const body = JSON.parse(raw) as { code?: unknown; clientId?: unknown };
      if (typeof body.code !== 'string' || !CODE_RE.test(body.code)) throw 0;
      code = body.code;
      clientId = typeof body.clientId === 'string' && body.clientId ? body.clientId : bundleId();
    } catch {
      return fail('bad_request', false);
    }
    if (!cfg.clientIds.includes(clientId)) return fail('forbidden', false);

    // 1. Who is asking: a real, non-anonymous account with an Apple identity.
    const auth = req.headers.get('authorization') ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token || token.length > 4096) return fail('unauthorized', false);
    const userRes = await timed(fetchFn, `${cfg.supabaseUrl}/auth/v1/user`, { method: 'GET', headers: { apikey: cfg.serviceKey, Authorization: `Bearer ${token}` } }, timeoutMs);
    if (!userRes) return unavailable('auth', 0, 'network');
    if (userRes.status === 401 || userRes.status === 403 || userRes.status === 404) {
      await discard(userRes);
      return fail('unauthorized', false);
    }
    if (!userRes.ok) {
      await discard(userRes);
      return unavailable('auth', userRes.status, 'auth_error');
    }
    let profileId: string;
    let subjects: string[];
    try {
      const u = (await userRes.json()) as AuthUser;
      if (typeof u.id !== 'string' || !UUID_RE.test(u.id)) throw 0;
      if (u.is_anonymous === true) return fail('forbidden', false);
      profileId = u.id.toLowerCase();
      subjects = appleSubjects(u);
    } catch {
      return fail('unauthorized', false);
    }
    if (subjects.length === 0) return fail('forbidden', false);

    // Rate limit (per instance; Apple codes are single use anyway).
    const hourAgo = now() - 3_600_000;
    const recent = (calls.get(profileId) ?? []).filter((t) => t > hourAgo);
    if (recent.length >= HOURLY_CALLS) {
      calls.set(profileId, recent);
      return fail('rate_limited', true, 429, { 'Retry-After': '3600' });
    }
    recent.push(now());
    calls.set(profileId, recent);

    // The shared counter, as the caller (auth.uid() is the person). Only SCRAT refuses.
    const hit = cfg.anonKey
      ? await timed(fetchFn, `${cfg.supabaseUrl}/rest/v1/rpc/rate_hit`, {
          method: 'POST',
          headers: { apikey: cfg.anonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ p_bucket: RATE_BUCKET }),
        }, timeoutMs)
      : undefined;
    if (hit === undefined) {
      log.warn('request.failed', { provider: 'postgrest', code: 'config' });
    } else if (hit && !hit.ok) {
      let sqlstate: unknown = null;
      try {
        sqlstate = ((await hit.json()) as { code?: unknown })?.code;
      } catch {
        sqlstate = null;
      }
      if (sqlstate === 'SCRAT') return fail('rate_limited', true, 429, { 'Retry-After': '3600' });
      log.warn('request.failed', { provider: 'postgrest', status: hit.status, code: 'postgrest_error' });
    } else if (!hit) {
      log.warn('request.failed', { provider: 'postgrest', status: 0, code: 'network' });
    } else {
      await discard(hit);
    }

    // 2. Exchange the code with Apple.
    let secret: string;
    try {
      secret = await makeClientSecret(cfg.apple, clientId, now());
    } catch {
      log.error('request.failed', { provider: 'apple', code: 'config' });
      return reply(503, failure({ code: 'unavailable', retryable: false }, log.reqId));
    }
    const form = new URLSearchParams({ client_id: clientId, client_secret: secret, code, grant_type: 'authorization_code' });
    const appleRes = await timed(fetchFn, APPLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    }, timeoutMs);
    if (!appleRes) return unavailable('apple', 0, 'network');
    let appleBody: { error?: unknown; refresh_token?: unknown; id_token?: unknown } = {};
    try {
      appleBody = (await appleRes.json()) as typeof appleBody;
    } catch {
      appleBody = {};
    }
    if (appleRes.status === 400 && appleBody.error === 'invalid_grant') {
      // Used, expired (five minutes) or not ours: the app does not retry it.
      log.warn('request.refused', { provider: 'apple', status: 400, code: 'invalid_grant' });
      return reply(410, failure({ code: 'gone', retryable: false }, log.reqId));
    }
    if (appleRes.status === 400 && (appleBody.error === 'invalid_client' || appleBody.error === 'unauthorized_client')) {
      log.error('request.failed', { provider: 'apple', status: 400, code: 'invalid_client' });
      return reply(503, failure({ code: 'unavailable', retryable: false }, log.reqId));
    }
    if (!appleRes.ok) return unavailable('apple', appleRes.status, appleRes.status === 400 ? 'apple_error' : `http_${appleRes.status}` as ErrorCode);
    const refresh = appleBody.refresh_token;
    if (typeof refresh !== 'string' || refresh.length < 8 || refresh.length > 2048) return unavailable('apple', appleRes.status, 'bad_response');

    // 3. The token must be for this account's Apple user, and for this client id.
    const claims = jwtClaims(appleBody.id_token);
    const aud = claims?.aud;
    const audOk = aud === clientId || (Array.isArray(aud) && aud.includes(clientId));
    if (!claims || typeof claims.sub !== 'string' || !subjects.includes(claims.sub) || !audOk || claims.iss !== APPLE_AUDIENCE) {
      log.warn('request.refused', { provider: 'apple', code: 'forbidden', status: 403 });
      return reply(403, failure({ code: 'forbidden', retryable: false }, log.reqId));
    }

    // 4. Wrap and store (service role only; the function is revoked from every API role).
    let wrapped: { ciphertext: string; keyVersion: number };
    try {
      wrapped = await wrapAppleToken(cfg.kek, cfg.kekVersion, profileId, refresh);
    } catch {
      log.error('request.failed', { code: 'config' });
      return reply(503, failure({ code: 'unavailable', retryable: false }, log.reqId));
    }
    const put = await timed(fetchFn, `${cfg.supabaseUrl}/rest/v1/rpc/ops_apple_token_put`, {
      method: 'POST',
      headers: { apikey: cfg.serviceKey, Authorization: `Bearer ${cfg.serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_profile: profileId, p_ciphertext: wrapped.ciphertext, p_key_version: wrapped.keyVersion, p_client_id: clientId }),
    }, timeoutMs);
    if (!put || !put.ok) {
      await discard(put);
      return unavailable('postgrest', put?.status ?? 0, put ? 'postgrest_error' : 'network');
    }
    await discard(put);
    log.info('request.done', { outcome: 'ok', provider: 'apple', status: 204, duration_ms: now() - started });
    // F02-REQ-004: stored, and nothing comes back but the request id.
    return new Response(null, { status: 204, headers: { [HEADER_REQUEST_ID]: log.reqId } });
  };
}
