/**
 * apple-token: captures the Sign in with Apple refresh token right after a
 * native sign-in, so account deletion can revoke it (BL-330, security review
 * H3, F02-REQ-004, F02-REQ-022, A-NFR-011, Apple guideline 5.1.1(v)).
 *
 * POST /functions/v1/apple-token/v1
 *   Authorization: Bearer <the new session's access token>
 *   {"code": "<credential.authorizationCode from expo-apple-authentication>"}
 * 204, no body, `x-request-id` header. Errors use the packages/api envelope.
 *
 * Steps:
 *  1. The caller is a real, non-anonymous session with an Apple identity
 *     (GET /auth/v1/user with the caller's token). The profile id comes only
 *     from that answer, never from the body.
 *  2. At most RATE_MAX calls per profile per RATE_WINDOW_MS in this isolate.
 *     Codes are single use and short lived, so a server-side counter is a
 *     follow-up (request to the database owner), not a gate for safety.
 *  3. Exchange the code at https://appleid.apple.com/auth/token
 *     (grant_type=authorization_code) with a 10-minute ES256 client secret
 *     for the app's bundle id, the client id a native iOS sign-in mints for.
 *  4. Apple's id_token in that answer must name the same Apple user (`sub`)
 *     as the caller's Apple identity and our client id (`aud`). It comes
 *     straight from Apple over TLS, so its signature is not re-checked. On a
 *     mismatch the new refresh token is revoked and nothing is stored.
 *  5. Wrap the refresh token with AES-256-GCM under the newest TOKEN_KEK_V<n>
 *     (purge-worker/lib/apple.ts wrapAppleToken, AAD = profile id) and store
 *     it with ops_apple_token_put. The purge worker's apple_token_revoke step
 *     unwraps and revokes it at deletion.
 *
 * Nothing about the person is logged: the shared logger keeps closed enums,
 * statuses and counts only. The code, tokens, ids and email never appear in a
 * log line or a response body.
 *
 * Apple endpoints and fields (verified 3 Oct 2026 for revoke and the client
 * secret, see purge-worker/lib/apple.ts; the token endpoint is the same
 * family: form-encoded client_id, client_secret, code, grant_type; errors as
 * `{"error": "invalid_grant" | "invalid_client" | ...}`). Re-check on the
 * founder's first staging run (AUTH_SETUP 2.4).
 */
import { bundleId } from '../../../packages/brand/index.ts';
import { failure, HEADER_REQUEST_ID, httpStatusFor, type ApiErrorCode } from '../../../packages/api/src/envelope.ts';
import { createLogger, type ErrorCode, type FunctionName, type LogSink } from '../_shared/log/log.ts';
import { makeClientSecret, revokeAppleToken, wrapAppleToken, type AppleKeyConfig } from '../purge-worker/lib/apple.ts';

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;
export type EnvGetter = (name: string) => string | undefined;

export const APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token';
export const RATE_MAX = 5;
export const RATE_WINDOW_MS = 10 * 60_000;
const ROUTE_RE = /\/apple-token\/v1\/?$/;
const CODE_RE = /^[A-Za-z0-9._-]{8,1024}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/**
 * Not yet in the shared logger's FUNCTIONS list (supabase/functions/_shared/log/log.ts,
 * request to its owner); until it is added, lines carry fn "unknown".
 */
const FN = 'apple-token' as unknown as FunctionName;
const LOG_CODE: Partial<Record<ApiErrorCode, ErrorCode>> = {
  bad_request: 'invalid_input', unauthorized: 'unauthorized', forbidden: 'forbidden', rate_limited: 'rate_limited',
  payload_too_large: 'payload_too_large', not_found: 'not_found',
};

export interface AppleTokenConfig {
  supabaseUrl: string;
  serviceKey: string;
  apple: AppleKeyConfig;
  clientId: string;
  kek: string;
  keyVersion: number;
}

/** Null when a required secret is missing; the function then answers 503 and stores nothing. */
export function readAppleTokenConfig(env: EnvGetter): AppleTokenConfig | null {
  const v = (n: string) => (env(n) ?? '').trim();
  const supabaseUrl = v('SUPABASE_URL').replace(/\/+$/, '');
  const serviceKey = v('SUPABASE_SERVICE_ROLE_KEY');
  const teamId = v('APPLE_TEAM_ID');
  const keyId = v('APPLE_SIGNIN_KEY_ID');
  const privateKeyPem = env('APPLE_SIGNIN_PRIVATE_KEY') ?? '';
  let keyVersion = 0;
  let kek = '';
  for (let n = 9; n >= 1; n--) {
    const k = v(`TOKEN_KEK_V${n}`);
    if (k) {
      keyVersion = n;
      kek = k;
      break;
    }
  }
  if (!supabaseUrl || !serviceKey || !teamId || !keyId || !privateKeyPem.trim() || !kek) return null;
  return { supabaseUrl, serviceKey, apple: { teamId, keyId, privateKeyPem }, clientId: bundleId(), kek, keyVersion };
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

/** The payload of a JWT, without checking the signature (the caller says why that is fine). */
function jwtPayload(jwt: string): Record<string, unknown> | null {
  const part = jwt.split('.')[1];
  if (!part) return null;
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (part.length % 4)) % 4);
    const json = new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
    const v = JSON.parse(json);
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

interface AuthUser {
  id?: unknown;
  is_anonymous?: unknown;
  identities?: { provider?: unknown; id?: unknown; identity_data?: { sub?: unknown } | null }[] | null;
}

export function makeAppleTokenHandler(env: EnvGetter, opts: AppleTokenOptions = {}): (req: Request) => Promise<Response> {
  const fetchFn: FetchFn = opts.fetch ?? ((i, init) => fetch(i, init));
  const timeoutMs = opts.timeoutMs ?? 10_000;
  const now = opts.now ?? (() => Date.now());
  /** profile id -> call times in this isolate (memory only, never logged). */
  const calls = new Map<string, number[]>();

  return async (req: Request) => {
    const started = now();
    const log = createLogger({ fn: FN, version: '1', sink: opts.logSink });
    const reply = (status: number, body: unknown) =>
      new Response(body === null ? null : JSON.stringify(body), {
        status,
        headers: body === null ? { [HEADER_REQUEST_ID]: log.reqId } : { 'Content-Type': 'application/json', [HEADER_REQUEST_ID]: log.reqId },
      });
    const fail = (code: ApiErrorCode, retryable: boolean, status = httpStatusFor(code), logCode?: ErrorCode) => {
      log.warn('request.refused', { code: logCode ?? LOG_CODE[code] ?? 'error', status });
      return reply(status, failure({ code, retryable }, log.reqId));
    };
    const unavailable = (provider: 'apple' | 'auth' | 'postgrest', status: number, code: ErrorCode, httpStatus = 503) => {
      log.error('request.failed', { provider, status, code });
      return reply(httpStatus, failure({ code: 'unavailable', retryable: true }, log.reqId));
    };

    if (req.method !== 'POST') return fail('bad_request', false, 405, 'method');
    if (!ROUTE_RE.test(new URL(req.url).pathname)) return fail('not_found', false);

    const cfg = readAppleTokenConfig(env);
    if (!cfg) {
      log.error('request.failed', { code: 'config' });
      return reply(503, failure({ code: 'unavailable', retryable: true }, log.reqId));
    }

    const raw = await req.text();
    if (raw.length > 4096) return fail('payload_too_large', false);
    let code: string;
    try {
      const body = JSON.parse(raw) as { code?: unknown };
      if (typeof body.code !== 'string' || !CODE_RE.test(body.code)) throw 0;
      code = body.code;
    } catch {
      return fail('bad_request', false);
    }

    // 1. Who is asking: a real session with an Apple identity.
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
    let appleSub: string;
    try {
      const u = (await userRes.json()) as AuthUser;
      if (typeof u.id !== 'string' || !UUID_RE.test(u.id)) throw 0;
      if (u.is_anonymous === true) return fail('anonymous_refused', false, 403, 'forbidden');
      const apple = (u.identities ?? []).find((i) => i?.provider === 'apple');
      const sub = apple?.identity_data?.sub ?? apple?.id;
      if (typeof sub !== 'string' || !sub) return fail('forbidden', false);
      profileId = u.id.toLowerCase();
      appleSub = sub;
    } catch {
      return fail('unauthorized', false);
    }

    // 2. Rate limit in this isolate.
    const t = now();
    const recent = (calls.get(profileId) ?? []).filter((x) => t - x < RATE_WINDOW_MS);
    if (recent.length >= RATE_MAX) {
      calls.set(profileId, recent);
      return fail('rate_limited', true, 429);
    }
    recent.push(t);
    calls.set(profileId, recent);

    // 3. Exchange the code with Apple.
    let clientSecret: string;
    try {
      clientSecret = await makeClientSecret(cfg.apple, cfg.clientId, t);
    } catch {
      return unavailable('apple', 0, 'config');
    }
    const appleRes = await timed(fetchFn, APPLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: cfg.clientId, client_secret: clientSecret, code, grant_type: 'authorization_code' }).toString(),
    }, timeoutMs);
    if (!appleRes) return unavailable('apple', 0, 'network', 502);
    let refreshToken: string;
    let idToken: string;
    if (appleRes.status !== 200) {
      let error = '';
      try {
        const j = (await appleRes.json()) as { error?: unknown };
        if (typeof j?.error === 'string') error = j.error;
      } catch {
        // no JSON body
      }
      // A used, expired or foreign code: the person signs in again; nothing to retry.
      if (appleRes.status === 400 && error === 'invalid_grant') return fail('bad_request', false, 400, 'invalid_grant');
      // Our key, team or client id is wrong: alert, and let the phone retry once later.
      if (appleRes.status === 400 && (error === 'invalid_client' || error === 'unauthorized_client')) return unavailable('apple', 400, 'invalid_client');
      return unavailable('apple', appleRes.status, appleRes.status === 400 ? 'apple_error' : (`http_${appleRes.status}` as ErrorCode), 502);
    }
    try {
      const j = (await appleRes.json()) as { refresh_token?: unknown; id_token?: unknown };
      if (typeof j.refresh_token !== 'string' || !j.refresh_token || typeof j.id_token !== 'string') throw 0;
      refreshToken = j.refresh_token;
      idToken = j.id_token;
    } catch {
      return unavailable('apple', 200, 'bad_response', 502);
    }

    // 4. The token must belong to the caller's Apple identity and to our app.
    const claims = jwtPayload(idToken);
    const aud = claims?.aud;
    const audOk = aud === cfg.clientId || (Array.isArray(aud) && aud.includes(cfg.clientId));
    if (!claims || claims.sub !== appleSub || !audOk) {
      await revokeAppleToken(fetchFn, { clientId: cfg.clientId, clientSecret, token: refreshToken, timeoutMs }).catch(() => null);
      return fail('forbidden', false, 403, 'forbidden');
    }

    // 5. Wrap and store.
    let ciphertext: string;
    try {
      ciphertext = (await wrapAppleToken(cfg.kek, cfg.keyVersion, profileId, refreshToken)).ciphertext;
    } catch {
      return unavailable('postgrest', 0, 'config');
    }
    const put = await timed(fetchFn, `${cfg.supabaseUrl}/rest/v1/rpc/ops_apple_token_put`, {
      method: 'POST',
      headers: { apikey: cfg.serviceKey, Authorization: `Bearer ${cfg.serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_profile: profileId, p_ciphertext: ciphertext, p_key_version: cfg.keyVersion, p_client_id: cfg.clientId }),
    }, timeoutMs);
    if (!put || !put.ok) {
      await discard(put);
      return unavailable('postgrest', put?.status ?? 0, put ? 'postgrest_error' : 'network');
    }
    await discard(put);
    log.info('request.done', { provider: 'apple', status: 204, duration_ms: Math.max(0, now() - started) });
    return reply(204, null);
  };
}
