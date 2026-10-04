/**
 * HTTP entry for the purge worker, separate from Deno.serve so tests can call it.
 *
 * Auth: `Authorization: Bearer <PURGE_WORKER_SECRET>`, compared in constant
 * time. The cron job holds this dedicated secret in Vault, not the service
 * role key (least privilege: a leaked trigger secret can only start a run).
 * Deploy with --no-verify-jwt because this bearer is not a JWT.
 * Body (optional, at most 1 KB): {"task": "run" | "daily"}.
 * Responses use the packages/api envelope and carry x-request-id.
 */
import { failure, HEADER_REQUEST_ID, httpStatusFor, success, type ApiErrorCode } from '../../../packages/api/src/envelope.ts';
import { createLogger, type LogSink } from '../_shared/log/log.ts';
import { readConfig, type EnvGetter } from './config.ts';
import { safeEqual, type FetchFn } from './lib/http.ts';
import { createServiceClient, type ServiceClient } from './lib/service.ts';
import { runWorker, type Task } from './worker.ts';

export interface HandlerOptions {
  fetch?: FetchFn;
  /** EdgeRuntime.waitUntil in production: answer 202 at once and keep working. */
  runInBackground?: (p: Promise<unknown>) => void;
  logSink?: LogSink;
  now?: () => Date;
  /** Tests inject a client; production builds one from the config. */
  client?: ServiceClient;
}

export function makeHandler(env: EnvGetter, opts: HandlerOptions = {}): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const { config, missing } = readConfig(env);
    const log = createLogger({ fn: 'purge-worker', version: config?.version ?? '1', sink: opts.logSink, now: opts.now });
    const reply = (status: number, body: unknown) =>
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', [HEADER_REQUEST_ID]: log.reqId } });
    const fail = (code: ApiErrorCode, retryable: boolean, status = httpStatusFor(code)) => reply(status, failure({ code, retryable }, log.reqId));

    if (req.method !== 'POST') {
      log.warn('request.refused', { code: 'method', status: 405 });
      return fail('bad_request', false, 405);
    }
    if (!config) {
      log.error('request.failed', { code: 'config', counts: { failed: missing.length } });
      return fail('internal', true);
    }
    const auth = req.headers.get('authorization') ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!safeEqual(token, config.triggerSecret)) {
      log.warn('request.refused', { code: 'unauthorized', status: 401 });
      return fail('unauthorized', false);
    }

    let task: Task = 'run';
    const raw = await req.text();
    if (raw.length > 1024) return fail('payload_too_large', false);
    if (raw.trim()) {
      try {
        const body = JSON.parse(raw) as { task?: unknown };
        if (body.task === 'daily' || body.task === 'run') task = body.task;
        else if (body.task !== undefined) return fail('bad_request', false);
      } catch {
        return fail('bad_request', false);
      }
    }

    const fetchFn = opts.fetch ?? ((input: string, init?: RequestInit) => fetch(input, init));
    const client = opts.client ?? createServiceClient({ url: config.supabaseUrl, serviceKey: config.serviceKey, fetch: fetchFn });
    log.info('request.start', { task: task === 'daily' ? 'ledger' : 'run' });
    const work = runWorker({ client, fetch: fetchFn, config, log, now: opts.now }, task).catch((e) => {
      log.exception('worker.done', e, { outcome: 'server_error' });
      return null;
    });

    if (opts.runInBackground) {
      opts.runInBackground(work);
      return reply(202, success({ accepted: true, task }, log.reqId));
    }
    const summary = await work;
    if (!summary) return fail('internal', true);
    return reply(200, success({ task, purge: summary.purge, queue: summary.queue, accounts: summary.accounts, alerts: summary.alerts }, log.reqId));
  };
}
