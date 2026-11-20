/**
 * BL-566: row counts after the monthly restore drill of the free nightly
 * staging backup. Runbook: docs/ops/runbooks/staging-backup-free.md.
 *
 *   RESTORED_DB_URL='postgres://postgres:<pw>@localhost:55432/postgres?sslmode=disable' \
 *   node scripts/ops/restore-check.ts --manifest manifest.txt
 *
 * --manifest is the output of `node scripts/ops/dump-manifest.ts dump.pgc`
 * for the dump you restored: every table in it, with its row count, and the
 * number of row level security policies. Every table is counted in the
 * restored copy and compared. Prints the number of tables compared, each
 * finding and PASS or FAIL; never a row, the URL or a psql message. The URL goes in the environment so the password is never
 * in argv. TLS is required except for localhost, 127.0.0.1 and [::1].
 * Exit 0 PASS, 1 FAIL, 2 usage, no connection or an unexpected stop.
 * Node 22, no npm packages; needs psql on PATH.
 */
import { readFileSync } from 'node:fs';
import { argv, env, exit, guardCrashes, print, printError } from './lib/cli.ts';
import { psqlRunner } from './lib/psql.ts';
import { runRestoreCheck, STOPPED_LINE } from './lib/restore-check.ts';

guardCrashes(STOPPED_LINE, 2);
const code = await runRestoreCheck(argv(), env, {
  sql: (db) => psqlRunner(db, { appName: 'scribe-restore-check', statementTimeout: '120s', timeoutMs: 150_000 }),
  readFile: (path) => { try { return readFileSync(path, 'utf8'); } catch { return null; } },
}, { print, printError });
exit(code);
