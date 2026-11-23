/**
 * Free plan keep-alive for scribe-prod (founder, 8 Nov 2026: "nightly 1 call to keep supabase active").
 * Pure logic; scripts/ops/keepalive.ts wires it to fetch.
 *
 * Supabase pauses a Free project that "does not receive sufficient user database activity over the
 * past week", and says "Generate a sufficient amount of activity by making API calls to your project"
 * (supabase.com/docs/guides/platform/free-project-pausing, read 8 Nov 2026). So the call is one real
 * Data API read that reaches Postgres: the anonymous, content-free read of `policy_versions` that the
 * smoke check already makes (lib/smoke.ts checkPolicyVersions; policy `policy_versions_read`). An Edge
 * Function health route is not used, because it may not touch the database.
 *
 * It never prints a URL, key or response body: only the HTTP status and the number of rows. A secret or
 * service-role key is refused, so the call is always anonymous. Exit 0 PASS, 1 FAIL, 2 usage.
 */
import { parseArgs } from './cli.ts';
import { isAnonymousKey, type FetchFn } from './smoke.ts';
import { projectRefOf } from './target.ts';

export const KEEPALIVE_PATH = '/rest/v1/policy_versions?select=document&limit=1';
export const USAGE = 'Usage: SUPABASE_URL=https://<ref>.supabase.co SUPABASE_PUBLISHABLE_KEY=<key> node scripts/ops/keepalive.ts --project-ref <ref> [--attempts 3] [--wait-ms 20000]';
export const STOPPED_LINE = 'keepalive stopped unexpectedly (no details are printed).';
const TIMEOUT_MS = 20_000;

export type Attempt = { status: number; rows: number | null; error?: 'timeout' | 'network' };

export interface KeepaliveDeps {
  fetch: FetchFn;
  sleep: (ms: number) => Promise<void>;
}
export interface KeepaliveIo {
  print: (line: string) => void;
}

export function resolveKeepalive(args: string[], env: (name: string) => string):
  { cfg: { url: string; key: string; attempts: number; waitMs: number }; problems: [] } | { cfg: null; problems: string[] } {
  const { flags } = parseArgs(args);
  const problems: string[] = [];
  const url = env('SUPABASE_URL').replace(/\/+$/, '');
  const key = env('SUPABASE_PUBLISHABLE_KEY');
  const ref = projectRefOf(url);
  if (!ref) problems.push('SUPABASE_URL must be https://<project-ref>.supabase.co');
  if (typeof flags['project-ref'] !== 'string') problems.push('--project-ref <ref> is required');
  else if (ref && flags['project-ref'] !== ref) problems.push('--project-ref does not match SUPABASE_URL');
  if (!key) problems.push('SUPABASE_PUBLISHABLE_KEY is not set');
  else if (!isAnonymousKey(key)) problems.push('SUPABASE_PUBLISHABLE_KEY must be a publishable key or the legacy anon key; secret and service-role keys are refused');
  const attempts = flags.attempts === undefined ? 3 : Number(flags.attempts);
  const waitMs = flags['wait-ms'] === undefined ? 20_000 : Number(flags['wait-ms']);
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 5) problems.push('--attempts must be 1 to 5');
  if (!Number.isInteger(waitMs) || waitMs < 0 || waitMs > 120_000) problems.push('--wait-ms must be 0 to 120000');
  if (problems.length) return { cfg: null, problems };
  return { cfg: { url, key, attempts, waitMs }, problems: [] };
}

/** One anonymous read. Redirects are not followed; the body is read only to count rows. */
export async function attempt(deps: KeepaliveDeps, url: string, key: string): Promise<Attempt> {
  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctrl.abort();
  }, TIMEOUT_MS);
  try {
    const res = await deps.fetch(`${url}${KEEPALIVE_PATH}`, { method: 'GET', headers: { apikey: key, accept: 'application/json' }, signal: ctrl.signal, redirect: 'manual' });
    let rows: number | null = null;
    try {
      const body: unknown = JSON.parse((await res.text()).slice(0, 65_536));
      rows = Array.isArray(body) ? body.length : null;
    } catch {
      rows = null;
    }
    return { status: res.status, rows };
  } catch {
    return { status: 0, rows: null, error: timedOut ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}

/** PASS only for 200 with a list holding at least one row: a published policy version proves the read reached the database. */
export function judge(a: Attempt): { pass: boolean; line: string } {
  if (a.error) return { pass: false, line: `no answer (${a.error}): the project may be paused or Supabase may be down` };
  if (a.status === 200 && a.rows !== null && a.rows >= 1) return { pass: true, line: `HTTP 200, ${a.rows} row` };
  if (a.status === 200) return { pass: false, line: `HTTP 200 but ${a.rows === null ? 'not a list' : 'no rows'}: no policy version is published (supabase/APPLY.md step 8)` };
  if (a.status === 401 || a.status === 403) return { pass: false, line: `HTTP ${a.status}: the publishable key was refused (rotated?) or the policy_versions_read policy is missing` };
  if (a.status === 404) return { pass: false, line: 'HTTP 404: policy_versions not found (schema not exposed, or migrations missing)' };
  return { pass: false, line: `HTTP ${a.status}: unexpected answer; open the project in the Supabase dashboard and check whether it is paused` };
}

export async function runKeepalive(args: string[], env: (name: string) => string, deps: KeepaliveDeps, io: KeepaliveIo): Promise<number> {
  if (parseArgs(args).flags.help) {
    io.print(USAGE);
    return 0;
  }
  const r = resolveKeepalive(args, env);
  if (!r.cfg) {
    for (const p of r.problems) io.print(p);
    io.print(USAGE);
    return 2;
  }
  let last = { pass: false, line: '' };
  for (let i = 1; i <= r.cfg.attempts; i++) {
    last = judge(await attempt(deps, r.cfg.url, r.cfg.key));
    io.print(`attempt ${i}: ${last.line}`);
    if (last.pass) break;
    if (i < r.cfg.attempts) await deps.sleep(r.cfg.waitMs);
  }
  io.print(last.pass ? 'PASS: one database read made; the project is awake' : 'FAIL: production did not answer the keep-alive read');
  return last.pass ? 0 : 1;
}
