/**
 * Shared request handling for our JSON Edge Functions (ADR 0017 rules 1 to 7;
 * packages/api README "Standards"). Runtime neutral: Web Request, Response,
 * fetch and WebCrypto only, so the same code runs in Deno and in tests.
 *
 * What every function built on this gets:
 *  - the envelope from packages/api (`{ ok, data | error, requestId }`), with
 *    `x-request-id` echoed when valid or made, `cache-control: no-store`,
 *    `x-content-type-options: nosniff`;
 *  - a body read with a byte cap before any parsing;
 *  - the `idempotency-key` rules (malformed is 400; required where the
 *    endpoint says so);
 *  - the caller's session checked against Supabase Auth (`/auth/v1/user`),
 *    anonymous sessions refused;
 *  - the server-side kill switch (`KILL_SWITCHES` function secret, the remote
 *    config vocabulary) answering `paused` with `Retry-After`;
 *  - subject hashes for rate limits (HMAC with a daily rotating key), so no
 *    raw IP, device id or user id is ever counted or stored.
 * Nothing here logs; callers log through `_shared/log/log.ts`.
 */
import {
  failure,
  HEADER_IDEMPOTENCY_KEY,
  HEADER_REQUEST_ID,
  httpStatusFor,
  IDEMPOTENCY_KEY_RE,
  REQUEST_ID_RE,
  success,
  type ApiError,
} from '../../../../packages/api/src/envelope.ts';
import { parseKillSwitchList, type KillSwitchKey } from '../../../../packages/api/src/kill-switches.ts';

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;
export type EnvGetter = (name: string) => string | undefined;

/** Seconds a `paused` answer asks the app to wait (packages/api PAUSED_RETRY_AFTER_SECONDS; pinned by a test). */
export const PAUSED_RETRY_AFTER = 300;

export function incomingRequestId(req: Request): string | undefined {
  const id = req.headers.get(HEADER_REQUEST_ID) ?? '';
  return REQUEST_ID_RE.test(id) ? id : undefined;
}

const BASE_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
} as const;

export function reply(status: number, body: unknown, requestId: string, extra: Record<string, string> = {}): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { ...BASE_HEADERS, [HEADER_REQUEST_ID]: requestId, ...extra },
  });
}

export function okReply<T>(data: T, requestId: string, status = 200): Response {
  return reply(status, success(data, requestId), requestId);
}

/** A failure in the envelope. The status follows the code unless given. Never a message. */
export function failReply(error: ApiError, requestId: string, status = httpStatusFor(error.code), extra: Record<string, string> = {}): Response {
  return reply(status, failure(error, requestId), requestId, extra);
}

export function pausedReply(key: KillSwitchKey, requestId: string): Response {
  return failReply({ code: 'paused', retryable: true, detail: key }, requestId, 503, { 'retry-after': String(PAUSED_RETRY_AFTER) });
}

/** True when this function's `KILL_SWITCHES` secret names the switch. */
export function serverKilled(env: EnvGetter, key: KillSwitchKey): boolean {
  return parseKillSwitchList(env('KILL_SWITCHES')).has(key);
}

export type BodyResult = { ok: true; text: string } | { ok: false; reason: 'too_large' };

/** Reads the body, refusing anything over `maxBytes` (by Content-Length first, then by bytes read). */
export async function readBody(req: Request, maxBytes: number): Promise<BodyResult> {
  const declared = Number(req.headers.get('content-length') ?? '0');
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false, reason: 'too_large' };
  const buf = new Uint8Array(await req.arrayBuffer());
  if (buf.byteLength > maxBytes) return { ok: false, reason: 'too_large' };
  return { ok: true, text: new TextDecoder().decode(buf) };
}

export function parseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

export type IdempotencyResult = { ok: true; key: string | null } | { ok: false };

/** `idempotency-key`: a lowercase UUID. Malformed is refused; missing is refused only where `required`. */
export function idempotencyKeyOf(req: Request, required: boolean): IdempotencyResult {
  const raw = req.headers.get(HEADER_IDEMPOTENCY_KEY);
  if (raw === null || raw === '') return required ? { ok: false } : { ok: true, key: null };
  const key = raw.trim().toLowerCase();
  return IDEMPOTENCY_KEY_RE.test(key) ? { ok: true, key } : { ok: false };
}

export function bearerOf(req: Request): string | null {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  return token && token.length <= 4096 ? token : null;
}

export async function timedFetch(fetchFn: FetchFn, url: string, init: RequestInit, timeoutMs: number): Promise<Response | null> {
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

export async function discard(res: Response | null): Promise<void> {
  try {
    await res?.arrayBuffer();
  } catch {
    // ignore
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SessionResult =
  | { kind: 'ok'; profileId: string }
  | { kind: 'unauthorized' }
  | { kind: 'anonymous' }
  | { kind: 'unavailable'; status: number };

/**
 * Who is calling: asks Supabase Auth about the bearer token (the gateway
 * verifies the JWT too; this also catches a revoked session). Uses the
 * publishable key as `apikey`; no service key is needed for this call.
 */
export async function sessionOf(fetchFn: FetchFn, supabaseUrl: string, apikey: string, token: string | null, timeoutMs: number): Promise<SessionResult> {
  if (!token) return { kind: 'unauthorized' };
  const res = await timedFetch(fetchFn, `${supabaseUrl}/auth/v1/user`, { method: 'GET', headers: { apikey, Authorization: `Bearer ${token}` } }, timeoutMs);
  if (!res) return { kind: 'unavailable', status: 0 };
  if (res.status === 401 || res.status === 403 || res.status === 404) {
    await discard(res);
    return { kind: 'unauthorized' };
  }
  if (!res.ok) {
    await discard(res);
    return { kind: 'unavailable', status: res.status };
  }
  try {
    const u = (await res.json()) as { id?: unknown; is_anonymous?: unknown };
    if (typeof u.id !== 'string' || !UUID_RE.test(u.id)) return { kind: 'unauthorized' };
    if (u.is_anonymous === true) return { kind: 'anonymous' };
    return { kind: 'ok', profileId: u.id.toLowerCase() };
  } catch {
    return { kind: 'unauthorized' };
  }
}

/** The PostgREST error parts we read: the SQLSTATE and the detail. The message is never read. */
export async function postgrestError(res: Response): Promise<{ sqlstate: string | null; detail: string | null }> {
  try {
    const body = (await res.json()) as { code?: unknown; details?: unknown };
    const sqlstate = typeof body.code === 'string' && /^[0-9A-Z]{5}$/.test(body.code) ? body.code : null;
    const detail = typeof body.details === 'string' && /^[a-z0-9_-]{1,40}$/.test(body.details) ? body.details : null;
    return { sqlstate, detail };
  } catch {
    return { sqlstate: null, detail: null };
  }
}

/** UTC day, the rotation period of subject hashes. */
export function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/**
 * A rate-limit subject: hex HMAC-SHA256 over `<kind>:<day>:<value>` with the
 * function's `RATE_SUBJECT_SECRET`. Rotates daily by construction, so stored
 * counters cannot be joined across days or back to an IP, install or person.
 */
export async function subjectHash(secret: string, kind: 'ip' | 'device', value: string, now: Date): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`${kind}:${utcDay(now)}:${value}`)));
  return Array.from(mac.slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** HMAC-SHA256 hex of an invite code with the pepper (F11 D5, BL-334). */
export async function codeHmac(pepper: string, code: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(code)));
  return Array.from(mac, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** The client IP the platform reports (first hop of `x-forwarded-for`), or '' when absent. Only ever hashed. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for') ?? '';
  return fwd.split(',')[0]?.trim().slice(0, 64) ?? '';
}
