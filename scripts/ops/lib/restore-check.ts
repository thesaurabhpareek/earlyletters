/**
 * BL-566: the content-free row count after a restore drill of the free
 * nightly staging backup (docs/ops/runbooks/staging-backup-free.md). Pure
 * logic; scripts/ops/restore-check.ts wires it to psql (lib/psql.ts).
 *
 * It counts three tables in the restored copy and, given the counts the
 * backup job wrote for that same dump, says whether they match. It reads
 * `count(*)` only, inside a read-only transaction: never a row, a column
 * value, a URL or a psql message. Exit 0 PASS, 1 FAIL, 2 usage or no
 * connection (one fixed line).
 */
import { parseArgs } from './cli.ts';
import type { SqlOutcome, SqlRunner } from './smoke.ts';
import { dbTargetOf, type DbTarget } from './target.ts';

/** The tables the drill compares (runbook step 4). Fixed: nothing from the command line reaches the SQL. */
export const RESTORE_TABLES = ['entries', 'policy_acceptances', 'deletion_requests'] as const;
export type RestoreTable = (typeof RESTORE_TABLES)[number];

export const COUNT_SQL: Record<RestoreTable, string> = {
  entries: 'select count(*) from public.entries',
  policy_acceptances: 'select count(*) from public.policy_acceptances',
  deletion_requests: 'select count(*) from public.deletion_requests',
};

export const USAGE = 'Usage: RESTORED_DB_URL=postgres://... node scripts/ops/restore-check.ts [--expect entries=N,policy_acceptances=N,deletion_requests=N]';
export const STOPPED_LINE = 'restore-check stopped unexpectedly (no details are printed).';

export type Count = { table: RestoreTable; state: 'counted'; rows: number } | { table: RestoreTable; state: 'missing' | 'unreadable'; sqlstate?: string };

/** `entries=12,policy_acceptances=3,deletion_requests=0` (the backup job's summary line). All three, whole numbers. */
export function parseExpect(raw: string): { expect: Record<RestoreTable, number>; problem: null } | { expect: null; problem: string } {
  const out: Partial<Record<RestoreTable, number>> = {};
  for (const part of raw.split(',').map((p) => p.trim()).filter(Boolean)) {
    const m = /^([a-z_]+)=(\d{1,12})$/.exec(part);
    if (!m || !(RESTORE_TABLES as readonly string[]).includes(m[1])) return { expect: null, problem: '--expect takes entries=N,policy_acceptances=N,deletion_requests=N' };
    out[m[1] as RestoreTable] = Number(m[2]);
  }
  for (const t of RESTORE_TABLES) if (out[t] === undefined) return { expect: null, problem: `--expect is missing ${t}` };
  return { expect: out as Record<RestoreTable, number>, problem: null };
}

/** One count from psql's answer. A missing table (42P01) is its own state; anything else that is not a number is unreadable. */
export function countOf(table: RestoreTable, o: SqlOutcome): Count | 'no_connection' {
  if (o.ok) return /^\d{1,15}$/.test(o.text) ? { table, state: 'counted', rows: Number(o.text) } : { table, state: 'unreadable' };
  if (o.kind === 'connect' || o.kind === 'no_psql') return 'no_connection';
  if (o.kind === 'sql' && o.sqlstate === '42P01') return { table, state: 'missing', sqlstate: '42P01' };
  return { table, state: 'unreadable', sqlstate: o.sqlstate };
}

/**
 * PASS when every table was counted and, with expected counts, each equals
 * its expected count exactly (the job counted the same dump, so there is no
 * day's drift to allow for). A restored 0 against an expected count above 0
 * is the case this exists for: a dump that restored its tables but not their
 * rows.
 */
export function verdict(counts: Count[], expect: Record<RestoreTable, number> | null): { pass: boolean; findings: string[] } {
  const findings: string[] = [];
  for (const c of counts) {
    if (c.state === 'counted') {
      if (expect && c.rows !== expect[c.table]) findings.push(`${c.table}: restored ${c.rows}, the backup job counted ${expect[c.table]}`);
    } else if (c.state === 'missing') findings.push(`${c.table} is missing from the restored copy`);
    else findings.push(`${c.table} could not be counted${c.sqlstate ? ` (SQLSTATE ${c.sqlstate})` : ''}`);
  }
  return { pass: findings.length === 0, findings };
}

export interface RestoreCheckDeps {
  sql: (db: DbTarget) => SqlRunner;
}
export interface RestoreCheckIo {
  print: (line: string) => void;
  printError: (line: string) => void;
}

export async function runRestoreCheck(args: string[], env: (name: string) => string, deps: RestoreCheckDeps, io: RestoreCheckIo): Promise<number> {
  const { flags } = parseArgs(args);
  if (flags.help) {
    io.print(USAGE);
    return 0;
  }
  const url = env('RESTORED_DB_URL');
  if (!url) {
    io.print('RESTORED_DB_URL is not set (the URL goes in the environment, never on the command line)');
    io.print(USAGE);
    return 2;
  }
  const parsed = dbTargetOf(url, { name: 'RESTORED_DB_URL', allowPlainLocal: true });
  if (!parsed.target) {
    io.print(parsed.problem);
    return 2;
  }
  let expect: Record<RestoreTable, number> | null = null;
  if (flags.expect !== undefined) {
    const e = parseExpect(typeof flags.expect === 'string' ? flags.expect : '');
    if (!e.expect) {
      io.print(e.problem);
      return 2;
    }
    expect = e.expect;
  }
  const run = deps.sql(parsed.target);
  const counts: Count[] = [];
  for (const table of RESTORE_TABLES) {
    const c = countOf(table, await run(COUNT_SQL[table]));
    if (c === 'no_connection') {
      io.print('Could not connect to the restored database (check that it is running and the URL is right; nothing else is printed).');
      return 2;
    }
    counts.push(c);
  }
  io.print('Restored row counts (counts only, no content):');
  for (const c of counts) io.print(`  ${c.table}: ${c.state === 'counted' ? c.rows : c.state.toUpperCase()}${expect ? `  (backup job: ${expect[c.table]})` : ''}`);
  if (!expect) io.print('No --expect given: compare these by hand with the backup job\'s "Row counts in this dump" line.');
  const v = verdict(counts, expect);
  for (const f of v.findings) io.print(`FINDING  ${f}`);
  io.print(v.pass ? 'PASS' : 'FAIL: write it in the drill log (docs/ops/runbooks/restore-drill.md) and keep the next nightly backups until it is understood');
  return v.pass ? 0 : 1;
}
