/**
 * analytics-ingest: receives batches of allowlisted analytics events from phones whose owners said yes
 * and stores them through public.ingest_app_events (migration 20261109010000).
 *
 * POST /functions/v1/analytics-ingest/v1
 *   {"id": "<random analytics id>", "events": [{"event": "...", "props": {...}, "ago_s": 0}, ...1 to 50]}
 * 202 {ok: true, data: {accepted: n}}. 400 for a bad shape. 413 over 32 KB. 429 over the daily cap.
 *
 * Rules (CLAUDE.md privacy rules, LEGAL-REQ-014, LEGAL-REQ-017):
 * - Every event is re-checked against the catalogue (packages/analytics sanitizeEvent). An event that
 *   fails is dropped; a batch with no valid event is a 400. Free text and PII-shaped strings never get in.
 * - The Authorization header is never read. The client IP is never read, stored or logged by this code.
 * - The log line carries counts and a status only: no id, no event name, no property value.
 */
import { sanitizeEvent } from '../../../packages/analytics/src/validate.ts';

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;
export type EnvGetter = (name: string) => string | undefined;

export const MAX_EVENTS = 50;
export const MAX_BODY = 32 * 1024;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROUTE_RE = /\/analytics-ingest\/v1\/?$/;

export interface IngestOptions {
  fetch?: FetchFn;
  log?: (line: string) => void;
  timeoutMs?: number;
}

export function makeIngestHandler(env: EnvGetter, opts: IngestOptions = {}): (req: Request) => Promise<Response> {
  const fetchFn: FetchFn = opts.fetch ?? ((i, init) => fetch(i, init));
  const log = opts.log ?? ((l: string) => console.log(l));
  const timeoutMs = opts.timeoutMs ?? 10_000;
  return async (req: Request) => {
    const reply = (status: number, body: unknown) =>
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    const done = (status: number, outcome: string, counts: Record<string, number> = {}) =>
      log(JSON.stringify({ fn: 'analytics-ingest', status, outcome, counts }));

    if (req.method !== 'POST') { done(405, 'method'); return reply(405, { ok: false, error: 'bad_request' }); }
    if (!ROUTE_RE.test(new URL(req.url).pathname)) { done(404, 'route'); return reply(404, { ok: false, error: 'not_found' }); }

    const supabaseUrl = (env('SUPABASE_URL') ?? '').replace(/\/+$/, '');
    const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !serviceKey) { done(503, 'config'); return reply(503, { ok: false, error: 'unavailable' }); }

    const raw = await req.text();
    if (raw.length > MAX_BODY) { done(413, 'too_large'); return reply(413, { ok: false, error: 'payload_too_large' }); }

    let id: string;
    let kept: { event: string; props: Record<string, unknown>; ago_s: number }[] = [];
    let received = 0;
    try {
      const body = JSON.parse(raw) as { id?: unknown; events?: unknown };
      if (typeof body.id !== 'string' || !UUID_RE.test(body.id)) throw 0;
      if (!Array.isArray(body.events) || body.events.length < 1 || body.events.length > MAX_EVENTS) throw 0;
      id = body.id.toLowerCase();
      received = body.events.length;
      for (const e of body.events as { event?: unknown; props?: unknown; ago_s?: unknown }[]) {
        if (!e || typeof e.event !== 'string') continue;
        const { props } = sanitizeEvent(e.event, e.props);
        if (!props) continue;
        const ago = typeof e.ago_s === 'number' && Number.isFinite(e.ago_s) ? Math.min(Math.max(Math.trunc(e.ago_s), 0), 14 * 24 * 3600) : 0;
        kept.push({ event: e.event, props, ago_s: ago });
      }
      if (kept.length === 0) throw 0;
    } catch {
      done(400, 'bad_request', { received });
      return reply(400, { ok: false, error: 'bad_request' });
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    let res: Response | null = null;
    try {
      res = await fetchFn(`${supabaseUrl}/rest/v1/rpc/ingest_app_events`, {
        method: 'POST',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_id: id, p_events: kept }),
        signal: ctrl.signal,
      });
    } catch {
      res = null;
    } finally {
      clearTimeout(timer);
    }
    if (!res || !res.ok) { done(503, 'store_failed', { received, kept: kept.length }); return reply(503, { ok: false, error: 'unavailable' }); }
    const stored = Number(await res.json().catch(() => 0));
    if (stored === -1) { done(429, 'daily_cap', { received }); return reply(429, { ok: false, error: 'rate_limited' }); }
    done(202, 'ok', { received, kept: kept.length, stored });
    return reply(202, { ok: true, data: { accepted: stored } });
  };
}
