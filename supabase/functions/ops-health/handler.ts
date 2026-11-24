/**
 * ops-health: two numbers for the outside purge watch (BL-584, DATA-03, CR-209 option A). Nothing else.
 *
 * GET /functions/v1/ops-health
 *   Authorization: Bearer <OPS_HEALTH_TOKEN>      its own token; not PURGE_WORKER_SECRET, not a Supabase key
 * 200 {ok: true, data: {purge_run_age_minutes: number | null, failed_cron_runs: number}, requestId}
 *   purge_run_age_minutes: minutes since the newest purge_run audit row (ops_deletion_sla); null means none was ever written.
 *   failed_cron_runs: failed scribe-* pg_cron runs in the last 120 minutes (ops_cron_health).
 * 401 without the token (checked first, before any setting or database is touched: no oracle), 405 for any other method,
 * 503 when the token or the Supabase settings are missing or a read fails. Errors use the packages/api envelope and carry no detail.
 *
 * Why a function: the watch must not hold a key that bypasses row-level security in a public repository. The service key
 * stays inside Supabase's function secrets (docs/ops/SECURITY.md); GitHub holds only the function URL and this token, which
 * can read two numbers. Revoke it by changing the function secret. The token compare is constant time (safeEqual).
 * No health route and no logging of the token, the URL, a row or a response body: closed enums and counts only (OBS-R02).
 */
import { type ApiErrorCode } from '../../../packages/api/src/envelope.ts';
import { failReply, okReply } from '../_shared/http/http.ts';
import { secretKeyOf } from '../_shared/keys/keys.ts';
import { createLogger, type LogSink } from '../_shared/log/log.ts';
import { safeEqual, type FetchFn } from '../purge-worker/lib/http.ts';
import { createServiceClient, type ServiceClient } from '../purge-worker/lib/service.ts';

/** The token is a random value of at least this many characters (`openssl rand -hex 32` gives 64); a shorter one refuses everyone. */
export const MIN_TOKEN_CHARS = 32;
/** The window ops_cron_health counts failed runs in: the 2 hours of the BL-584 acceptance lines. */
export const CRON_WINDOW_MINUTES = 120;

export interface OpsHealthOptions { fetch?: FetchFn; client?: ServiceClient; logSink?: LogSink; timeoutMs?: number }

const isAge = (v: unknown): v is number | null => v === null || (typeof v === 'number' && Number.isFinite(v) && v >= 0);
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

export function makeOpsHealthHandler(env: (name: string) => string | undefined, opts: OpsHealthOptions = {}): (req: Request) => Promise<Response> {
  return async (req) => {
    const log = createLogger({ fn: 'ops-health', version: '1', sink: opts.logSink });
    const refuse = (code: ApiErrorCode, retryable: boolean, status?: number) => failReply({ code, retryable }, log.reqId, status);

    if (req.method !== 'GET') return refuse('bad_request', false, 405);
    // The bearer check comes first: a caller without the token always gets 401, never a configuration answer.
    const token = (env('OPS_HEALTH_TOKEN') ?? '').trim();
    const auth = req.headers.get('authorization') ?? '';
    if (token.length < MIN_TOKEN_CHARS || !safeEqual(auth.startsWith('Bearer ') ? auth.slice(7) : '', token)) {
      log.warn('request.refused', { code: 'unauthorized', status: 401, outcome: 'refused' });
      return refuse('unauthorized', false);
    }

    const url = (env('SUPABASE_URL') ?? '').trim().replace(/\/+$/, '');
    const serviceKey = secretKeyOf(env) ?? '';
    if (!opts.client && (!url || !serviceKey)) {
      log.error('request.failed', { code: 'config', status: 503, outcome: 'server_error' });
      return refuse('unavailable', true);
    }
    const client = opts.client ?? createServiceClient({ url, serviceKey, fetch: opts.fetch, timeoutMs: opts.timeoutMs ?? 10_000 });

    try {
      // Two literal call sites on purpose: supabase/tests/function_rpc_contract checks each name against the schema.
      const sla = await client.rpc<{ purge_run_age_minutes?: unknown } | null>('ops_deletion_sla', {});
      const cron = await client.rpc<{ failed_runs?: unknown } | null>('ops_cron_health', { p_window_minutes: CRON_WINDOW_MINUTES });
      const age = sla?.purge_run_age_minutes;
      const failed = cron?.failed_runs;
      if (!isAge(age) || !isCount(failed)) {
        log.error('request.failed', { code: 'bad_response', status: 503, outcome: 'server_error' });
        return refuse('unavailable', true);
      }
      log.info('request.done', { status: 200, outcome: 'ok', counts: { failed: failed } });
      return okReply({ purge_run_age_minutes: age, failed_cron_runs: failed }, log.reqId);
    } catch {
      log.error('request.failed', { code: 'error', status: 503, outcome: 'server_error' });
      return refuse('unavailable', true);
    }
  };
}
