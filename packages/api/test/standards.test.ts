import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { ApiFailureSchema } from '../src';

const ApiFailureSchemaParse = (x: unknown) => v.parse(ApiFailureSchema, x).error.code;
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
  API_ERROR_CODES_VERSION,
  ERROR_CODE_SINCE,
  HEADER_IDEMPOTENCY_KEY,
  IDEMPOTENCY,
  PAUSED_RETRY_AFTER_SECONDS,
  SERVER_ENDPOINTS,
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
        expect(['signIn', 'syncPull', 'syncBooks', 'policyActionsNeeded', 'peekInvite']).toContain(name);
      }
    }
  });

  it('[F19-REQ-011] every server-feature endpoint names its build flag, and the M14 ones their kill switch', () => {
    for (const [name, e] of entries) {
      if (e.auth === 'public') continue;
      if (['signIn', 'syncPush', 'syncPull', 'createChild', 'recordPolicyAct', 'policyActionsNeeded', 'createInvite'].includes(name)) continue;
      expect(e.capability, `${name} needs a capability`).toBeDefined();
      if (e.path.startsWith('/functions/') || e.path.startsWith('<escrow')) expect(e.killSwitch, `${name} needs a kill switch`).toBeDefined();
    }
  });

  it('server-only endpoints live apart from the app-callable list', () => {
    for (const [name, e] of Object.entries(SERVER_ENDPOINTS) as [string, EndpointSpec][]) {
      expect(e.auth).toBe('server_only');
      expect(name in ENDPOINTS).toBe(false);
    }
  });

  it('[ADR-0017] idempotency keys are kept 24 hours; paused answers ask for a wait', () => {
    expect(IDEMPOTENCY).toEqual({ header: HEADER_IDEMPOTENCY_KEY, retentionHours: 24, keyFormat: 'uuid' });
    expect(PAUSED_RETRY_AFTER_SECONDS).toBeGreaterThanOrEqual(60);
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
    for (const s of ['SCRAT', 'SCINV', 'SCPLS', 'SCCAP', 'SCVER']) expect(classifySqlstate(s).action).toBe('tell_user');
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

  it('[ADR-0017] error codes are versioned and append-only: the 22 version 1 codes keep their place', () => {
    expect(API_ERROR_CODES_VERSION).toBe(2);
    const v1 = API_ERROR_CODES.filter((c) => ERROR_CODE_SINCE[c] === 1);
    expect(v1).toEqual(API_ERROR_CODES.slice(0, 22));
    expect(v1).toHaveLength(22);
    for (const c of API_ERROR_CODES) expect(ERROR_CODE_SINCE[c]).toBeLessThanOrEqual(API_ERROR_CODES_VERSION);
    expect(Object.keys(ERROR_CODE_SINCE).sort()).toEqual([...API_ERROR_CODES].sort());
  });

  it('an older client reads a newer code as internal (permanent), never as a crash', () => {
    const r = ApiFailureSchemaParse({ ok: false, error: { code: 'from_the_future', retryable: false }, requestId: '0123456789ab' });
    expect(r).toBe('internal');
  });

  it('builds content-free failures with a request id', () => {
    const id = newRequestId();
    expect(id).toMatch(REQUEST_ID_RE);
    const f = failure({ code: 'immutable', retryable: false, sqlstate: 'SCIMM', message: 'row: Asha' } as never, id);
    expect(f).toEqual({ ok: false, error: { code: 'immutable', retryable: false, sqlstate: 'SCIMM' }, requestId: id });
    expect(JSON.stringify(f)).not.toContain('Asha');
  });
});
