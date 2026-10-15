/**
 * invite-redeem: join a co-parent's book with the 8-character code
 * (F11 6.2 B, F11-REQ-007, B-NFR-004; WP-F11-02; contract
 * packages/api/src/server/family.ts). Links keep using `accept_child_invite`
 * over PostgREST; codes come only through here, because a code has about 40
 * bits and must be throttled where the caller cannot reset the count.
 *
 * POST /functions/v1/invite-redeem/v1
 *   Authorization: Bearer <the signed-in user's access token>
 *   Idempotency-Key: <uuid> (optional: accept is idempotent for the same person)
 *   {"code": "7K3M9QXZ", "mode": "peek" | "accept", "device": "<install uuid>"}
 * 200 {ok: true, data: {mode: "peek", inviter, role, joined?} | {mode: "accept", child_id, role}, requestId}
 *
 * Order of checks (cheap and content-free first): route, kill switch
 * (`KILL_SWITCHES` contains `invites`), configuration (fail closed without
 * the pepper or the subject secret, BL-334), idempotency key, body size and
 * shape, session (no anonymous), the failure gate (10 per device hash and per
 * IP hash per hour; 1,000 per hour across the service, then every code
 * answers `rate_limited` with detail `codes_paused` and an alert line), then
 * the service-role RPC with the code's HMAC. The code, the token, the device
 * id, the IP and every id stay out of logs and out of the database in clear.
 *
 * SQL it calls (service role only; requested from S02 in the PR, WP-F11-01):
 *   invite_redeem_gate(p_device_hash text, p_ip_hash text) returns jsonb
 *     {"allowed": bool, "scope": "device" | "ip" | "global" | null}      (requested)
 *   invite_redeem_fail(p_device_hash text, p_ip_hash text) returns void (requested)
 *   peek_invite_by_code(p_code_hash bytea) returns jsonb, the peek_invite shape
 *     {"inviter", "role", "joined"?}                                     (requested)
 *   accept_child_invite_by_code(p_user uuid, p_code_hash bytea) returns uuid
 *     (built in S02's 20261015020000)
 * bytea travels as PostgREST text: `\x` and lowercase hex.
 * The last two raise SCINV (detail from INVITE_UNUSABLE_DETAILS), SCCAP,
 * SCCON and SCRAT exactly as `accept_child_invite` does.
 */
import {
  classifySqlstate, httpStatusFor, isErrorDetail, type ApiErrorCode,
} from '../../../packages/api/src/envelope.ts';
import { parseRedeemRequest, type RedeemData } from '../../../packages/api/src/server/family.ts';
import { createLogger, type ErrorCode, type LogSink } from '../_shared/log/log.ts';
import {
  bearerOf, clientIp, codeHmac, discard, failReply, idempotencyKeyOf, incomingRequestId, okReply, parseJson, pausedReply,
  postgrestError, readBody, serverKilled, sessionOf, subjectHash, timedFetch, type EnvGetter, type FetchFn,
} from '../_shared/http/http.ts';

export const MAX_BODY_BYTES = 1_024;
const ROUTE_RE = /\/invite-redeem\/v1\/?$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** On the code path every unusable reason but `already_member` reads as `not_found`, so a guess learns nothing. */
const CODE_PATH_DETAILS = new Set(['already_member']);

const LOG_CODE: Partial<Record<ApiErrorCode, ErrorCode>> = {
  bad_request: 'invalid_input', unauthorized: 'unauthorized', forbidden: 'forbidden', anonymous_refused: 'anonymous', not_found: 'not_found',
  payload_too_large: 'payload_too_large', rate_limited: 'rate_limited', paused: 'killed', invite_unusable: 'invite_unusable',
  parents_full: 'parents_full', consent_required: 'consent', unavailable: 'error',
};

export interface RedeemOptions {
  fetch?: FetchFn;
  logSink?: LogSink;
  now?: () => Date;
  timeoutMs?: number;
}

export function makeRedeemHandler(env: EnvGetter, opts: RedeemOptions = {}): (req: Request) => Promise<Response> {
  const fetchFn: FetchFn = opts.fetch ?? ((i, init) => fetch(i, init));
  const now = opts.now ?? (() => new Date());
  const timeoutMs = opts.timeoutMs ?? 8_000;

  return async (req: Request) => {
    const started = Date.now();
    const log = createLogger({ fn: 'invite-redeem', version: '1', sink: opts.logSink, now, reqId: incomingRequestId(req) });
    const id = log.reqId;
    let task: 'peek' | 'accept' | undefined;
    const refuse = (code: ApiErrorCode, retryable: boolean, extra: { status?: number; detail?: string; headers?: Record<string, string> } = {}) => {
      const status = extra.status ?? httpStatusFor(code);
      log.warn('redeem.refused', { status, code: LOG_CODE[code] ?? 'error', task, duration_ms: Date.now() - started });
      return failReply({ code, retryable, detail: isErrorDetail(extra.detail) ? extra.detail : undefined }, id, status, extra.headers);
    };
    const unavailable = (fields: { provider?: 'postgrest' | 'auth'; status?: number; code?: ErrorCode }) => {
      log.error('redeem.failed', { ...fields, task, duration_ms: Date.now() - started });
      return failReply({ code: 'unavailable', retryable: true }, id, 503);
    };

    try {
      if (req.method !== 'POST') return refuse('bad_request', false, { status: 405 });
      if (!ROUTE_RE.test(new URL(req.url).pathname)) return refuse('not_found', false);
      if (serverKilled(env, 'invites')) {
        log.warn('redeem.refused', { status: 503, code: 'killed' });
        return pausedReply('invites', id);
      }

      const supabaseUrl = (env('SUPABASE_URL') ?? '').replace(/\/+$/, '');
      const anonKey = env('SUPABASE_ANON_KEY') ?? '';
      const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY') ?? '';
      const pepper = env('INVITE_CODE_PEPPER') ?? '';
      const subjectSecret = env('RATE_SUBJECT_SECRET') ?? '';
      // Fail closed (BL-334): without the pepper a code could only be compared in clear, so nothing is compared.
      if (!supabaseUrl || !anonKey || !serviceKey || pepper.length < 32 || subjectSecret.length < 32) {
        log.error('redeem.failed', { code: 'config' });
        return failReply({ code: 'unavailable', retryable: true }, id, 503);
      }

      if (!idempotencyKeyOf(req, false).ok) return refuse('bad_request', false);
      const body = await readBody(req, MAX_BODY_BYTES);
      if (!body.ok) return refuse('payload_too_large', false);
      const json = parseJson(body.text);
      const parsed = json.ok ? parseRedeemRequest(json.value) : { ok: false as const };
      if (!parsed.ok) return refuse('bad_request', false);
      const { code, mode, device } = parsed.value;
      task = mode;

      const session = await sessionOf(fetchFn, supabaseUrl, anonKey, bearerOf(req), timeoutMs);
      if (session.kind === 'unauthorized') return refuse('unauthorized', false);
      if (session.kind === 'anonymous') return refuse('anonymous_refused', false);
      if (session.kind === 'unavailable') return unavailable({ provider: 'auth', status: session.status });

      const at = now();
      const deviceHash = await subjectHash(subjectSecret, 'device', device.toLowerCase(), at);
      const ipHash = await subjectHash(subjectSecret, 'ip', clientIp(req) || 'none', at);
      const service = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
      const rpc = (fn: string, args: Record<string, unknown>) =>
        timedFetch(fetchFn, `${supabaseUrl}/rest/v1/rpc/${fn}`, { method: 'POST', headers: service, body: JSON.stringify(args) }, timeoutMs);

      // The failure gate, before the code is looked at.
      const gate = await rpc('invite_redeem_gate', { p_device_hash: deviceHash, p_ip_hash: ipHash });
      if (!gate || !gate.ok) {
        await discard(gate);
        return unavailable({ provider: 'postgrest', status: gate?.status ?? 0 });
      }
      const g = (await gate.json().catch(() => null)) as { allowed?: unknown; scope?: unknown } | null;
      if (!g || typeof g.allowed !== 'boolean') return unavailable({ provider: 'postgrest', code: 'bad_response' });
      if (!g.allowed) {
        if (g.scope === 'global') {
          // F11-REQ-007: the code path pauses for everyone; links keep working. This error line is the signal;
          // the 15-minute alert is a purge-worker SLA condition over the gate's global counter (follow-up with S02's table).
          log.error('redeem.brake', { code: 'brake', status: 429, task });
          return failReply({ code: 'rate_limited', retryable: true, detail: 'codes_paused' }, id, 429, { 'retry-after': '3600' });
        }
        return refuse('rate_limited', true, { headers: { 'retry-after': '3600' } });
      }

      const codeHash = `\\x${await codeHmac(pepper, code)}`;
      const res = mode === 'peek'
        ? await rpc('peek_invite_by_code', { p_code_hash: codeHash })
        : await rpc('accept_child_invite_by_code', { p_user: session.profileId, p_code_hash: codeHash });
      if (!res) return unavailable({ provider: 'postgrest', status: 0 });

      if (!res.ok) {
        const { sqlstate, detail } = await postgrestError(res);
        if (sqlstate === 'SCINV' || sqlstate === 'P0002') {
          const counted = await rpc('invite_redeem_fail', { p_device_hash: deviceHash, p_ip_hash: ipHash });
          await discard(counted);
          if (!counted || !counted.ok) return unavailable({ provider: 'postgrest', status: counted?.status ?? 0 });
          return refuse('invite_unusable', false, { detail: detail && CODE_PATH_DETAILS.has(detail) ? detail : 'not_found' });
        }
        if (!sqlstate || res.status >= 500) return unavailable({ provider: 'postgrest', status: res.status });
        const rule = classifySqlstate(sqlstate);
        if (rule.code === 'internal') return unavailable({ provider: 'postgrest', status: res.status, code: 'sqlstate' });
        return refuse(rule.code, rule.retryable, { detail: detail ?? undefined, headers: rule.code === 'rate_limited' ? { 'retry-after': '3600' } : undefined });
      }

      let data: RedeemData;
      const value = await res.json().catch(() => null);
      if (mode === 'peek') {
        const p = value as { inviter?: unknown; role?: unknown; joined?: unknown } | null;
        if (!p || (p.inviter !== null && typeof p.inviter !== 'string') || p.role !== 'parent') return unavailable({ provider: 'postgrest', code: 'bad_response' });
        data = { mode: 'peek', inviter: p.inviter as string | null, role: 'parent', ...(p.joined === true ? { joined: true as const } : {}) };
      } else {
        if (typeof value !== 'string' || !UUID_RE.test(value)) return unavailable({ provider: 'postgrest', code: 'bad_response' });
        data = { mode: 'accept', child_id: value.toLowerCase(), role: 'parent' };
      }
      log.info(mode === 'peek' ? 'redeem.peeked' : 'redeem.accepted', { status: 200, outcome: 'ok', task, duration_ms: Date.now() - started });
      return okReply(data, id);
    } catch (e) {
      log.exception('redeem.failed', e, { status: 500, task });
      return failReply({ code: 'internal', retryable: true }, id, 500);
    }
  };
}
