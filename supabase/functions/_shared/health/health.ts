/**
 * The health route every Edge Function answers (RA-07-06; read by
 * scripts/ops/staging-smoke.ts after each staging deploy, runbook
 * docs/ops/runbooks/staging-smoke.md):
 *
 *   GET or HEAD /functions/v1/<name>/health
 *   200 {ok: true, data: {status: "ready"}, requestId}    deployed, started, required settings present
 *   503 {ok: false, error: {code: "unavailable", retryable: true}, requestId}   deployed, settings missing
 *
 * Content-free and uncached: nothing about the caller is read (no auth, no
 * body, no query), and the answer never names which setting is missing.
 * Reachable without a session only when the function is deployed with
 * --no-verify-jwt; behind gateway JWT verification the gateway answers 401
 * before the function runs.
 */
import { failure, HEADER_REQUEST_ID, success } from '../../../../packages/api/src/envelope.ts';

/** `/<fn>/health` (what the platform passes) and `/functions/v1/<fn>/health` (local serve). */
export function isHealthPath(pathname: string, fn: string): boolean {
  const parts = pathname.split('/').filter(Boolean);
  const i = parts.indexOf(fn);
  return i >= 0 && parts.length === i + 2 && parts[i + 1] === 'health';
}

export function isHealthRequest(req: Request, fn: string): boolean {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  try {
    return isHealthPath(new URL(req.url).pathname, fn);
  } catch {
    return false;
  }
}

export function healthResponse(req: Request, ready: boolean, requestId: string): Response {
  const body = ready ? success({ status: 'ready' as const }, requestId) : failure({ code: 'unavailable', retryable: true }, requestId);
  return new Response(req.method === 'HEAD' ? null : JSON.stringify(body), {
    status: ready ? 200 : 503,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      [HEADER_REQUEST_ID]: requestId,
    },
  });
}
