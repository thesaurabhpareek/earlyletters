import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
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
  RATE_LIMIT_GAPS,
  SQLSTATE_RULES,
  type EndpointName,
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
        expect(['signIn', 'syncPull', 'syncBooks', 'policyActionsNeeded', 'mySyncGate', 'peekInvite']).toContain(name);
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
    for (const s of ['SCRAT', 'SCINV', 'SCPLS', 'SCCAP']) expect(classifySqlstate(s).action).toBe('tell_user');
    for (const s of ['40001', '40P01', '57014', '08006', '53300']) expect(classifySqlstate(s).action).toBe('retry');
    expect(classifySqlstate('SCZZZ').action).toBe('reject');
    expect(classifySqlstate('23514').action).toBe('reject');
    expect(classifySqlstate('not a code').action).toBe('reject');
  });

  it('[D-069] SCCAP means the book already has two parents: tell the person, never retry (20261005000000)', () => {
    expect(classifySqlstate('SCCAP')).toEqual({ code: 'parents_full', action: 'tell_user', retryable: false });
    expect(httpStatusFor('parents_full')).toBe(409);
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

// ---------------------------------------------------------------------------
// Contract against the database (ADR 0017 section 6): what ENDPOINTS says
// about rate limits and idempotency is what the newest SQL definition does.
// ---------------------------------------------------------------------------

const REPO = join(__dirname, '..', '..', '..');
const MIGRATIONS = join(REPO, 'supabase', 'migrations');

/** The newest `create or replace function public.<name>(` body across all migrations, in file order. */
function latestBodies(): Map<string, { file: string; body: string }> {
  const out = new Map<string, { file: string; body: string }>();
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort()) {
    const sql = readFileSync(join(MIGRATIONS, file), 'utf8');
    const re = /create\s+or\s+replace\s+function\s+public\.([a-z0-9_]+)\s*\(/gi;
    for (let m = re.exec(sql); m; m = re.exec(sql)) {
      const open = sql.indexOf('$$', m.index);
      const close = open < 0 ? -1 : sql.indexOf('$$', open + 2);
      if (close > open) out.set(m[1].toLowerCase(), { file, body: sql.slice(open + 2, close) });
    }
  }
  return out;
}

/** Buckets in the newest rate_hit(): name -> [limit, window seconds]. */
function rateBuckets(body: string): Map<string, [number, number]> {
  const out = new Map<string, [number, number]>();
  const unit: Record<string, number> = { second: 1, seconds: 1, minute: 60, minutes: 60, hour: 3600, hours: 3600, day: 86_400, days: 86_400 };
  for (const m of body.matchAll(/\('([a-z_]+)',\s*(\d+),\s*interval\s+'(\d+)\s+([a-z]+)'\)/g)) {
    out.set(m[1], [Number(m[2]), Number(m[3]) * (unit[m[4]] ?? NaN)]);
  }
  return out;
}

const RATE_LIMITED = /rate_hit\(|errcode\s*=\s*'SCRAT'/;

describe('[ADR-0017 6] ENDPOINTS match the SQL that serves them', () => {
  const bodies = latestBodies();
  const rpcs = (Object.entries(ENDPOINTS) as [EndpointName, EndpointSpec][])
    .map(([name, e]) => ({ name, e, fn: /^\/rest\/v1\/rpc\/([a-z0-9_]+)$/.exec(e.path)?.[1] }))
    .filter((x): x is { name: EndpointName; e: EndpointSpec; fn: string } => !!x.fn && x.e.status !== 'planned');

  it.each(rpcs.map((r) => [r.name, r] as const))('%s exists in supabase/migrations', (_n, r) => {
    expect(bodies.has(r.fn), `${r.fn} has no definition`).toBe(true);
  });

  it.each(rpcs.filter((r) => r.e.rateLimit.enforcedBy === 'rpc').map((r) => [r.name, r] as const))(
    '%s is rate limited inside the function, as listed',
    (_n, r) => {
      const { body, file } = bodies.get(r.fn)!;
      expect(RATE_LIMITED.test(body), `${r.fn} (${file}) has no rate_hit() or SCRAT`).toBe(true);
      if (r.e.rateLimit.bucket) {
        expect(body, `${r.fn} counts in ${r.e.rateLimit.bucket}`).toContain(`rate_hit('${r.e.rateLimit.bucket}')`);
        const bucket = rateBuckets(bodies.get('rate_hit')!.body).get(r.e.rateLimit.bucket);
        expect(bucket, r.e.rateLimit.bucket).toEqual([r.e.rateLimit.limit, r.e.rateLimit.windowSeconds]);
      }
    },
  );

  it('lists every client-only limit as a known gap, and nothing else', () => {
    const clientOnly = (Object.entries(ENDPOINTS) as [EndpointName, EndpointSpec][]).filter(([, e]) => e.rateLimit.enforcedBy === 'client').map(([n]) => n);
    expect([...clientOnly].sort()).toEqual([...RATE_LIMIT_GAPS].sort());
    // When the server starts limiting one of them, flip it to 'rpc' (this fails until then).
    for (const r of rpcs.filter((x) => x.e.rateLimit.enforcedBy === 'client')) {
      expect(RATE_LIMITED.test(bodies.get(r.fn)?.body ?? ''), `${r.fn} is now limited on the server: set enforcedBy 'rpc'`).toBe(false);
    }
  });

  it('names every gap in ADR 0017 section 6', () => {
    const adr = readFileSync(join(REPO, 'docs', 'adr', '0017-api-standards.md'), 'utf8');
    const gaps = adr.slice(adr.indexOf('## 6.'));
    for (const n of RATE_LIMIT_GAPS) expect(gaps, n).toContain(ENDPOINTS[n].path.split('/').pop()!);
  });

  it('stores idempotency keys server side where the endpoint says so (20261005000000)', () => {
    for (const r of rpcs.filter((x) => x.e.idempotency === 'idempotency_key')) {
      expect(bodies.get(r.fn)!.body, r.fn).toContain('idempotency_claim(');
    }
  });

  it('maps every SQLSTATE our functions raise', () => {
    const raised = new Set<string>();
    for (const { body } of bodies.values()) for (const m of body.matchAll(/errcode\s*=\s*'(SC[A-Z]{3})'/g)) raised.add(m[1]);
    // SCPLS is kept for older builds (decision 3); every SC code a function can raise needs a rule.
    expect([...raised].filter((c) => !SQLSTATE_RULES[c]).sort()).toEqual([]);
  });
});

describe('[DECISION-17] every RPC the app calls is in ENDPOINTS', () => {
  const APP = join(REPO, 'apps', 'mobile', 'src');
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((n) => {
      const full = join(dir, n);
      if (n === 'node_modules' || n.startsWith('.') || n === '__tests__') return [];
      if (statSync(full).isDirectory()) return files(full);
      return /\.(ts|tsx)$/.test(n) && !/\.test\.tsx?$/.test(n) ? [full] : [];
    });
  const called = new Set<string>();
  for (const f of files(APP)) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/\.rpc\(\s*'([a-z0-9_]+)'/g)) called.add(m[1]);
    // The sync engine's own wrapper: call<T>('sync_push', ...).
    for (const m of src.matchAll(/\bcall<[^>]*>\(\s*'([a-z0-9_]+)'/g)) called.add(m[1]);
  }
  const listed = new Set(Object.values(ENDPOINTS as Record<string, EndpointSpec>).map((e) => /\/rpc\/([a-z0-9_]+)$/.exec(e.path)?.[1]).filter(Boolean));
  const invoked = new Set<string>();
  for (const f of files(APP)) {
    for (const m of readFileSync(f, 'utf8').matchAll(/functions\.invoke\(\s*'([a-z0-9/-]+)'/g)) invoked.add(m[1]);
  }
  const listedFunctions = new Set(Object.values(ENDPOINTS as Record<string, EndpointSpec>).map((e) => /^\/functions\/v1\/(.+)$/.exec(e.path)?.[1]).filter(Boolean));

  it.each([...invoked].sort())('Edge Function %s is in ENDPOINTS', (fn) => {
    expect(listedFunctions.has(fn), `add ${fn} to ENDPOINTS`).toBe(true);
  });

  it('finds the calls it checks', () => {
    expect(called.has('sync_push') && called.has('record_policy_act')).toBe(true);
  });

  it.each([...called].sort())('%s has a budget, auth rule, retry rule and rate limit', (fn) => {
    expect(listed.has(fn), `add ${fn} to ENDPOINTS (packages/api/src/standards.ts)`).toBe(true);
  });
});
