/**
 * Reads the two sources over HTTPS with an injected `fetch` (tested with a
 * fake). Read-only credentials from the environment; nothing is written to
 * either service. Errors carry the HTTP status and the query name only,
 * never a response body (a body could echo a query or data).
 */
import type { EventName } from '../catalog';
import { allQueries, parseBreakdownRows, parseFunnelRows, parseWeeklyRows } from './hogql';
import type { DeviceData, DeviceRow, ServerAggregates } from './types';

export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body?: string }) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

export class SourceError extends Error {
  constructor(public readonly source: 'posthog' | 'server', public readonly status: number, public readonly query?: string) {
    super(`insights_source_failed:${source}:${status}${query ? `:${query}` : ''}`);
  }
}

export interface PostHogConfig {
  /** Private API host, not the ingestion host: https://us.posthog.com or https://eu.posthog.com. */
  apiHost: string;
  projectId: string;
  /** Personal API key with the Query Read scope only. */
  apiKey: string;
  weeks: number;
}

export async function fetchPostHog(cfg: PostHogConfig, fetch: FetchLike): Promise<DeviceData> {
  if (!/^https:\/\//.test(cfg.apiHost) || !/^\d+$/.test(cfg.projectId)) throw new SourceError('posthog', 0, 'config');
  const url = `${cfg.apiHost.replace(/\/+$/, '')}/api/projects/${cfg.projectId}/query/`;
  const rows: DeviceRow[] = [];
  let funnel: DeviceData['funnel'] = [];
  for (const item of allQueries(cfg.weeks)) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { authorization: `Bearer ${cfg.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ query: { kind: 'HogQLQuery', query: item.q.query }, name: item.q.name }),
    });
    if (!res.ok) throw new SourceError('posthog', res.status, item.q.name);
    const body = (await res.json()) as { results?: unknown };
    const results = Array.isArray(body.results) ? (body.results.filter(Array.isArray) as unknown[][]) : [];
    if (item.kind === 'weekly') rows.push(...parseWeeklyRows(results));
    else if (item.kind === 'breakdown') rows.push(...parseBreakdownRows(item.event as EventName, item.dim!, results));
    else funnel = parseFunnelRows(results);
  }
  return { source: 'posthog', rows, funnel };
}

export interface ServerConfig {
  /** https://<project>.supabase.co */
  url: string;
  /** Publishable (anon) key for the `apikey` header. */
  publishableKey: string;
  /** Bearer for a role that may run insights_aggregates: an insights_reader JWT (recommended) or a secret key. */
  bearer: string;
  weeks: number;
}

export async function fetchServer(cfg: ServerConfig, fetch: FetchLike): Promise<ServerAggregates> {
  if (!/^https:\/\//.test(cfg.url)) throw new SourceError('server', 0, 'config');
  const res = await fetch(`${cfg.url.replace(/\/+$/, '')}/rest/v1/rpc/insights_aggregates`, {
    method: 'POST',
    headers: { apikey: cfg.publishableKey, authorization: `Bearer ${cfg.bearer}`, 'content-type': 'application/json' },
    body: JSON.stringify({ p_weeks: cfg.weeks }),
  });
  if (!res.ok) throw new SourceError('server', res.status, 'insights_aggregates');
  const body = (await res.json()) as ServerAggregates;
  if (!body || typeof body !== 'object' || body.k_min !== 10 || !Array.isArray(body.weekly_keeping_families)) throw new SourceError('server', 200, 'shape');
  return body;
}
