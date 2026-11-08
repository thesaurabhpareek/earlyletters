/**
 * BL-566: the content-free comparison after a restore drill of the free
 * nightly backup (docs/ops/runbooks/staging-backup-free.md). Pure logic;
 * scripts/ops/restore-check.ts wires it to psql (lib/psql.ts).
 *
 * The drill compares the restored copy with the dump's own manifest
 * (scripts/ops/dump-manifest.ts: every table the dump holds, its row count,
 * and the number of row level security policies). Every table in the
 * manifest is counted in the restored copy; a table that is missing,
 * unreadable or has a different count is a finding, and so is a different
 * number of policies. PASS needs every one to match. It reads `count(*)`
 * only, inside a read-only transaction: never a row, a column value, a URL
 * or a psql message. Exit 0 PASS, 1 FAIL, 2 usage or no connection (one
 * fixed line).
 */
import { parseArgs } from './cli.ts';
import { manifestGaps, parseManifest, TABLE_NAME, type Manifest } from './dump-manifest.ts';
import type { SqlOutcome, SqlRunner } from './smoke.ts';
import { dbTargetOf, type DbTarget } from './target.ts';

export const USAGE = 'Usage: RESTORED_DB_URL=postgres://... node scripts/ops/restore-check.ts --manifest manifest.txt   (manifest.txt from: node scripts/ops/dump-manifest.ts dump.pgc > manifest.txt)';
export const STOPPED_LINE = 'restore-check stopped unexpectedly (no details are printed).';
export const POLICIES_SQL = 'select count(*) from pg_policies';

/** The only SQL built from the manifest, and only from names that match TABLE_NAME (lower-case letters, digits, underscores). */
export function countSql(table: string): string {
  if (!TABLE_NAME.test(table)) throw new Error('table name not allowed');
  const [schema, name] = table.split('.');
  return `select count(*) from "${schema}"."${name}"`;
}

export type Count = { table: string; state: 'counted'; rows: number } | { table: string; state: 'missing' | 'unreadable'; sqlstate?: string };

/** One count from psql's answer. A missing table (42P01) is its own state; anything else that is not a number is unreadable. */
export function countOf(table: string, o: SqlOutcome): Count | 'no_connection' {
  if (o.ok) return /^\d{1,15}$/.test(o.text) ? { table, state: 'counted', rows: Number(o.text) } : { table, state: 'unreadable' };
  if (o.kind === 'connect' || o.kind === 'no_psql') return 'no_connection';
  if (o.kind === 'sql' && o.sqlstate === '42P01') return { table, state: 'missing', sqlstate: '42P01' };
  return { table, state: 'unreadable', sqlstate: o.sqlstate };
}

/**
 * PASS when the manifest is fit to judge by (every required table, some policies), every manifest table was counted
 * and equals the dump's count exactly, and the policy count equals the dump's. A restored 0 against a dump count
 * above 0 is the case this exists for: a table restored without its rows.
 */
export function verdict(manifest: Manifest, counts: Count[], restoredPolicies: Count): { pass: boolean; findings: string[] } {
  const findings: string[] = manifestGaps(manifest).map((g) => `manifest: ${g}`);
  for (const c of counts) {
    const want = manifest.tables[c.table];
    if (c.state === 'counted') {
      if (c.rows !== want) findings.push(`${c.table}: restored ${c.rows}, the dump holds ${want}`);
    } else if (c.state === 'missing') findings.push(`${c.table} is missing from the restored copy`);
    else findings.push(`${c.table} could not be counted${c.sqlstate ? ` (SQLSTATE ${c.sqlstate})` : ''}`);
  }
  if (restoredPolicies.state !== 'counted') findings.push('the policies could not be counted in the restored copy');
  else if (restoredPolicies.rows !== manifest.policies) findings.push(`policies: restored ${restoredPolicies.rows}, the dump holds ${manifest.policies}`);
  return { pass: findings.length === 0, findings };
}

export interface RestoreCheckDeps {
  sql: (db: DbTarget) => SqlRunner;
  /** The manifest file's text, or null when it cannot be read. */
  readFile: (path: string) => string | null;
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
  if (typeof flags.manifest !== 'string') {
    io.print('--manifest is required: the table-by-table manifest of the dump you restored');
    io.print(USAGE);
    return 2;
  }
  const text = deps.readFile(flags.manifest);
  if (text === null) {
    io.print('The manifest file could not be read.');
    return 2;
  }
  const m = parseManifest(text);
  if (!m.manifest) {
    io.print(m.problem);
    return 2;
  }
  const manifest = m.manifest;
  const run = deps.sql(parsed.target);
  const counts: Count[] = [];
  for (const table of Object.keys(manifest.tables).sort()) {
    const c = countOf(table, await run(countSql(table)));
    if (c === 'no_connection') {
      io.print('Could not connect to the restored database (check that it is running and the URL is right; nothing else is printed).');
      return 2;
    }
    counts.push(c);
  }
  const pol = countOf('policies', await run(POLICIES_SQL));
  if (pol === 'no_connection') {
    io.print('Could not connect to the restored database (check that it is running and the URL is right; nothing else is printed).');
    return 2;
  }
  const rows = counts.reduce((n, c) => n + (c.state === 'counted' ? c.rows : 0), 0);
  io.print(`Compared ${counts.length} tables and the policy count with the dump (${rows} rows restored; counts only, no content):`);
  const v = verdict(manifest, counts, pol);
  for (const f of v.findings) io.print(`FINDING  ${f}`);
  io.print(v.pass ? 'PASS' : 'FAIL: write it in the drill log (docs/ops/runbooks/restore-drill.md) and keep the next nightly backups until it is understood');
  return v.pass ? 0 : 1;
}
