/**
 * invite-redeem: join a co-parent's book with the 8-character code
 * (F11 6.2 B, F11-REQ-007, B-NFR-004; WP-F11-02; contract
 * packages/api/src/server/family.ts). Links keep using `accept_child_invite`
 * over PostgREST; codes come only through here, because a code has about 40
 * bits and must be throttled where the caller cannot reset the count.
 *
 * POST /functions/v1/invite-redeem/v1
 *   Authorization: Bearer <the signed-in user's access token>
 *   {"code": "7K3M9QXZ", "mode": "peek" | "accept", "device": "<install uuid>"}
 * 200 {ok: true, data: {mode: "peek", inviter, role, joined?} | {mode: "accept", child_id, role}, requestId}
 * An `Idempotency-Key` header is accepted and checked for shape, but not
 * needed: accept is idempotent for the same person, peek changes nothing.
 *
 * Order of checks (cheap and content-free first): route, kill switch
 * (`KILL_SWITCHES` contains `invites`), configuration (fail closed without
 * the pepper or the subject secret, BL-334), body size (streamed, capped) and
 * shape, session (only a full account; anonymous refused), then ONE
 * service-role RPC, `invite_redeem_by_code` (contract `RedeemByCodeArgs`,
 * requested from S02), that gates, looks up and counts in a single
 * transaction with the counter rows locked: 10 failures per person, 10 per
 * device and 30 per client IP per rolling hour, 1,000 across the service,
 * after which every code answers `rate_limited` with detail `codes_paused`
 * while links keep working. Because the count commits in the same
 * transaction as the lookup, parallel guesses cannot all pass the gate, and
 * no wrong guess is ever answered without being counted.
 *
 * Secrets: INVITE_CODE_PEPPER, RATE_SUBJECT_SECRET, CLIENT_IP_HEADER (the one
 * header the platform sets for the client address; unset skips the IP limit).
 *
 * The code, the device id, the IP, the person and every id stay out of logs
 * and out of the database in clear (hashes only; the code as an HMAC with
 * the pepper, sent as PostgREST bytea text `\x<hex>`).
 */
import { classifySqlstate, httpStatusFor, isErrorDetail, type ApiErrorCode } from '../../../packages/api/src/envelope.ts';
import { parseRedeemRequest, RedeemRpcResultSchema, type RedeemData } from '../../../packages/api/src/server/family.ts';
import * as v from 'valibot';
import { createLogger, type ErrorCode, type LogSink } from '../_shared/log/log.ts';
import {
  bearerOf, clientIp, codeHmac, failReply, idempotencyKeyOf, incomingRequestId, okReply, parseJson, pausedReply,
  postgrestError, readBody, serverKilled, sessionOf, subjectHashes, timedRequest, unknownKillSwitches, upstreamJson, type EnvGetter, type FetchFn,
} from '../_shared/http/http.ts';

export const MAX_BODY_BYTES = 1_024;
const ROUTE_RE = /\/invite-redeem\/v1\/?$/;
/** SQLSTATEs the RPC may hand back as `refused` (the code was right). Anything else is a bad answer. */
const REFUSED_OK = new Set(['SCCAP', 'SCCON', 'SCDEL', 'SCRAT']);
/** A person the database just called `limited` is answered from memory for this long, without another RPC (per isolate). */
export const LIMITED_MEMO_MS = 60_000;

const LOG_CODE: Partial<Record<ApiErrorCode, ErrorCode>> = {
  bad_request: 'invalid_input', unauthorized: 'unauthorized', forbidden: 'forbidden', anonymous_refused: 'anonymous', not_found: 'not_found',
  payload_too_large: 'payload_too_large', rate_limited: 'rate_limited', paused: 'killed', invite_unusable: 'invite_unusable',
  parents_full: 'parents_full', consent_required: 'consent', unavailable: 'error', deleted: 'not_found',
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
  // Best-effort and per isolate: a caller who is limited keeps costing nothing but this lookup for a minute.
  const limitedUntil = new Map<string, number>();

  return async (req: Request) => {
    const started = Date.now();
    const log = createLogger({ fn: 'invite-redeem', version: '1', sink: opts.logSink, now, reqId: incomingRequestId(req) });
    const id = log.reqId;
    let task: 'peek' | 'accept' | undefined;
    const refuse = (
      code: ApiErrorCode, retryable: boolean,
      extra: { status?: number; detail?: string | null; sqlstate?: string; headers?: Record<string, string> } = {},
    ) => {
      const status = extra.status ?? httpStatusFor(code);
      log.warn('redeem.refused', { status, code: LOG_CODE[code] ?? 'error', sqlstate: extra.sqlstate, task, duration_ms: Date.now() - started });
      return failReply({ code, retryable, sqlstate: extra.sqlstate, detail: isErrorDetail(extra.detail) ? extra.detail : undefined }, id, status, extra.headers);
    };
    /** SCCON details are a comma list of missing consents; the envelope carries one closed value (family-share first). */
    const consentDetail = (d: string | null | undefined) => {
      const parts = (d ?? '').split(',').map((x) => x.trim());
      return parts.includes('family-share') ? 'family-share' : parts.find((x) => isErrorDetail(x)) ?? undefined;
    };
    const unavailable = (fields: { provider?: 'postgrest' | 'auth'; status?: number; code?: ErrorCode }) => {
      log.error('redeem.failed', { ...fields, task, duration_ms: Date.now() - started });
      return failReply({ code: 'unavailable', retryable: true }, id, 503);
    };

    try {
      if (req.method !== 'POST') return refuse('bad_request', false, { status: 405 });
      if (!ROUTE_RE.test(new URL(req.url).pathname)) return refuse('not_found', false);
      if (unknownKillSwitches(env) > 0) log.warn('redeem.degraded', { code: 'config' });
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
      const userSubjects = await subjectHashes(subjectSecret, 'user', session.profileId, at);
      const memo = limitedUntil.get(userSubjects[0]);
      if (memo !== undefined && memo > at.getTime()) return refuse('rate_limited', true, { headers: { 'retry-after': '3600' } });
      if (limitedUntil.size > 10_000) limitedUntil.clear();
      const ip = clientIp(req, env('CLIENT_IP_HEADER'));
      // No trusted address: the IP limit is skipped for this call (person, device and global still apply). Visible in logs.
      if (!ip) log.warn('redeem.degraded', { code: 'no_address', task });
      const args = {
        p_user: session.profileId,
        p_mode: mode,
        p_code_hash: `\\x${await codeHmac(pepper, code)}`,
        p_user_subjects: userSubjects,
        p_device_subjects: await subjectHashes(subjectSecret, 'device', device, at),
        p_ip_subjects: ip ? await subjectHashes(subjectSecret, 'ip', ip, at) : [],
      };
      const res = await timedRequest(fetchFn, `${supabaseUrl}/rest/v1/rpc/invite_redeem_by_code`, {
        method: 'POST',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      }, timeoutMs);
      if (!res) return unavailable({ provider: 'postgrest', status: 0, code: 'network' });
      if (!res.ok) {
        const { sqlstate } = postgrestError(res);
        return unavailable({ provider: 'postgrest', status: res.status, code: sqlstate ? 'sqlstate' : 'postgrest_error' });
      }
      const out = v.safeParse(RedeemRpcResultSchema, upstreamJson(res));
      if (!out.success) return unavailable({ provider: 'postgrest', code: 'bad_response' });
      const r = out.output;

      let data: RedeemData;
      switch (r.outcome) {
        case 'limited':
          if (r.scope === 'global') {
            // F11-REQ-007: the code path pauses for everyone; links keep working. This error line is the signal;
            // the 15-minute alert is a purge-worker SLA condition over the global counter (follow-up with S02's table).
            log.error('redeem.brake', { code: 'brake', status: 429, task });
            return failReply({ code: 'rate_limited', retryable: true, detail: 'codes_paused' }, id, 429, { 'retry-after': '3600' });
          }
          if (r.scope === 'user') limitedUntil.set(userSubjects[0], at.getTime() + LIMITED_MEMO_MS);
          return refuse('rate_limited', true, { headers: { 'retry-after': '3600' } });
        case 'unusable':
          // On the code path every reason but `already_member` reads as `not_found`, so a guess learns nothing.
          return refuse('invite_unusable', false, { sqlstate: 'SCINV', detail: r.detail === 'already_member' ? 'already_member' : 'not_found' });
        case 'refused': {
          // A wrong code must come back as `unusable` (counted). An uncounted SCINV would make guessing free: fail closed.
          if (!REFUSED_OK.has(r.sqlstate)) return unavailable({ provider: 'postgrest', code: 'bad_response' });
          const rule = classifySqlstate(r.sqlstate);
          if (rule.code === 'rate_limited') return refuse('rate_limited', true, { sqlstate: 'SCRAT', headers: { 'retry-after': '3600' } });
          const detail = r.sqlstate === 'SCCON' ? consentDetail(r.detail) : r.sqlstate === 'SCCAP' ? undefined : r.detail;
          return refuse(rule.code, rule.retryable, { sqlstate: r.sqlstate, detail });
        }
        case 'peek':
          // An answer for the other mode is a database bug: never pass a join off as a peek, or the reverse.
          if (mode !== 'peek') return unavailable({ provider: 'postgrest', code: 'bad_response' });
          data = { mode: 'peek', inviter: r.inviter, role: r.role, ...(r.joined ? { joined: true as const } : {}) };
          break;
        case 'accepted':
          if (mode !== 'accept') return unavailable({ provider: 'postgrest', code: 'bad_response' });
          data = { mode: 'accept', child_id: r.child_id.toLowerCase(), role: r.role };
          break;
      }
      log.info(mode === 'peek' ? 'redeem.peeked' : 'redeem.accepted', { status: 200, outcome: 'ok', task, duration_ms: Date.now() - started });
      return okReply(data, id);
    } catch (e) {
      log.exception('redeem.failed', e, { status: 500, task });
      return failReply({ code: 'internal', retryable: true }, id, 500);
    }
  };
}
