/**
 * BL-584 (DATA-03): an alert from outside Supabase when purge or retention stops running.
 *
 * The purge runbook says a dead worker cannot alert (docs/ops/runbooks/purge-failing.md). This check runs
 * from a scheduled GitHub workflow (docs/ops/proposed/purge-watch.yml), so it does not depend on the worker
 * it watches. It reads two content-free answers over the Data API with the service role:
 *   - public.ops_deletion_sla(): `purge_run_age_minutes`, minutes since the newest `purge_run` audit row
 *     (exists today);
 *   - public.ops_cron_health(p_window_minutes): counts failed `scribe-*` runs in cron.job_run_details and
 *     names the jobs (docs/ops/proposed/ops_cron_health.sql, a proposal: the data-architect lane writes
 *     the migration).
 * A failed GitHub Actions run emails the repository owner. So every way of not knowing is a non-zero exit:
 * stale or missing purge row, a failed cron run, the cron RPC not installed, an unreachable project, an answer
 * of the wrong shape. Output carries closed values only: numbers, a hard-coded reason, and job names that
 * match /^scribe-[a-z0-9-]{1,60}$/. Never a URL, key, row or response body.
 */
export type FetchFn = (url: string, init: RequestInit) => Promise<Response>;

export const DEFAULT_MAX_AGE_MINUTES = 120;
export const STOPPED_LINE = 'purge watch: stopped before it could check (no detail printed on purpose).';
const JOB_NAME = /^scribe-[a-z0-9-]{1,60}$/;

export interface Finding { level: 'FAIL' | 'PASS'; check: string; detail: string }
export interface WatchResult { code: 0 | 1 | 2; lines: string[] }

type Read = { ok: true; value: unknown } | { ok: false; reason: 'unreachable' | 'not_installed' | 'status' | 'shape' };

async function rpc(fetchFn: FetchFn, base: string, key: string, name: string, body: object): Promise<Read> {
  let res: Response;
  try {
    res = await fetchFn(`${base}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, reason: 'unreachable' };
  }
  if (res.status === 404) return { ok: false, reason: 'not_installed' };
  if (!res.ok) return { ok: false, reason: 'status' };
  try {
    return { ok: true, value: await res.json() };
  } catch {
    return { ok: false, reason: 'shape' };
  }
}

const REASON: Record<string, string> = {
  unreachable: 'the project did not answer',
  not_installed: 'the function is not installed on this project',
  status: 'the project refused the read (check the service key secret)',
  shape: 'the answer was not the expected shape',
};

/** Acceptance 1: no purge_run audit row for max age minutes (or none at all) fires. */
export function judgePurgeRun(sla: unknown, maxAge: number): Finding {
  const check = 'purge_run recent';
  const age = (sla as { purge_run_age_minutes?: unknown } | null)?.purge_run_age_minutes;
  if (sla === null || typeof sla !== 'object' || !(age === null || (typeof age === 'number' && Number.isFinite(age) && age >= 0))) {
    return { level: 'FAIL', check, detail: REASON.shape };
  }
  if (age === null) return { level: 'FAIL', check, detail: 'no purge_run audit row has ever been written' };
  if (age > maxAge) return { level: 'FAIL', check, detail: `newest purge_run is ${Math.floor(age)} minutes old (limit ${maxAge})` };
  return { level: 'PASS', check, detail: `newest purge_run is ${Math.floor(age)} minutes old (limit ${maxAge})` };
}

/** Acceptance 2: a failed scribe-* run in the window fires. */
export function judgeCronRuns(health: unknown, window: number): Finding {
  const check = 'scribe-* cron runs';
  const h = health as { failed_runs?: unknown; failed_jobs?: unknown } | null;
  if (h === null || typeof h !== 'object' || typeof h.failed_runs !== 'number' || !Number.isInteger(h.failed_runs) || h.failed_runs < 0
    || !Array.isArray(h.failed_jobs)) {
    return { level: 'FAIL', check, detail: REASON.shape };
  }
  if (h.failed_runs === 0) return { level: 'PASS', check, detail: `no failed run in the last ${window} minutes` };
  const names = [...new Set(h.failed_jobs.filter((n): n is string => typeof n === 'string' && JOB_NAME.test(n)))].sort();
  return { level: 'FAIL', check, detail: `${h.failed_runs} failed run(s) in the last ${window} minutes${names.length ? `: ${names.join(', ')}` : ''}` };
}

export interface WatchEnv { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE_KEY?: string }

/** `--max-age-minutes N` (default 120). `--purge-only` skips the cron read until ops_cron_health is installed. */
export async function watchMain(argv: string[], env: WatchEnv, fetchFn: FetchFn): Promise<WatchResult> {
  let maxAge = DEFAULT_MAX_AGE_MINUTES;
  let purgeOnly = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--purge-only') purgeOnly = true;
    else if (argv[i] === '--max-age-minutes') {
      const n = Number(argv[++i]);
      if (!Number.isInteger(n) || n < 1 || n > 10080) return { code: 2, lines: ['purge watch: --max-age-minutes must be a whole number from 1 to 10080.'] };
      maxAge = n;
    } else return { code: 2, lines: ['purge watch: unknown argument. Usage: purge-watch.ts [--max-age-minutes N] [--purge-only]'] };
  }
  const base = (env.SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
  const key = (env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(base) || !key) {
    return { code: 2, lines: ['purge watch: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set (the URL is the project URL, https only).'] };
  }

  const findings: Finding[] = [];
  const sla = await rpc(fetchFn, base, key, 'ops_deletion_sla', {});
  findings.push(sla.ok ? judgePurgeRun(sla.value, maxAge) : { level: 'FAIL', check: 'purge_run recent', detail: REASON[sla.reason] });
  if (purgeOnly) {
    findings.push({ level: 'FAIL', check: 'scribe-* cron runs', detail: 'not checked (--purge-only); this run is not a full check' });
  } else {
    const cron = await rpc(fetchFn, base, key, 'ops_cron_health', { p_window_minutes: maxAge });
    findings.push(cron.ok ? judgeCronRuns(cron.value, maxAge) : { level: 'FAIL', check: 'scribe-* cron runs', detail: REASON[cron.reason] });
  }
  const failed = findings.filter((f) => f.level === 'FAIL').length;
  const lines = findings.map((f) => `${f.level} ${f.check}: ${f.detail}`);
  lines.push(failed ? `purge watch: ${failed} problem(s). Runbook: docs/ops/runbooks/purge-failing.md` : 'purge watch: ok');
  return { code: failed ? 1 : 0, lines };
}
