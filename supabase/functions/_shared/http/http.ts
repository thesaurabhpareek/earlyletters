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

/**
 * Reads the body as a stream and stops at `maxBytes`: a declared
 * Content-Length over the cap is refused before reading, and a chunked body
 * is cancelled as soon as it passes the cap, so no request can make the
 * isolate hold more than `maxBytes`.
 */
export async function readBody(req: Pick<Request, "headers" | "body">, maxBytes: number): Promise<BodyResult> {
  const declared = Number(req.headers.get('content-length') ?? '0');
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false, reason: 'too_large' };
  if (!req.body) return { ok: true, text: '' };
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return { ok: false, reason: 'too_large' };
    }
    chunks.push(value);
  }
  const buf = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    buf.set(c, at);
    at += c.byteLength;
  }
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

/** A finished upstream answer: status and body text, both read inside the timeout. */
export interface Upstream {
  status: number;
  ok: boolean;
  text: string;
}

/**
 * fetch with the timeout covering the body as well as the headers, and a
 * cap on the body read (upstream answers here are small). Null on network
 * failure, timeout or an oversized body.
 */
export async function timedRequest(fetchFn: FetchFn, url: string, init: RequestInit, timeoutMs: number, maxBytes = 65_536): Promise<Upstream | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchFn(url, { ...init, signal: ctrl.signal });
    const body = await readBody(res, maxBytes);
    if (!body.ok) return null;
    return { status: res.status, ok: res.ok, text: body.text };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function upstreamJson(u: Upstream): unknown {
  try {
    return JSON.parse(u.text);
  } catch {
    return undefined;
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
 * Fails closed: only `is_anonymous === false` counts as a full account.
 */
export async function sessionOf(fetchFn: FetchFn, supabaseUrl: string, apikey: string, token: string | null, timeoutMs: number): Promise<SessionResult> {
  if (!token) return { kind: 'unauthorized' };
  const res = await timedRequest(fetchFn, `${supabaseUrl}/auth/v1/user`, { method: 'GET', headers: { apikey, Authorization: `Bearer ${token}` } }, timeoutMs);
  if (!res) return { kind: 'unavailable', status: 0 };
  if (res.status === 401 || res.status === 403 || res.status === 404) return { kind: 'unauthorized' };
  if (!res.ok) return { kind: 'unavailable', status: res.status };
  const u = upstreamJson(res) as { id?: unknown; is_anonymous?: unknown } | undefined;
  if (!u || typeof u.id !== 'string' || !UUID_RE.test(u.id)) return { kind: 'unauthorized' };
  if (u.is_anonymous !== false) return { kind: 'anonymous' };
  return { kind: 'ok', profileId: u.id.toLowerCase() };
}

/** The PostgREST error parts we read: the SQLSTATE and the detail. The message is never read. */
export function postgrestError(u: Upstream): { sqlstate: string | null; detail: string | null } {
  const body = upstreamJson(u) as { code?: unknown; details?: unknown } | undefined;
  const sqlstate = body && typeof body.code === 'string' && /^[0-9A-Z]{5}$/.test(body.code) ? body.code : null;
  const detail = body && typeof body.details === 'string' && /^[a-z0-9_,-]{1,60}$/.test(body.details) ? body.details : null;
  return { sqlstate, detail };
}

const keyCache = new Map<string, Promise<CryptoKey>>();
function hmacKey(secret: string): Promise<CryptoKey> {
  let k = keyCache.get(secret);
  if (!k) {
    k = crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    keyCache.set(secret, k);
  }
  return k;
}

async function hmacHex(secret: string, message: string, bytes = 32): Promise<string> {
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(secret), new TextEncoder().encode(message)));
  return Array.from(mac.slice(0, bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** UTC day, the rotation period of subject hashes. */
export function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export type SubjectKind = 'user' | 'device' | 'ip';

/**
 * Rate-limit subjects: hex HMAC-SHA256 over `<kind>:<UTC day>:<value>` with
 * the function's `RATE_SUBJECT_SECRET`, so stored counters cannot be joined
 * across days or reversed to an IP, install or person without the secret.
 * The first element is the hash under today's key. In the first hour of a
 * UTC day the hash under yesterday's key follows it, so a rolling-hour count
 * never restarts at midnight.
 */
export async function subjectHashes(secret: string, kind: SubjectKind, value: string, now: Date): Promise<string[]> {
  const today = await hmacHex(secret, `${kind}:${utcDay(now)}:${value}`, 16);
  if (now.getUTCHours() !== 0) return [today];
  const yesterday = await hmacHex(secret, `${kind}:${utcDay(new Date(now.getTime() - 86_400_000))}:${value}`, 16);
  return [today, yesterday];
}

/** HMAC-SHA256 hex of an invite code with the pepper (F11 D5, BL-334). */
export function codeHmac(pepper: string, code: string): Promise<string> {
  return hmacHex(pepper, code);
}

/**
 * The caller's address as the platform reports it, for rate limits only (it
 * is only ever hashed). Trusted sources in order: `cf-connecting-ip`, then
 * `x-real-ip`, set by the edge in front of Supabase Edge Functions [A: which
 * one the platform sets is checked on the first staging deploy]. A
 * client-supplied `x-forwarded-for` is never trusted. IPv6 is bucketed by /64,
 * because one phone can rotate inside its /64. '' when none is present: the
 * IP limit is then skipped (the person, the device and the global brake
 * still apply), never shared by every caller.
 */
export function clientIp(req: Request): string {
  const raw = (req.headers.get('cf-connecting-ip') ?? req.headers.get('x-real-ip') ?? '').trim();
  if (/^[0-9]{1,3}(\.[0-9]{1,3}){3}$/.test(raw)) return raw;
  if (/^[0-9a-f:]{2,39}$/i.test(raw) && raw.includes(':')) return ipv6Prefix64(raw);
  return '';
}

function ipv6Prefix64(addr: string): string {
  const [head, tail] = addr.toLowerCase().split('::');
  const h = head ? head.split(':') : [];
  const t = tail !== undefined && tail !== '' ? tail.split(':') : [];
  const groups = tail === undefined ? h : [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t];
  return `${groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, '')).join(':')}::/64`;
}
