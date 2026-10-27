/**
 * subscription-status: the D-080 status report and D-081 consent record
 * (F14 6.6; WP-F14-15c endpoint shell; contract
 * packages/api/src/server/subscription-status.ts).
 *
 * Ownership: S07 wrote this shell, the validation and the tests against the
 * contract; S06 owns the folder from here (08 section 3.3) and the SQL it
 * calls (WP-F14-15b, S06's migration range).
 *
 *   POST /functions/v1/subscription-status/v1/report
 *     Authorization: Bearer <user access token>
 *     Idempotency-Key: <uuid>   (required)
 *     <StatusReport JSON, strict: any other key is refused>
 *   200 {ok: true, data: {stored, consent}, requestId}
 *
 *   GET /functions/v1/subscription-status/v1/salt
 *   200 {ok: true, data: {salt}, requestId}   (the per-account salt for sub_ref)
 *
 *   GET or HEAD /functions/v1/subscription-status/health   (RA-07-06, _shared/health)
 *   200 {ok: true, data: {status: "ready"}} when SUPABASE_URL and SUPABASE_ANON_KEY
 *   are set, 503 `unavailable` otherwise. Anonymous at this layer and starts no
 *   work: no Auth call, no RPC, no body read, nothing about the caller logged.
 *   Gateway JWT verification stays on (S06, #178): with it the gateway answers
 *   401 before this runs, and the staging smoke lists the function as not
 *   checked. Turning verify_jwt off is a separate decision, never made for a
 *   health check; the report and salt routes check the session themselves.
 *
 * Least privilege: no service key. The function checks the session against
 * Supabase Auth (only a full account; anonymous refused here, not left to
 * the SQL), then forwards the caller's JWT, the idempotency key and the
 * request id to two RPCs that act only for `auth.uid()` (security definer,
 * `require_user()`), requested from S06:
 *   status_report_store(p_report jsonb) returns jsonb {stored, consent}
 *     one transaction: idempotency_claim (a key reused with other arguments
 *     raises 22023 with detail `idempotency`), the 30-per-hour limit (SCRAT),
 *     upsert by (profile, sub_ref) keeping the newest `reported_at`, and the
 *     consent record once per original purchase. It orders by the server's
 *     receive time and clamps a `reported_at` ahead of the server clock to
 *     now (never refuses for it: a phone clock set ahead must not lose the
 *     report). It reads `app.status_report_enabled` and raises SCKIL while
 *     off, so the kill switch also stops direct PostgREST calls. Because any signed-in
 *     client can call it directly, the SQL repeats this function's checks
 *     and trusts none of them: the same allowlisted keys and types as
 *     StatusReportSchema, at most 2 KiB, and it computes the fingerprint
 *     (`statusFingerprint` is the reference) itself;
 *   status_salt() returns text  (32 random bytes, base64url, made once per
 *     account; 30 per person per hour, SCRAT)
 * Until they exist PostgREST answers 404 and this function answers
 * `unavailable` (retryable): the phone keeps the report queued. Nothing is
 * lost and nothing is emailed.
 *
 * Never logged and never stored by this function: the body, `sub_ref`, the
 * salt, any id. The server never answers whether someone is a member (D-080).
 */
import { classifySqlstate, HEADER_IDEMPOTENCY_KEY, HEADER_REQUEST_ID, httpStatusFor, type ApiErrorCode } from '../../../packages/api/src/envelope.ts';
import {
  parseStatusReport, SALT_RE, STATUS_REPORT_MAX_BYTES, STORED_OUTCOMES, CONSENT_OUTCOMES, type StatusReportResult,
} from '../../../packages/api/src/server/subscription-status.ts';
import { healthResponse, isHealthRequest } from '../_shared/health/health.ts';
import { createLogger, type ErrorCode, type LogSink } from '../_shared/log/log.ts';
import {
  bearerOf, failReply, idempotencyKeyOf, incomingRequestId, okReply, parseJson, pausedReply, postgrestError, readBody,
  serverKilled, sessionOf, timedRequest, unknownKillSwitches, upstreamJson, type EnvGetter, type FetchFn,
} from '../_shared/http/http.ts';

const REPORT_RE = /\/subscription-status\/v1\/report\/?$/;
const SALT_ROUTE_RE = /\/subscription-status\/v1\/salt\/?$/;

const LOG_CODE: Partial<Record<ApiErrorCode, ErrorCode>> = {
  bad_request: 'invalid_input', unauthorized: 'unauthorized', anonymous_refused: 'anonymous', not_found: 'not_found',
  payload_too_large: 'payload_too_large', rate_limited: 'rate_limited', idempotency_conflict: 'idempotency', forbidden: 'forbidden',
};

export interface StatusOptions {
  fetch?: FetchFn;
  logSink?: LogSink;
  timeoutMs?: number;
}

export function makeStatusHandler(env: EnvGetter, opts: StatusOptions = {}): (req: Request) => Promise<Response> {
  const fetchFn: FetchFn = opts.fetch ?? ((i, init) => fetch(i, init));
  const timeoutMs = opts.timeoutMs ?? 8_000;

  return async (req: Request) => {
    const started = Date.now();
    const log = createLogger({ fn: 'subscription-status', version: '1', sink: opts.logSink, reqId: incomingRequestId(req) });
    const id = log.reqId;
    let task: 'report' | 'salt' | undefined;
    const refuse = (code: ApiErrorCode, retryable: boolean, status = httpStatusFor(code), headers?: Record<string, string>) => {
      log.warn('status.refused', { status, code: LOG_CODE[code] ?? 'error', task, duration_ms: Date.now() - started });
      return failReply({ code, retryable }, id, status, headers);
    };
    const unavailable = (status: number, code?: ErrorCode) => {
      log.error('status.failed', { provider: 'postgrest', status, code, task, duration_ms: Date.now() - started });
      return failReply({ code: 'unavailable', retryable: true }, id, 503);
    };

    try {
      // GET or HEAD /subscription-status/health (RA-07-06): settings present or not, nothing else.
      if (isHealthRequest(req, 'subscription-status')) {
        const configured = Boolean((env('SUPABASE_URL') ?? '').trim() && (env('SUPABASE_ANON_KEY') ?? '').trim());
        log.info('request.done', { status: configured ? 200 : 503, outcome: configured ? 'ok' : 'server_error' });
        return healthResponse(req, configured, id);
      }
      const path = new URL(req.url).pathname;
      task = REPORT_RE.test(path) ? 'report' : SALT_ROUTE_RE.test(path) ? 'salt' : undefined;
      if (!task) return refuse('not_found', false);
      if ((task === 'report' && req.method !== 'POST') || (task === 'salt' && req.method !== 'GET')) return refuse('bad_request', false, 405);
      if (unknownKillSwitches(env) > 0) log.warn('status.degraded', { code: 'config', task });
      if (serverKilled(env, 'statusReport')) {
        log.warn('status.refused', { status: 503, code: 'killed', task });
        return pausedReply('statusReport', id);
      }
      const supabaseUrl = (env('SUPABASE_URL') ?? '').replace(/\/+$/, '');
      const anonKey = env('SUPABASE_ANON_KEY') ?? '';
      if (!supabaseUrl || !anonKey) {
        log.error('status.failed', { code: 'config', task });
        return failReply({ code: 'unavailable', retryable: true }, id, 503);
      }
      const token = bearerOf(req);
      if (!token) return refuse('unauthorized', false);
      const headers: Record<string, string> = {
        apikey: anonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', [HEADER_REQUEST_ID]: id,
      };

      let body: string;
      if (task === 'report') {
        const idem = idempotencyKeyOf(req, true);
        if (!idem.ok) return refuse('bad_request', false);
        headers[HEADER_IDEMPOTENCY_KEY] = idem.key!;
        const raw = await readBody(req, STATUS_REPORT_MAX_BYTES);
        if (!raw.ok) return refuse('payload_too_large', false);
        const json = parseJson(raw.text);
        const parsed = json.ok ? parseStatusReport(json.value) : { ok: false as const };
        if (!parsed.ok) return refuse('bad_request', false);
        body = JSON.stringify({ p_report: parsed.value });
      } else {
        body = '{}';
      }

      const session = await sessionOf(fetchFn, supabaseUrl, anonKey, token, timeoutMs);
      if (session.kind === 'unauthorized') return refuse('unauthorized', false);
      if (session.kind === 'anonymous') return refuse('anonymous_refused', false);
      if (session.kind === 'unavailable') {
        log.error('status.failed', { provider: 'auth', status: session.status, task, duration_ms: Date.now() - started });
        return failReply({ code: 'unavailable', retryable: true }, id, 503);
      }

      const fn = task === 'report' ? 'status_report_store' : 'status_salt';
      const res = await timedRequest(fetchFn, `${supabaseUrl}/rest/v1/rpc/${fn}`, { method: 'POST', headers, body }, timeoutMs);
      if (!res) return unavailable(0, 'network');
      if (!res.ok) {
        if (res.status === 401) return refuse('unauthorized', false);
        const { sqlstate, detail } = postgrestError(res);
        if (!sqlstate || res.status >= 500) return unavailable(res.status, 'postgrest_error');
        if (sqlstate === '22023') return detail === 'idempotency' ? refuse('idempotency_conflict', false) : refuse('bad_request', false);
        // The SQL-side switch (app.status_report_enabled, requested from S06) answers like the function's own.
        if (sqlstate === 'SCKIL') return pausedReply('statusReport', id);
        // The session check above confirmed a full account, so 42501 here can only be a missing grant: a deploy
        // fault, never this person's refusal. Retryable, so the phone keeps the report and its D-081 consent
        // record for later (F14-REQ-043; review B N3 on #138).
        if (sqlstate === '42501') return unavailable(res.status, 'forbidden');
        const rule = classifySqlstate(sqlstate);
        if (rule.code === 'internal') return unavailable(res.status, 'sqlstate');
        return refuse(rule.code, rule.code === 'rate_limited' ? true : rule.retryable, httpStatusFor(rule.code),
          rule.code === 'rate_limited' ? { 'retry-after': '3600' } : undefined);
      }

      const value = upstreamJson(res) ?? null;
      if (task === 'salt') {
        if (typeof value !== 'string' || !SALT_RE.test(value)) return unavailable(200, 'bad_response');
        log.info('salt.served', { status: 200, outcome: 'ok', task, duration_ms: Date.now() - started });
        return okReply({ salt: value }, id);
      }
      const r = value as Partial<StatusReportResult> | null;
      if (!r || !(STORED_OUTCOMES as readonly string[]).includes(r.stored ?? '') || !(CONSENT_OUTCOMES as readonly string[]).includes(r.consent ?? '')) {
        return unavailable(200, 'bad_response');
      }
      log.info('status.stored', { status: 200, outcome: 'ok', task, duration_ms: Date.now() - started });
      return okReply({ stored: r.stored, consent: r.consent } as StatusReportResult, id);
    } catch (e) {
      log.exception('status.failed', e, { status: 500, task });
      return failReply({ code: 'internal', retryable: true }, id, 500);
    }
  };
}
