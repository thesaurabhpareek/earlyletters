/**
 * BL-584 (DATA-03, CR-209 option A): an alert from outside Supabase when purge or retention stops running.
 *
 * The purge runbook says a dead worker cannot alert (docs/ops/runbooks/purge-failing.md). This check runs from a scheduled
 * GitHub workflow (docs/ops/proposed/purge-watch.yml), so it does not depend on the worker it watches. It makes one call:
 * GET <OPS_HEALTH_URL> with `Authorization: Bearer <OPS_HEALTH_TOKEN>`, the ops-health Edge Function
 * (supabase/functions/ops-health), which answers two numbers: `purge_run_age_minutes` and `failed_cron_runs`. It holds no
 * Supabase key at all: the service key stays inside Supabase's function secrets, and this token can read those two numbers.
 *
 * A failed GitHub Actions run emails the repository owner. So every way of not knowing is a non-zero exit: stale or missing
 * purge row, a failed scribe-* cron run, a refused token, the function not deployed, an unreachable project, an answer of the
 * wrong shape. Output carries closed values only: numbers and hard-coded reasons. Never a URL, the token, a row or a response body.
 */
export type FetchFn = (url: string, init: RequestInit) => Promise<Response>;

export const DEFAULT_MAX_AGE_MINUTES = 120;
export const STOPPED_LINE = 'purge watch: stopped before it could check (no detail printed on purpose).';
/** The function's own path on a project; the URL secret must name exactly this, over https, on a supabase.co project host. */
const URL_RE = /^https:\/\/[a-z0-9-]+\.supabase\.co\/functions\/v1\/ops-health$/;

export interface Finding { level: 'FAIL' | 'PASS'; check: string; detail: string }
export interface WatchResult { code: 0 | 1 | 2; lines: string[] }
export interface WatchEnv { OPS_HEALTH_URL?: string; OPS_HEALTH_TOKEN?: string }

type Read = { ok: true; value: unknown } | { ok: false; reason: 'unreachable' | 'not_deployed' | 'refused' | 'unavailable' | 'status' | 'shape' };

const REASON: Record<string, string> = {
  unreachable: 'the project did not answer',
  not_deployed: 'the ops-health function is not deployed at that address',
  refused: 'the function refused the token (check the OPS_HEALTH_TOKEN secret on both sides)',
  unavailable: 'the function could not read the project (setting, migration or database)',
  status: 'the function answered with an unexpected status',
  shape: 'the answer was not the expected shape',
};

async function read(fetchFn: FetchFn, url: string, token: string): Promise<Read> {
  let res: Response;
  try {
    res = await fetchFn(url, { method: 'GET', headers: { authorization: `Bearer ${token}`, accept: 'application/json' }, redirect: 'error' });
  } catch {
    return { ok: false, reason: 'unreachable' };
  }
  if (res.status === 401) return { ok: false, reason: 'refused' };
  if (res.status === 404) return { ok: false, reason: 'not_deployed' };
  if (res.status === 503) return { ok: false, reason: 'unavailable' };
  if (!res.ok) return { ok: false, reason: 'status' };
  try {
    const body = (await res.json()) as { ok?: unknown; data?: unknown } | null;
    return body !== null && typeof body === 'object' && body.ok === true ? { ok: true, value: body.data } : { ok: false, reason: 'shape' };
  } catch {
    return { ok: false, reason: 'shape' };
  }
}

/** Acceptance 1: no purge_run audit row for max age minutes (or none at all) fires. */
export function judgePurgeRun(data: unknown, maxAge: number): Finding {
  const check = 'purge_run recent';
  const age = (data as { purge_run_age_minutes?: unknown } | null)?.purge_run_age_minutes;
  if (data === null || typeof data !== 'object' || !(age === null || (typeof age === 'number' && Number.isFinite(age) && age >= 0))) {
    return { level: 'FAIL', check, detail: REASON.shape };
  }
  if (age === null) return { level: 'FAIL', check, detail: 'no purge_run audit row has ever been written' };
  const detail = `newest purge_run is ${Math.floor(age)} minutes old (limit ${maxAge})`;
  return { level: age > maxAge ? 'FAIL' : 'PASS', check, detail };
}

/** Acceptance 2: a failed scribe-* run in the last 2 hours fires. */
export function judgeCronRuns(data: unknown): Finding {
  const check = 'scribe-* cron runs';
  const n = (data as { failed_cron_runs?: unknown } | null)?.failed_cron_runs;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) return { level: 'FAIL', check, detail: REASON.shape };
  return n === 0
    ? { level: 'PASS', check, detail: 'no failed run in the last 120 minutes' }
    : { level: 'FAIL', check, detail: `${n} failed run(s) in the last 120 minutes` };
}

/** `--max-age-minutes N` (default 120, 1 to 10080) is the purge_run limit. The cron window is fixed at 120 inside the function. */
export async function watchMain(argv: string[], env: WatchEnv, fetchFn: FetchFn): Promise<WatchResult> {
  let maxAge = DEFAULT_MAX_AGE_MINUTES;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--max-age-minutes') {
      const n = Number(argv[++i]);
      if (!Number.isInteger(n) || n < 1 || n > 10080) return { code: 2, lines: ['purge watch: --max-age-minutes must be a whole number from 1 to 10080.'] };
      maxAge = n;
    } else return { code: 2, lines: ['purge watch: unknown argument. Usage: purge-watch.ts [--max-age-minutes N]'] };
  }
  const url = (env.OPS_HEALTH_URL ?? '').trim();
  const token = (env.OPS_HEALTH_TOKEN ?? '').trim();
  if (!URL_RE.test(url) || !token) {
    return { code: 2, lines: ['purge watch: OPS_HEALTH_URL and OPS_HEALTH_TOKEN must both be set (the URL is https://<project>.supabase.co/functions/v1/ops-health).'] };
  }

  const got = await read(fetchFn, url, token);
  const findings: Finding[] = got.ok
    ? [judgePurgeRun(got.value, maxAge), judgeCronRuns(got.value)]
    : [{ level: 'FAIL', check: 'purge_run recent', detail: REASON[got.reason] }, { level: 'FAIL', check: 'scribe-* cron runs', detail: REASON[got.reason] }];
  const failed = findings.filter((f) => f.level === 'FAIL').length;
  const lines = findings.map((f) => `${f.level} ${f.check}: ${f.detail}`);
  lines.push(failed ? `purge watch: ${failed} problem(s). Runbook: docs/ops/runbooks/purge-failing.md` : 'purge watch: ok');
  return { code: failed ? 1 : 0, lines };
}
