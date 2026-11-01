import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EVENTS } from '../src';
import {
  allQueries,
  assertContentFree,
  catalogueValue,
  computeInsights,
  ContentGuardError,
  detectAnomaly,
  fetchPostHog,
  fetchServer,
  parseBreakdownRows,
  parseFunnelRows,
  parseWeeklyRows,
  renderReport,
  SourceError,
  syntheticInput,
  weekStart,
  type FetchLike,
} from '../src/insights';
import { parseArgs, run } from '../../../scripts/insights/run';

const DATE = '2026-10-05';

describe('engine on synthetic data (dry run)', () => {
  const input = syntheticInput(DATE);
  const report = computeInsights(input);

  it('finds the planted problems and ranks proposals by score', () => {
    const ids = report.proposals.map((p) => p.id);
    for (const id of ['no-speech', 'pack-failures-no_space', 'not-vetted-for-language', 'week4-retention', 'wkf-drop', 'error-spike-save_failed', 'two-voices-low']) {
      expect(ids, id).toContain(id);
    }
    const scores = report.proposals.map((p) => p.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    expect(report.anomalies.map((a) => a.metric)).toEqual(expect.arrayContaining(['wkf', 'error_save_failed']));
  });

  it('every proposal has problem, evidence, hypothesis, change, metric and confidence', () => {
    for (const p of report.proposals) {
      expect(p.problem.length, p.id).toBeGreaterThan(10);
      expect(p.evidence.length, p.id).toBeGreaterThan(0);
      expect(p.hypothesis.length, p.id).toBeGreaterThan(10);
      expect(p.change.length, p.id).toBeGreaterThan(10);
      expect(p.metric.length, p.id).toBeGreaterThan(5);
      expect(['high', 'medium', 'low']).toContain(p.confidence);
      expect(p.id).toMatch(/^[a-z0-9_-]+$/);
    }
  });

  it('only reads complete weeks before the report week', () => {
    expect(report.latestWeek! < weekStart(DATE)).toBe(true);
    expect(weekStart('2026-10-05')).toBe('2026-10-05'); // a Monday
    expect(weekStart('2026-10-04')).toBe('2026-09-28'); // a Sunday
  });

  it('is deterministic and content-free, and says it is synthetic', () => {
    const a = renderReport(report);
    const b = renderReport(computeInsights(syntheticInput(DATE)));
    expect(a).toBe(b);
    expect(() => assertContentFree(a)).not.toThrow();
    expect(a).toContain('Dry run on synthetic data');
    expect(a).toContain('### 1. ');
  });

  it('works with only one source, and says which', () => {
    const serverOnly = renderReport(computeInsights({ ...input, device: null }));
    expect(serverOnly).toContain('device analytics no');
    const deviceOnly = computeInsights({ ...input, server: null });
    expect(deviceOnly.proposals.some((p) => p.id === 'no-speech')).toBe(true);
    expect(deviceOnly.proposals.some((p) => p.id === 'week4-retention')).toBe(false);
  });

  it('says so when the server has no language column yet', () => {
    const r = renderReport(computeInsights({ ...input, server: { ...input.server!, language_mix: { available: false, rows: [] } } }));
    expect(r).toContain('Language mix is not available yet');
  });

  it('treats suppressed server cells (null) and small device funnel counts as unknown, never as zero', () => {
    const s = input.server!;
    const r = computeInsights({
      ...input,
      server: { ...s, weekly_keeping_families: s.weekly_keeping_families.map((w) => ({ ...w, families: null, letters: null, spoken_letters: null })) },
      device: { ...input.device!, funnel: input.device!.funnel.map((f) => ({ ...f, started: 9, saved: 4 })) },
    });
    expect(r.metrics.find((m) => m.key === 'wkf')!.value).toBeNull();
    expect(r.metrics.find((m) => m.key === 'save_rate')!.value).toBeNull();
    expect(r.proposals.some((p) => p.id === 'start-to-save' || p.id === 'wkf-drop')).toBe(false);
  });
});

describe('anomaly detection', () => {
  const pts = (vals: number[]) => vals.map((v, i) => ({ week: `2026-09-${String(i + 1).padStart(2, '0')}`, value: v }));
  it('flags a large change against a steady baseline and ignores noise', () => {
    expect(detectAnomaly(pts([100, 102, 98, 101, 60]), { metric: 'm', label: 'm', source: 'server', minBase: 30 })?.direction).toBe('down');
    expect(detectAnomaly(pts([100, 140, 70, 120, 90]), { metric: 'm', label: 'm', source: 'server', minBase: 30 })).toBeNull();
    expect(detectAnomaly(pts([5, 6, 5, 6, 20]), { metric: 'm', label: 'm', source: 'server', minBase: 30 })).toBeNull(); // too small
    expect(detectAnomaly(pts([100, 60]), { metric: 'm', label: 'm', source: 'server', minBase: 30 })).toBeNull(); // too short
  });
});

describe('content guard', () => {
  it('refuses emails, URLs, uuids, tokens and the canary family, naming only the kind', () => {
    const cases: [string, string][] = [
      ['email', 'write to asha.parent@example.com'],
      ['url', 'see https://example.com/x'],
      ['uuid', 'id 3f2b8c1e-9a4d-4c7b-8e2f-1a2b3c4d5e6f'],
      ['canary', 'Asha said hello'],
      ['token', 'k' + 'a'.repeat(40)],
    ];
    for (const [kind, text] of cases) {
      try {
        assertContentFree(text);
        throw new Error('not refused');
      } catch (e) {
        expect(e).toBeInstanceOf(ContentGuardError);
        expect((e as ContentGuardError).kind).toBe(kind);
        expect((e as Error).message).not.toContain(text);
      }
    }
  });

  it('a canary smuggled into raw device rows can never reach a written report', () => {
    const input = syntheticInput(DATE);
    // Bypass the parser on purpose: the guard is the last line.
    input.device!.rows.push(...[0, 1, 2, 3].map((i) => ({ week: input.device!.funnel[8 + i].week, event: 'machine_edit_rejected', dim: 'reason', value: 'Asha', events: 900, people: 90 })));
    expect(() => assertContentFree(renderReport(computeInsights(input)))).toThrow(ContentGuardError);
  });
});

describe('HogQL queries and parsing', () => {
  const qs = allQueries(12);

  it('name only catalogue events and properties, count, and suppress groups under 10 inside PostHog', () => {
    for (const { q, event, dim } of qs) {
      expect(q.query).toMatch(/count(If)?\(/);
      expect(q.query).toMatch(/HAVING (people|opened) >= 10/);
      expect(q.query).not.toMatch(/\$set|person\.|properties\.\$|SELECT \*/);
      if (event) expect(Object.keys(EVENTS)).toContain(event);
      if (event && dim) expect(Object.keys(EVENTS[event].props)).toContain(dim);
    }
    for (const m of qs.flatMap(({ q }) => [...q.query.matchAll(/'([a-z_]+)'/g)].map((x) => x[1]))) expect(Object.keys(EVENTS)).toContain(m);
  });

  it('keeps only catalogue values; anything else becomes other', () => {
    expect(catalogueValue('pack_download', 'failure', 'no_space')).toBe('no_space');
    expect(catalogueValue('pack_download', 'failure', 'Asha')).toBe('other');
    expect(catalogueValue('machine_edit_rejected', 'count', 3)).toBe('3');
    expect(catalogueValue('machine_edit_rejected', 'count', 99999)).toBe('other');
    expect(catalogueValue('invite_created', 'shared', true)).toBe('true');
    const rows = parseBreakdownRows('pack_download', 'failure', [
      ['2026-09-28T00:00:00Z', 'no_space', 12, 11],
      ['2026-09-28T00:00:00Z', 'asha.parent@example.com', 30, 20],
      ['2026-09-28T00:00:00Z', 'hash_mismatch', 4, 3],
      ['not a date', 'no_space', 50, 50],
    ]);
    expect(rows).toEqual([
      { week: '2026-09-28', event: 'pack_download', dim: 'failure', value: 'no_space', events: 12, people: 11 },
      { week: '2026-09-28', event: 'pack_download', dim: 'failure', value: 'other', events: 30, people: 20 },
    ]);
    expect(parseWeeklyRows([['2026-09-28', 'letter_saved', 40, 12], ['2026-09-28', 'letter_text', 40, 12], ['2026-09-28', 'app_opened', 9, 9]])).toEqual([
      { week: '2026-09-28', event: 'letter_saved', events: 40, people: 12 },
    ]);
    expect(parseFunnelRows([['2026-09-28', 40, 20, 12], ['2026-09-21', 5, 2, 1]])).toEqual([{ week: '2026-09-28', opened: 40, started: 20, saved: 12 }]);
  });
});

function fakeFetch(handler: (url: string, body: unknown, headers: Record<string, string>) => { status: number; json: unknown }) {
  const calls: { url: string; headers: Record<string, string>; body: unknown }[] = [];
  const f: FetchLike = async (url, init) => {
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ url, headers: init.headers, body });
    const r = handler(url, body, init.headers);
    return { ok: r.status >= 200 && r.status < 300, status: r.status, json: async () => r.json };
  };
  return { f, calls };
}

describe('sources', () => {
  it('PostHog: one POST per query to the query API with the read key; rows parsed and checked', async () => {
    const { f, calls } = fakeFetch((_u, body) => {
      const q = (body as { query: { query: string } }).query.query;
      if (q.includes('countIf(opened)')) return { status: 200, json: { results: [['2026-09-28', 50, 30, 20]] } };
      if (q.includes('GROUP BY week, event')) return { status: 200, json: { results: [['2026-09-28', 'letter_saved', 40, 20]] } };
      return { status: 200, json: { results: [] } };
    });
    const d = await fetchPostHog({ apiHost: 'https://us.posthog.com/', projectId: '123', apiKey: 'phx_test', weeks: 12 }, f);
    expect(calls).toHaveLength(allQueries(12).length);
    expect(calls[0].url).toBe('https://us.posthog.com/api/projects/123/query/');
    expect(calls[0].headers.authorization).toBe('Bearer phx_test');
    expect((calls[0].body as { query: { kind: string } }).query.kind).toBe('HogQLQuery');
    expect(d.rows).toEqual([{ week: '2026-09-28', event: 'letter_saved', events: 40, people: 20 }]);
    expect(d.funnel).toEqual([{ week: '2026-09-28', opened: 50, started: 30, saved: 20 }]);
  });

  it('errors carry the status and query name, never the response body', async () => {
    const { f } = fakeFetch(() => ({ status: 403, json: { detail: 'asha.parent@example.com is not allowed' } }));
    await expect(fetchPostHog({ apiHost: 'https://us.posthog.com', projectId: '1', apiKey: 'k', weeks: 12 }, f)).rejects.toSatisfy(
      (e: unknown) => e instanceof SourceError && e.status === 403 && !e.message.includes('asha'),
    );
  });

  it('server: calls the insights_aggregates RPC and checks the shape', async () => {
    const agg = syntheticInput(DATE).server!;
    const { f, calls } = fakeFetch(() => ({ status: 200, json: agg }));
    const s = await fetchServer({ url: 'https://x.supabase.co', publishableKey: 'sb_publishable_x', bearer: 'jwt', weeks: 12 }, f);
    expect(calls[0].url).toBe('https://x.supabase.co/rest/v1/rpc/insights_aggregates');
    expect(calls[0].body).toEqual({ p_weeks: 12 });
    expect(calls[0].headers).toMatchObject({ apikey: 'sb_publishable_x', authorization: 'Bearer jwt' });
    expect(s.k_min).toBe(10);
    const bad = fakeFetch(() => ({ status: 200, json: { k_min: 2, weekly_keeping_families: [] } }));
    await expect(fetchServer({ url: 'https://x.supabase.co', publishableKey: 'p', bearer: 'b', weeks: 12 }, bad.f)).rejects.toBeInstanceOf(SourceError);
  });
});

describe('scripts/insights/run.ts', () => {
  const noFetch: FetchLike = async () => {
    throw new Error('network used in a dry run');
  };

  it('parses arguments', () => {
    expect(parseArgs(['--dry-run', '--date', '2026-10-05', '--weeks', '8'])).toEqual({ dryRun: true, date: '2026-10-05', weeks: 8, out: null });
    expect(() => parseArgs(['--date', 'yesterday'])).toThrow();
    expect(() => parseArgs(['--weeks', '2'])).toThrow();
  });

  it('dry run uses no network and writes YYYY-MM-DD.md when --out is given', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'insights-'));
    try {
      const { path, markdown } = await run({ dryRun: true, date: DATE, weeks: 12, out: dir, env: {}, fetch: noFetch, log: () => {} });
      expect(path).toBe(join(dir, `${DATE}.md`));
      expect(existsSync(path!)).toBe(true);
      expect(readFileSync(path!, 'utf8')).toBe(markdown);
      const printed = await run({ dryRun: true, date: DATE, weeks: 12, out: null, env: {}, fetch: noFetch, log: () => {} });
      expect(printed.path).toBeNull();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('a real run with no credentials stops without writing anything', async () => {
    await expect(run({ dryRun: false, date: DATE, weeks: 12, out: tmpdir(), env: {}, fetch: noFetch, log: () => {} })).rejects.toThrow(/no source configured/);
  });

  it('a real run reads both sources with the read-only credentials from env', async () => {
    const agg = syntheticInput(DATE).server!;
    const { f, calls } = fakeFetch((url) => (url.includes('supabase') ? { status: 200, json: agg } : { status: 200, json: { results: [] } }));
    const dir = mkdtempSync(join(tmpdir(), 'insights-'));
    try {
      const env = {
        POSTHOG_PERSONAL_API_KEY: 'phx_read', POSTHOG_PROJECT_ID: '42', SUPABASE_URL: 'https://x.supabase.co',
        SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x', SUPABASE_INSIGHTS_TOKEN: 'reader-jwt',
      };
      const { markdown, path } = await run({ dryRun: false, date: DATE, weeks: 12, out: dir, env, fetch: f, log: () => {} });
      expect(path).toBe(join(dir, `${DATE}.md`));
      expect(markdown).not.toContain('Dry run');
      expect(markdown).toContain('server aggregates yes, device analytics yes');
      expect(calls.some((c) => c.url.startsWith('https://us.posthog.com/api/projects/42/query/'))).toBe(true);
      expect(JSON.stringify(markdown)).not.toMatch(/phx_read|reader-jwt|sb_publishable/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
