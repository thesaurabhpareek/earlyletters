import { describe, expect, it } from 'vitest';
import {
  CACHE_POLICY,
  classifyHttpStatus,
  classifySqlstate,
  ENDPOINT_CLASSES,
  ENDPOINTS,
  failure,
  httpStatusFor,
  newRequestId,
  parseRetryAfter,
  REQUEST_ID_RE,
  retryDelayMs,
  API_ERROR_CODES,
  type EndpointSpec,
} from '../src';

describe('[DECISION-17] every endpoint the app calls meets the API standard', () => {
  const entries = Object.entries(ENDPOINTS) as [string, EndpointSpec][];

  it.each(entries)('%s has a p95 budget, auth rule, retry rule and rate limit', (_name, e) => {
    const cls = ENDPOINT_CLASSES[e.class];
    expect(cls.p95Ms).toBeGreaterThan(0);
    expect(cls.timeoutMs).toBeGreaterThan(cls.p95Ms);
    expect(cls.maxAttempts).toBeGreaterThanOrEqual(1);
    expect(['public', 'user_jwt']).toContain(e.auth);
    expect(e.rateLimit.limit).toBeGreaterThan(0);
    expect(e.rateLimit.windowSeconds).toBeGreaterThan(0);
  });

  it('never lists a server-only endpoint as callable from the app (no service keys in the app)', () => {
    expect(entries.filter(([, e]) => e.auth === 'server_only')).toEqual([]);
  });

  it('public endpoints are read-only GETs; mutations are idempotent by id or key', () => {
    for (const [name, e] of entries) {
      if (e.auth === 'public' && name !== 'signIn') expect(e.method).toBe('GET');
      if (e.method === 'POST' && e.idempotency === 'safe_method') {
        expect(['signIn', 'syncPull', 'policyActionsNeeded']).toContain(name);
      }
    }
  });

  it('versions our own routes in the path', () => {
    for (const [, e] of entries) {
      if (e.path.startsWith('/functions/v1/config') || e.path.startsWith('/functions/v1/content')) expect(e.path).toMatch(/\/v1\//);
    }
  });

  it('caches public documents with stale-while-revalidate and never caches errors', () => {
    for (const k of ['remoteConfig', 'packManifest', 'contentBundle'] as const) {
      expect(CACHE_POLICY[k]).toMatch(/max-age=\d+/);
      expect(CACHE_POLICY[k]).toMatch(/stale-while-revalidate=\d+/);
    }
    expect(Number(/max-age=(\d+)/.exec(CACHE_POLICY.remoteConfig)![1])).toBeLessThanOrEqual(300);
    expect(CACHE_POLICY.packFile).toContain('immutable');
    expect(CACHE_POLICY.error).toBe('no-store');
  });
});

describe('retry policy', () => {
  it('uses full jitter under an exponential ceiling and a cap', () => {
    expect(retryDelayMs('read_rpc', 1, () => 1)).toBe(1000);
    expect(retryDelayMs('read_rpc', 3, () => 1)).toBe(4000);
    expect(retryDelayMs('read_rpc', 30, () => 1)).toBe(60_000);
    expect(retryDelayMs('read_rpc', 3, () => 0)).toBe(0);
  });
  it('honours Retry-After in seconds, capped', () => {
    expect(retryDelayMs('public_document', 1, () => 0.5, 7)).toBe(7000);
    expect(retryDelayMs('public_document', 1, () => 0.5, 9999)).toBe(30_000);
    expect(parseRetryAfter('120')).toBe(120);
    expect(parseRetryAfter('Wed, 21 Oct 2026 07:28:00 GMT')).toBeNull();
  });
});

describe('errors', () => {
  it('maps every SQLSTATE in supabase/APPLY.md to an action', () => {
    expect(classifySqlstate('SCCON')).toMatchObject({ code: 'consent_required', action: 'pause_for_consent' });
    expect(classifySqlstate('28000')).toMatchObject({ action: 'reauth', retryable: true });
    for (const s of ['SCIMM', 'SCTMB', 'SCLPG', 'SCDEL', 'SCPAR', 'SCCID', 'SCAPR', 'SCANO', 'P0002', '22023', '42501']) {
      expect(classifySqlstate(s).action).toBe('reject');
    }
    for (const s of ['SCRAT', 'SCINV', 'SCPLS']) expect(classifySqlstate(s).action).toBe('tell_user');
    for (const s of ['40001', '40P01', '57014', '08006', '53300']) expect(classifySqlstate(s).action).toBe('retry');
    expect(classifySqlstate('SCZZZ').action).toBe('reject');
    expect(classifySqlstate('23514').action).toBe('reject');
    expect(classifySqlstate('not a code').action).toBe('reject');
  });

  it('maps HTTP statuses', () => {
    expect(classifyHttpStatus(0).action).toBe('retry');
    expect(classifyHttpStatus(401).action).toBe('reauth');
    expect(classifyHttpStatus(429).action).toBe('retry');
    expect(classifyHttpStatus(503).action).toBe('retry');
    expect(classifyHttpStatus(404).action).toBe('reject');
  });

  it('gives every error code an HTTP status', () => {
    for (const c of API_ERROR_CODES) expect(httpStatusFor(c)).toBeGreaterThanOrEqual(400);
  });

  it('builds content-free failures with a request id', () => {
    const id = newRequestId();
    expect(id).toMatch(REQUEST_ID_RE);
    const f = failure({ code: 'immutable', retryable: false, sqlstate: 'SCIMM', message: 'row: Asha' } as never, id);
    expect(f).toEqual({ ok: false, error: { code: 'immutable', retryable: false, sqlstate: 'SCIMM' }, requestId: id });
    expect(JSON.stringify(f)).not.toContain('Asha');
  });
});
