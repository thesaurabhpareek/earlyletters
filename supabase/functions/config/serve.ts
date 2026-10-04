/**
 * Serving signed public documents (ADR 0016, ADR 0017). Shared by the
 * `config` and `content` functions; runtime neutral (Web Request/Response and
 * WebCrypto only), so the same code runs in Deno and in Node tests.
 *
 * What a response guarantees:
 *  - the body is the exact signed JSON text produced by `scripts/packs`
 *    (signed offline; no key exists in any function);
 *  - a strong ETag (SHA-256 of the body), `If-None-Match` answered with 304;
 *  - Cache-Control from @scribe/api `CACHE_POLICY` (max-age plus
 *    stale-while-revalidate and stale-if-error), so a CDN can sit in front;
 *  - `x-request-id` echoed when valid, generated otherwise;
 *  - no user data in, none out: no auth, no cookies, nothing about the caller
 *    is read except the method, path, `If-None-Match` and the request id;
 *  - one content-free log line per request through the shared logger.
 */
import { CACHE_POLICY } from '../../../packages/api/src/standards.ts';
import { failure, HEADER_REQUEST_ID, REQUEST_ID_RE, type ApiErrorCode } from '../../../packages/api/src/envelope.ts';
import { createLogger, type FunctionName, type LogSink } from '../_shared/log/log.ts';

export interface PublishedDocument {
  /** Exact JSON text of the SignedDocument. */
  body: string;
  cacheControl: string;
}

/** Route key is the path after the function name, e.g. `v1/remote-config`. */
export type DocumentRoutes = Record<string, (url: URL) => PublishedDocument | null>;

export interface ServeOptions {
  logSink?: LogSink;
  now?: () => Date;
  version?: string;
}

const etags = new Map<string, string>();

async function etagFor(body: string): Promise<string> {
  const hit = etags.get(body);
  if (hit) return hit;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body));
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  const tag = `"sha256-${hex.slice(0, 32)}"`;
  etags.set(body, tag);
  return tag;
}

/** True when an If-None-Match header lists this ETag (or `*`). Weak validators compare equal too (RFC 9110 13.1.2). */
export function matchesEtag(header: string | null, etag: string): boolean {
  if (!header) return false;
  return header.split(',').some((t) => {
    const v = t.trim().replace(/^W\//, '');
    return v === '*' || v === etag;
  });
}

/** The path after the function's own segment: `/functions/v1/config/v1/packs` and `/config/v1/packs` both give `v1/packs`. */
export function routeOf(pathname: string, fn: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  const i = parts.indexOf(fn);
  return i < 0 ? null : parts.slice(i + 1).join('/');
}

export function makeDocumentHandler(fn: 'config' | 'content', routes: DocumentRoutes, opts: ServeOptions = {}) {
  return async (req: Request): Promise<Response> => {
    const started = Date.now();
    const incoming = req.headers.get(HEADER_REQUEST_ID) ?? '';
    // 'config' and 'content' are not in the shared logger's FUNCTIONS list yet (request in the ADR 0016 report); it logs them as 'unknown'.
    const log = createLogger({
      fn: fn as unknown as FunctionName,
      version: opts.version ?? '1',
      sink: opts.logSink,
      now: opts.now,
      reqId: REQUEST_ID_RE.test(incoming) ? incoming : undefined,
    });
    const base: Record<string, string> = {
      [HEADER_REQUEST_ID]: log.reqId,
      'access-control-allow-origin': '*',
      'access-control-expose-headers': 'etag, x-request-id',
      'x-content-type-options': 'nosniff',
    };
    const fail = (status: number, code: ApiErrorCode, retryable: boolean) => {
      log.warn('request.refused', { status, code: status === 405 ? 'method' : status === 404 ? 'not_found' : 'invalid_input', duration_ms: Date.now() - started });
      return new Response(JSON.stringify(failure({ code, retryable }, log.reqId)), {
        status,
        headers: { ...base, 'content-type': 'application/json; charset=utf-8', 'cache-control': CACHE_POLICY.error },
      });
    };

    try {
      if (req.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: { ...base, 'access-control-allow-methods': 'GET, HEAD, OPTIONS', 'access-control-allow-headers': 'if-none-match, x-request-id, x-app-version', 'access-control-max-age': '86400' },
        });
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return fail(405, 'bad_request', false);
      const url = new URL(req.url);
      const route = routeOf(url.pathname, fn);
      const resolve = route !== null ? routes[route] : undefined;
      const doc = resolve ? resolve(url) : null;
      if (!doc) return fail(404, 'not_found', false);

      const etag = await etagFor(doc.body);
      const headers = { ...base, etag, 'cache-control': doc.cacheControl, 'content-type': 'application/json; charset=utf-8' };
      if (matchesEtag(req.headers.get('if-none-match'), etag)) {
        log.info('request.done', { status: 304, outcome: 'ok', duration_ms: Date.now() - started });
        return new Response(null, { status: 304, headers });
      }
      log.info('request.done', { status: 200, outcome: 'ok', duration_ms: Date.now() - started });
      return new Response(req.method === 'HEAD' ? null : doc.body, { status: 200, headers });
    } catch (e) {
      log.exception('request.failed', e, { status: 500 });
      return new Response(JSON.stringify(failure({ code: 'internal', retryable: true }, log.reqId)), {
        status: 500,
        headers: { ...base, 'content-type': 'application/json; charset=utf-8', 'cache-control': CACHE_POLICY.error },
      });
    }
  };
}
