/**
 * Weekly Supabase Free plan usage check for scribe-prod. Pure logic; scripts/ops/free-limits.ts wires
 * it to psql (lib/psql.ts). Run by docs/ops/proposed/workflows/supabase-free-limits.yml.
 *
 * Free plan limits, read on supabase.com/pricing on 8 Nov 2026: "500 MB database size per project",
 * file storage "1 GB included", egress "5 GB included", "50,000 monthly active users". The limits
 * are written in decimal units here (500 MB = 500,000,000 bytes), which can only make the alert early.
 *
 * Two numbers are alert lines, both read as the narrow backup role (docs/ops/backup/backup-role.sql, which
 * cannot read Storage, sessions or the Vault, on purpose):
 *   - database size: the sum of pg_database_size over every database the role may connect to. Supabase
 *     measures "all databases in your Postgres cluster" (supabase.com/docs/guides/platform/database-size,
 *     read 8 Nov 2026); a database the role cannot connect to is left out, so this can understate (UNVERIFIED
 *     whether the role sees them all on the hosted cluster).
 *   - accounts: every row of auth.users. Supabase counts as a monthly active user each distinct user who
 *     "sign[s] in or refresh[es] their token" in the billing cycle (supabase.com/docs/guides/platform/
 *     manage-your-usage/monthly-active-users, read 8 Nov 2026); the role cannot read sessions, so a refresh-only
 *     user cannot be seen. Total accounts is an UPPER bound of MAU (every active user is an account), so the
 *     alert can come early but never late. The sign-ins in the last 30 days are printed as the lower bound.
 * Storage bytes and egress cannot be read as this role and are reported NOT CHECKED: the founder reads them on
 * the dashboard (Organization > Usage). Storage stays small only while recording backup is off.
 *
 * It prints numbers and percentages only: never a row, a URL or a psql message. Each statement runs
 * read only (lib/psql.ts). Exit 0 all under the alert line, 1 at or above it, 2 usage, no connection
 * or a number that could not be read.
 */
import { parseArgs } from './cli.ts';
import type { SqlOutcome, SqlRunner } from './smoke.ts';
import { dbTargetOf, type DbTarget } from './target.ts';

export const METRICS = ['database', 'mau'] as const;
export type Metric = (typeof METRICS)[number];

export const LIMITS: Record<Metric, { limit: number; unit: 'bytes' | 'users'; label: string }> = {
  database: { limit: 500_000_000, unit: 'bytes', label: 'database size (limit 500 MB)' },
  mau: { limit: 50_000, unit: 'users', label: 'accounts, an upper bound of monthly active users (limit 50,000)' },
};

/** Fixed statements: nothing from the command line reaches the SQL. */
export const METRIC_SQL: Record<Metric, string> = {
  database: "select coalesce(sum(pg_database_size(datname)), 0)::bigint from pg_database where has_database_privilege(datname, 'CONNECT')",
  mau: 'select count(*) from auth.users',
};
/** Printed, never alerted on: the lower bound of MAU. */
export const SIGNINS_SQL = "select count(*) from auth.users where last_sign_in_at > now() - interval '30 days'";

export const DEFAULT_ALERT_PERCENT = 80;
export const USAGE = 'Usage: LIMITS_DB_URL=postgres://... node scripts/ops/free-limits.ts --project-ref <ref> [--alert-percent 80] [--summary <file>]';
export const STOPPED_LINE = 'free-limits stopped unexpectedly (no details are printed).';

export type Reading = { metric: Metric; value: number; percent: number } | { metric: Metric; value: null; sqlstate?: string };

/** The project a backup-role pooler URL belongs to: user `<role>.<ref>` on `*.pooler.supabase.com`, or host `db.<ref>.supabase.co`. */
export function refOfDbTarget(t: DbTarget): string | null {
  if (t.projectRef) return t.projectRef;
  if (!/\.pooler\.supabase\.com$/.test(t.env.PGHOST)) return null;
  return /^[a-z_][a-z0-9_]{0,62}\.([a-z0-9]{8,40})$/.exec(t.env.PGUSER)?.[1] ?? null;
}

export function readingOf(metric: Metric, o: SqlOutcome): Reading | 'no_connection' {
  if (o.ok && /^\d{1,18}$/.test(o.text)) {
    const value = Number(o.text);
    return { metric, value, percent: Math.round((value / LIMITS[metric].limit) * 1000) / 10 };
  }
  if (!o.ok && (o.kind === 'connect' || o.kind === 'no_psql')) return 'no_connection';
  return { metric, value: null, sqlstate: o.ok ? undefined : o.sqlstate };
}

function human(metric: Metric, value: number): string {
  if (LIMITS[metric].unit === 'users') return value.toLocaleString('en-US');
  return `${(value / 1_000_000).toFixed(1)} MB`;
}

export function reportLines(readings: Reading[], alertPercent: number, signins?: number | null): { lines: string[]; over: Metric[]; unread: Metric[] } {
  const lines: string[] = [];
  const over: Metric[] = [];
  const unread: Metric[] = [];
  for (const r of readings) {
    if (r.value === null) {
      unread.push(r.metric);
      lines.push(`UNREAD   ${LIMITS[r.metric].label}: could not be read${r.sqlstate ? ` (SQLSTATE ${r.sqlstate})` : ''}`);
      continue;
    }
    const hit = r.percent >= alertPercent;
    if (hit) over.push(r.metric);
    lines.push(`${hit ? 'ALERT ' : 'OK    '}   ${LIMITS[r.metric].label}: ${human(r.metric, r.value)}, ${r.percent}%`);
  }
  if (typeof signins === 'number') lines.push(`INFO     accounts that signed in during the last 30 days: ${signins.toLocaleString('en-US')} (a lower bound of MAU: token refreshes are not visible)`);
  lines.push('NOT CHECKED  file storage (limit 1 GB): this role cannot read Storage; read Organization > Usage on the Supabase dashboard');
  lines.push('NOT CHECKED  egress (limit 5 GB): read Organization > Usage on the Supabase dashboard');
  return { lines, over, unread };
}

export interface FreeLimitsDeps {
  sql: (db: DbTarget) => SqlRunner;
  appendSummary?: (path: string, text: string) => void;
}
export interface FreeLimitsIo {
  print: (line: string) => void;
}

export async function runFreeLimits(args: string[], env: (name: string) => string, deps: FreeLimitsDeps, io: FreeLimitsIo): Promise<number> {
  const { flags } = parseArgs(args);
  if (flags.help) {
    io.print(USAGE);
    return 0;
  }
  const url = env('LIMITS_DB_URL');
  if (!url) {
    io.print('LIMITS_DB_URL is not set (the URL goes in the environment, never on the command line)');
    io.print(USAGE);
    return 2;
  }
  const parsed = dbTargetOf(url, { name: 'LIMITS_DB_URL' });
  if (!parsed.target) {
    io.print(parsed.problem);
    return 2;
  }
  if (typeof flags['project-ref'] !== 'string') {
    io.print('--project-ref <ref> is required');
    return 2;
  }
  if (refOfDbTarget(parsed.target) !== flags['project-ref']) {
    io.print('--project-ref does not match the project in LIMITS_DB_URL');
    return 2;
  }
  const alertPercent = flags['alert-percent'] === undefined ? DEFAULT_ALERT_PERCENT : Number(flags['alert-percent']);
  if (!Number.isInteger(alertPercent) || alertPercent < 1 || alertPercent > 100) {
    io.print('--alert-percent must be a whole number from 1 to 100');
    return 2;
  }
  const run = deps.sql(parsed.target);
  const readings: Reading[] = [];
  for (const m of METRICS) {
    const r = readingOf(m, await run(METRIC_SQL[m]));
    if (r === 'no_connection') {
      io.print('Could not connect to the database (check the secret and that the project is not paused; nothing else is printed).');
      return 2;
    }
    readings.push(r);
  }
  const si = await run(SIGNINS_SQL);
  const signins = si.ok && /^\d{1,15}$/.test(si.text) ? Number(si.text) : null;
  const rep = reportLines(readings, alertPercent, signins);
  io.print(`Supabase Free plan usage, alert at ${alertPercent}% (numbers only):`);
  for (const l of rep.lines) io.print(`  ${l}`);
  const verdict = rep.unread.length ? 'UNREAD: a number could not be read; fix the role grants (docs/ops/backup/backup-role.sql)'
    : rep.over.length ? `ALERT: ${rep.over.join(', ')} at or above ${alertPercent}% of the Free plan limit` : 'OK: every number is under the alert line';
  io.print(verdict);
  if (typeof flags.summary === 'string' && deps.appendSummary) {
    deps.appendSummary(flags.summary, ['### Supabase Free plan usage', ...rep.lines.map((l) => `- ${l}`), '', verdict, ''].join('\n'));
  }
  if (rep.unread.length) return 2;
  return rep.over.length ? 1 : 0;
}
