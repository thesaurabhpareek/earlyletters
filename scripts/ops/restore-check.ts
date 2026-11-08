/**
 * BL-566: row counts after the monthly restore drill of the free nightly
 * staging backup. Runbook: docs/ops/runbooks/staging-backup-free.md.
 *
 *   RESTORED_DB_URL='postgres://postgres:<pw>@localhost:55432/postgres?sslmode=disable' \
 *   node scripts/ops/restore-check.ts --expect entries=N,policy_acceptances=N,deletion_requests=N
 *
 * --expect is the backup job's "Row counts in this dump" line for the
 * artifact you restored. Prints counts of entries, policy_acceptances and
 * deletion_requests, the comparison and PASS or FAIL; never a row, the URL or
 * a psql message. The URL goes in the environment so the password is never
 * in argv. TLS is required except for localhost, 127.0.0.1 and [::1].
 * Exit 0 PASS, 1 FAIL, 2 usage, no connection or an unexpected stop.
 * Node 22, no npm packages; needs psql on PATH.
 */
import { argv, env, exit, guardCrashes, print, printError } from './lib/cli.ts';
import { psqlRunner } from './lib/psql.ts';
import { runRestoreCheck, STOPPED_LINE } from './lib/restore-check.ts';

guardCrashes(STOPPED_LINE, 2);
const code = await runRestoreCheck(argv(), env, {
  sql: (db) => psqlRunner(db, { appName: 'scribe-restore-check', statementTimeout: '120s', timeoutMs: 150_000 }),
}, { print, printError });
exit(code);
