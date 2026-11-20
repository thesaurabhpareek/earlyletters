/**
 * BL-566: the table-by-table manifest of a decrypted backup, for the monthly restore drill.
 * Runbook: docs/ops/runbooks/staging-backup-free.md.
 *
 *   node scripts/ops/dump-manifest.ts dump.pgc > manifest.txt
 *
 * Reads the dump with pg_restore (--data-only to count the rows of every table, --list to count the row level
 * security policies). Prints the manifest (table names and counts, nothing else) to stdout. No database is
 * touched and no row is printed or kept. Exit 0; 1 when the dump lacks a required table or has no policies (the
 * manifest is still printed); 2 for usage or when pg_restore cannot read the file. Node 22, no npm packages;
 * needs pg_restore on PATH (PG_RESTORE_BIN overrides it).
 */
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { argv, exit, guardCrashes, printError } from './lib/cli.ts';
import { CopyCounter, formatManifest, manifestGaps, policiesFromToc } from './lib/dump-manifest.ts';

guardCrashes('dump-manifest stopped unexpectedly (no details are printed).', 2);
const given = argv().find((a) => !a.startsWith('--'));
if (!given) {
  printError('Usage: node scripts/ops/dump-manifest.ts <dump.pgc>');
  exit(2);
}
const file = given ?? '';
const bin = process.env.PG_RESTORE_BIN || 'pg_restore';

/** Runs pg_restore, feeds each stdout line to `onLine`, resolves with its exit code (127 when it is not installed). */
function readLines(args: string[], onLine: (line: string) => void): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'ignore'] });
    const rl = createInterface({ input: child.stdout!, crlfDelay: Infinity });
    rl.on('line', onLine);
    child.on('error', () => resolve(127));
    child.on('close', (c) => resolve(c ?? 1));
  });
}

let toc = '';
if ((await readLines(['--list', file], (l) => { toc += l + '\n'; })) !== 0) {
  printError('pg_restore could not read the file (is it the decrypted dump, and is pg_restore installed?).');
  exit(2);
}
const counter = new CopyCounter();
if ((await readLines(['--data-only', '-f', '-', file], (l) => counter.push(l))) !== 0) {
  printError('pg_restore could not read the data blocks of the file (the dump is damaged).');
  exit(2);
}
if (counter.unparsed > 0) {
  printError(`${counter.unparsed} COPY block(s) have a table name this script does not read; the manifest would leave them out.`);
  exit(2);
}
const manifest = { policies: policiesFromToc(toc), tables: counter.tables };
process.stdout.write(formatManifest(manifest));
const gaps = manifestGaps(manifest);
for (const g of gaps) printError(`FINDING  ${g}`);
exit(gaps.length ? 1 : 0);
