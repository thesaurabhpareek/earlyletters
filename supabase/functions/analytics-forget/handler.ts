/**
 * analytics-forget: deletes PostHog persons (and their events) for the random
 * analytics ids a device sends, at deletion request time (TDD 05 X-02 and 7.4,
 * LEGAL-REQ-029, TRACKING_PLAN section 7).
 *
 * Stateless by design: the ids are used for one PostHog call and dropped. They
 * are never written to Postgres, never logged and never joined to the person,
 * which keeps the store label "not linked to you" true. The only state is a
 * per-person daily call count (ops.forget_quota) for the rate limit.
 *
 * POST /functions/v1/analytics-forget/v1
 *   Authorization: Bearer <the signed-in user's access token>
 *   Idempotency-Key: <uuid> (optional; the call is idempotent by nature)
 *   {"ids": ["<uuid>", ...1 to 21], "reason": "account_deletion" | "device_after_deletion"}
 * 202 {ok: true, data: {accepted: n}, requestId}; errors use the packages/api envelope.
 *
 * PostHog (verified 3 Oct 2026, posthog.com/docs/api/persons):
 *   POST https://us.posthog.com/api/projects/:project_id/persons/bulk_delete/
 *   {distinct_ids: [...], delete_events: true}, at most 1000 ids, personal API key
 *   with person:write; answers 202 and deletes in the background.
 */
import {
  failure, HEADER_IDEMPOTENCY_KEY, HEADER_REQUEST_ID, httpStatusFor, IDEMPOTENCY_KEY_RE, success, type ApiErrorCode,
} from '../../../packages/api/src/envelope.ts';
import { createLogger, type ErrorCode, type LogSink, type Reason } from '../_shared/log/log.ts';

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;
export type EnvGetter = (name: string) => string | undefined;

export const MAX_IDS = 21;
export const DAILY_CALLS = 5;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REASONS: readonly Reason[] = ['account_deletion', 'device_after_deletion'];
const ROUTE_RE = /\/analytics-forget\/v1\/?$/;
const LOG_CODE: Partial<Record<ApiErrorCode, ErrorCode>> = {
  bad_request: 'invalid_input', rate_limited: 'quota', unauthorized: 'unauthorized', forbidden: 'forbidden',
  payload_too_large: 'payload_too_large', not_found: 'not_found',
};

export interface ForgetOptions {
  fetch?: FetchFn;
  logSink?: LogSink;
  timeoutMs?: number;
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

export function makeForgetHandler(env: EnvGetter, opts: ForgetOptions = {}): (req: Request) => Promise<Response> {
  const fetchFn: FetchFn = opts.fetch ?? ((i, init) => fetch(i, init));
  const timeoutMs = opts.timeoutMs ?? 10_000;
  return async (req: Request) => {
    const started = Date.now();
    const log = createLogger({ fn: 'analytics-forget', version: '1', sink: opts.logSink });
    const reply = (status: number, body: unknown, extra: Record<string, string> = {}) =>
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', [HEADER_REQUEST_ID]: log.reqId, ...extra } });
    const fail = (code: ApiErrorCode, retryable: boolean, status = httpStatusFor(code), extra: Record<string, string> = {}) => {
      log.warn('forget.refused', { code: LOG_CODE[code] ?? 'error', status });
      return reply(status, failure({ code, retryable }, log.reqId), extra);
    };

    if (req.method !== 'POST') return fail('bad_request', false, 405);
    if (!ROUTE_RE.test(new URL(req.url).pathname)) return fail('not_found', false);

    const supabaseUrl = (env('SUPABASE_URL') ?? '').replace(/\/+$/, '');
    const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const phKey = env('POSTHOG_PERSONAL_API_KEY') ?? '';
    const phProject = env('POSTHOG_PROJECT_ID') ?? '';
    const phHost = (env('POSTHOG_HOST') || 'https://us.posthog.com').replace(/\/+$/, '');
    if (!supabaseUrl || !serviceKey || !phKey || !/^[0-9]{1,12}$/.test(phProject)) {
      log.error('forget.failed', { code: 'config' });
      return reply(503, failure({ code: 'unavailable', retryable: true }, log.reqId));
    }

    const idem = req.headers.get(HEADER_IDEMPOTENCY_KEY);
    if (idem !== null && !IDEMPOTENCY_KEY_RE.test(idem.toLowerCase())) return fail('bad_request', false);

    // Body: read at most 4 KB.
    const raw = await req.text();
    if (raw.length > 4096) return fail('payload_too_large', false);
    let ids: string[];
    let reason: Reason;
    try {
      const body = JSON.parse(raw) as { ids?: unknown; reason?: unknown };
      if (!Array.isArray(body.ids) || body.ids.length < 1 || body.ids.length > MAX_IDS) throw 0;
      if (!body.ids.every((x) => typeof x === 'string' && UUID_RE.test(x))) throw 0;
      if (!REASONS.includes(body.reason as Reason)) throw 0;
      ids = [...new Set((body.ids as string[]).map((x) => x.toLowerCase()))];
      reason = body.reason as Reason;
    } catch {
      return fail('bad_request', false);
    }

    // Who is asking: a real, non-anonymous session.
    const auth = req.headers.get('authorization') ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token || token.length > 4096) return fail('unauthorized', false);
    const userRes = await timed(fetchFn, `${supabaseUrl}/auth/v1/user`, { method: 'GET', headers: { apikey: serviceKey, Authorization: `Bearer ${token}` } }, timeoutMs);
    if (!userRes) return reply(503, failure({ code: 'unavailable', retryable: true }, log.reqId));
    if (userRes.status === 401 || userRes.status === 403 || userRes.status === 404) {
      await discard(userRes);
      return fail('unauthorized', false);
    }
    if (!userRes.ok) {
      await discard(userRes);
      log.error('forget.failed', { provider: 'auth', status: userRes.status });
      return reply(503, failure({ code: 'unavailable', retryable: true }, log.reqId));
    }
    let profileId: string;
    try {
      const u = (await userRes.json()) as { id?: unknown; is_anonymous?: unknown };
      if (typeof u.id !== 'string' || !UUID_RE.test(u.id)) throw 0;
      if (u.is_anonymous === true) return fail('forbidden', false);
      profileId = u.id;
    } catch {
      return fail('unauthorized', false);
    }

    // Rate limit: DAILY_CALLS per person per day. Counts only; the ids are not stored.
    const q = await timed(fetchFn, `${supabaseUrl}/rest/v1/rpc/ops_consume_forget_quota`, {
      method: 'POST',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_profile: profileId, p_limit: DAILY_CALLS }),
    }, timeoutMs);
    if (!q || !q.ok) {
      await discard(q);
      log.error('forget.failed', { provider: 'postgrest', status: q?.status ?? 0 });
      return reply(503, failure({ code: 'unavailable', retryable: true }, log.reqId));
    }
    if ((await q.json()) !== true) return fail('rate_limited', true, 429, { 'Retry-After': '3600' });

    const ph = await timed(fetchFn, `${phHost}/api/projects/${phProject}/persons/bulk_delete/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${phKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ distinct_ids: ids, delete_events: true }),
    }, timeoutMs);
    if (!ph || !(ph.status === 202 || ph.status === 200 || ph.status === 204)) {
      await discard(ph);
      log.error('forget.failed', { provider: 'posthog', status: ph?.status ?? 0, code: ph ? 'posthog_error' : 'network', reason });
      return reply(502, failure({ code: 'unavailable', retryable: true }, log.reqId));
    }
    await discard(ph);
    log.info('forget.accepted', { reason, counts: { ids: ids.length }, provider: 'posthog', status: ph.status, duration_ms: Date.now() - started });
    return reply(202, success({ accepted: ids.length }, log.reqId));
  };
}
